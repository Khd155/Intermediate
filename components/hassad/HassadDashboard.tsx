'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { DashboardData, StudentData, FamilyStats, WeekEnabled } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const STUDENT_DELAY = 2000
const FAMILY_DELAY  = 1800
const WEEK_MAX: Record<number, number>  = { 1: 2700, 2: 2900, 3: 2300 }
const WEEK_LABEL: Record<number, string> = { 1: 'الأول', 2: 'الثاني', 3: 'الثالث' }
const WEEK_ICON: Record<number, string>  = { 1: '🌱', 2: '🌿', 3: '🌾' }

type Section = 'intro' | 'w1' | 'w2' | 'w3' | 'total' | 'fw1' | 'fw2' | 'fw3' | 'final'
type FwKey   = 'fw1' | 'fw2' | 'fw3'
type Phase   = 'idle' | 'revealing' | 'done'

const NAV_LABELS: Partial<Record<Section, string>> = {
  w1: '🌱 أسبوع ١', w2: '🌿 أسبوع ٢', w3: '🌾 أسبوع ٣',
  total: '🏅 الإجمالي',
  fw1: '👨‍👩‍👦 أسر · ١', fw2: '👨‍👩‍👦 أسر · ٢', fw3: '👨‍👩‍👦 أسر · ٣',
  final: '🏆 الختام',
}

function buildSequence(we: WeekEnabled): Section[] {
  const s: Section[] = []
  if (we.week1) s.push('w1')
  if (we.week2) s.push('w2')
  if (we.week3) s.push('w3')
  s.push('total')
  if (we.week1) s.push('fw1')
  if (we.week2) s.push('fw2')
  if (we.week3) s.push('fw3')
  s.push('final')
  return s
}

function pctColor(p: number) {
  return p >= 85 ? '#22c55e' : p >= 65 ? '#d4a017' : '#ef4444'
}
function medalEmoji(rank: number) {
  return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null
}

// Deterministic confetti (no random — avoids hydration issues)
const CONFETTI = Array.from({ length: 44 }, (_, i) => ({
  id: i,
  left: `${(i * 37 + 5) % 100}%`,
  delay: `${(i * 0.11) % 2.4}s`,
  dur: `${2.2 + (i * 0.07) % 2}s`,
  emoji: ['🎉', '⭐', '✨', '🎊', '💫', '🌟', '🎈', '🏆'][i % 8],
  size: `${18 + (i % 4) * 8}px`,
}))

// ─── Primitives ───────────────────────────────────────────────────────────────

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 50 + delay)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <div style={{
      opacity: show ? 1 : 0,
      transform: show ? 'none' : 'translateY(22px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    }}>
      {children}
    </div>
  )
}

function ScoreBar({ pct, color }: { pct: number; color: string }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(pct), 150); return () => clearTimeout(t) }, [pct])
  return (
    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${w}%`, background: color, borderRadius: 99, transition: 'width 0.9s ease' }} />
    </div>
  )
}

// ─── Student card ─────────────────────────────────────────────────────────────

function StudentCard({ student, rank, score, maxScore }: {
  student: StudentData; rank: number; score: number; maxScore: number
}) {
  const pct   = maxScore > 0 ? Math.min(100, Math.round(score / maxScore * 100)) : 0
  const m     = medalEmoji(rank)
  const isTop = rank <= 3
  return (
    <FadeIn>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        background: isTop ? `rgba(212,160,23,${0.08 - (rank - 1) * 0.02})` : 'rgba(255,255,255,0.025)',
        border: `1px solid rgba(212,160,23,${isTop ? 0.22 : 0.06})`,
        borderRadius: 16, padding: '14px 18px', marginBottom: 10,
      }}>
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>{student.name}</span>
            <span style={{ fontSize: 11, color: '#64748b', flexShrink: 0, marginRight: 8 }}>{pct}%</span>
          </div>
          <ScoreBar pct={pct} color={pctColor(pct)} />
        </div>
        <div style={{ fontWeight: 900, fontSize: 18, color: '#f0c040', flexShrink: 0, minWidth: 56, textAlign: 'left' }}>
          {score.toLocaleString('ar-SA')}
        </div>
      </div>
    </FadeIn>
  )
}

// ─── Family reveal card (auto-shown, full detail, no tap) ─────────────────────

function FamilyRevealCard({ family, weekNum, rank }: {
  family: FamilyStats; weekNum: 1 | 2 | 3; rank: number
}) {
  const weekScore = weekNum === 1 ? family.week1 : weekNum === 2 ? family.week2 : family.week3
  const eval_     = weekNum === 1 ? family.w1Eval : weekNum === 2 ? family.w2Eval : family.w3Eval
  const m         = medalEmoji(rank)

  const evalRows = eval_ ? [
    { label: 'رياضي',   icon: '⚽', val: eval_.athletic, color: '#38bdf8' },
    { label: 'شعبيات',  icon: '🎵', val: eval_.popular,  color: '#fb923c' },
    { label: 'ثقافي',   icon: '🧠', val: eval_.cultural, color: '#a78bfa' },
  ].filter(r => r.val > 0) : []

  return (
    <FadeIn>
      <div style={{
        background: rank === 1 ? 'rgba(212,160,23,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1.5px solid rgba(212,160,23,${rank === 1 ? 0.28 : 0.1})`,
        borderRadius: 20, padding: '22px 24px', marginBottom: 16,
        boxShadow: rank === 1 ? '0 4px 28px rgba(212,160,23,0.1)' : 'none',
      }}>
        {/* Name row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{
            width: 58, height: 58, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: m ? 28 : 18, fontWeight: 700,
            background: m ? 'rgba(212,160,23,0.15)' : 'rgba(255,255,255,0.05)',
            border: `2px solid rgba(212,160,23,${m ? 0.28 : 0.08})`,
          }}>
            {m ?? rank}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#f0f0e0' }}>{family.name}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              {WEEK_ICON[weekNum]} الأسبوع {WEEK_LABEL[weekNum]}
            </div>
          </div>
          {weekScore > 0 && (
            <div style={{ textAlign: 'left', flexShrink: 0 }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#f0c040', lineHeight: 1 }}>
                {weekScore.toLocaleString('ar-SA')}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>المجموع</div>
            </div>
          )}
        </div>

        {/* Eval breakdown (only non-zero) */}
        {evalRows.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {evalRows.map(r => (
              <div key={r.label} style={{
                flex: 1, minWidth: 90,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, padding: '12px 14px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{r.icon}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{r.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: r.color }}>
                  {r.val.toLocaleString('ar-SA')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </FadeIn>
  )
}

// ─── Buttons ──────────────────────────────────────────────────────────────────

function StartButton({ onPress, label = 'ابدأ العرض' }: { onPress: () => void; label?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 20px 24px' }}>
      <button onClick={onPress} style={{
        background: 'linear-gradient(135deg, #b8860b, #f0c040)',
        border: 'none', borderRadius: 999, padding: '15px 52px',
        fontSize: 16, fontWeight: 800, color: '#0a0f1e', cursor: 'pointer',
        fontFamily: 'inherit', boxShadow: '0 4px 28px rgba(212,160,23,0.4)',
      }}>
        ▶ {label}
      </button>
    </div>
  )
}

function NextButton({ onNext, label = 'التالي ←' }: { onNext: () => void; label?: string }) {
  return (
    <div style={{
      flexShrink: 0, padding: '12px 20px 22px',
      background: 'linear-gradient(to top, #0a0f1e 55%, transparent)',
      display: 'flex', justifyContent: 'center',
    }}>
      <button onClick={onNext} style={{
        background: 'linear-gradient(135deg, #b8860b, #f0c040)',
        border: 'none', borderRadius: 999, padding: '15px 52px',
        fontSize: 16, fontWeight: 800, color: '#0a0f1e', cursor: 'pointer',
        fontFamily: 'inherit', boxShadow: '0 4px 28px rgba(212,160,23,0.4)',
      }}>
        {label}
      </button>
    </div>
  )
}

// ─── Section idle screen ──────────────────────────────────────────────────────

function IdleScreen({ icon, title, subtitle, onStart, startLabel }: {
  icon: string; title: string; subtitle: string; onStart: () => void; startLabel?: string
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
      <FadeIn>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>{icon}</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#f0f0e0', marginBottom: 10 }}>{title}</div>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 36 }}>{subtitle}</div>
          <button onClick={onStart} style={{
            background: 'linear-gradient(135deg, #b8860b, #f0c040)',
            border: 'none', borderRadius: 999, padding: '15px 52px',
            fontSize: 16, fontWeight: 800, color: '#0a0f1e', cursor: 'pointer',
            fontFamily: 'inherit', boxShadow: '0 4px 28px rgba(212,160,23,0.4)',
          }}>
            ▶ {startLabel ?? 'ابدأ العرض'}
          </button>
        </div>
      </FadeIn>
    </div>
  )
}

// ─── Week section ─────────────────────────────────────────────────────────────

function WeekSection({ weekNum, students, phase, revealed, onStart, onNext }: {
  weekNum: 1 | 2 | 3; students: StudentData[]; phase: Phase; revealed: number
  onStart: () => void; onNext: () => void
}) {
  const scoreKey = `week${weekNum}` as keyof StudentData
  const maxScore = WEEK_MAX[weekNum]
  const sorted   = useMemo(() =>
    [...students].sort((a, b) => (b[scoreKey] as number) - (a[scoreKey] as number)),
    [students, scoreKey]
  )
  const ref    = useRef<HTMLDivElement>(null)
  const allDone = phase === 'done'

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' })
  }, [revealed])

  if (phase === 'idle') {
    return (
      <IdleScreen
        icon={WEEK_ICON[weekNum]}
        title={`الأسبوع ${WEEK_LABEL[weekNum]}`}
        subtitle={`${sorted.length} طالب · ${maxScore.toLocaleString('ar-SA')} درجة قصوى`}
        onStart={onStart}
      />
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Header */}
      <div style={{
        padding: '14px 22px', flexShrink: 0,
        background: 'rgba(212,160,23,0.04)', borderBottom: '1px solid rgba(212,160,23,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 26 }}>{WEEK_ICON[weekNum]}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#f0f0e0' }}>الأسبوع {WEEK_LABEL[weekNum]}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              {sorted.length} طالب · {maxScore.toLocaleString('ar-SA')} درجة قصوى
            </div>
          </div>
          {allDone && <span style={{ fontSize: 18 }}>✅</span>}
        </div>
        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: allDone ? '#22c55e' : '#d4a017',
            width: `${sorted.length > 0 ? Math.min(100, (revealed / sorted.length) * 100) : 0}%`,
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      {/* Students */}
      <div ref={ref} style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {sorted.slice(0, revealed).map((s, i) => (
          <StudentCard key={s.name} student={s} rank={i + 1}
            score={s[scoreKey] as number} maxScore={maxScore} />
        ))}
      </div>

      {/* Button: only when done */}
      {allDone && <NextButton onNext={onNext} />}
    </div>
  )
}

// ─── Total section ────────────────────────────────────────────────────────────

function TotalSection({ students, maxScore, phase, revealed, onStart, onNext }: {
  students: StudentData[]; maxScore: number; phase: Phase; revealed: number
  onStart: () => void; onNext: () => void
}) {
  const sorted = useMemo(() => [...students].sort((a, b) => b.total - a.total), [students])
  const ref    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' })
  }, [revealed])

  if (phase === 'idle') {
    return (
      <IdleScreen
        icon="🏅"
        title="الترتيب الكلي"
        subtitle={`مجموع الأسابيع · ${maxScore.toLocaleString('ar-SA')} درجة قصوى`}
        onStart={onStart}
      />
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{
        padding: '14px 22px', flexShrink: 0,
        background: 'rgba(212,160,23,0.04)', borderBottom: '1px solid rgba(212,160,23,0.08)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 26 }}>🏅</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#f0f0e0' }}>الترتيب الكلي</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            مجموع الأسابيع · {maxScore.toLocaleString('ar-SA')} درجة قصوى
          </div>
        </div>
        {phase === 'done' && <span style={{ fontSize: 18 }}>✅</span>}
      </div>

      <div ref={ref} style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {sorted.slice(0, revealed).map((s, i) => (
          <StudentCard key={s.name} student={s} rank={i + 1} score={s.total} maxScore={maxScore} />
        ))}
      </div>

      {phase === 'done' && <NextButton onNext={onNext} />}
    </div>
  )
}

// ─── Family week section ──────────────────────────────────────────────────────

function FamilyWeekSection({ families, weekNum, phase, revealed, onStart, onNext, isLastFw }: {
  families: FamilyStats[]; weekNum: 1 | 2 | 3; phase: Phase; revealed: number
  onStart: () => void; onNext: () => void; isLastFw: boolean
}) {
  const sorted = useMemo(() =>
    [...families].sort((a, b) => {
      const av = weekNum === 1 ? a.week1 : weekNum === 2 ? a.week2 : a.week3
      const bv = weekNum === 1 ? b.week1 : weekNum === 2 ? b.week2 : b.week3
      return bv - av
    }),
    [families, weekNum]
  )
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' })
  }, [revealed])

  if (phase === 'idle') {
    return (
      <IdleScreen
        icon="👨‍👩‍👦"
        title={`حصاد الأسر — الأسبوع ${WEEK_LABEL[weekNum]}`}
        subtitle={`${families.length} أسرة · اضغط لبدء عرض النتائج`}
        onStart={onStart}
        startLabel="ابدأ العرض"
      />
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{
        padding: '14px 22px', flexShrink: 0,
        background: 'rgba(212,160,23,0.04)', borderBottom: '1px solid rgba(212,160,23,0.08)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 26 }}>👨‍👩‍👦</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#f0f0e0' }}>
            حصاد الأسر — الأسبوع {WEEK_LABEL[weekNum]}
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{families.length} أسرة</div>
        </div>
        {phase === 'done' && <span style={{ fontSize: 18 }}>✅</span>}
      </div>

      <div ref={ref} style={{ flex: 1, overflowY: 'auto', padding: '20px 20px' }}>
        {sorted.slice(0, revealed).map((f, i) => (
          <FamilyRevealCard key={f.name} family={f} weekNum={weekNum} rank={i + 1} />
        ))}
      </div>

      {phase === 'done' && (
        <NextButton
          onNext={onNext}
          label={isLastFw ? 'إعلان الفائزة 🏆' : 'الأسبوع التالي ←'}
        />
      )}
    </div>
  )
}

// ─── Celebration ──────────────────────────────────────────────────────────────

function Celebration({ winner, onDone }: { winner: FamilyStats; onDone: () => void }) {
  const [phase, setPhase] = useState<'suspense' | 'reveal'>('suspense')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 2800)
    const t2 = setTimeout(onDone, 7000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: phase === 'reveal'
        ? 'radial-gradient(ellipse at 50% 30%, #1e1200 0%, #070c1c 70%)'
        : 'radial-gradient(ellipse at 50% 50%, #0d1225 0%, #050810 70%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      transition: 'background 1s ease',
    }}>
      <style>{`
        @keyframes rise-up  { from { transform: translateY(110vh) scale(0.5); opacity:1 } to { transform: translateY(-15vh) scale(1.1); opacity:0 } }
        @keyframes pulse-w  { 0%,100%{opacity:0.4;transform:scale(0.95)} 50%{opacity:1;transform:scale(1.08)} }
        @keyframes reveal-w { from{opacity:0;transform:scale(0.6) translateY(30px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes trophy-f { 0%,100%{transform:translateY(0) rotate(-5deg)} 50%{transform:translateY(-20px) rotate(5deg)} }
        @keyframes glow-txt { 0%,100%{text-shadow:0 0 40px rgba(251,191,36,0.5)} 50%{text-shadow:0 0 100px rgba(251,191,36,1)} }
        @keyframes dot-pulse { 0%{opacity:0} 50%{opacity:1} 100%{opacity:0} }
      `}</style>

      {/* Confetti — only when revealing */}
      {phase === 'reveal' && CONFETTI.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: p.left, bottom: '-5%',
          fontSize: p.size,
          animation: `rise-up ${p.dur} ${p.delay} ease-out both`,
          pointerEvents: 'none', userSelect: 'none',
        }}>
          {p.emoji}
        </div>
      ))}

      {/* Suspense phase */}
      {phase === 'suspense' && (
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 10, padding: '0 32px' }}>
          <div style={{ fontSize: 72, animation: 'pulse-w 0.9s ease-in-out infinite', marginBottom: 24 }}>🎊</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#d4a017', marginBottom: 16 }}>
            والفائزة بالحصاد الأسري هي
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: '50%', background: '#d4a017',
                animation: `dot-pulse 1.2s ${i * 0.4}s ease-in-out infinite`,
              }} />
            ))}
          </div>
        </div>
      )}

      {/* Reveal phase */}
      {phase === 'reveal' && (
        <div style={{
          textAlign: 'center', position: 'relative', zIndex: 10, padding: '0 32px',
          animation: 'reveal-w 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}>
          <div style={{ fontSize: 88, animation: 'trophy-f 1.2s ease-in-out infinite', marginBottom: 16 }}>🏆</div>
          <div style={{ fontSize: 16, color: '#d4a017', letterSpacing: 3, marginBottom: 12, fontWeight: 600 }}>
            🎉 الفائزة بالحصاد الأسري 🎉
          </div>
          <div style={{
            fontSize: 46, fontWeight: 900, color: '#fbbf24',
            animation: 'glow-txt 1.6s ease-in-out infinite', marginBottom: 10,
          }}>
            {winner.name}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#f0c040' }}>
            {winner.total.toLocaleString('ar-SA')} درجة
          </div>
        </div>
      )}

      <button onClick={onDone} style={{
        position: 'absolute', bottom: 36,
        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: 999, padding: '11px 32px', color: '#64748b',
        fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
      }}>
        متابعة
      </button>
    </div>
  )
}

// ─── Final section ────────────────────────────────────────────────────────────

function FinalSection({ families }: { families: FamilyStats[] }) {
  const sorted = useMemo(() => [...families].sort((a, b) => b.total - a.total), [families])
  const winner = sorted[0]
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', overflowY: 'auto', padding: '32px 24px',
    }}>
      <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <FadeIn>
          <div style={{ fontSize: 70, marginBottom: 14 }}>🏆</div>
          <div style={{ fontSize: 14, color: '#d4a017', letterSpacing: 2, marginBottom: 10 }}>الفائزة بالحصاد الأسري</div>
          <div style={{ fontSize: 38, fontWeight: 900, color: '#fbbf24', marginBottom: 8 }}>{winner?.name}</div>
          <div style={{ fontSize: 20, color: '#f0c040', marginBottom: 40 }}>
            {winner?.total.toLocaleString('ar-SA')} درجة
          </div>
        </FadeIn>
        <div style={{ textAlign: 'right', width: '100%' }}>
          {sorted.map((f, i) => (
            <FadeIn key={f.name} delay={200 + i * 160}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: i === 0 ? 'rgba(212,160,23,0.09)' : 'rgba(255,255,255,0.03)',
                border: `1px solid rgba(212,160,23,${i === 0 ? 0.3 : 0.07})`,
                borderRadius: 16, padding: '16px 20px', marginBottom: 10,
              }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{medalEmoji(i + 1) ?? (i + 1)}</span>
                <span style={{ flex: 1, fontSize: 17, fontWeight: 800, color: '#e2e8f0' }}>{f.name}</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: i === 0 ? '#fbbf24' : '#d4a017' }}>
                  {f.total.toLocaleString('ar-SA')}
                </span>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Intro screen ─────────────────────────────────────────────────────────────

function IntroScreen({ onStart, studentCount, familyCount }: {
  onStart: () => void; studentCount: number; familyCount: number
}) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 28px',
    }}>
      <FadeIn>
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <div style={{ fontSize: 80, marginBottom: 20 }}>🌾</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#f0c040', marginBottom: 12 }}>
            الحصاد الأسري
          </div>
          <div style={{ fontSize: 15, color: '#64748b', lineHeight: 1.8, marginBottom: 12 }}>
            نتائج البرنامج عبر الأسابيع الثلاثة
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 40 }}>
            {[
              { icon: '👤', val: studentCount, label: 'طالب' },
              { icon: '👨‍👩‍👦', val: familyCount, label: 'أسرة' },
            ].map(k => (
              <div key={k.label} style={{
                background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.15)',
                borderRadius: 14, padding: '14px 20px', textAlign: 'center', minWidth: 90,
              }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{k.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#f0c040' }}>{k.val}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{k.label}</div>
              </div>
            ))}
          </div>
          <button onClick={onStart} style={{
            background: 'linear-gradient(135deg, #b8860b, #f0c040)',
            border: 'none', borderRadius: 999, padding: '17px 60px',
            fontSize: 18, fontWeight: 900, color: '#0a0f1e', cursor: 'pointer',
            fontFamily: 'inherit', boxShadow: '0 6px 32px rgba(212,160,23,0.45)',
            letterSpacing: 1,
          }}>
            ابدأ ←
          </button>
        </div>
      </FadeIn>
    </div>
  )
}

// ─── Nav menu ─────────────────────────────────────────────────────────────────

function NavMenu({ section, sequence, goTo }: {
  section: Section; sequence: Section[]; goTo: (s: Section) => void
}) {
  const [open, setOpen] = useState(false)
  const navItems = sequence.filter(s => s !== 'intro' && NAV_LABELS[s])
  return (
    <div style={{ position: 'relative', zIndex: 100 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: 40, height: 40, borderRadius: '50%',
        background: open ? 'rgba(212,160,23,0.2)' : 'rgba(255,255,255,0.06)',
        border: `1px solid rgba(212,160,23,${open ? 0.35 : 0.18})`,
        color: '#d4a017', fontSize: 17, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
      }}>
        {open ? '✕' : '☰'}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
          <div style={{
            position: 'absolute', top: 48, left: 0, zIndex: 99,
            background: '#0e1422', border: '1px solid rgba(212,160,23,0.2)',
            borderRadius: 14, padding: '8px 0', minWidth: 210,
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          }}>
            {navItems.map(s => (
              <button key={s} onClick={() => { goTo(s); setOpen(false) }} style={{
                width: '100%', display: 'block', padding: '11px 18px',
                background: s === section ? 'rgba(212,160,23,0.12)' : 'transparent',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                color: s === section ? '#f0c040' : '#94a3b8',
                fontSize: 14, textAlign: 'right',
                fontWeight: s === section ? 700 : 400,
              }}>
                {NAV_LABELS[s]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function HassadDashboard({ data }: { data: DashboardData }) {
  const { students, families, weekEnabled, maxPossibleScore } = data

  const sequence = useMemo(() => buildSequence(weekEnabled), [weekEnabled])
  const [section, setSection]             = useState<Section>('intro')
  const [showCelebration, setShowCelebration] = useState(false)

  // Week state
  const [weekPhase,    setWeekPhase]    = useState<Record<1|2|3, Phase>>({ 1: 'idle', 2: 'idle', 3: 'idle' })
  const [weekRevealed, setWeekRevealed] = useState<Record<1|2|3, number>>({ 1: 0, 2: 0, 3: 0 })

  // Total state
  const [totalPhase,    setTotalPhase]    = useState<Phase>('idle')
  const [totalRevealed, setTotalRevealed] = useState(0)

  // Family state
  const [familyPhase,    setFamilyPhase]    = useState<Record<FwKey, Phase>>({ fw1: 'idle', fw2: 'idle', fw3: 'idle' })
  const [familyRevealed, setFamilyRevealed] = useState<Record<FwKey, number>>({ fw1: 0, fw2: 0, fw3: 0 })

  // Sorted data
  const sortedByWeek = useMemo(() => ({
    1: [...students].sort((a, b) => b.week1 - a.week1),
    2: [...students].sort((a, b) => b.week2 - a.week2),
    3: [...students].sort((a, b) => b.week3 - a.week3),
  }), [students])
  const sortedByTotal    = useMemo(() => [...students].sort((a, b) => b.total - a.total), [students])
  const sortedFamilies   = useMemo(() => [...families].sort((a, b) => b.total - a.total), [families])
  const winnerFamily     = sortedFamilies[0]

  // ── Auto-reveal: weeks ───────────────────────────────────────────────────────
  const activeWn: 1|2|3|null = section === 'w1' ? 1 : section === 'w2' ? 2 : section === 'w3' ? 3 : null
  useEffect(() => {
    if (!activeWn || weekPhase[activeWn] !== 'revealing') return
    const total = sortedByWeek[activeWn].length
    if (weekRevealed[activeWn] >= total) {
      setWeekPhase(prev => ({ ...prev, [activeWn]: 'done' }))
      return
    }
    const t = setTimeout(() =>
      setWeekRevealed(prev => ({ ...prev, [activeWn]: prev[activeWn] + 1 }))
    , STUDENT_DELAY)
    return () => clearTimeout(t)
  }, [activeWn, weekPhase, weekRevealed, sortedByWeek])

  // ── Auto-reveal: total ───────────────────────────────────────────────────────
  useEffect(() => {
    if (section !== 'total' || totalPhase !== 'revealing') return
    if (totalRevealed >= sortedByTotal.length) {
      setTotalPhase('done')
      return
    }
    const t = setTimeout(() => setTotalRevealed(n => n + 1), STUDENT_DELAY)
    return () => clearTimeout(t)
  }, [section, totalPhase, totalRevealed, sortedByTotal.length])

  // ── Auto-reveal: families ────────────────────────────────────────────────────
  const activeFw: FwKey | null = section === 'fw1' ? 'fw1' : section === 'fw2' ? 'fw2' : section === 'fw3' ? 'fw3' : null
  useEffect(() => {
    if (!activeFw || familyPhase[activeFw] !== 'revealing') return
    const total = sortedFamilies.length
    if (familyRevealed[activeFw] >= total) {
      setFamilyPhase(prev => ({ ...prev, [activeFw]: 'done' }))
      return
    }
    const t = setTimeout(() =>
      setFamilyRevealed(prev => ({ ...prev, [activeFw]: prev[activeFw] + 1 }))
    , FAMILY_DELAY)
    return () => clearTimeout(t)
  }, [activeFw, familyPhase, familyRevealed, sortedFamilies.length])

  // ── Navigation helpers ───────────────────────────────────────────────────────
  const fwSections = sequence.filter(s => s === 'fw1' || s === 'fw2' || s === 'fw3') as FwKey[]
  const lastFwSection = fwSections[fwSections.length - 1] as FwKey | undefined

  const navigateNext = useCallback(() => {
    const idx = sequence.indexOf(section)
    if (idx >= 0 && idx < sequence.length - 1) setSection(sequence[idx + 1])
  }, [section, sequence])

  const goTo = useCallback((s: Section) => setSection(s), [])

  // ── goNext: handles phase transitions and navigation ─────────────────────────
  const goNext = useCallback(() => {
    // Week sections
    if (section === 'w1' || section === 'w2' || section === 'w3') {
      const wn = section === 'w1' ? 1 : section === 'w2' ? 2 : 3 as 1|2|3
      if (weekPhase[wn] === 'idle') {
        setWeekPhase(prev => ({ ...prev, [wn]: 'revealing' }))
        return
      }
      navigateNext()
      return
    }
    // Total
    if (section === 'total') {
      if (totalPhase === 'idle') { setTotalPhase('revealing'); return }
      navigateNext()
      return
    }
    // Family sections
    if (activeFw) {
      if (familyPhase[activeFw] === 'idle') {
        setFamilyPhase(prev => ({ ...prev, [activeFw]: 'revealing' }))
        return
      }
      if (familyPhase[activeFw] === 'done' && activeFw === lastFwSection) {
        setShowCelebration(true)
        return
      }
      navigateNext()
      return
    }
  }, [section, weekPhase, totalPhase, familyPhase, activeFw, lastFwSection, navigateNext])

  // ── Resolve active week number for family sections ───────────────────────────
  const fwWeekNum = (fw: FwKey): 1|2|3 => {
    // Map fw section to week number based on which weeks are enabled
    const enabledFws = sequence.filter(s => s === 'fw1' || s === 'fw2' || s === 'fw3') as FwKey[]
    const idx = enabledFws.indexOf(fw)
    const enabledWeeks = ([1,2,3] as const).filter(w => weekEnabled[`week${w}` as keyof WeekEnabled])
    return enabledWeeks[idx] ?? 1
  }

  // Step counter (exclude intro)
  const seqIdx  = section === 'intro' ? -1 : sequence.indexOf(section)
  const stepNum = seqIdx + 1
  const stepTot = sequence.length

  return (
    <div dir="rtl" style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse at 50% 0%, #12192e 0%, #0a0f1e 65%)',
      fontFamily: '"Tajawal", "Cairo", sans-serif',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      color: '#e2e8f0',
    }}>
      <style>{`
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-track { background: transparent }
        ::-webkit-scrollbar-thumb { background: rgba(212,160,23,0.2); border-radius: 99px }
      `}</style>

      {/* Celebration overlay */}
      {showCelebration && winnerFamily && (
        <Celebration
          winner={winnerFamily}
          onDone={() => { setShowCelebration(false); setSection('final') }}
        />
      )}

      {/* Header — hidden on intro */}
      {section !== 'intro' && (
        <header style={{
          flexShrink: 0, height: 52,
          background: 'rgba(10,15,30,0.92)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(212,160,23,0.1)',
          display: 'flex', alignItems: 'center', paddingRight: 14, paddingLeft: 14, gap: 12,
        }}>
          <NavMenu section={section} sequence={sequence} goTo={goTo} />
          <div style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#d4a017' }}>
            🌾 الحصاد الأسري
          </div>
          {section !== 'final' && (
            <div style={{ fontSize: 11, color: '#334155', flexShrink: 0 }}>
              {stepNum} / {stepTot}
            </div>
          )}
        </header>
      )}

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {section === 'intro' && (
          <IntroScreen
            onStart={() => setSection(sequence[0])}
            studentCount={students.length}
            familyCount={families.length}
          />
        )}

        {section === 'w1' && weekEnabled.week1 && (
          <WeekSection weekNum={1} students={students}
            phase={weekPhase[1]} revealed={weekRevealed[1]}
            onStart={goNext} onNext={goNext} />
        )}
        {section === 'w2' && weekEnabled.week2 && (
          <WeekSection weekNum={2} students={students}
            phase={weekPhase[2]} revealed={weekRevealed[2]}
            onStart={goNext} onNext={goNext} />
        )}
        {section === 'w3' && weekEnabled.week3 && (
          <WeekSection weekNum={3} students={students}
            phase={weekPhase[3]} revealed={weekRevealed[3]}
            onStart={goNext} onNext={goNext} />
        )}

        {section === 'total' && (
          <TotalSection students={students} maxScore={maxPossibleScore}
            phase={totalPhase} revealed={totalRevealed}
            onStart={goNext} onNext={goNext} />
        )}

        {activeFw && (
          <FamilyWeekSection
            families={families}
            weekNum={fwWeekNum(activeFw)}
            phase={familyPhase[activeFw]}
            revealed={familyRevealed[activeFw]}
            onStart={goNext}
            onNext={goNext}
            isLastFw={activeFw === lastFwSection}
          />
        )}

        {section === 'final' && <FinalSection families={families} />}

      </main>
    </div>
  )
}
