'use client'

import { StudentData, WeekEnabled, FilterState } from '@/lib/types'

interface FiltersProps {
  students: StudentData[]
  families: string[]
  weekEnabled: WeekEnabled
  filters: FilterState
  onChange: (filters: FilterState) => void
}

export function Filters({ students, families, weekEnabled, filters, onChange }: FiltersProps) {
  const weeks: { value: FilterState['week']; label: string; key: keyof WeekEnabled }[] = [
    { value: '1', label: 'الأسبوع الأول', key: 'week1' },
    { value: '2', label: 'الأسبوع الثاني', key: 'week2' },
    { value: '3', label: 'الأسبوع الثالث', key: 'week3' },
  ]

  const selectClass = `
    w-full rounded-xl border border-[rgba(212,160,23,0.15)] 
    bg-[#131d35] text-slate-200 text-sm px-4 py-2.5
    focus:outline-none focus:border-[rgba(212,160,23,0.5)]
    transition-colors duration-200
    appearance-none cursor-pointer
  `

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🔍</span>
        <h3 className="text-sm font-bold text-slate-300">الفلاتر</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Student filter */}
        <div>
          <label className="block text-xs text-slate-500 mb-1.5 font-medium">الطالب</label>
          <div className="relative">
            <select
              className={selectClass}
              value={filters.student}
              onChange={e => onChange({ ...filters, student: e.target.value })}
            >
              <option value="all">جميع الطلاب</option>
              {students.map(s => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">▾</span>
          </div>
        </div>

        {/* Week filter */}
        <div>
          <label className="block text-xs text-slate-500 mb-1.5 font-medium">الأسبوع</label>
          <div className="relative">
            <select
              className={selectClass}
              value={filters.week}
              onChange={e => onChange({ ...filters, week: e.target.value as FilterState['week'] })}
            >
              <option value="all">جميع الأسابيع</option>
              {weeks.map(w => (
                <option
                  key={w.value}
                  value={w.value}
                  disabled={!weekEnabled[w.key]}
                >
                  {w.label} {!weekEnabled[w.key] ? '(غير مفعل)' : ''}
                </option>
              ))}
            </select>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">▾</span>
          </div>
        </div>

        {/* Family filter */}
        <div>
          <label className="block text-xs text-slate-500 mb-1.5 font-medium">الأسرة</label>
          <div className="relative">
            <select
              className={selectClass}
              value={filters.family}
              onChange={e => onChange({ ...filters, family: e.target.value })}
            >
              <option value="all">جميع الأسر</option>
              {families.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">▾</span>
          </div>
        </div>
      </div>

      {/* Reset */}
      {(filters.student !== 'all' || filters.week !== 'all' || filters.family !== 'all') && (
        <button
          onClick={() => onChange({ student: 'all', week: 'all', family: 'all' })}
          className="mt-3 text-xs text-yellow-500 hover:text-yellow-400 transition-colors flex items-center gap-1"
        >
          <span>✕</span> مسح الفلاتر
        </button>
      )}
    </div>
  )
}
