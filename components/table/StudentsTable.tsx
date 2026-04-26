'use client'

import { useState } from 'react'
import { StudentData } from '@/lib/types'
import { getScoreColorClass, getProgressBarColor, getScoreLabel, getScoreBg } from '@/lib/dataProcessor'

interface StudentsTableProps {
  students: StudentData[]
  selectedWeek: string
  maxScore: number
}

type SortKey = 'rank' | 'name' | 'family' | 'week1' | 'week2' | 'week3' | 'total' | 'percentage'

export function StudentsTable({ students, selectedWeek, maxScore }: StudentsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('rank')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [search, setSearch] = useState('')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filtered = students
    .filter(s => s.name.includes(search) || s.family.includes(search))
    .sort((a, b) => {
      const av = a[sortKey] as string | number
      const bv = b[sortKey] as string | number
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span className="text-xs ml-1 opacity-50">
      {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )

  const thClass = "px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-yellow-400 transition-colors select-none whitespace-nowrap"

  const getDisplayScore = (s: StudentData): number => {
    if (selectedWeek === '1') return s.week1
    if (selectedWeek === '2') return s.week2
    if (selectedWeek === '3') return s.week3
    return s.total
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[rgba(212,160,23,0.1)] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h3 className="text-sm font-bold text-slate-300">جدول الدرجات</h3>
          <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full px-2 py-0.5">
            {filtered.length} طالب
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="بحث..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-[#0a0f1e] border border-[rgba(212,160,23,0.15)] rounded-lg px-3 py-1.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[rgba(212,160,23,0.4)] w-40"
            dir="rtl"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-xs">🔍</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr className="bg-[rgba(212,160,23,0.03)]">
              <th className={thClass} onClick={() => handleSort('rank')}>
                # <SortIcon k="rank" />
              </th>
              <th className={thClass} onClick={() => handleSort('name')}>
                الاسم <SortIcon k="name" />
              </th>
              <th className={thClass} onClick={() => handleSort('family')}>
                الأسرة <SortIcon k="family" />
              </th>
              <th className={thClass} onClick={() => handleSort('week1')}>
                أ١ <SortIcon k="week1" />
              </th>
              <th className={thClass} onClick={() => handleSort('week2')}>
                أ٢ <SortIcon k="week2" />
              </th>
              <th className={thClass} onClick={() => handleSort('week3')}>
                أ٣ <SortIcon k="week3" />
              </th>
              <th className={thClass} onClick={() => handleSort('total')}>
                المجموع <SortIcon k="total" />
              </th>
              <th className={thClass} onClick={() => handleSort('percentage')}>
                % النسبة <SortIcon k="percentage" />
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">التقدم</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => {
              const displayScore = getDisplayScore(s)
              return (
                <tr
                  key={s.name}
                  className="transition-colors hover:bg-[rgba(212,160,23,0.03)]"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  {/* Rank */}
                  <td className="px-4 py-3">
                    <span className={`
                      w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                      ${s.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                        s.rank === 2 ? 'bg-slate-400/20 text-slate-300' :
                        s.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-slate-700/30 text-slate-500'}
                    `}>
                      {s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : s.rank}
                    </span>
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3 text-sm font-semibold text-slate-200 whitespace-nowrap">
                    {s.name}
                  </td>

                  {/* Family */}
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full px-2 py-0.5 whitespace-nowrap">
                      {s.family}
                    </span>
                  </td>

                  {/* Weekly scores */}
                  <td className="px-4 py-3 text-sm text-slate-400 text-center">{s.week1 || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-400 text-center">{s.week2 || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-400 text-center">{s.week3 || '—'}</td>

                  {/* Total */}
                  <td className="px-4 py-3 text-sm font-bold text-yellow-400 text-center">
                    {displayScore}
                  </td>

                  {/* Percentage */}
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getScoreBg(s.percentage)}`}>
                      {s.percentage}% {getScoreLabel(s.percentage)}
                    </span>
                  </td>

                  {/* Progress bar */}
                  <td className="px-4 py-3">
                    <div className="w-28">
                      <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-l ${getProgressBarColor(s.percentage)} progress-bar`}
                          style={{ '--progress': `${s.percentage}%` } as React.CSSProperties}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">
            لا توجد نتائج
          </div>
        )}
      </div>
    </div>
  )
}
