'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { DashboardData, StudentData, FamilyStats, WeekEnabled, StudentMemorization } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const STUDENT_DELAY = 2000
const FAMILY_DELAY  = 1800
const WEEK_MAX: Record<number, number>   = { 1: 2700, 2: 2900, 3: 2300 }
const WEEK_LABEL: Record<number, string>  = { 1: 'الأول', 2: 'الثاني', 3: 'الثالث' }
const WEEK_ICON: Record<number, string>   = { 1: '🌱', 2: '🌿', 3: '🌾' }

type Section = 'intro' | 'w1' | 'w2' | 'w3' | 'total' | 'fw1' | 'fw2' | 'fw3' | 'final' | 'hifz'
type FwKey   = 'fw1' | 'fw2' | 'fw3'
type Phase   = 'idle' | 'revealing' | 'done'

const NAV_LABELS: Partial<Record<Section, string>> = {
  w1: '🌱 أسبوع ١', w2: '🌿 أسبوع ٢', w3: '🌾 أسبوع ٣',
  total: '🏅 الإجمالي',
  fw1: '👨‍👩‍👦 أسر · أسبوع ١', fw2: '👨‍👩‍👦 أسر · أسبوع ٢', fw3: '👨‍👩‍👦 أسر · أسبوع ٣',
  final: '🏆 الختام',
  hifz: '📖 الحفظ',
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
  s.push('hifz')
  return s
}

function pctColor(p: number) {
  return p >= 85 ? '#22c55e' : p >= 65 ? '#d4a017' : '#ef4444'
}
function medalEmoji(rank: number) {
  return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null
}

const CONFETTI = Array.from({ length: 44 }, (_, i) => ({
  id: i,
  left: `${(i * 37 + 5) % 100}%`,
  delay: `${(i * 0.18) % 4}s`,
  dur: `${3.5 + (i * 0.07) % 2.5}s`,
  emoji: ['🎉', '⭐', '✨', '🎊', '💫', '🌟', '🎈', '🏆'][i % 8],
  size: `${18 + (i % 4) * 8}px`,
}))

// ─── FadeIn ───────────────────────────────────────────────────────────────────

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

// ─── ScoreBar ─────────────────────────────────────────────────────────────────

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

// ─── Family reveal card (auto-shown, full detail, zero values hidden) ──────────

function FamilyRevealCard({ family, weekNum, rank }: {
  family: FamilyStats; weekNum: 1 | 2 | 3; rank: number
}) {
  const weekScore = weekNum === 1 ? family.week1 : weekNum === 2 ? family.week2 : family.week3
  const eval_     = weekNum === 1 ? family.w1Eval : weekNum === 2 ? family.w2Eval : family.w3Eval
  const m         = medalEmoji(rank)

  const evalRows = eval_ ? [
    { label: 'رياضي',  icon: '⚽', val: eval_.athletic, color: '#38bdf8' },
    { label: 'شعبيات', icon: '🎵', val: eval_.popular,  color: '#fb923c' },
    { label: 'ثقافي',  icon: '🧠', val: eval_.cultural, color: '#a78bfa' },
  ].filter(r => r.val > 0) : []

  return (
    <FadeIn>
      <div style={{
        background: rank === 1 ? 'rgba(212,160,23,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1.5px solid rgba(212,160,23,${rank === 1 ? 0.28 : 0.1})`,
        borderRadius: 20, padding: '22px 24px', marginBottom: 16,
        boxShadow: rank === 1 ? '0 4px 28px rgba(212,160,23,0.1)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: evalRows.length ? 16 : 0 }}>
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

// ─── IdleScreen ───────────────────────────────────────────────────────────────

function IdleScreen({ icon, title, subtitle, onStart }: {
  icon: string; title: string; subtitle: string; onStart: () => void
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
            ▶ ابدأ العرض
          </button>
        </div>
      </FadeIn>
    </div>
  )
}

// ─── NextButton ───────────────────────────────────────────────────────────────

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
  const ref = useRef<HTMLDivElement>(null)

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
          {phase === 'done' && <span style={{ fontSize: 18 }}>✅</span>}
        </div>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: phase === 'done' ? '#22c55e' : '#d4a017',
            width: `${sorted.length > 0 ? Math.min(100, (revealed / sorted.length) * 100) : 0}%`,
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>
      <div ref={ref} style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {sorted.slice(0, revealed).map((s, i) => (
          <StudentCard key={s.name} student={s} rank={i + 1}
            score={s[scoreKey] as number} maxScore={maxScore} />
        ))}
      </div>
      {phase === 'done' && <NextButton onNext={onNext} />}
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
          label={isLastFw ? 'إعلان الأسرة الرائدة 🏆' : 'الأسبوع التالي ←'}
        />
      )}
    </div>
  )
}

// ─── Final section (celebration + winner, stays permanently) ──────────────────

function FinalSection({ winner, onGoHifz, hasHifz }: {
  winner: FamilyStats; onGoHifz: () => void; hasHifz: boolean
}) {
  const [phase, setPhase] = useState<'suspense' | 'reveal'>('suspense')

  useEffect(() => {
    const t = setTimeout(() => setPhase('reveal'), 2800)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      flex: 1, position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Glow overlay — always pulsing */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: phase === 'reveal'
          ? 'radial-gradient(ellipse at 50% 40%, rgba(212,160,23,0.18) 0%, transparent 65%)'
          : 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.08) 0%, transparent 65%)',
        animation: 'glow-pulse 2.2s ease-in-out infinite',
        transition: 'background 1.5s ease',
      }} />

      {/* Confetti — infinite loop, only in reveal phase */}
      {phase === 'reveal' && CONFETTI.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: p.left, bottom: '-5%',
          fontSize: p.size, pointerEvents: 'none', userSelect: 'none',
          animation: `confetti-loop ${p.dur} ${p.delay} ease-in-out infinite`,
        }}>
          {p.emoji}
        </div>
      ))}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 32px', maxWidth: 440, width: '100%' }}>

        {/* Suspense phase */}
        {phase === 'suspense' && (
          <div>
            <div style={{ fontSize: 72, animation: 'suspense-bounce 0.8s ease-in-out infinite alternate', marginBottom: 24 }}>🎊</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#d4a017', animation: 'suspense-fade 1s ease-in-out infinite', marginBottom: 20 }}>
              والأسرة الرائدة في الحصاد الأسري هي…
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 10, height: 10, borderRadius: '50%', background: '#d4a017',
                  animation: `dot-wave 1s ${i * 0.3}s ease-in-out infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Reveal phase */}
        {phase === 'reveal' && (
          <div style={{ animation: 'winner-appear 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
            <div style={{ fontSize: 88, animation: 'trophy-float 1.3s ease-in-out infinite', marginBottom: 16 }}>🏆</div>
            <div style={{ fontSize: 15, color: '#d4a017', letterSpacing: 3, marginBottom: 14, fontWeight: 600 }}>
              🎉 الأسرة الرائدة في الحصاد الأسري 🎉
            </div>
            <div style={{
              fontSize: 46, fontWeight: 900, color: '#fbbf24', marginBottom: 12,
              animation: 'winner-glow 1.8s ease-in-out infinite',
            }}>
              {winner.name}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#f0c040', marginBottom: 40 }}>
              {winner.total.toLocaleString('ar-SA')} درجة
            </div>
            {hasHifz && (
              <button onClick={onGoHifz} style={{
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 999, padding: '13px 36px', color: '#94a3b8',
                fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
                backdropFilter: 'blur(8px)',
              }}>
                📖 عرض بيانات الحفظ
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Hifz section ─────────────────────────────────────────────────────────────

function HifzSection({ memorizations }: { memorizations: StudentMemorization[] }) {
  // Sort lowest to highest pages (ascending)
  const sorted = useMemo(() =>
    [...memorizations].filter(m => m.pages > 0 || m.name).sort((a, b) => a.pages - b.pages),
    [memorizations]
  )
  const totalPages = useMemo(() => sorted.reduce((s, m) => s + m.pages, 0), [sorted])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{
        padding: '14px 22px', flexShrink: 0,
        background: 'rgba(99,102,241,0.04)', borderBottom: '1px solid rgba(99,102,241,0.1)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 26 }}>📖</span>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#f0f0e0' }}>بيانات الحفظ</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {sorted.length} طالب · {totalPages.toLocaleString('ar-SA')} صفحة إجمالاً · من الأقل إلى الأعلى
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#334155', padding: '60px 0', fontSize: 14 }}>
            لا توجد بيانات حفظ
          </div>
        ) : sorted.map((m, i) => (
          <FadeIn key={`${m.name}-${i}`} delay={i * 70}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.1)',
              borderRadius: 14, padding: '14px 18px', marginBottom: 10,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#6366f1',
                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)',
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{m.name}</div>
                {(m.startSura || m.endSura) && (
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {m.startSura && <span>من <span style={{ color: '#a5b4fc' }}>{m.startSura}</span></span>}
                    {m.startSura && m.endSura && <span> · </span>}
                    {m.endSura && <span>إلى <span style={{ color: '#a5b4fc' }}>{m.endSura}</span></span>}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'left', flexShrink: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#818cf8' }}>
                  {m.pages.toLocaleString('ar-SA')}
                </div>
                <div style={{ fontSize: 11, color: '#475569', textAlign: 'center' }}>صفحة</div>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  )
}

// ─── Drawer menu (right-side overlay) ────────────────────────────────────────

function DrawerMenu({ section, sequence, goTo }: {
  section: Section; sequence: Section[]; goTo: (s: Section) => void
}) {
  const [open, setOpen] = useState(false)
  const navItems = sequence.filter(s => NAV_LABELS[s])

  return (
    <>
      {/* Hamburger button */}
      <button onClick={() => setOpen(true)} style={{
        width: 40, height: 40, borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,160,23,0.18)',
        color: '#d4a017', fontSize: 17, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        ☰
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Drawer — slides from right */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 270, zIndex: 301,
        background: '#0e1422',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        borderLeft: '1px solid rgba(212,160,23,0.15)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Drawer header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid rgba(212,160,23,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#d4a017' }}>🌾 التنقل</span>
          <button onClick={() => setOpen(false)} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)', border: 'none',
            color: '#64748b', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {navItems.map(s => (
            <button key={s} onClick={() => { goTo(s); setOpen(false) }} style={{
              width: '100%', display: 'flex', alignItems: 'center', padding: '13px 20px',
              background: s === section ? 'rgba(212,160,23,0.12)' : 'transparent',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              color: s === section ? '#f0c040' : '#94a3b8',
              fontSize: 14, textAlign: 'right',
              fontWeight: s === section ? 700 : 400,
              borderRight: s === section ? '3px solid #d4a017' : '3px solid transparent',
            }}>
              {NAV_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function HassadDashboard({ data }: { data: DashboardData }) {
  const { students, families, weekEnabled, maxPossibleScore, memorizations } = data

  const sequence = useMemo(() => buildSequence(weekEnabled), [weekEnabled])
  const [section, setSection] = useState<Section>('intro')

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
  const sortedByTotal  = useMemo(() => [...students].sort((a, b) => b.total - a.total), [students])
  const sortedFamilies = useMemo(() => [...families].sort((a, b) => b.total - a.total), [families])
  const winnerFamily   = sortedFamilies[0]

  // ── Active section helpers ────────────────────────────────────────────────────
  const activeWn: 1|2|3|null = section === 'w1' ? 1 : section === 'w2' ? 2 : section === 'w3' ? 3 : null
  const activeFw: FwKey|null = section === 'fw1' ? 'fw1' : section === 'fw2' ? 'fw2' : section === 'fw3' ? 'fw3' : null

  // ── Auto-reveal: weeks ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeWn || weekPhase[activeWn] !== 'revealing') return
    const total = sortedByWeek[activeWn].length
    if (weekRevealed[activeWn] >= total) {
      setWeekPhase(prev => ({ ...prev, [activeWn]: 'done' })); return
    }
    const t = setTimeout(() =>
      setWeekRevealed(prev => ({ ...prev, [activeWn]: prev[activeWn] + 1 }))
    , STUDENT_DELAY)
    return () => clearTimeout(t)
  }, [activeWn, weekPhase, weekRevealed, sortedByWeek])

  // ── Auto-reveal: total ────────────────────────────────────────────────────────
  useEffect(() => {
    if (section !== 'total' || totalPhase !== 'revealing') return
    if (totalRevealed >= sortedByTotal.length) {
      setTotalPhase('done'); return
    }
    const t = setTimeout(() => setTotalRevealed(n => n + 1), STUDENT_DELAY)
    return () => clearTimeout(t)
  }, [section, totalPhase, totalRevealed, sortedByTotal.length])

  // ── Auto-reveal: families ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeFw || familyPhase[activeFw] !== 'revealing') return
    const total = sortedFamilies.length
    if (familyRevealed[activeFw] >= total) {
      setFamilyPhase(prev => ({ ...prev, [activeFw]: 'done' })); return
    }
    const t = setTimeout(() =>
      setFamilyRevealed(prev => ({ ...prev, [activeFw]: prev[activeFw] + 1 }))
    , FAMILY_DELAY)
    return () => clearTimeout(t)
  }, [activeFw, familyPhase, familyRevealed, sortedFamilies.length])

  // ── Navigation ────────────────────────────────────────────────────────────────
  const fwSections    = sequence.filter(s => s === 'fw1' || s === 'fw2' || s === 'fw3') as FwKey[]
  const lastFwSection = fwSections[fwSections.length - 1] as FwKey | undefined

  const navigateNext = useCallback(() => {
    const idx = sequence.indexOf(section)
    if (idx >= 0 && idx < sequence.length - 1) setSection(sequence[idx + 1])
  }, [section, sequence])

  const goTo = useCallback((s: Section) => setSection(s), [])

  const goNext = useCallback(() => {
    if (section === 'w1' || section === 'w2' || section === 'w3') {
      const wn = (section === 'w1' ? 1 : section === 'w2' ? 2 : 3) as 1|2|3
      if (weekPhase[wn] === 'idle') { setWeekPhase(prev => ({ ...prev, [wn]: 'revealing' })); return }
      navigateNext(); return
    }
    if (section === 'total') {
      if (totalPhase === 'idle') { setTotalPhase('revealing'); return }
      navigateNext(); return
    }
    if (activeFw) {
      if (familyPhase[activeFw] === 'idle') {
        setFamilyPhase(prev => ({ ...prev, [activeFw]: 'revealing' })); return
      }
      if (familyPhase[activeFw] === 'done' && activeFw === lastFwSection) {
        setSection('final'); return
      }
      navigateNext(); return
    }
  }, [section, weekPhase, totalPhase, familyPhase, activeFw, lastFwSection, navigateNext])

  // ── Skip button (during revealing) ───────────────────────────────────────────
  const isRevealing =
    (activeWn !== null && weekPhase[activeWn] === 'revealing') ||
    (section === 'total' && totalPhase === 'revealing') ||
    (activeFw !== null && familyPhase[activeFw] === 'revealing')

  const handleSkip = useCallback(() => {
    if (activeWn) {
      setWeekPhase(prev => ({ ...prev, [activeWn]: 'done' }))
      navigateNext(); return
    }
    if (section === 'total') {
      setTotalPhase('done')
      navigateNext(); return
    }
    if (activeFw) {
      setFamilyPhase(prev => ({ ...prev, [activeFw]: 'done' }))
      if (activeFw === lastFwSection) { setSection('final') }
      else { navigateNext() }
    }
  }, [activeWn, section, activeFw, lastFwSection, navigateNext])

  // ── Map fw key → week number ──────────────────────────────────────────────────
  const fwWeekNum = (fw: FwKey): 1|2|3 => {
    const enabledFws = sequence.filter(s => s === 'fw1' || s === 'fw2' || s === 'fw3') as FwKey[]
    const idx = enabledFws.indexOf(fw)
    const enabledWeeks = ([1, 2, 3] as const).filter(w => weekEnabled[`week${w}` as keyof WeekEnabled])
    return enabledWeeks[idx] ?? 1
  }

  const stepNum = section === 'intro' ? 0 : sequence.indexOf(section) + 1
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
        @keyframes glow-pulse      { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes confetti-loop   { 0%{transform:translateY(108vh) rotate(0deg);opacity:0} 5%{opacity:1} 95%{opacity:1} 100%{transform:translateY(-15vh) rotate(720deg);opacity:0} }
        @keyframes trophy-float    { 0%,100%{transform:translateY(0) rotate(-4deg)} 50%{transform:translateY(-18px) rotate(4deg)} }
        @keyframes winner-glow     { 0%,100%{text-shadow:0 0 40px rgba(251,191,36,0.5)} 50%{text-shadow:0 0 100px rgba(251,191,36,1)} }
        @keyframes winner-appear   { from{opacity:0;transform:scale(0.7) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes suspense-bounce { from{transform:translateY(0)} to{transform:translateY(-12px)} }
        @keyframes suspense-fade   { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes dot-wave        { 0%,100%{transform:translateY(0);opacity:0.4} 50%{transform:translateY(-8px);opacity:1} }
      `}</style>

      {/* Skip button — fixed left, visible during revealing */}
      {isRevealing && (
        <button onClick={handleSkip} style={{
          position: 'fixed', left: 18, top: '50%', transform: 'translateY(-50%)',
          zIndex: 50,
          background: 'rgba(10,15,30,0.88)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 999, padding: '10px 16px',
          color: '#475569', fontSize: 12, cursor: 'pointer',
          fontFamily: 'inherit', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          transition: 'color 0.2s',
        }}>
          <span style={{ fontSize: 16 }}>⬅</span>
          <span>تخطي</span>
        </button>
      )}

      {/* Header — hidden on intro */}
      {section !== 'intro' && (
        <header style={{
          flexShrink: 0, height: 52,
          background: 'rgba(10,15,30,0.92)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(212,160,23,0.1)',
          display: 'flex', alignItems: 'center', paddingRight: 14, paddingLeft: 14, gap: 12,
        }}>
          <DrawerMenu section={section} sequence={sequence} goTo={goTo} />
          <div style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#d4a017' }}>
            🌾 الحصاد الأسري
          </div>
          {section !== 'final' && section !== 'hifz' && (
            <div style={{ fontSize: 11, color: '#334155', flexShrink: 0 }}>
              {stepNum} / {stepTot}
            </div>
          )}
        </header>
      )}

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {section === 'intro' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 28px' }}>
            <FadeIn>
              <div style={{ textAlign: 'center', maxWidth: 380 }}>
                <div style={{ fontSize: 80, marginBottom: 20 }}>🌾</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: '#f0c040', marginBottom: 12 }}>الحصاد الأسري</div>
                <div style={{ fontSize: 15, color: '#64748b', lineHeight: 1.8, marginBottom: 12 }}>
                  نتائج البرنامج عبر الأسابيع الثلاثة
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 44 }}>
                  {[
                    { icon: '👤', val: students.length, label: 'طالب' },
                    { icon: '👨‍👩‍👦', val: families.length, label: 'أسرة' },
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
                <button onClick={() => setSection(sequence[0])} style={{
                  background: 'linear-gradient(135deg, #b8860b, #f0c040)',
                  border: 'none', borderRadius: 999, padding: '17px 64px',
                  fontSize: 18, fontWeight: 900, color: '#0a0f1e', cursor: 'pointer',
                  fontFamily: 'inherit', boxShadow: '0 6px 32px rgba(212,160,23,0.45)',
                }}>
                  ابدأ ←
                </button>
              </div>
            </FadeIn>
          </div>
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
            onStart={goNext} onNext={goNext}
            isLastFw={activeFw === lastFwSection}
          />
        )}

        {section === 'final' && winnerFamily && (
          <FinalSection
            winner={winnerFamily}
            onGoHifz={() => setSection('hifz')}
            hasHifz={memorizations.length > 0}
          />
        )}

        {section === 'hifz' && (
          <HifzSection memorizations={memorizations} />
        )}

      </main>
    </div>
  )
}
