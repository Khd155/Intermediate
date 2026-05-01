'use client'

import { useState } from 'react'
import { StudentData, WeekEnabled } from '@/lib/types'
import { getProgressBarColor, getScoreLabel, getScoreBg } from '@/lib/dataProcessor'

interface StudentsTableProps {
  students: StudentData[]
  selectedWeek: string
  maxScore: number
  weekEnabled?: WeekEnabled
}

type SortKey = 'rank' | 'name' | 'family' | 'week1' | 'week2' | 'week3' | 'total' | 'percentage'

const WEEK_MAX = { week1: 2700, week2: 2800, week3: 2800 }

function weekPct(score: number, weekKey: keyof typeof WEEK_MAX): number {
  return WEEK_MAX[weekKey] > 0 ? Math.min(100, Math.round((score / WEEK_MAX[weekKey]) * 100)) : 0
}

function WeekChip({ score, weekKey, enabled }: {
  score: number
  weekKey: keyof typeof WEEK_MAX
  enabled: boolean
}) {
  const weekLabel = weekKey === 'week1' ? 'أ١' : weekKey === 'week2' ? 'أ٢' : 'أ٣'

  if (!enabled) return (
    <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-medium bg-slate-700/30 text-slate-600 border border-slate-700/30">
      <span className="opacity-60">{weekLabel}</span>
      <span>—</span>
    </span>
  )

  const pct = weekPct(score, weekKey)
  const color = pct >= 80
    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
    : pct >= 50
    ? 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400'
    : 'bg-red-500/10 border-red-500/25 text-red-400'

  return (
    <span className={`inline-flex items-center gap-2 rounded-xl px-3 py-1 text-xs font-semibold border ${color} whitespace-nowrap`}>
      <span className="opacity-60 text-[11px]">{weekLabel}</span>
      <span className="font-bold text-sm">{score}</span>
      <span className="opacity-50 text-[10px]">◆</span>
      <span className="font-bold">{pct}%</span>
    </span>
  )
}

export function StudentsTable({ students, selectedWeek, maxScore, weekEnabled }: StudentsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('rank')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [search, setSearch] = useState('')

  const we: WeekEnabled = weekEnabled ?? { week1: true, week2: true, week3: true }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
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
    <span className="text-xs mr-0.5 opacity-40">{sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
  )

  const th = "px-3 py-3 text-right text-xs font-semibold text-slate-400 cursor-pointer hover:text-yellow-400 transition-colors select-none whitespace-nowrap"

  const getDisplayScore = (s: StudentData) =>
    selectedWeek === '1' ? s.week1 : selectedWeek === '2' ? s.week2 : selectedWeek === '3' ? s.week3 : s.total

  const rankBadge = (rank: number) => {
    if (rank === 1) return { emoji: '🥇', cls: 'bg-yellow-500/20 text-yellow-400' }
    if (rank === 2) return { emoji: '🥈', cls: 'bg-slate-400/20 text-slate-300' }
    if (rank === 3) return { emoji: '🥉', cls: 'bg-orange-500/20 text-orange-400' }
    return { emoji: String(rank), cls: 'bg-slate-700/30 text-slate-500' }
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[rgba(212,160,23,0.1)] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h3 className="text-sm font-bold text-slate-300">جدول الدرجات</h3>
          <span className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full px-2 py-0.5">
            {filtered.length} طالب
          </span>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="بحث..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-[#0a0f1e] border border-[rgba(212,160,23,0.15)] rounded-lg px-3 py-1.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-[rgba(212,160,23,0.4)] w-36"
            dir="rtl"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-xs">🔍</span>
        </div>
      </div>

      {/* ── MOBILE: Cards ── */}
      <div className="md:hidden divide-y divide-[rgba(212,160,23,0.06)]">
        {filtered.map(s => {
          const { emoji, cls } = rankBadge(s.rank)
          const displayScore = getDisplayScore(s)
          return (
            <div key={s.name} className="p-4 hover:bg-[rgba(212,160,23,0.02)] transition-colors">
              {/* Row 1: rank + name + family */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${cls}`}>
                  {emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-200 truncate">{s.name}</p>
                  <span className="text-[11px] bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full px-2 py-0.5">
                    {s.family}
                  </span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${getScoreBg(s.percentage)}`}>
                  {s.percentage}%
                </span>
              </div>

              {/* Row 2: week chips */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <WeekChip score={s.week1} weekKey="week1" enabled={we.week1} />
                <WeekChip score={s.week2} weekKey="week2" enabled={we.week2} />
                <WeekChip score={s.week3} weekKey="week3" enabled={we.week3} />
              </div>

              {/* Row 3: total + progress */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">المجموع:</span>
                <span className="text-sm font-bold text-yellow-400">{displayScore}</span>
                <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-l ${getProgressBarColor(s.percentage)} progress-bar`}
                    style={{ '--progress': `${s.percentage}%` } as React.CSSProperties}
                  />
                </div>
                <span className="text-xs text-slate-500">{getScoreLabel(s.percentage)}</span>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">لا توجد نتائج</div>
        )}
      </div>

      {/* ── DESKTOP: Table ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr className="bg-[rgba(212,160,23,0.03)]">
              <th className={th} onClick={() => handleSort('rank')}># <SortIcon k="rank" /></th>
              <th className={th} onClick={() => handleSort('name')}>الاسم <SortIcon k="name" /></th>
              <th className={th} onClick={() => handleSort('family')}>الأسرة <SortIcon k="family" /></th>
              <th className={th}>الأسابيع</th>
              <th className={th} onClick={() => handleSort('total')}>المجموع <SortIcon k="total" /></th>
              <th className={th} onClick={() => handleSort('percentage')}>النسبة <SortIcon k="percentage" /></th>
              <th className={th}>التقدم</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const { emoji, cls } = rankBadge(s.rank)
              const displayScore = getDisplayScore(s)
              return (
                <tr key={s.name} className="transition-colors hover:bg-[rgba(212,160,23,0.03)]">
                  <td className="px-3 py-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${cls}`}>
                      {emoji}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm font-semibold text-slate-200 whitespace-nowrap">{s.name}</td>
                  <td className="px-3 py-3">
                    <span className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full px-2 py-0.5 whitespace-nowrap">
                      {s.family}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      <WeekChip score={s.week1} weekKey="week1" enabled={we.week1} />
                      <WeekChip score={s.week2} weekKey="week2" enabled={we.week2} />
                      <WeekChip score={s.week3} weekKey="week3" enabled={we.week3} />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm font-bold text-yellow-400 text-center whitespace-nowrap">
                    {displayScore}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getScoreBg(s.percentage)}`}>
                      {s.percentage}% {getScoreLabel(s.percentage)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="w-28">
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>{s.percentage}%</span>
                        <span>{s.total}</span>
                      </div>
                      <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
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
          <div className="text-center py-12 text-slate-500 text-sm">لا توجد نتائج</div>
        )}
      </div>
    </div>
  )
}