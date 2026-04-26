'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Dot,
} from 'recharts'
import { StudentData, WeekEnabled } from '@/lib/types'

interface WeeklyLineChartProps {
  students: StudentData[]
  weekEnabled: WeekEnabled
}

const COLORS = [
  '#d4a017', '#10b981', '#60a5fa', '#f472b6',
  '#a78bfa', '#fb923c', '#34d399', '#fbbf24',
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#131d35] border border-[rgba(212,160,23,0.3)] rounded-xl p-3 text-sm shadow-xl" dir="rtl">
      <p className="font-bold text-slate-300 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 text-xs mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-bold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function WeeklyLineChart({ students, weekEnabled }: WeeklyLineChartProps) {
  // Build chart data from enabled weeks only
  const weekData = []
  if (weekEnabled.week1) weekData.push({ week: 'الأسبوع الأول', weekKey: 'week1' })
  if (weekEnabled.week2) weekData.push({ week: 'الأسبوع الثاني', weekKey: 'week2' })
  if (weekEnabled.week3) weekData.push({ week: 'الأسبوع الثالث', weekKey: 'week3' })

  const data = weekData.map(({ week, weekKey }) => {
    const point: Record<string, string | number> = { week }
    students.forEach(s => {
      point[s.name] = s[weekKey as keyof StudentData] as number
    })
    return point
  })

  if (data.length === 0) {
    return (
      <div className="glass-card p-5 flex items-center justify-center h-64">
        <p className="text-slate-500 text-sm">لا توجد أسابيع مفعلة</p>
      </div>
    )
  }

  // Only show top 8 students to keep chart readable
  const topStudents = [...students].sort((a, b) => b.total - a.total).slice(0, 8)

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📈</span>
        <h3 className="text-sm font-bold text-slate-300">تطور الأداء الأسبوعي</h3>
        {students.length > 8 && (
          <span className="text-xs text-slate-500">(أفضل 8 طلاب)</span>
        )}
      </div>

      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="week"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Cairo' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontFamily: 'Cairo', fontSize: 11, color: '#94a3b8', paddingTop: 12 }}
            />
            {topStudents.map((student, i) => (
              <Line
                key={student.name}
                type="monotone"
                dataKey={student.name}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={<Dot r={4} fill={COLORS[i % COLORS.length]} />}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
