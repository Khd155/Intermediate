'use client'

import { StudentData, WeekEnabled } from '@/lib/types'
import { getScoreBg, getScoreLabel, getProgressBarColor } from '@/lib/dataProcessor'

const WEEK_MAX = { 1: 2700, 2: 2800, 3: 2800 }

interface Props {
  weekNum: 1 | 2 | 3
  students: StudentData[]
  enabled: boolean
}

export function WeekRankingSection({ weekNum, students, enabled }: Props) {
  const weekMax = WEEK_MAX[weekNum]
  const weekKey = `week${weekNum}` as keyof StudentData

  const sorted = [...students]
    .filter(s => enabled)
    .sort((a, b) => (b[weekKey] as number) - (a[weekKey] as number))

  const weekLabel = weekNum === 1 ? 'الأول' : weekNum === 2 ? 'الثاني' : 'الثالث'

  const rankBadge = (rank: number) => {
    if (rank === 1) return { emoji: '🥇', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
    if (rank === 2) return { emoji: '🥈', cls: 'bg-slate-400/20 text-slate-300 border-slate-400/30' }
    if (rank === 3) return { emoji: '🥉', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' }
    return { emoji: String(rank), cls: 'bg-slate-700/30 text-slate-500 border-slate-700/30' }
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-[rgba(212,160,23,0.1)] flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-sm font-bold text-yellow-400">
          {weekNum}
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-200">الأسبوع {weekLabel}</h3>
          <p className="text-xs text-slate-500">الحد الأقصى: {weekMax.toLocaleString('ar-SA')} درجة</p>
        </div>
        {!enabled && (
          <span className="mr-auto text-xs bg-slate-700/40 text-slate-500 border border-slate-700/40 rounded-full px-3 py-0.5">
            غير مفعل
          </span>
        )}
      </div>

      {!enabled ? (
        <div className="py-10 text-center text-slate-600 text-sm">لم يُفعَّل هذا الأسبوع بعد</div>
      ) : (
        <div className="divide-y divide-[rgba(212,160,23,0.05)]">
          {sorted.map((s, i) => {
            const score = s[weekKey] as number
            const pct = weekMax > 0 ? Math.min(100, Math.round((score / weekMax) * 100)) : 0
            const { emoji, cls } = rankBadge(i + 1)
            return (
              <div key={s.name} className="flex items-center gap-3 px-4 py-3 hover:bg-[rgba(212,160,23,0.02)] transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border flex-shrink-0 ${cls}`}>
                  {emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-200 truncate">{s.name}</span>
                    <span className="text-[11px] bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full px-2 py-0.5 flex-shrink-0">
                      {s.family}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-l ${getProgressBarColor(pct)}`}
                      style={{ width: `${pct}%`, transition: 'width 0.6s ease' }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-yellow-400">{score.toLocaleString('ar-SA')}</div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getScoreBg(pct)}`}>
                    {pct}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
