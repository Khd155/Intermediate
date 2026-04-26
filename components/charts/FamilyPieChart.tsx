'use client'

import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { FamilyStats } from '@/lib/types'

interface FamilyPieChartProps {
  families: FamilyStats[]
}

const COLORS = ['#d4a017', '#10b981', '#60a5fa', '#f472b6', '#a78bfa']

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: FamilyStats & { value: number } }> }) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#131d35] border border-[rgba(212,160,23,0.3)] rounded-xl p-3 text-sm shadow-xl" dir="rtl">
      <p className="font-bold text-slate-200 mb-1">{d.name}</p>
      <p className="text-yellow-400">المجموع: <span className="font-bold">{d.total}</span></p>
      <p className="text-slate-400">المتوسط: {d.average}</p>
      <p className="text-slate-400">عدد الأعضاء: {d.count}</p>
    </div>
  )
}

function CustomLabel({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: {
  cx: number; cy: number; midAngle: number
  innerRadius: number; outerRadius: number; percent: number
}) {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x} y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontFamily="Cairo"
      fontWeight="600"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function FamilyPieChart({ families }: FamilyPieChartProps) {
  const data = families.map(f => ({ ...f, value: f.total }))

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🥧</span>
        <h3 className="text-sm font-bold text-slate-300">توزيع الدرجات بين الأسر</h3>
      </div>

      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              labelLine={false}
              label={CustomLabel as unknown as boolean}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (
                <span style={{ color: '#94a3b8', fontFamily: 'Cairo', fontSize: 11 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
