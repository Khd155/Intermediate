export interface RawSheetRow {
  [key: string]: string | number | boolean | null
}

export interface WeekEnabled {
  week1: boolean
  week2: boolean
  week3: boolean
}

export interface StudentData {
  name: string
  family: string
  week1: number
  week2: number
  week3: number
  total: number
  percentage: number
  rank: number
}

export interface FamilyWeekEval {
  athletic: number
  popular: number
  cultural: number
}

export interface FamilyStats {
  name: string
  total: number
  average: number
  count: number
  rank: number
  percentage: number
  week1: number
  week2: number
  week3: number
  w1Eval?: FamilyWeekEval
  w2Eval?: FamilyWeekEval
  w3Eval?: FamilyWeekEval
}

export interface StudentMemorization {
  name: string
  startSura: string
  endSura: string
  pages: number
}

export interface DashboardData {
  students: StudentData[]
  families: FamilyStats[]
  weekEnabled: WeekEnabled
  maxPossibleScore: number
  topStudent: StudentData | null
  topFamily: FamilyStats | null
  memorizations: StudentMemorization[]
}

export interface FilterState {
  student: string
  week: 'all' | '1' | '2' | '3'
  family: string
}
