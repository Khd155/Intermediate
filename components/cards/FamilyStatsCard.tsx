'use client'

import { FamilyStats } from '@/lib/types'
import { getProgressBarColor, getScoreBg, getScoreLabel } from '@/lib/dataProcessor'

interface FamilyStatsCardProps {
  families: FamilyStats[]
}

export function FamilyStatsCard({ families }: FamilyStatsCardProps) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-lg">👨‍👩‍👦</span>
        <h3 className="text-sm font-bold text-slate-300">إحصائيات الأسر</h3>
      </div>

      <div className="space-y-4">
        {families.map((family, i) => (
          <div
            key={family.name}
            className="p-4 rounded-xl border border-[rgba(212,160,23,0.1)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(212,160,23,0.03)] transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    i === 1 ? 'bg-slate-400/20 text-slate-300' :
                    'bg-orange-500/20 text-orange-400'}
                `}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-200">{family.name}</p>
                  <p className="text-xs text-slate-500">{family.count} أعضاء</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getScoreBg(family.percentage)}`}>
                {getScoreLabel(family.percentage)}
              </span>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">المجموع</p>
                <p className="text-lg font-bold text-yellow-400">{family.total}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">المتوسط</p>
                <p className="text-lg font-bold text-blue-400">{family.average}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">النسبة</p>
                <p className="text-lg font-bold text-emerald-400">{family.percentage}%</p>
              </div>
            </div>

            {/* Progress */}
            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-l ${getProgressBarColor(family.percentage)} progress-bar`}
                style={{ '--progress': `${family.percentage}%` } as React.CSSProperties}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
