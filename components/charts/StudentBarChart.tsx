'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import { StudentData, WeekEnabled } from '@/lib/types'
import { getScoreColor } from '@/lib/dataProcessor'

interface StudentBarChartProps {
  students: StudentData[]
  selectedWeek: string
  weekEnabled: WeekEnabled
}

const barColors = {
  excellent: '#10b981',
  average: '#eab308',
  weak: '#ef4444',
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: StudentData & { displayScore: number } }> }) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#131d35] border border-[rgba(212,160,23,0.3)] rounded-xl p-3 text-sm shadow-xl" dir="rtl">
      <p className="font-bold text-slate-200 mb-1">{d.name}</p>
      <p className="text-yellow-400">الدرجة: <span className="font-bold">{d.displayScore}</span></p>
      <p className="text-slate-400">الأسرة: {d.family}</p>
      <p className="text-slate-400">الترتيب: #{d.rank}</p>
    </div>
  )
}

export function StudentBarChart({ students, selectedWeek, weekEnabled }: StudentBarChartProps) {
  const getScore = (s: StudentData): number => {
    if (selectedWeek === '1') return s.week1
    if (selectedWeek === '2') return s.week2
    if (selectedWeek === '3') return s.week3
    return s.total
  }

  const data = students
    .map(s => ({ ...s, displayScore: getScore(s) }))
    .sort((a, b) => b.displayScore - a.displayScore)

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h3 className="text-sm font-bold text-slate-300">ترتيب الطلاب</h3>
        </div>
        <span className="text-xs text-slate-500">
          {selectedWeek === 'all' ? 'إجمالي الأسابيع' : `الأسبوع ${selectedWeek === '1' ? 'الأول' : selectedWeek === '2' ? 'الثاني' : 'الثالث'}`}
        </span>
      </div>

      <div style={{ height: Math.max(300, data.length * 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Cairo' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Cairo' }}
              axisLine={false}
              tickLine={false}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="displayScore" radius={[0, 6, 6, 0]} maxBarSize={28}>
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={barColors[getScoreColor(entry.percentage) as keyof typeof barColors]}
                />
              ))}
              <LabelList
                dataKey="displayScore"
                position="right"
                style={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Cairo' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 justify-center flex-wrap">
        {[
          { color: '#10b981', label: 'ممتاز (80%+)' },
          { color: '#eab308', label: 'متوسط (50-79%)' },
          { color: '#ef4444', label: 'ضعيف (<50%)' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}
