import { RawSheetRow, WeekEnabled, StudentMemorization } from './types'
import { buildDashboard } from './dataProcessor'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets'
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly'

// ─── Token cache ───────────────────────────────────────────────────────────────

let cachedToken: { value: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && cachedToken.expiresAt > now + 60) return cachedToken.value

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL!
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY!
  if (!clientEmail || !privateKeyRaw) throw new Error('Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY')

  const privateKey = privateKeyRaw.replace(/\\n/g, '\n')

  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString('base64')
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = { iss: clientEmail, scope: SCOPES, aud: TOKEN_URL, iat: now, exp: now + 3600 }
  const signingInput = `${encode(header)}.${encode(payload)}`

  const pemBody = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    Buffer.from(pemBody, 'base64'),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, Buffer.from(signingInput))
  const signature = Buffer.from(sig).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const jwt = `${signingInput}.${signature}`

  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  })

  if (!tokenRes.ok) throw new Error(`Token error: ${await tokenRes.text()}`)
  const { access_token, expires_in } = await tokenRes.json()
  cachedToken = { value: access_token, expiresAt: now + (expires_in as number) }
  return access_token
}

// ─── Sheet title cache (gid → title) ──────────────────────────────────────────

let sheetTitleCache: Record<number, string> | null = null

async function getSheetTitle(spreadsheetId: string, gid: number): Promise<string> {
  if (sheetTitleCache?.[gid]) return sheetTitleCache[gid]

  const token = await getAccessToken()
  const res = await fetch(`${SHEETS_API}/${spreadsheetId}?fields=sheets.properties`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`Metadata error: ${await res.text()}`)

  const meta = await res.json()
  sheetTitleCache = {}
  for (const s of meta.sheets ?? []) {
    sheetTitleCache[s.properties.sheetId] = s.properties.title
  }

  if (!sheetTitleCache[gid]) throw new Error(`Sheet gid ${gid} not found`)
  return sheetTitleCache[gid]
}

// ─── Fetch by gid ──────────────────────────────────────────────────────────────

async function fetchByGid(
  spreadsheetId: string,
  gid: number,
  cellRange: string
): Promise<(string | number | boolean)[][]> {
  const token = await getAccessToken()
  const title = await getSheetTitle(spreadsheetId, gid)

  // Wrap title in single quotes to handle Arabic/special chars
  const range = `'${title}'!${cellRange}`
  const url = `${SHEETS_API}/${spreadsheetId}/values/${encodeURIComponent(range)}`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('Sheets error:', body)
    throw new Error(`Sheets API error [gid:${gid} ${cellRange}]: ${res.status}`)
  }

  const data = await res.json()
  return data.values ?? []
}

// ─── Row → object ──────────────────────────────────────────────────────────────

function parseVal(val: unknown): string | number | boolean | null {
  if (val === undefined || val === '') return null
  if (val === 'TRUE' || val === true) return true
  if (val === 'FALSE' || val === false) return false
  if (typeof val === 'string' && !isNaN(Number(val.replace(/٫/g, '.')))) return Number(val.replace(/٫/g, '.'))
  if (typeof val === 'number') return val
  return String(val)
}

// تحويل صفوف بدون headers — كل صف يصبح object بمفاتيح숫 col_0, col_1, ...
function rawToRows(values: (string | number | boolean)[][]): RawSheetRow[] {
  return values
    .filter(row => row && row.length > 0)
    .map(row => {
      const obj: RawSheetRow = {}
      row.forEach((val, i) => { obj[`col_${i}`] = parseVal(val) })
      return obj
    })
}

function rowsToObjects(values: (string | number | boolean)[][]): RawSheetRow[] {
  if (values.length < 2) return []
  const headers = values[0]
  return values.slice(1).map(row => {
    const obj: RawSheetRow = {}
    headers.forEach((h, i) => {
      obj[String(h)] = parseVal(row[i])
    })
    return obj
  })
}

// ─── Week flags ────────────────────────────────────────────────────────────────

function parseWeekEnabled(cells: (string | number | boolean)[][][]): WeekEnabled {
  const isTrue = (v: unknown) => v === true || v === 'TRUE'
  return {
    week1: isTrue(cells[0]?.[0]?.[0]),
    week2: isTrue(cells[1]?.[0]?.[0]),
    week3: isTrue(cells[2]?.[0]?.[0]),
  }
}

// ─── Public entry point ────────────────────────────────────────────────────────

const GID_HALAQA  = 589208165
const GID_MEMBERS = 1287284119
const GID_TAQYEEM = 41294986
const GID_HIFZ    = 1945933238

export async function getDashboardData() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!
  if (!spreadsheetId) throw new Error('Missing GOOGLE_SHEETS_ID')

  const [
    mainValues, membersValues, w1Cell, w2Cell, w3Cell,
    taq_muslim_w1, taq_bukhari_w1,
    taq_muslim_w2, taq_bukhari_w2,
    taq_muslim_w3, taq_bukhari_w3,
    hifzValues,
  ] = await Promise.all([
    fetchByGid(spreadsheetId, GID_HALAQA, 'A1:AV200'),
    fetchByGid(spreadsheetId, GID_MEMBERS, 'A1:C200'),
    fetchByGid(spreadsheetId, GID_HALAQA, 'E40'),
    fetchByGid(spreadsheetId, GID_HALAQA, 'T40'),
    fetchByGid(spreadsheetId, GID_HALAQA, 'AI40'),
    fetchByGid(spreadsheetId, GID_TAQYEEM, 'B3:B5'),
    fetchByGid(spreadsheetId, GID_TAQYEEM, 'E3:E5'),
    fetchByGid(spreadsheetId, GID_TAQYEEM, 'B9:B11'),
    fetchByGid(spreadsheetId, GID_TAQYEEM, 'E9:E11'),
    fetchByGid(spreadsheetId, GID_TAQYEEM, 'B15:B17'),
    fetchByGid(spreadsheetId, GID_TAQYEEM, 'E15:E17'),
    fetchByGid(spreadsheetId, GID_HIFZ, 'B4:E200'),
  ])

  const parseEval = (
    data: (string | number | boolean)[][],
    enabled: boolean
  ): { athletic: number; popular: number; cultural: number } => {
    if (!enabled) return { athletic: 0, popular: 0, cultural: 0 }
    const getVal = (idx: number) => {
      const v = data[idx]?.[0]
      return typeof v === 'number' ? v : !isNaN(Number(v)) ? Number(v) : 0
    }
    return { athletic: getVal(0), popular: getVal(1), cultural: getVal(2) }
  }

  const weekEnabled = parseWeekEnabled([w1Cell, w2Cell, w3Cell])

  const taqyeemEvals = {
    w1: {
      'أسرة الامام مسلم':   parseEval(taq_muslim_w1,  weekEnabled.week1),
      'أسرة الامام البخاري': parseEval(taq_bukhari_w1, weekEnabled.week1),
    },
    w2: {
      'أسرة الامام مسلم':   parseEval(taq_muslim_w2,  weekEnabled.week2),
      'أسرة الامام البخاري': parseEval(taq_bukhari_w2, weekEnabled.week2),
    },
    w3: {
      'أسرة الامام مسلم':   parseEval(taq_muslim_w3,  weekEnabled.week3),
      'أسرة الامام البخاري': parseEval(taq_bukhari_w3, weekEnabled.week3),
    },
  }

  const memorizations: StudentMemorization[] = hifzValues
    .filter(row => row[0] && String(row[0]).trim())
    .map(row => ({
      name:      String(row[0]).trim(),
      startSura: row[1] ? String(row[1]).trim() : '',
      endSura:   row[2] ? String(row[2]).trim() : '',
      pages:     typeof row[3] === 'number' ? row[3] : (!isNaN(Number(row[3])) ? Number(row[3]) : 0),
    }))

  const rows        = rawToRows(mainValues.slice(7))
  const membersRows = rawToRows(membersValues)

  return buildDashboard(rows, membersRows, weekEnabled, memorizations, taqyeemEvals)
}