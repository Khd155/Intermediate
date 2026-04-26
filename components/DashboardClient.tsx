'use client'

import { useState, useMemo } from 'react'
import { DashboardData, FilterState } from '@/lib/types'
import { filterStudents, getWeekScore } from '@/lib/dataProcessor'
import { KpiCard } from '@/components/cards/KpiCard'
import { WeekStatus } from '@/components/cards/WeekStatus'
import { FamilyStatsCard } from '@/components/cards/FamilyStatsCard'
import { Filters } from '@/components/filters/Filters'
import { StudentBarChart } from '@/components/charts/StudentBarChart'
import { WeeklyLineChart } from '@/components/charts/WeeklyLineChart'
import { FamilyPieChart } from '@/components/charts/FamilyPieChart'
import { StudentsTable } from '@/components/table/StudentsTable'

interface DashboardClientProps {
  data: DashboardData
}

export function DashboardClient({ data }: DashboardClientProps) {
  const [filters, setFilters] = useState<FilterState>({
    student: 'all',
    week: 'all',
    family: 'all',
  })

  const families = useMemo(
    () => Array.from(new Set(data.students.map(s => s.family))),
    [data.students]
  )

  const filteredStudents = useMemo(
    () => filterStudents(data.students, filters.student, filters.week, filters.family),
    [data.students, filters]
  )

  // KPI calculations based on filters
  const totalScore = useMemo(() => {
    if (filteredStudents.length === 0) return 0
    return filteredStudents.reduce((acc, s) => acc + getWeekScore(s, filters.week), 0)
  }, [filteredStudents, filters.week])

  const avgPercentage = useMemo(() => {
    if (filteredStudents.length === 0) return 0
    const avg = filteredStudents.reduce((acc, s) => acc + s.percentage, 0) / filteredStudents.length
    return Math.round(avg)
  }, [filteredStudents])

  const enabledWeeksCount = [
    data.weekEnabled.week1,
    data.weekEnabled.week2,
    data.weekEnabled.week3,
  ].filter(Boolean).length

  return (
    <div className="min-h-screen relative z-10">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 bg-[rgba(10,15,30,0.9)] backdrop-blur-xl border-b border-[rgba(212,160,23,0.1)]">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Islamic ornament */}
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-xl">
              ☪
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100 leading-tight">
                حصاد البرنامج الأسري
              </h1>
              <p className="text-xs text-slate-500">حلقة ثاني متوسط</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <WeekStatus weekEnabled={data.weekEnabled} />
            <div className="text-xs text-slate-600 bg-slate-800/50 rounded-lg px-3 py-1.5">
              {data.students.length} طالب
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">

        {/* ===== FILTERS ===== */}
        <Filters
          students={data.students}
          families={families}
          weekEnabled={data.weekEnabled}
          filters={filters}
          onChange={setFilters}
        />

        {/* ===== KPI CARDS ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="مجموع الدرجات"
            value={totalScore.toLocaleString('ar-SA')}
            subtitle={`${filteredStudents.length} طالب`}
            icon="📊"
            accent="gold"
            delay={50}
          />
          <KpiCard
            title="متوسط النسبة"
            value={`${avgPercentage}%`}
            subtitle={filters.week === 'all' ? 'جميع الأسابيع' : `أسبوع ${filters.week}`}
            icon="📈"
            accent="blue"
            delay={100}
          />
          <KpiCard
            title="أفضل طالب"
            value={data.topStudent?.name ?? '—'}
            subtitle={data.topStudent ? `${data.topStudent.total} درجة` : undefined}
            icon="🥇"
            accent="emerald"
            delay={150}
          />
          <KpiCard
            title="أفضل أسرة"
            value={data.topFamily?.name ?? '—'}
            subtitle={data.topFamily ? `متوسط ${data.topFamily.average}` : undefined}
            icon="👨‍👩‍👦"
            accent="rose"
            delay={200}
          />
        </div>

        {/* ===== CHARTS ROW 1 ===== */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <StudentBarChart
            students={filteredStudents}
            selectedWeek={filters.week}
            weekEnabled={data.weekEnabled}
          />
          <WeeklyLineChart
            students={filteredStudents}
            weekEnabled={data.weekEnabled}
          />
        </div>

        {/* ===== CHARTS ROW 2 + FAMILY STATS ===== */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-1">
            <FamilyPieChart families={data.families} />
          </div>
          <div className="xl:col-span-2">
            <FamilyStatsCard families={data.families} />
          </div>
        </div>

        {/* ===== STUDENTS TABLE ===== */}
        <StudentsTable
          students={filteredStudents}
          selectedWeek={filters.week}
          maxScore={data.maxPossibleScore}
        />

        {/* Footer */}
        <footer className="text-center py-6 text-xs text-slate-700 border-t border-[rgba(212,160,23,0.05)]">
          <p>
             &nbsp; حصاد البرنامج الأسري &nbsp; 
          </p>
          <p className="mt-1 text-slate-800">
            {enabledWeeksCount} أسبوع مفعل من أصل 3
          </p>
        </footer>
      </main>
    </div>
  )
}