'use client'

import { DashboardData } from '@/lib/types'
import { getScoreBg, getProgressBarColor, getScoreLabel } from '@/lib/dataProcessor'
import { WeekRankingSection } from './WeekRankingSection'

interface Props {
  data: DashboardData
}

export function HassadView({ data }: Props) {
  const { students, families, weekEnabled, maxPossibleScore } = data

  const totalScore = students.reduce((acc, s) => acc + s.total, 0)
  const enabledWeeks = [weekEnabled.week1, weekEnabled.week2, weekEnabled.week3].filter(Boolean).length

  const overallSorted = [...students].sort((a, b) => b.total - a.total)
  const familiesSorted = [...families].sort((a, b) => b.total - a.total)

  const rankBadge = (rank: number) => {
    if (rank === 1) return { emoji: '🥇', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
    if (rank === 2) return { emoji: '🥈', cls: 'bg-slate-400/20 text-slate-300 border-slate-400/30' }
    if (rank === 3) return { emoji: '🥉', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' }
    return { emoji: String(rank), cls: 'bg-slate-700/30 text-slate-500 border-slate-700/30' }
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">

      {/* ملخص الإنجازات */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🌾</span>
          <h2 className="text-base font-bold text-slate-200">ملخص الإنجازات</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي الطلاب', value: students.length, icon: '👥', sub: `في ${enabledWeeks} أسابيع` },
            { label: 'مجموع الدرجات', value: totalScore.toLocaleString('ar-SA'), icon: '📊', sub: 'لجميع الطلاب' },
            { label: 'أفضل طالب', value: overallSorted[0]?.name ?? '—', icon: '🥇', sub: overallSorted[0] ? `${overallSorted[0].total} درجة` : '' },
            { label: 'أفضل أسرة', value: familiesSorted[0]?.name ?? '—', icon: '🏆', sub: familiesSorted[0] ? `${familiesSorted[0].total} درجة` : '' },
          ].map(card => (
            <div key={card.label} className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{card.icon}</span>
                <span className="text-xs text-slate-500">{card.label}</span>
              </div>
              <p className="text-lg font-bold text-slate-100 truncate">{card.value}</p>
              <p className="text-xs text-slate-600 mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ترتيب الأسبوع الأول والثاني */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <WeekRankingSection weekNum={1} students={students} enabled={weekEnabled.week1} />
        <WeekRankingSection weekNum={2} students={students} enabled={weekEnabled.week2} />
      </div>

      {/* ترتيب الأسبوع الثالث */}
      <WeekRankingSection weekNum={3} students={students} enabled={weekEnabled.week3} />

      {/* الترتيب الكلي */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-[rgba(212,160,23,0.1)] flex items-center gap-3">
          <span className="text-xl">🏅</span>
          <div>
            <h3 className="text-sm font-bold text-slate-200">الترتيب الكلي</h3>
            <p className="text-xs text-slate-500">مجموع {enabledWeeks} أسابيع</p>
          </div>
        </div>
        <div className="divide-y divide-[rgba(212,160,23,0.05)]">
          {overallSorted.map((s, i) => {
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
                      className={`h-full rounded-full bg-gradient-to-l ${getProgressBarColor(s.percentage)}`}
                      style={{ width: `${s.percentage}%`, transition: 'width 0.6s ease' }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0 space-y-0.5">
                  <div className="text-sm font-bold text-yellow-400">{s.total.toLocaleString('ar-SA')}</div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getScoreBg(s.percentage)}`}>
                    {s.percentage}% · {getScoreLabel(s.percentage)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ترتيب الأسر */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-[rgba(212,160,23,0.1)] flex items-center gap-3">
          <span className="text-xl">👨‍👩‍👦</span>
          <h3 className="text-sm font-bold text-slate-200">ترتيب الأسر</h3>
        </div>
        <div className="divide-y divide-[rgba(212,160,23,0.05)]">
          {familiesSorted.map((f, i) => {
            const { emoji, cls } = rankBadge(i + 1)
            return (
              <div key={f.name} className="flex items-center gap-3 px-4 py-4 hover:bg-[rgba(212,160,23,0.02)] transition-colors">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border flex-shrink-0 ${cls}`}>
                  {emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-200 mb-1">{f.name}</p>
                  <div className="flex gap-3 text-xs text-slate-500">
                    <span>{f.count} طالب</span>
                    <span>·</span>
                    <span>متوسط {f.average} درجة</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-base font-bold text-yellow-400">{f.total.toLocaleString('ar-SA')}</div>
                  <div className="text-xs text-slate-500">إجمالي الدرجات</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
