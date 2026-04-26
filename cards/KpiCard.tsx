'use client'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: string
  accent?: 'gold' | 'emerald' | 'blue' | 'rose'
  delay?: number
}

const accentStyles = {
  gold: {
    bg: 'from-yellow-500/10 to-amber-500/5',
    border: 'border-yellow-500/20',
    icon: 'bg-yellow-500/10 text-yellow-400',
    value: 'text-yellow-400',
    glow: 'shadow-yellow-500/10',
  },
  emerald: {
    bg: 'from-emerald-500/10 to-green-500/5',
    border: 'border-emerald-500/20',
    icon: 'bg-emerald-500/10 text-emerald-400',
    value: 'text-emerald-400',
    glow: 'shadow-emerald-500/10',
  },
  blue: {
    bg: 'from-blue-500/10 to-cyan-500/5',
    border: 'border-blue-500/20',
    icon: 'bg-blue-500/10 text-blue-400',
    value: 'text-blue-400',
    glow: 'shadow-blue-500/10',
  },
  rose: {
    bg: 'from-rose-500/10 to-pink-500/5',
    border: 'border-rose-500/20',
    icon: 'bg-rose-500/10 text-rose-400',
    value: 'text-rose-400',
    glow: 'shadow-rose-500/10',
  },
}

export function KpiCard({ title, value, subtitle, icon, accent = 'gold', delay = 0 }: KpiCardProps) {
  const styles = accentStyles[accent]

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border ${styles.border}
        bg-gradient-to-br ${styles.bg} backdrop-blur-sm
        shadow-xl ${styles.glow} shadow-lg
        p-4 sm:p-6 animate-slide-up
        hover:scale-[1.02] transition-transform duration-300
      `}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      {/* Decorative corner pattern */}
      <div className="absolute top-0 left-0 w-20 h-20 opacity-5">
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <path
            d="M0 0 L80 0 L80 80 Z"
            fill="currentColor"
            className={styles.value.replace('text-', 'fill-').replace('-400', '-500')}
          />
        </svg>
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl ${styles.icon} flex items-center justify-center text-lg sm:text-2xl`}>
            {icon}
          </div>
          {subtitle && (
            <span className="text-[10px] sm:text-xs text-slate-500 bg-slate-800/50 rounded-full px-2 py-1 truncate max-w-[80px] sm:max-w-none">
              {subtitle}
            </span>
          )}
        </div>

        <p className="text-xs sm:text-sm text-slate-400 mb-1 font-medium">{title}</p>
        <p className={`text-xl sm:text-3xl font-bold ${styles.value} tracking-tight truncate`}>
          {value}
        </p>
      </div>
    </div>
  )
}