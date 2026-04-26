'use client'

import { WeekEnabled } from '@/lib/types'

interface WeekStatusProps {
  weekEnabled: WeekEnabled
}

const weekLabels: Record<keyof WeekEnabled, string> = {
  week1: 'الأسبوع الأول',
  week2: 'الأسبوع الثاني',
  week3: 'الأسبوع الثالث',
}

export function WeekStatus({ weekEnabled }: WeekStatusProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <span className="text-xs text-slate-500 font-medium">حالة الأسابيع:</span>
      {(Object.keys(weekEnabled) as (keyof WeekEnabled)[]).map(key => {
        const enabled = weekEnabled[key]
        return (
          <div
            key={key}
            className={`
              flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border
              transition-all duration-300
              ${enabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-700/30 border-slate-600/30 text-slate-500'
              }
            `}
          >
            <span>{enabled ? '✅' : '❌'}</span>
            <span>{weekLabels[key]}</span>
          </div>
        )
      })}
    </div>
  )
}
