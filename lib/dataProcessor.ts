import { RawSheetRow, StudentData, FamilyStats, DashboardData, WeekEnabled } from './types'

const sum = (arr: number[]): number => arr.reduce((a, b) => a + b, 0)

export function parseStudents(
  rows: RawSheetRow[],
  familyMap: Record<string, string>,
  weekEnabled: WeekEnabled
): StudentData[] {
  const students: StudentData[] = []

  // الدرجة القصوى الكلية = 3000
  const maxPossible = 3000

  for (const row of rows) {
    // col_0 = رقم، col_1 = اسم، col_2 = حفظ، col_3 = مراجعة، col_4+ = درجات
    const name = row['col_1']
    if (!name || typeof name !== 'string' || !name.trim()) continue

    // اجمع كل الأرقام من col_4 إلى col_48
    const values: number[] = []
    for (let i = 4; i <= 48; i++) {
      const v = row[`col_${i}`]
      values.push(typeof v === 'number' ? v : 0)
    }

    // نحتاج 45 قيمة على الأقل
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
  taqyeemScores: Record<string, number> = {}
): FamilyStats[] {
  const familyMap: Record<string, StudentData[]> = {}

  for (const s of students) {
    if (!familyMap[s.family]) familyMap[s.family] = []
    familyMap[s.family].push(s)
  }

  const maxPerStudent = 3000

  const stats: FamilyStats[] = Object.entries(familyMap).map(([name, members]) => {
    const studentsTotal = sum(members.map(m => m.total))
    const taqyeem = taqyeemScores[name] ?? 0
    const total = studentsTotal + taqyeem
    const average = members.length > 0 ? Math.round(studentsTotal / members.length) : 0
    const percentage = maxPerStudent > 0 ? Math.round((average / maxPerStudent) * 100) : 0
    return { name, total, average, count: members.length, rank: 0, percentage }
  })

  stats.sort((a, b) => b.total - a.total)
  stats.forEach((f, i) => { f.rank = i + 1 })

  return stats
}

export function buildDashboard(
  rows: RawSheetRow[],
  membersRows: RawSheetRow[],
  weekEnabled: WeekEnabled
,
  taqyeemScores: Record<string, number> = {}
): DashboardData {
  // هيكل شيت الأعضاء:
  // الصف 1 = أسماء الأسر (headers): col_0 = أسرة الامام مسلم، col_1 = أسرة الامام البخاري
  // الصفوف التالية = أسماء الأعضاء في كل عمود
  const familyMap: Record<string, string> = {}
  if (membersRows.length > 0) {
    // الصف الأول يحتوي أسماء الأسر
    const familyNames: Record<string, string> = {}
    const headerRow = membersRows[0]
    Object.keys(headerRow).forEach(key => {
      const val = headerRow[key]
      if (typeof val === 'string' && val.trim()) {
        familyNames[key] = val.trim()
      }
    })
    // باقي الصفوف = أعضاء
    for (const row of membersRows.slice(1)) {
      Object.keys(familyNames).forEach(colKey => {
        const memberName = row[colKey]
        if (memberName && typeof memberName === 'string' && memberName.trim()) {
          familyMap[memberName.trim()] = familyNames[colKey]
        }
      })
    }
  }

  const maxPossibleScore = 3000

  // إخفاء الطلاب بدون أسرة
  const allStudents = parseStudents(rows, familyMap, weekEnabled)
  const students = allStudents.filter(s => s.family !== 'غير محدد')
  // إعادة ترتيب الرتب بعد الفلترة
  students.forEach((s, i) => { s.rank = i + 1 })
  const families = computeFamilyStats(students, weekEnabled, taqyeemScores)

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

export function filterStudents(
  students: StudentData[],
  selectedStudent: string,
  selectedWeek: string,
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