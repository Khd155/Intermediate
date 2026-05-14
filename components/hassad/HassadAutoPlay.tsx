'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { DashboardData, StudentData, FamilyStats, WeekEnabled } from '@/lib/types'

// ─── Config ───────────────────────────────────────────────────────────────────

const DELAY_STUDENT  = 1000   // ms between students in week/total view
const DELAY_FAMILY   = 1800   // ms between families
const PAUSE_DONE     = 2200   // ms pause after last item before auto-advance

const WEEK_MAX: Record<number, number> = { 1: 2700, 2: 2800, 3: 2800 }
const WEEK_LABEL: Record<number, string> = { 1: 'الأول', 2: 'الثاني', 3: 'الثالث' }
const WEEK_ICON: Record<number, string> = { 1: '🌱', 2: '🌿', 3: '🌾' }

// ─── Phase machine ────────────────────────────────────────────────────────────

type Phase =
  | 'landing'
  | 'w1-intro' | 'w1-play'
  | 'w2-intro' | 'w2-play'
  | 'w3-intro' | 'w3-play'
  | 'total-play'
  | 'families-play'
  | 'final'

function phaseWeekNum(p: Phase): 1 | 2 | 3 | null {
  if (p === 'w1-intro' || p === 'w1-play') return 1
  if (p === 'w2-intro' || p === 'w2-play') return 2
  if (p === 'w3-intro' || p === 'w3-play') return 3
  return null
}

function isPlayPhase(p: Phase) {
  return p === 'w1-play' || p === 'w2-play' || p === 'w3-play' || p === 'total-play' || p === 'families-play'
}

function nextPhase(p: Phase, we: WeekEnabled): Phase {
  if (p === 'landing') {
    if (we.week1) return 'w1-intro'
    if (we.week2) return 'w2-intro'
    if (we.week3) return 'w3-intro'
    return 'total-play'
  }
  if (p === 'w1-intro') return 'w1-play'
  if (p === 'w1-play')  return we.week2 ? 'w2-intro' : we.week3 ? 'w3-intro' : 'total-play'
  if (p === 'w2-intro') return 'w2-play'
  if (p === 'w2-play')  return we.week3 ? 'w3-intro' : 'total-play'
  if (p === 'w3-intro') return 'w3-play'
  if (p === 'w3-play')  return 'total-play'
  if (p === 'total-play') return 'families-play'
  if (p === 'families-play') return 'final'
  return 'final'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pctColor(p: number) {
  return p >= 85 ? '#22c55e' : p >= 65 ? '#d4a017' : p >= 45 ? '#f97316' : '#ef4444'
}

function medal(rank: number) {
  return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null
}

// ─── Shared: Entry animation ──────────────────────────────────────────────────

function FlyIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay + 30)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <div style={{
      opacity: show ? 1 : 0,
      transform: show ? 'none' : 'translateY(20px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    }}>
      {children}
    </div>
  )
}

// ─── Student card ─────────────────────────────────────────────────────────────

function StudentCard({ student, rank, score, maxScore, delay = 0 }: {
  student: StudentData; rank: number; score: number; maxScore: number; delay?: number
}) {
  const pct = maxScore > 0 ? Math.min(100, Math.round(score / maxScore * 100)) : 0
  const m = medal(rank)
  const isTop3 = rank <= 3

  return (
    <FlyIn delay={delay}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: isTop3 ? `rgba(212,160,23,${0.1 - (rank - 1) * 0.025})` : 'rgba(255,255,255,0.03)',
        border: `1px solid rgba(212,160,23,${isTop3 ? 0.28 : 0.07})`,
        borderRadius: 14, padding: '13px 16px', marginBottom: 10,
      }}>
        {/* rank badge */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: m ? 24 : 15, fontWeight: 700,
          background: m ? 'rgba(212,160,23,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid rgba(212,160,23,${m ? 0.25 : 0.06})`,
          color: rank === 1 ? '#fbbf24' : rank === 2 ? '#94a3b8' : rank === 3 ? '#fb923c' : '#475569',
        }}>
          {m ?? rank}
        </div>

        {/* name + bar */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>{student.name}</span>
            <span style={{
              fontSize: 11, background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa',
              borderRadius: 99, padding: '1px 8px', flexShrink: 0,
            }}>
              {student.family}
            </span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
            <BarAnimate pct={pct} color={pctColor(pct)} />
          </div>
        </div>

        {/* score */}
        <div style={{ textAlign: 'left', flexShrink: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: '#f0c040', lineHeight: 1 }}>
            {score.toLocaleString('ar-SA')}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{pct}%</div>
        </div>
      </div>
    </FlyIn>
  )
}

function BarAnimate({ pct, color }: { pct: number; color: string }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(pct), 100); return () => clearTimeout(t) }, [pct])
  return (
    <div style={{
      height: '100%', width: `${w}%`, background: color, borderRadius: 99,
      transition: 'width 0.9s ease',
    }} />
  )
}

// ─── Family card (for families section) ──────────────────────────────────────

function FamilyCard({ family, rank, weekEnabled, delay = 0 }: {
  family: FamilyStats; rank: number; weekEnabled: WeekEnabled; delay?: number
}) {
  const m = medal(rank)
  const isTop = rank <= 3

  return (
    <FlyIn delay={delay}>
      <div style={{
        background: isTop ? 'rgba(212,160,23,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid rgba(212,160,23,${isTop ? 0.25 : 0.07})`,
        borderRadius: 16, padding: '18px 20px', marginBottom: 14,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: m ? 26 : 16, fontWeight: 700,
            background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.2)',
            color: rank === 1 ? '#fbbf24' : '#d4a017',
          }}>
            {m ?? rank}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#f0f0e0' }}>{family.name}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{family.count} طالب</div>
          </div>
          <div style={{ marginRight: 'auto', textAlign: 'left' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#f0c040' }}>
              {family.total.toLocaleString('ar-SA')}
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>المجموع الكلي</div>
          </div>
        </div>

        {/* Per-week breakdown */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {([1, 2, 3] as const).filter(w => weekEnabled[`week${w}` as keyof WeekEnabled]).map(w => {
            const score = w === 1 ? family.week1 : w === 2 ? family.week2 : family.week3
            return (
              <div key={w} style={{
                flex: 1, minWidth: 80,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10, padding: '10px 14px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>
                  {WEEK_ICON[w]} أسبوع {WEEK_LABEL[w]}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#d4a017' }}>
                  {score.toLocaleString('ar-SA')}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </FlyIn>
  )
}

// ─── Screens ──────────────────────────────────────────────────────────────────

function LandingScreen({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '0 32px' }}>
      <div style={{ fontSize: 72, marginBottom: 20, lineHeight: 1 }}>🌾</div>
      <div style={{
        display: 'inline-block', fontSize: 11, letterSpacing: 3, color: '#d4a017',
        border: '1px solid rgba(212,160,23,0.3)', borderRadius: 99,
        padding: '4px 18px', marginBottom: 24,
      }}>
        البرنامج الأسري • 1447هـ
      </div>
      <h1 style={{ fontSize: 'clamp(38px,9vw,80px)', fontWeight: 900, color: '#f0f0e0', margin: '0 0 14px', lineHeight: 1.1 }}>
        الحصاد الأسري
      </h1>
      <p style={{ fontSize: 18, color: '#64748b', marginBottom: 52 }}>
        نتائج وإنجازات البرنامج عبر الأسابيع
      </p>
      <button onClick={onNext} style={goldenBtn}>
        ابدأ الحصاد ←
      </button>
    </div>
  )
}

function WeekIntroScreen({ n, students, onNext }: {
  n: 1 | 2 | 3; students: StudentData[]; onNext: () => void
}) {
  const weekMax = WEEK_MAX[n]
  const scoreKey = `week${n}` as keyof StudentData
  const totalWeekScore = students.reduce((s, st) => s + (st[scoreKey] as number), 0)
  const topStudent = [...students].sort((a, b) => (b[scoreKey] as number) - (a[scoreKey] as number))[0]

  return (
    <div style={{ textAlign: 'center', padding: '0 32px', maxWidth: 520 }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>{WEEK_ICON[n]}</div>
      <div style={{
        display: 'inline-block', fontSize: 11, letterSpacing: 3, color: '#d4a017',
        border: '1px solid rgba(212,160,23,0.3)', borderRadius: 99,
        padding: '4px 18px', marginBottom: 20,
      }}>
        الأسبوع {WEEK_LABEL[n]}
      </div>
      <h2 style={{ fontSize: 'clamp(28px,6vw,52px)', fontWeight: 900, color: '#f0f0e0', margin: '0 0 32px' }}>
        ترتيب الأسبوع {WEEK_LABEL[n]}
      </h2>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 44, flexWrap: 'wrap' }}>
        {[
          { label: 'عدد الطلاب', value: String(students.length) },
          { label: 'الدرجة القصوى', value: weekMax.toLocaleString('ar-SA') },
          { label: 'أعلى درجة', value: topStudent ? (topStudent[scoreKey] as number).toLocaleString('ar-SA') : '—' },
        ].map((item, i) => (
          <div key={i} style={{
            background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.15)',
            borderRadius: 12, padding: '12px 20px', minWidth: 100,
          }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#f0c040' }}>{item.value}</div>
          </div>
        ))}
      </div>
      <button onClick={onNext} style={goldenBtn}>
        عرض ترتيب الأسبوع {WEEK_LABEL[n]} →
      </button>
    </div>
  )
}

function PlayingHeader({ title, badge, sub, revealed, total, isAuto }: {
  title: string; badge: string; sub?: string
  revealed: number; total: number; isAuto: boolean
}) {
  return (
    <div style={{ textAlign: 'center', paddingBottom: 20, flexShrink: 0 }}>
      <div style={{ fontSize: 11, letterSpacing: 3, color: '#d4a017', marginBottom: 8 }}>{badge}</div>
      <h2 style={{ fontSize: 'clamp(20px,4vw,30px)', fontWeight: 800, color: '#f0f0e0', margin: '0 0 6px' }}>{title}</h2>
      {sub && <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 12px' }}>{sub}</p>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
        <div style={{ height: 4, flex: 1, maxWidth: 240, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
          <div style={{
            height: '100%', borderRadius: 99, background: 'linear-gradient(to left, #f0c040, #d4a017)',
            width: `${total > 0 ? (revealed / total) * 100 : 0}%`,
            transition: 'width 0.5s ease',
          }} />
        </div>
        <span style={{ fontSize: 12, color: '#475569', flexShrink: 0 }}>
          {revealed} / {total}
        </span>
        {isAuto && revealed < total && (
          <span style={{ fontSize: 11, color: '#d4a017', animation: 'pulse 1.5s infinite' }}>⏳</span>
        )}
      </div>
    </div>
  )
}

function FinalScreen({ data }: { data: DashboardData }) {
  const { students, families } = data
  const sortedFamilies = [...families].sort((a, b) => b.total - a.total)
  const topStudent = students[0]

  return (
    <div style={{ width: '100%', maxWidth: 600 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🏆</div>
        <h2 style={{ fontSize: 'clamp(24px,5vw,44px)', fontWeight: 900, color: '#f0f0e0', margin: '0 0 8px' }}>
          الملخص النهائي
        </h2>
        <p style={{ fontSize: 14, color: '#64748b' }}>ترتيب الأسر الإجمالي</p>
      </div>

      {/* Family podium */}
      <div style={{ marginBottom: 28 }}>
        {sortedFamilies.map((f, i) => {
          const rank = i + 1
          const m = medal(rank)
          return (
            <FlyIn key={f.name} delay={i * 200}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: rank === 1 ? 'rgba(234,179,8,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid rgba(212,160,23,${rank === 1 ? 0.3 : 0.07})`,
                borderRadius: 14, padding: '14px 18px', marginBottom: 10,
              }}>
                <span style={{ fontSize: rank === 1 ? 30 : 22 }}>{m ?? rank}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#e2e8f0' }}>{f.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{f.count} طالب · متوسط {f.average}</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: rank === 1 ? '#fbbf24' : '#d4a017' }}>
                  {f.total.toLocaleString('ar-SA')}
                </div>
              </div>
            </FlyIn>
          )
        })}
      </div>

      {/* Top student highlight */}
      {topStudent && (
        <FlyIn delay={sortedFamilies.length * 200 + 200}>
          <div style={{
            background: 'rgba(212,160,23,0.07)', border: '1px solid rgba(212,160,23,0.2)',
            borderRadius: 14, padding: '16px 20px', textAlign: 'center', marginBottom: 24,
          }}>
            <div style={{ fontSize: 12, color: '#d4a017', letterSpacing: 2, marginBottom: 6 }}>أفضل طالب في البرنامج</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#f0f0e0' }}>🥇 {topStudent.name}</div>
            <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
              {topStudent.total.toLocaleString('ar-SA')} درجة · {topStudent.percentage}%
            </div>
          </div>
        </FlyIn>
      )}

      <FlyIn delay={(sortedFamilies.length + 2) * 200}>
        <div style={{ textAlign: 'center' }}>
          <Link href="/dashboard" style={{
            display: 'inline-block',
            background: 'rgba(212,160,23,0.12)', border: '1px solid rgba(212,160,23,0.35)',
            color: '#f0c040', borderRadius: 12, padding: '13px 30px',
            fontSize: 15, fontWeight: 700, textDecoration: 'none',
          }}>
            العودة للوحة المتابعة ←
          </Link>
        </div>
      </FlyIn>
    </div>
  )
}

// Shared button style
const goldenBtn: React.CSSProperties = {
  background: 'linear-gradient(135deg, #d4a017, #f0c040)',
  border: 'none', borderRadius: 14, padding: '15px 44px',
  fontSize: 16, fontWeight: 800, color: '#0a0f1e', cursor: 'pointer',
  boxShadow: '0 6px 28px rgba(212,160,23,0.35)', letterSpacing: 0.5,
  fontFamily: 'inherit',
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HassadAutoPlay({ data }: { data: DashboardData }) {
  const { students, families, weekEnabled } = data

  // Pre-sort lists
  const byWeek1    = useMemo(() => [...students].sort((a, b) => b.week1 - a.week1), [students])
  const byWeek2    = useMemo(() => [...students].sort((a, b) => b.week2 - a.week2), [students])
  const byWeek3    = useMemo(() => [...students].sort((a, b) => b.week3 - a.week3), [students])
  const byTotal    = useMemo(() => [...students].sort((a, b) => b.total - a.total), [students])
  const byFamilies = useMemo(() => [...families].sort((a, b) => b.total - a.total), [families])

  // Phase state
  const [phase, setPhase] = useState<Phase>('landing')
  const [revealed, setRevealed] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  // What's being listed in current play phase
  const currentList = useMemo((): { id: string; item: StudentData | FamilyStats; type: 'student' | 'family'; rank: number }[] => {
    if (phase === 'w1-play') return byWeek1.map((s, i) => ({ id: s.name, item: s, type: 'student', rank: i + 1 }))
    if (phase === 'w2-play') return byWeek2.map((s, i) => ({ id: s.name, item: s, type: 'student', rank: i + 1 }))
    if (phase === 'w3-play') return byWeek3.map((s, i) => ({ id: s.name, item: s, type: 'student', rank: i + 1 }))
    if (phase === 'total-play') return byTotal.map((s, i) => ({ id: s.name, item: s, type: 'student', rank: i + 1 }))
    if (phase === 'families-play') return byFamilies.map((f, i) => ({ id: f.name, item: f, type: 'family', rank: i + 1 }))
    return []
  }, [phase, byWeek1, byWeek2, byWeek3, byTotal, byFamilies])

  // Reset revealed on phase change
  useEffect(() => { setRevealed(0) }, [phase])

  // Auto-scroll content
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: contentRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [revealed])

  // Auto-play engine
  const advance = useCallback(() => {
    setPhase(p => nextPhase(p, weekEnabled))
  }, [weekEnabled])

  useEffect(() => {
    if (!isPlayPhase(phase)) return

    if (revealed >= currentList.length) {
      const t = setTimeout(advance, PAUSE_DONE)
      return () => clearTimeout(t)
    }

    const delay = phase === 'families-play' ? DELAY_FAMILY : DELAY_STUDENT
    const t = setTimeout(() => setRevealed(r => r + 1), delay)
    return () => clearTimeout(t)
  }, [phase, revealed, currentList.length, advance])

  // Button press (only for landing + week intros)
  const handleNext = useCallback(() => {
    setPhase(p => nextPhase(p, weekEnabled))
  }, [weekEnabled])

  const playing = isPlayPhase(phase)
  const weekNum = phaseWeekNum(phase)

  // Header label for play phases
  const playHeader = (() => {
    if (phase === 'w1-play') return { badge: 'الأسبوع الأول', title: 'ترتيب الأسبوع الأول', sub: `الدرجة القصوى ${WEEK_MAX[1].toLocaleString('ar-SA')}` }
    if (phase === 'w2-play') return { badge: 'الأسبوع الثاني', title: 'ترتيب الأسبوع الثاني', sub: `الدرجة القصوى ${WEEK_MAX[2].toLocaleString('ar-SA')}` }
    if (phase === 'w3-play') return { badge: 'الأسبوع الثالث', title: 'ترتيب الأسبوع الثالث', sub: `الدرجة القصوى ${WEEK_MAX[3].toLocaleString('ar-SA')}` }
    if (phase === 'total-play') return { badge: 'المجموع الكلي', title: 'الترتيب النهائي للطلاب', sub: 'مجموع جميع الأسابيع' }
    if (phase === 'families-play') return { badge: 'تقرير الأسر', title: 'ملخص أداء كل أسرة', sub: undefined }
    return null
  })()

  const weekNumForScore = (entry: { item: StudentData | FamilyStats; type: 'student' | 'family' }) => {
    if (entry.type !== 'student') return 0
    const s = entry.item as StudentData
    if (phase === 'w1-play') return s.week1
    if (phase === 'w2-play') return s.week2
    if (phase === 'w3-play') return s.week3
    return s.total
  }

  const maxForPhase = () => {
    if (phase === 'w1-play') return WEEK_MAX[1]
    if (phase === 'w2-play') return WEEK_MAX[2]
    if (phase === 'w3-play') return WEEK_MAX[3]
    return data.maxPossibleScore
  }

  return (
    <div dir="rtl" style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse at 50% 0%, #12192e 0%, #0a0f1e 65%)',
      fontFamily: '"Tajawal", "Cairo", sans-serif',
      overflow: 'hidden', color: '#e2e8f0',
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
      `}</style>

      {/* Back link */}
      <Link href="/dashboard" style={{
        position: 'fixed', top: 18, right: 18, zIndex: 300,
        display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none',
        color: '#475569', fontSize: 13,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 8, padding: '6px 12px',
      }}>
        ← لوحة المتابعة
      </Link>

      {/* ── Main content ── */}
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', overflow: 'hidden',
        justifyContent: (phase === 'landing' || phase.endsWith('-intro') || phase === 'final') ? 'center' : 'flex-start',
        paddingTop: playing ? 68 : 0,
        paddingBottom: 80,
        paddingLeft: 40, paddingRight: 40,
      }}>

        {/* Landing */}
        {phase === 'landing' && <LandingScreen onNext={handleNext} />}

        {/* Week intros */}
        {(phase === 'w1-intro' || phase === 'w2-intro' || phase === 'w3-intro') && weekNum && (
          <WeekIntroScreen
            n={weekNum}
            students={students}
            onNext={handleNext}
          />
        )}

        {/* Play phases */}
        {playing && playHeader && (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 640, height: '100%' }}>
            <PlayingHeader
              title={playHeader.title}
              badge={playHeader.badge}
              sub={playHeader.sub}
              revealed={revealed}
              total={currentList.length}
              isAuto
            />
            <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
              {currentList.slice(0, revealed).map((entry) => {
                if (entry.type === 'student') {
                  return (
                    <StudentCard
                      key={entry.id}
                      student={entry.item as StudentData}
                      rank={entry.rank}
                      score={weekNumForScore(entry)}
                      maxScore={maxForPhase()}
                    />
                  )
                } else {
                  return (
                    <FamilyCard
                      key={entry.id}
                      family={entry.item as FamilyStats}
                      rank={entry.rank}
                      weekEnabled={weekEnabled}
                    />
                  )
                }
              })}
            </div>
          </div>
        )}

        {/* Final */}
        {phase === 'final' && (
          <div style={{ width: '100%', maxWidth: 640, height: '100%', overflowY: 'auto' }}>
            <FinalScreen data={data} />
          </div>
        )}
      </div>

      {/* ── Status bar ── */}
      <div style={{
        position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 16, zIndex: 200,
        background: 'rgba(10,15,30,0.8)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 99, padding: '8px 20px', backdropFilter: 'blur(12px)',
      }}>
        {playing ? (
          <>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: '#d4a017',
              animation: 'pulse 1.5s infinite',
            }} />
            <span style={{ fontSize: 12, color: '#64748b' }}>
              عرض تلقائي · {revealed}/{currentList.length}
            </span>
          </>
        ) : (
          <span style={{ fontSize: 12, color: '#1e293b' }}>
            {phase === 'final' ? 'انتهى العرض 🌾' : 'اضغط التالي للمتابعة'}
          </span>
        )}
      </div>

      {/* ── Next button (only for landing + intros) ── */}
      {(phase === 'landing' || phase.endsWith('-intro')) && (
        <button onClick={handleNext} style={{
          position: 'fixed', bottom: 20, left: 20, zIndex: 200,
          background: 'rgba(212,160,23,0.12)', border: '1px solid rgba(212,160,23,0.35)',
          color: '#f0c040', borderRadius: 12, padding: '11px 26px',
          fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 2px 14px rgba(212,160,23,0.12)',
        }}>
          التالي ←
        </button>
      )}
    </div>
  )
}
