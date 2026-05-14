'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { DashboardData, StudentData, FamilyStats, WeekEnabled, StudentMemorization } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const STUDENT_DELAY = 2000
const WEEK_MAX: Record<number, number> = { 1: 2700, 2: 2900, 3: 2300 }
const WEEK_LABEL: Record<number, string> = { 1: 'الأول', 2: 'الثاني', 3: 'الثالث' }
const WEEK_ICON: Record<number, string>  = { 1: '🌱', 2: '🌿', 3: '🌾' }

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = 'w1' | 'w2' | 'w3' | 'total' | 'families' | 'hifz' | 'final'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pctColor(p: number) {
  return p >= 85 ? '#22c55e' : p >= 65 ? '#d4a017' : p >= 45 ? '#f97316' : '#ef4444'
}
function pctBg(p: number) {
  return p >= 85 ? 'rgba(34,197,94,0.1)' : p >= 65 ? 'rgba(212,160,23,0.1)' : 'rgba(239,68,68,0.1)'
}
function medalEmoji(rank: number) {
  return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null
}

// ─── FadeIn animation ─────────────────────────────────────────────────────────

function FadeIn({ children, className }: { children: React.ReactNode; className?: string }) {
  const [show, setShow] = useState(false)
  useEffect(() => { const t = setTimeout(() => setShow(true), 40); return () => clearTimeout(t) }, [])
  return (
    <div
      className={className}
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'none' : 'translateY(16px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      {children}
    </div>
  )
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ pct }: { pct: number }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(pct), 100); return () => clearTimeout(t) }, [pct])
  return (
    <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${w}%`, background: pctColor(pct), borderRadius: 99, transition: 'width 0.9s ease' }} />
    </div>
  )
}

// ─── Student card (compact) ───────────────────────────────────────────────────

function StudentCard({ student, rank, score, maxScore }: {
  student: StudentData; rank: number; score: number; maxScore: number
}) {
  const pct = maxScore > 0 ? Math.min(100, Math.round(score / maxScore * 100)) : 0
  const m   = medalEmoji(rank)
  const top = rank <= 3

  return (
    <FadeIn>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: top ? `rgba(212,160,23,${0.09 - (rank - 1) * 0.02})` : 'rgba(255,255,255,0.03)',
        border: `1px solid rgba(212,160,23,${top ? 0.25 : 0.07})`,
        borderRadius: 14, padding: '13px 16px', marginBottom: 8,
      }}>
        {/* Rank */}
        <div style={{
          width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: m ? 22 : 14, fontWeight: 700,
          background: m ? 'rgba(212,160,23,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid rgba(212,160,23,${m ? 0.22 : 0.05})`,
          color: rank === 1 ? '#fbbf24' : rank === 2 ? '#94a3b8' : rank === 3 ? '#fb923c' : '#475569',
        }}>
          {m ?? rank}
        </div>

        {/* Name + bar */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0' }}>{student.name}</span>
            <span style={{
              fontSize: 10, background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.18)', color: '#60a5fa',
              borderRadius: 99, padding: '1px 7px', flexShrink: 0,
            }}>{student.family}</span>
          </div>
          <ScoreBar pct={pct} />
        </div>

        {/* Score */}
        <div style={{ textAlign: 'left', flexShrink: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#f0c040', lineHeight: 1 }}>
            {score.toLocaleString('ar-SA')}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{pct}%</div>
        </div>
      </div>
    </FadeIn>
  )
}


// ─── Week view ────────────────────────────────────────────────────────────────

function WeekView({ weekNum, students, playState, onStart }: {
  weekNum: 1 | 2 | 3
  students: StudentData[]
  playState: { started: boolean; revealed: number }
  onStart: () => void
}) {
  const maxScore = WEEK_MAX[weekNum]
  const scoreKey = `week${weekNum}` as keyof StudentData
  const sorted   = useMemo(() =>
    [...students].sort((a, b) => (b[scoreKey] as number) - (a[scoreKey] as number)),
    [students, scoreKey]
  )
  const contentRef = useRef<HTMLDivElement>(null)
  const { started, revealed } = playState
  const allDone = revealed >= sorted.length && started

  // Auto-scroll on new reveal
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: contentRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [revealed])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Week header bar */}
      <div style={{
        padding: '14px 20px', flexShrink: 0,
        background: 'rgba(212,160,23,0.04)', borderBottom: '1px solid rgba(212,160,23,0.08)',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 28 }}>{WEEK_ICON[weekNum]}</span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f0e0' }}>الأسبوع {WEEK_LABEL[weekNum]}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            الدرجة القصوى {maxScore.toLocaleString('ar-SA')} · {students.length} طالب
          </div>
        </div>
        {started && (
          <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ height: 4, width: 120, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
              <div style={{
                height: '100%', borderRadius: 99,
                background: allDone ? '#22c55e' : '#d4a017',
                width: `${sorted.length > 0 ? (revealed / sorted.length) * 100 : 0}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <span style={{ fontSize: 12, color: allDone ? '#22c55e' : '#d4a017', fontWeight: 600 }}>
              {allDone ? 'اكتمل ✓' : `${revealed} / ${sorted.length}`}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {/* Intro / Start button */}
        {!started && (
          <FadeIn>
            <div style={{
              textAlign: 'center', padding: '48px 24px',
              background: 'rgba(212,160,23,0.04)', border: '1px solid rgba(212,160,23,0.12)',
              borderRadius: 16, marginBottom: 20,
            }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>{WEEK_ICON[weekNum]}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#f0f0e0', marginBottom: 8 }}>
                الأسبوع {WEEK_LABEL[weekNum]}
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 28 }}>
                {students.length} طالب · الدرجة القصوى {maxScore.toLocaleString('ar-SA')}
              </div>
              <button onClick={onStart} style={{
                background: 'linear-gradient(135deg, #d4a017, #f0c040)',
                border: 'none', borderRadius: 12, padding: '13px 36px',
                fontSize: 15, fontWeight: 800, color: '#0a0f1e', cursor: 'pointer',
                fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(212,160,23,0.3)',
              }}>
                ابدأ عرض الترتيب ←
              </button>
            </div>
          </FadeIn>
        )}

        {/* Revealed students */}
        {sorted.slice(0, revealed).map((student, i) => (
          <StudentCard key={student.name} student={student} rank={i + 1}
            score={student[scoreKey] as number} maxScore={maxScore} />
        ))}

        {/* Playing indicator */}
        {started && !allDone && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#334155', fontSize: 13 }}>
            <span style={{ display: 'inline-block', animation: 'pulse 1.5s infinite' }}>⏳</span>
            {' '}الطالب التالي خلال ثانيتين…
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Total view ───────────────────────────────────────────────────────────────

function TotalView({ students, maxScore }: { students: StudentData[]; maxScore: number }) {
  const sorted = useMemo(() => [...students].sort((a, b) => b.total - a.total), [students])
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '14px 20px', flexShrink: 0,
        background: 'rgba(212,160,23,0.04)', borderBottom: '1px solid rgba(212,160,23,0.08)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 24 }}>🏅</span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f0e0' }}>الترتيب الكلي</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>مجموع 3 أسابيع · {maxScore.toLocaleString('ar-SA')} درجة قصوى</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {sorted.map((s, i) => (
          <StudentCard key={s.name} student={s} rank={i + 1} score={s.total} maxScore={maxScore} />
        ))}
      </div>
    </div>
  )
}

// ─── Family week card ─────────────────────────────────────────────────────────

function FamilyWeekCard({ family, weekNum, rank }: {
  family: FamilyStats; weekNum: 1 | 2 | 3; rank: number
}) {
  const weekScore = weekNum === 1 ? family.week1 : weekNum === 2 ? family.week2 : family.week3
  const eval_     = weekNum === 1 ? family.w1Eval : weekNum === 2 ? family.w2Eval : family.w3Eval
  const m         = medalEmoji(rank)
  const isTop     = rank <= 3

  const evalRows = eval_ ? [
    { label: 'رياضي ⚽',   val: eval_.athletic, color: '#38bdf8' },
    { label: 'شعبيات 🎵',  val: eval_.popular,  color: '#fb923c' },
    { label: 'ثقافي 🧠',   val: eval_.cultural, color: '#a78bfa' },
  ] : []

  return (
    <FadeIn>
      <div style={{
        background: isTop ? `rgba(212,160,23,${0.08 - (rank - 1) * 0.02})` : 'rgba(255,255,255,0.03)',
        border: `1px solid rgba(212,160,23,${isTop ? 0.25 : 0.07})`,
        borderRadius: 14, padding: '16px 20px', marginBottom: 10,
        display: 'flex', alignItems: 'flex-start', gap: 14,
      }}>
        {/* Rank badge */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: m ? 22 : 15, fontWeight: 700,
          background: m ? 'rgba(212,160,23,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid rgba(212,160,23,${m ? 0.22 : 0.05})`,
          color: rank === 1 ? '#fbbf24' : rank === 2 ? '#94a3b8' : rank === 3 ? '#fb923c' : '#475569',
        }}>
          {m ?? rank}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f0e0', marginBottom: 10 }}>{family.name}</div>

          {/* Score + eval grid */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Total for this week */}
            <div style={{
              background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.2)',
              borderRadius: 10, padding: '8px 14px', minWidth: 100, textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, color: '#d4a017', marginBottom: 3, letterSpacing: 1 }}>مجموع الأسبوع</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#f0c040' }}>
                {weekScore.toLocaleString('ar-SA')}
              </div>
            </div>

            {/* Eval breakdown */}
            {evalRows.map(row => (
              <div key={row.label} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10, padding: '8px 14px', minWidth: 85, textAlign: 'center',
              }}>
                <div style={{ fontSize: 10, color: '#64748b', marginBottom: 3 }}>{row.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: row.val > 0 ? row.color : '#334155' }}>
                  {row.val.toLocaleString('ar-SA')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FadeIn>
  )
}

// ─── Family total card ────────────────────────────────────────────────────────

function FamilyTotalCard({ family, rank }: { family: FamilyStats; rank: number }) {
  const m     = medalEmoji(rank)
  const isTop = rank <= 3

  return (
    <FadeIn>
      <div style={{
        background: isTop ? `rgba(212,160,23,${0.09 - (rank - 1) * 0.02})` : 'rgba(255,255,255,0.03)',
        border: `1px solid rgba(212,160,23,${isTop ? 0.28 : 0.07})`,
        borderRadius: 14, padding: '16px 20px', marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: m ? 22 : 15, fontWeight: 700,
          background: m ? 'rgba(212,160,23,0.12)' : 'rgba(255,255,255,0.04)',
          border: `1px solid rgba(212,160,23,${m ? 0.25 : 0.05})`,
          color: rank === 1 ? '#fbbf24' : rank === 2 ? '#94a3b8' : rank === 3 ? '#fb923c' : '#475569',
        }}>
          {m ?? rank}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f0e0', marginBottom: 6 }}>{family.name}</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'أسبوع ١ 🌱', val: family.week1 },
              { label: 'أسبوع ٢ 🌿', val: family.week2 },
              { label: 'أسبوع ٣ 🌾', val: family.week3 },
            ].map(w => w.val > 0 && (
              <span key={w.label} style={{ fontSize: 11, color: '#64748b' }}>
                {w.label}: <span style={{ color: '#94a3b8', fontWeight: 600 }}>{w.val.toLocaleString('ar-SA')}</span>
              </span>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'left', flexShrink: 0 }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: rank === 1 ? '#fbbf24' : '#f0c040' }}>
            {family.total.toLocaleString('ar-SA')}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 2 }}>الإجمالي</div>
        </div>
      </div>
    </FadeIn>
  )
}

// ─── Families view ────────────────────────────────────────────────────────────

type FamilyTab = 'fw1' | 'fw2' | 'fw3' | 'ftotal'

function FamiliesView({ families, weekEnabled }: {
  families: FamilyStats[]; weekEnabled: WeekEnabled
}) {
  const firstEnabled: FamilyTab = weekEnabled.week1 ? 'fw1' : weekEnabled.week2 ? 'fw2' : weekEnabled.week3 ? 'fw3' : 'ftotal'
  const [activeTab, setActiveTab] = useState<FamilyTab>(firstEnabled)

  const familyTabs: { id: FamilyTab; label: string; icon: string }[] = [
    ...(weekEnabled.week1 ? [{ id: 'fw1' as FamilyTab, label: 'أسبوع ١', icon: '🌱' }] : []),
    ...(weekEnabled.week2 ? [{ id: 'fw2' as FamilyTab, label: 'أسبوع ٢', icon: '🌿' }] : []),
    ...(weekEnabled.week3 ? [{ id: 'fw3' as FamilyTab, label: 'أسبوع ٣', icon: '🌾' }] : []),
    { id: 'ftotal', label: 'الإجمالي', icon: '🏆' },
  ]

  const sortedByTotal = useMemo(() => [...families].sort((a, b) => b.total - a.total), [families])

  const getSortedByWeek = (w: 1 | 2 | 3) =>
    [...families].sort((a, b) =>
      (w === 1 ? b.week1 - a.week1 : w === 2 ? b.week2 - a.week2 : b.week3 - a.week3)
    )

  const weekNum: 1 | 2 | 3 | null = activeTab === 'fw1' ? 1 : activeTab === 'fw2' ? 2 : activeTab === 'fw3' ? 3 : null
  const weekSorted = weekNum ? getSortedByWeek(weekNum) : []

  const weekLabel = activeTab === 'fw1' ? 'الأول' : activeTab === 'fw2' ? 'الثاني' : activeTab === 'fw3' ? 'الثالث' : ''
  const weekIcon  = activeTab === 'fw1' ? '🌱' : activeTab === 'fw2' ? '🌿' : activeTab === 'fw3' ? '🌾' : '🏆'

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '12px 20px', flexShrink: 0,
        background: 'rgba(212,160,23,0.04)', borderBottom: '1px solid rgba(212,160,23,0.08)',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 22 }}>👨‍👩‍👦</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f0f0e0' }}>حصاد الأسر</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {activeTab === 'ftotal' ? 'المجموع النهائي لجميع الأسابيع' : `نتائج الأسبوع ${weekLabel}`}
          </div>
        </div>
        {/* Sub-tabs */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {familyTabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 13px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeTab === t.id ? 'rgba(212,160,23,0.18)' : 'rgba(255,255,255,0.04)',
              color: activeTab === t.id ? '#f0c040' : '#475569',
              fontWeight: activeTab === t.id ? 700 : 400,
              fontSize: 12, fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {weekNum !== null && (
          <>
            <div style={{ fontSize: 11, color: '#475569', marginBottom: 12, letterSpacing: 1 }}>
              {weekIcon} ترتيب الأسر — الأسبوع {weekLabel}
            </div>
            {weekSorted.map((f, i) => (
              <FamilyWeekCard key={f.name} family={f} weekNum={weekNum} rank={i + 1} />
            ))}
          </>
        )}

        {activeTab === 'ftotal' && (
          <>
            <div style={{ fontSize: 11, color: '#475569', marginBottom: 12, letterSpacing: 1 }}>
              🏆 الترتيب النهائي — مجموع جميع الأسابيع
            </div>
            {/* Winner banner */}
            {sortedByTotal[0] && (
              <FadeIn>
                <div style={{
                  background: 'rgba(212,160,23,0.1)', border: '2px solid rgba(212,160,23,0.35)',
                  borderRadius: 14, padding: '18px 24px', marginBottom: 16, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 11, color: '#d4a017', letterSpacing: 2, marginBottom: 6 }}>🏆 الفائزة بالحصاد 🏆</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#fbbf24' }}>
                    {sortedByTotal[0].name}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#f0c040', marginTop: 6 }}>
                    {sortedByTotal[0].total.toLocaleString('ar-SA')} درجة
                  </div>
                </div>
              </FadeIn>
            )}
            {sortedByTotal.map((f, i) => (
              <FamilyTotalCard key={f.name} family={f} rank={i + 1} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Final view ───────────────────────────────────────────────────────────────

function FinalView({ data }: { data: DashboardData }) {
  const { students, families, weekEnabled } = data
  const topStudent = students[0]
  const sortedFamilies = useMemo(() => [...families].sort((a, b) => b.total - a.total), [families])
  const enabledWeeks = [weekEnabled.week1, weekEnabled.week2, weekEnabled.week3].filter(Boolean).length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '14px 20px', flexShrink: 0,
        background: 'rgba(212,160,23,0.04)', borderBottom: '1px solid rgba(212,160,23,0.08)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 24 }}>🏆</span>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f0e0' }}>الملخص النهائي</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 20 }}>
          {[
            { icon: '👥', label: 'الطلاب', value: students.length },
            { icon: '📅', label: 'الأسابيع', value: enabledWeeks },
            { icon: '🏠', label: 'الأسر', value: families.length },
          ].map(k => (
            <div key={k.label} style={{
              background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.12)',
              borderRadius: 12, padding: '14px 16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{k.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#f0c040' }}>{k.value}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Top student */}
        {topStudent && (
          <div style={{
            background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.25)',
            borderRadius: 14, padding: '18px 20px', marginBottom: 16, textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, color: '#d4a017', letterSpacing: 2, marginBottom: 8 }}>أفضل طالب في البرنامج</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#f0f0e0' }}>🥇 {topStudent.name}</div>
            <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 6 }}>
              {topStudent.total.toLocaleString('ar-SA')} درجة · {topStudent.percentage}% · {topStudent.family}
            </div>
          </div>
        )}

        {/* Family podium */}
        <div style={{ fontSize: 11, color: '#475569', letterSpacing: 2, marginBottom: 10 }}>ترتيب الأسر النهائي</div>
        {sortedFamilies.map((f, i) => {
          const m = medalEmoji(i + 1)
          return (
            <div key={f.name} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: i === 0 ? 'rgba(234,179,8,0.09)' : 'rgba(255,255,255,0.03)',
              border: `1px solid rgba(212,160,23,${i === 0 ? 0.28 : 0.07})`,
              borderRadius: 12, padding: '13px 16px', marginBottom: 8,
            }}>
              <span style={{ fontSize: m ? 24 : 14, flexShrink: 0 }}>{m ?? (i + 1)}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>{f.name}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{f.count} طالب</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: i === 0 ? '#fbbf24' : '#d4a017' }}>
                {f.total.toLocaleString('ar-SA')}
              </div>
            </div>
          )
        })}

        {/* Back link */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link href="/dashboard" style={{
            display: 'inline-block',
            background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.3)',
            color: '#f0c040', borderRadius: 10, padding: '11px 28px',
            fontSize: 14, fontWeight: 700, textDecoration: 'none',
          }}>
            العودة للوحة المتابعة ←
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Hifz card ────────────────────────────────────────────────────────────────

function HifzCard({ mem, rank }: { mem: StudentMemorization; rank: number }) {
  const m = medalEmoji(rank)
  const top = rank <= 3
  return (
    <FadeIn>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: top ? `rgba(99,102,241,${0.09 - (rank - 1) * 0.02})` : 'rgba(255,255,255,0.03)',
        border: `1px solid rgba(99,102,241,${top ? 0.25 : 0.07})`,
        borderRadius: 14, padding: '13px 16px', marginBottom: 8,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: m ? 22 : 14, fontWeight: 700,
          background: m ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid rgba(99,102,241,${m ? 0.22 : 0.05})`,
          color: rank === 1 ? '#fbbf24' : rank === 2 ? '#94a3b8' : rank === 3 ? '#fb923c' : '#475569',
        }}>
          {m ?? rank}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{mem.name}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            من <span style={{ color: '#a5b4fc' }}>{mem.startSura}</span>
            {' '}إلى <span style={{ color: '#a5b4fc' }}>{mem.endSura}</span>
          </div>
        </div>
        <div style={{ textAlign: 'left', flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#818cf8' }}>{mem.pages}</div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>صفحة</div>
        </div>
      </div>
    </FadeIn>
  )
}

// ─── Hifz view ────────────────────────────────────────────────────────────────

function HifzView({ memorizations }: { memorizations: StudentMemorization[] }) {
  const sorted = useMemo(() => [...memorizations].sort((a, b) => b.pages - a.pages), [memorizations])
  const totalPages = useMemo(() => sorted.reduce((s, m) => s + m.pages, 0), [sorted])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '14px 20px', flexShrink: 0,
        background: 'rgba(99,102,241,0.04)', borderBottom: '1px solid rgba(99,102,241,0.1)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 24 }}>📖</span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f0e0' }}>بيانات الحفظ</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {sorted.length} طالب · {totalPages.toLocaleString('ar-SA')} صفحة إجمالاً
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#334155', fontSize: 14 }}>
            لا توجد بيانات حفظ
          </div>
        ) : (
          sorted.map((m, i) => <HifzCard key={m.name} mem={m} rank={i + 1} />)
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HassadDashboard({ data }: { data: DashboardData }) {
  const { students, families, weekEnabled, maxPossibleScore, memorizations } = data

  // Active tab
  const defaultTab = (): Tab => weekEnabled.week1 ? 'w1' : weekEnabled.week2 ? 'w2' : weekEnabled.week3 ? 'w3' : 'total'
  const [tab, setTab] = useState<Tab>(defaultTab)

  // Per-week play state (persists across tab switches)
  const [weekPlay, setWeekPlay] = useState<Record<1 | 2 | 3, { started: boolean; revealed: number }>>({
    1: { started: false, revealed: 0 },
    2: { started: false, revealed: 0 },
    3: { started: false, revealed: 0 },
  })

  const activeWeekNum: 1 | 2 | 3 | null = tab === 'w1' ? 1 : tab === 'w2' ? 2 : tab === 'w3' ? 3 : null

  // Sorted students per week (memoized)
  const sortedByWeek = useMemo(() => ({
    1: [...students].sort((a, b) => b.week1 - a.week1),
    2: [...students].sort((a, b) => b.week2 - a.week2),
    3: [...students].sort((a, b) => b.week3 - a.week3),
  }), [students])

  // Auto-play engine — only runs for active week
  useEffect(() => {
    if (!activeWeekNum) return
    const state = weekPlay[activeWeekNum]
    if (!state.started) return
    const total = sortedByWeek[activeWeekNum].length
    if (state.revealed >= total) return

    const t = setTimeout(() => {
      setWeekPlay(prev => ({
        ...prev,
        [activeWeekNum]: { ...prev[activeWeekNum], revealed: prev[activeWeekNum].revealed + 1 },
      }))
    }, STUDENT_DELAY)
    return () => clearTimeout(t)
  }, [activeWeekNum, weekPlay, sortedByWeek])

  const startWeek = useCallback((n: 1 | 2 | 3) => {
    setWeekPlay(prev => ({
      ...prev,
      [n]: { started: true, revealed: prev[n].revealed > 0 ? prev[n].revealed : 1 },
    }))
  }, [])

  // Build tabs list
  const tabs: { id: Tab; label: string; icon: string }[] = [
    ...(weekEnabled.week1 ? [{ id: 'w1' as Tab, label: 'أسبوع ١', icon: '🌱' }] : []),
    ...(weekEnabled.week2 ? [{ id: 'w2' as Tab, label: 'أسبوع ٢', icon: '🌿' }] : []),
    ...(weekEnabled.week3 ? [{ id: 'w3' as Tab, label: 'أسبوع ٣', icon: '🌾' }] : []),
    { id: 'total',    label: 'الإجمالي', icon: '🏅' },
    { id: 'families', label: 'الأسر',    icon: '👨‍👩‍👦' },
    { id: 'hifz',     label: 'الحفظ',    icon: '📖' },
    { id: 'final',    label: 'الختام',   icon: '🏆' },
  ]

  return (
    <div dir="rtl" style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse at 50% 0%, #12192e 0%, #0a0f1e 65%)',
      fontFamily: '"Tajawal", "Cairo", sans-serif',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      color: '#e2e8f0',
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-track { background: transparent }
        ::-webkit-scrollbar-thumb { background: rgba(212,160,23,0.2); border-radius: 99px }
      `}</style>

      {/* ── Top navigation ── */}
      <header style={{
        flexShrink: 0, background: 'rgba(10,15,30,0.9)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(212,160,23,0.1)',
        display: 'flex', alignItems: 'center', gap: 0,
        paddingRight: 16, paddingLeft: 16, height: 52,
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {/* Brand */}
        <div style={{ fontSize: 13, fontWeight: 700, color: '#d4a017', flexShrink: 0, marginLeft: 20 }}>
          🌾 الحصاد
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, flex: 1, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: tab === t.id ? 'rgba(212,160,23,0.15)' : 'transparent',
              color: tab === t.id ? '#f0c040' : '#475569',
              fontWeight: tab === t.id ? 700 : 400,
              fontSize: 13, fontFamily: 'inherit', flexShrink: 0,
              transition: 'all 0.2s',
            }}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {/* Dot indicator if week has started */}
              {(t.id === 'w1' || t.id === 'w2' || t.id === 'w3') && (() => {
                const wn = t.id === 'w1' ? 1 : t.id === 'w2' ? 2 : 3
                const st = weekPlay[wn]
                if (!st.started) return null
                const done = st.revealed >= sortedByWeek[wn].length
                return (
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: done ? '#22c55e' : '#d4a017',
                    animation: done ? 'none' : 'pulse 1.5s infinite',
                  }} />
                )
              })()}
            </button>
          ))}
        </div>

        {/* Back link */}
        <Link href="/dashboard" style={{
          flexShrink: 0, marginRight: 8, fontSize: 12, color: '#334155',
          textDecoration: 'none', padding: '5px 10px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 7,
        }}>
          ← لوحة
        </Link>
      </header>

      {/* ── Content ── */}
      <main style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'w1' && weekEnabled.week1 && (
          <WeekView weekNum={1} students={students}
            playState={weekPlay[1]} onStart={() => startWeek(1)} />
        )}
        {tab === 'w2' && weekEnabled.week2 && (
          <WeekView weekNum={2} students={students}
            playState={weekPlay[2]} onStart={() => startWeek(2)} />
        )}
        {tab === 'w3' && weekEnabled.week3 && (
          <WeekView weekNum={3} students={students}
            playState={weekPlay[3]} onStart={() => startWeek(3)} />
        )}
        {tab === 'total' && (
          <TotalView students={students} maxScore={maxPossibleScore} />
        )}
        {tab === 'families' && (
          <FamiliesView families={families} weekEnabled={weekEnabled} />
        )}
        {tab === 'hifz' && (
          <HifzView memorizations={memorizations} />
        )}
        {tab === 'final' && (
          <FinalView data={data} />
        )}
      </main>
    </div>
  )
}
