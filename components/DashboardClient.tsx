'use client'

import { useState, useMemo } from 'react'
import { DashboardData, FilterState } from '@/lib/types'
import { filterStudents, getWeekScore, getWeekPercentage } from '@/lib/dataProcessor'
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
    () => filterStudents(data.students, filters.student, filters.family),
    [data.students, filters.student, filters.family]
  )

  const totalScore = useMemo(() => {
    if (filteredStudents.length === 0) return 0
    return filteredStudents.reduce((acc, s) => acc + getWeekScore(s, filters.week), 0)
  }, [filteredStudents, filters.week])

  const avgPercentage = useMemo(() => {
    if (filteredStudents.length === 0) return 0
    const avg = filteredStudents.reduce((acc, s) => acc + getWeekPercentage(s, filters.week), 0) / filteredStudents.length
    return Math.round(avg)
  }, [filteredStudents, filters.week])

  const enabledWeeksCount = [
    data.weekEnabled.week1,
    data.weekEnabled.week2,
    data.weekEnabled.week3,
  ].filter(Boolean).length

  return (
    <div className="min-h-screen relative z-10">

      {/* ===== HEADER MOBILE ===== */}
      <header className="sticky top-0 z-50 bg-[rgba(10,15,30,0.95)] backdrop-blur-xl border-b border-[rgba(212,160,23,0.1)]">

        {/* Mobile */}
        <div className="md:hidden px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-sm">
                ☪
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-100">حصاد البرنامج الأسري</h1>
                <p className="text-[10px] text-slate-500">نظام متابعة الحلقات</p>
              </div>
            </div>
            <span className="text-xs text-slate-400 bg-slate-800/60 rounded-lg px-2 py-1">
              {data.students.length} طالب
            </span>
          </div>
          {/* Week badges scrollable */}
          <div className="flex gap-2 overflow-x-auto" style={{scrollbarWidth:'none'}}>
            {([['week1','أسبوع ١'],['week2','أسبوع ٢'],['week3','أسبوع ٣']] as const).map(([key, label]) => (
              <div key={key} className={`flex-shrink-0 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                data.weekEnabled[key]
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-700/30 border-slate-600/30 text-slate-500'
              }`}>
                <span>{data.weekEnabled[key] ? '✅' : '❌'}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:flex max-w-screen-2xl mx-auto px-6 py-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-xl">☪</div>
            <div>
              <h1 className="text-lg font-bold text-slate-100">لوحة متابعة حلقات القرآن الكريم</h1>
              <p className="text-xs text-slate-500">نظام متكامل للمتابعة والإحصاء</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <WeekStatus weekEnabled={data.weekEnabled} />
            <div className="text-xs text-slate-600 bg-slate-800/50 rounded-lg px-3 py-1.5">{data.students.length} طالب</div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* FILTERS */}
        <Filters
          students={data.students}
          families={families}
          weekEnabled={data.weekEnabled}
          filters={filters}
          onChange={setFilters}
        />

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard title="مجموع الدرجات" value={totalScore.toLocaleString('ar-SA')} subtitle={`${filteredStudents.length} طالب`} icon="📊" accent="gold" delay={50} />
          <KpiCard title="متوسط النسبة" value={`${avgPercentage}%`} subtitle={filters.week === 'all' ? 'جميع الأسابيع' : `أسبوع ${filters.week}`} icon="📈" accent="blue" delay={100} />
          <KpiCard title="أفضل طالب" value={data.topStudent?.name ?? '—'} subtitle={data.topStudent ? `${data.topStudent.total} درجة` : undefined} icon="🥇" accent="emerald" delay={150} />
          <KpiCard title="أفضل أسرة" value={data.topFamily?.name ?? '—'} subtitle={data.topFamily ? `متوسط ${data.topFamily.average}` : undefined} icon="👨‍👩‍👦" accent="rose" delay={200} />
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
          <StudentBarChart students={filteredStudents} selectedWeek={filters.week} weekEnabled={data.weekEnabled} />
          <WeeklyLineChart students={filteredStudents} weekEnabled={data.weekEnabled} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-5">
          <div className="xl:col-span-1"><FamilyPieChart families={data.families} /></div>
          <div className="xl:col-span-2"><FamilyStatsCard families={data.families} /></div>
        </div>

        {/* TABLE */}
        <StudentsTable students={filteredStudents} selectedWeek={filters.week} maxScore={data.maxPossibleScore} weekEnabled={data.weekEnabled} />

        <footer className="text-center py-6 text-xs text-slate-700 border-t border-[rgba(212,160,23,0.05)]">
          <p>﷽ &nbsp; لوحة متابعة حلقات القرآن الكريم &nbsp; ☪</p>
          <p className="mt-1 text-slate-800">{enabledWeeksCount} أسبوع مفعل من أصل 3</p>
        </footer>
      </main>
    </div>
  )
}