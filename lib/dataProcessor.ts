import { RawSheetRow, StudentData, FamilyStats, DashboardData, WeekEnabled } from './types'

const sum = (arr: number[]): number => arr.reduce((a, b) => a + b, 0)

const WEEK_MAX = { week1: 2700, week2: 2800, week3: 2800 }

function calcMax(weekEnabled: WeekEnabled): number {
  return (
    (weekEnabled.week1 ? WEEK_MAX.week1 : 0) +
    (weekEnabled.week2 ? WEEK_MAX.week2 : 0) +
    (weekEnabled.week3 ? WEEK_MAX.week3 : 0)
  ) || WEEK_MAX.week1
}

export function parseStudents(
  rows: RawSheetRow[],
  familyMap: Record<string, string>,
  weekEnabled: WeekEnabled
): StudentData[] {
  const students: StudentData[] = []
  const maxPossible = calcMax(weekEnabled)

  for (const row of rows) {
    const name = row['col_1']
    if (!name || typeof name !== 'string' || !name.trim()) continue

    const values: number[] = []
    for (let i = 4; i <= 48; i++) {
      const v = row[`col_${i}`]
      values.push(typeof v === 'number' ? v : 0)
    }

    if (values.length < 45) continue

    const w1 = values.slice(0, 12)
    const a1 = values.slice(12, 15)
    const w2 = values.slice(15, 27)
    const a2 = values.slice(27, 30)
    const w3 = values.slice(30, 42)
    const a3 = values.slice(42, 45)

    const week1Total = weekEnabled.week1 ? sum(w1) + sum(a1) : 0
    const week2Total = weekEnabled.week2 ? sum(w2) + sum(a2) : 0
    const week3Total = weekEnabled.week3 ? sum(w3) + sum(a3) : 0

    const total = week1Total + week2Total + week3Total
    const percentage = maxPossible > 0 ? Math.round((total / maxPossible) * 100) : 0

    students.push({
      name: name.trim(),
      family: familyMap[name.trim()] || 'غير محدد',
      week1: week1Total,
      week2: week2Total,
      week3: week3Total,
      total,
      percentage,
      rank: 0,
    })
  }

  students.sort((a, b) => b.total - a.total)
  students.forEach((s, i) => { s.rank = i + 1 })

  return students
}

export function computeFamilyStats(
  students: StudentData[],
  weekEnabled: WeekEnabled,
  taqyeemScores: Record<string, number> = {},
  taqyeemByWeek?: { w1: Record<string, number>; w2: Record<string, number>; w3: Record<string, number> }
): FamilyStats[] {
  const familyMap: Record<string, StudentData[]> = {}

  for (const s of students) {
    if (!familyMap[s.family]) familyMap[s.family] = []
    familyMap[s.family].push(s)
  }

  const maxPerStudent = calcMax(weekEnabled)

  const stats: FamilyStats[] = Object.entries(familyMap).map(([name, members]) => {
    const studentsTotal = sum(members.map(m => m.total))
    const taqyeem = taqyeemScores[name] ?? 0
    const total = studentsTotal + taqyeem
    const average = members.length > 0 ? Math.round(studentsTotal / members.length) : 0
    const percentage = maxPerStudent > 0 ? Math.round((average / maxPerStudent) * 100) : 0

    const week1 = sum(members.map(m => m.week1)) + (taqyeemByWeek?.w1[name] ?? 0)
    const week2 = sum(members.map(m => m.week2)) + (taqyeemByWeek?.w2[name] ?? 0)
    const week3 = sum(members.map(m => m.week3)) + (taqyeemByWeek?.w3[name] ?? 0)

    return { name, total, average, count: members.length, rank: 0, percentage, week1, week2, week3 }
  })

  stats.sort((a, b) => b.total - a.total)
  stats.forEach((f, i) => { f.rank = i + 1 })

  return stats
}

export function buildDashboard(
  rows: RawSheetRow[],
  membersRows: RawSheetRow[],
  weekEnabled: WeekEnabled,
  taqyeemScores: Record<string, number> = {},
  taqyeemByWeek?: { w1: Record<string, number>; w2: Record<string, number>; w3: Record<string, number> }
): DashboardData {
  const familyMap: Record<string, string> = {}
  if (membersRows.length > 0) {
    const familyNames: Record<string, string> = {}
    const headerRow = membersRows[0]
    Object.keys(headerRow).forEach(key => {
      const val = headerRow[key]
      if (typeof val === 'string' && val.trim()) familyNames[key] = val.trim()
    })
    for (const row of membersRows.slice(1)) {
      Object.keys(familyNames).forEach(colKey => {
        const memberName = row[colKey]
        if (memberName && typeof memberName === 'string' && memberName.trim()) {
          familyMap[memberName.trim()] = familyNames[colKey]
        }
      })
    }
  }

  const maxPossibleScore = calcMax(weekEnabled)
  const allStudents = parseStudents(rows, familyMap, weekEnabled)
  const students = allStudents.filter(s => s.family !== 'غير محدد')
  students.forEach((s, i) => { s.rank = i + 1 })
  const families = computeFamilyStats(students, weekEnabled, taqyeemScores, taqyeemByWeek)

  return {
    students,
    families,
    weekEnabled,
    maxPossibleScore,
    topStudent: students[0] || null,
    topFamily: families[0] || null,
  }
}

export function getScoreColor(percentage: number): string {
  if (percentage >= 80) return 'excellent'
  if (percentage >= 50) return 'average'
  return 'weak'
}

export function getScoreColorClass(percentage: number): string {
  if (percentage >= 80) return 'text-emerald-400'
  if (percentage >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

export function getProgressBarColor(percentage: number): string {
  if (percentage >= 80) return 'from-emerald-500 to-emerald-400'
  if (percentage >= 50) return 'from-yellow-500 to-yellow-400'
  return 'from-red-500 to-red-400'
}

export function getScoreBg(percentage: number): string {
  if (percentage >= 80) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
  if (percentage >= 50) return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
  return 'bg-red-500/10 border-red-500/20 text-red-400'
}

export function getScoreLabel(percentage: number): string {
  if (percentage >= 80) return 'ممتاز'
  if (percentage >= 50) return 'متوسط'
  return 'ضعيف'
}

export function getWeekPercentage(student: StudentData, week: string): number {
  if (week === '1') return WEEK_MAX.week1 > 0 ? Math.min(100, Math.round((student.week1 / WEEK_MAX.week1) * 100)) : 0
  if (week === '2') return WEEK_MAX.week2 > 0 ? Math.min(100, Math.round((student.week2 / WEEK_MAX.week2) * 100)) : 0
  if (week === '3') return WEEK_MAX.week3 > 0 ? Math.min(100, Math.round((student.week3 / WEEK_MAX.week3) * 100)) : 0
  return student.percentage
}

export function filterStudents(
  students: StudentData[],
  selectedStudent: string,
  selectedFamily: string
): StudentData[] {
  return students.filter(s => {
    if (selectedStudent && selectedStudent !== 'all' && s.name !== selectedStudent) return false
    if (selectedFamily && selectedFamily !== 'all' && s.family !== selectedFamily) return false
    return true
  })
}

export function getWeekScore(student: StudentData, week: string): number {
  if (week === '1') return student.week1
  if (week === '2') return student.week2
  if (week === '3') return student.week3
  return student.total
}