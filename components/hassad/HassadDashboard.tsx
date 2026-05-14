'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { DashboardData, StudentData, FamilyStats, WeekEnabled, StudentMemorization } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const STUDENT_DELAY = 2000
const FAMILY_DELAY  = 1800
const WEEK_MAX: Record<number, number>   = { 1: 2700, 2: 2900, 3: 2300 }
const WEEK_LABEL: Record<number, string>  = { 1: 'الأول', 2: 'الثاني', 3: 'الثالث' }
const WEEK_ICON: Record<number, string>   = { 1: '🌱', 2: '🌿', 3: '🌾' }

type Section    = 'intro' | 'w1' | 'w2' | 'w3' | 'total' | 'fw1' | 'fw2' | 'fw3' | 'final' | 'hifz'
type FwKey      = 'fw1' | 'fw2' | 'fw3'
type Phase      = 'idle' | 'revealing' | 'done'
type FinalPhase = 'suspense' | 'dark' | 'fake' | 'winner' | 'results'

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
      transition: 'opacity 0.45s ease, transform 0.45s ease',
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

// ─── StudentCard ──────────────────────────────────────────────────────────────

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

// ─── Family reveal card ───────────────────────────────────────────────────────

function FamilyRevealCard({ family, weekNum, rank }: {
  family: FamilyStats; weekNum: 1 | 2 | 3; rank: number
}) {
  const weekScore = weekNum === 1 ? family.week1 : weekNum === 2 ? family.week2 : family.week3
  const eval_     = weekNum === 1 ? family.w1Eval : weekNum === 2 ? family.w2Eval : family.w3Eval
  const m         = medalEmoji(rank)

  const evalRows = eval_ ? [
    { label: 'رياضي',  icon: '⚽', val: eval_.athletic, color: '#38bdf8' },
    { label: 'شعبيات', icon: '🥘', val: eval_.popular,  color: '#fb923c' },
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

// ─── WeekSection ──────────────────────────────────────────────────────────────

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
  useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' }) }, [revealed])

  if (phase === 'idle') return (
    <IdleScreen icon={WEEK_ICON[weekNum]} title={`الأسبوع ${WEEK_LABEL[weekNum]}`}
      subtitle={`${sorted.length} طالب · ${maxScore.toLocaleString('ar-SA')} درجة قصوى`}
      onStart={onStart} />
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '14px 22px', flexShrink: 0, background: 'rgba(212,160,23,0.04)', borderBottom: '1px solid rgba(212,160,23,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 26 }}>{WEEK_ICON[weekNum]}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#f0f0e0' }}>الأسبوع {WEEK_LABEL[weekNum]}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{sorted.length} طالب · {maxScore.toLocaleString('ar-SA')} درجة قصوى</div>
          </div>
          {phase === 'done' && <span style={{ fontSize: 18 }}>✅</span>}
        </div>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 99, background: phase === 'done' ? '#22c55e' : '#d4a017', width: `${sorted.length > 0 ? Math.min(100, (revealed / sorted.length) * 100) : 0}%`, transition: 'width 0.6s ease' }} />
        </div>
      </div>
      <div ref={ref} style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {sorted.slice(0, revealed).map((s, i) => (
          <StudentCard key={s.name} student={s} rank={i + 1} score={s[scoreKey] as number} maxScore={maxScore} />
        ))}
      </div>
      {phase === 'done' && <NextButton onNext={onNext} />}
    </div>
  )
}

// ─── TotalSection ─────────────────────────────────────────────────────────────

function TotalSection({ students, maxScore, phase, revealed, onStart, onNext }: {
  students: StudentData[]; maxScore: number; phase: Phase; revealed: number
  onStart: () => void; onNext: () => void
}) {
  const sorted = useMemo(() => [...students].sort((a, b) => b.total - a.total), [students])
  const ref    = useRef<HTMLDivElement>(null)
  useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' }) }, [revealed])

  if (phase === 'idle') return (
    <IdleScreen icon="🏅" title="الترتيب الكلي"
      subtitle={`مجموع الأسابيع · ${maxScore.toLocaleString('ar-SA')} درجة قصوى`}
      onStart={onStart} />
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '14px 22px', flexShrink: 0, background: 'rgba(212,160,23,0.04)', borderBottom: '1px solid rgba(212,160,23,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 26 }}>🏅</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#f0f0e0' }}>الترتيب الكلي</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>مجموع الأسابيع · {maxScore.toLocaleString('ar-SA')} درجة قصوى</div>
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

// ─── FamilyWeekSection ────────────────────────────────────────────────────────

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
  useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' }) }, [revealed])

  if (phase === 'idle') return (
    <IdleScreen icon="👨‍👩‍👦" title={`حصاد الأسر — الأسبوع ${WEEK_LABEL[weekNum]}`}
      subtitle={`${families.length} أسرة · اضغط لبدء عرض النتائج`}
      onStart={onStart} />
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '14px 22px', flexShrink: 0, background: 'rgba(212,160,23,0.04)', borderBottom: '1px solid rgba(212,160,23,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 26 }}>👨‍👩‍👦</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#f0f0e0' }}>حصاد الأسر — الأسبوع {WEEK_LABEL[weekNum]}</div>
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
        <NextButton onNext={onNext} label={isLastFw ? 'إعلان الأسرة الرائدة 🏆' : 'الأسبوع التالي ←'} />
      )}
    </div>
  )
}

// ─── FinalSection ─────────────────────────────────────────────────────────────

function FinalSection({ families, finalPhase, suspenseCount, onGoHifz, hasHifz }: {
  families: FamilyStats[]; finalPhase: FinalPhase; suspenseCount: number
  onGoHifz: () => void; hasHifz: boolean
}) {
  const winner = families[0]
  const second = families[1]
  const diff   = winner && second ? winner.total - second.total : 0
  const showConfetti = finalPhase === 'fake' || finalPhase === 'winner' || finalPhase === 'results'

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

      {/* Background — shifts from dark to golden on winner */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: finalPhase === 'dark'
          ? 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.04) 0%, transparent 55%)'
          : showConfetti
            ? 'radial-gradient(ellipse at 50% 40%, rgba(212,160,23,0.22) 0%, transparent 65%)'
            : 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.06) 0%, transparent 65%)',
        animation: finalPhase === 'dark'
          ? 'dark-breathe 2s ease-in-out infinite'
          : 'glow-pulse 2.5s ease-in-out infinite',
        transition: 'background 2s ease',
      }} />

      {/* Confetti – looping */}
      {showConfetti && CONFETTI.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: p.left, bottom: '-5%',
          fontSize: p.size, pointerEvents: 'none', userSelect: 'none',
          animation: `confetti-loop ${p.dur} ${p.delay} ease-in-out infinite`,
        }}>
          {p.emoji}
        </div>
      ))}

      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 28px', maxWidth: 480, width: '100%' }}>

        {/* ── Suspense countdown ── */}
        {finalPhase === 'suspense' && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#94a3b8', marginBottom: 20, letterSpacing: 2 }}>
              والأسرة الرائدة في الحصاد الأسري هي…
            </div>
            <div style={{
              fontSize: 130, fontWeight: 900, lineHeight: 1, marginBottom: 16,
              color: '#d4a017',
              animation: 'count-tick 1s ease-in-out',
              animationFillMode: 'both',
            }}>
              {suspenseCount}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%', background: '#334155',
                  animation: `dot-wave 1s ${i * 0.33}s ease-in-out infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* ── Dark silence (5s) ── */}
        {finalPhase === 'dark' && <div style={{ opacity: 0 }} />}

        {/* ── Fake winner: 2nd place shown as winner for 3s ── */}
        {finalPhase === 'fake' && second && (
          <div style={{ animation: 'fake-in 0.75s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
            <div style={{ fontSize: 88, animation: 'trophy-float 1.3s ease-in-out infinite', marginBottom: 16 }}>🏆</div>
            <div style={{ fontSize: 14, color: '#d4a017', letterSpacing: 3, marginBottom: 14, fontWeight: 600 }}>
              🎉 الأسرة الرائدة في الحصاد الأسري 🎉
            </div>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#fbbf24', marginBottom: 12, animation: 'winner-glow 1.8s ease-in-out infinite' }}>
              {second.name}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#f0c040' }}>
              {second.total.toLocaleString('ar-SA')} درجة
            </div>
          </div>
        )}

        {/* ── Real winner — explosive reveal with shake ── */}
        {finalPhase === 'winner' && winner && (
          <div style={{ animation: 'winner-explode 0.85s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
            <div style={{ fontSize: 96, animation: 'trophy-float 1.3s ease-in-out infinite', marginBottom: 16 }}>🏆</div>
            <div style={{ fontSize: 14, color: '#d4a017', letterSpacing: 3, marginBottom: 14, fontWeight: 600 }}>
              🎉 الأسرة الرائدة في الحصاد الأسري 🎉
            </div>
            <div style={{
              fontSize: 52, fontWeight: 900, color: '#fbbf24', marginBottom: 12,
              animation: 'winner-glow 1.8s ease-in-out infinite',
            }}>
              {winner.name}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f0c040' }}>
              {winner.total.toLocaleString('ar-SA')} درجة
            </div>
          </div>
        )}

        {/* ── Results: winner + 2nd + diff ── */}
        {finalPhase === 'results' && winner && (
          <div style={{ animation: 'winner-explode 0.6s ease forwards', width: '100%' }}>
            <FadeIn>
              <div style={{
                background: 'rgba(212,160,23,0.1)', border: '2px solid rgba(212,160,23,0.35)',
                borderRadius: 20, padding: '20px 24px', marginBottom: 14, textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, color: '#d4a017', letterSpacing: 2, marginBottom: 8 }}>🥇 الأسرة الرائدة</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: '#fbbf24', marginBottom: 6, animation: 'winner-glow 1.8s ease-in-out infinite' }}>
                  {winner.name}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#f0c040' }}>
                  {winner.total.toLocaleString('ar-SA')} درجة
                </div>
              </div>
            </FadeIn>

            {second && (
              <FadeIn delay={300}>
                <div style={{
                  background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.18)',
                  borderRadius: 16, padding: '16px 20px', textAlign: 'center', marginBottom: 12,
                }}>
                  <div style={{ fontSize: 11, color: '#64748b', letterSpacing: 2, marginBottom: 6 }}>🥈 المركز الثاني</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#94a3b8', marginBottom: 4 }}>{second.name}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#64748b' }}>
                    {second.total.toLocaleString('ar-SA')} درجة
                  </div>
                </div>
              </FadeIn>
            )}

            {second && diff > 0 && (
              <FadeIn delay={500}>
                <div style={{ fontSize: 14, color: '#475569', textAlign: 'center', marginBottom: 8 }}>
                  الفارق: <span style={{ color: '#f0c040', fontWeight: 800, fontSize: 18 }}>
                    {diff.toLocaleString('ar-SA')}
                  </span> درجة
                </div>
              </FadeIn>
            )}
          </div>
        )}
      </div>

      {/* White flash when real winner is revealed (covers fake→real transition) */}
      {finalPhase === 'winner' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 15, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 50%, #fffbe6 0%, rgba(255,240,100,0.85) 40%, rgba(212,160,23,0.4) 70%, transparent 100%)',
          animation: 'winner-flash 0.9s ease-out forwards',
        }} />
      )}

      {/* "التالي" — bottom-left, results phase only */}
      {finalPhase === 'results' && hasHifz && (
        <button onClick={onGoHifz} style={{
          position: 'absolute', bottom: 28, left: 24, zIndex: 20,
          background: 'rgba(10,15,30,0.85)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 999, padding: '10px 22px',
          color: '#64748b', fontSize: 13, cursor: 'pointer',
          fontFamily: 'inherit', backdropFilter: 'blur(8px)',
        }}>
          التالي ←
        </button>
      )}
    </div>
  )
}

// ─── HifzSection ──────────────────────────────────────────────────────────────
// sorted ascending (least → most pages). Display is bottom-up:
//   sorted[0] = rank N = appears first at visual bottom
//   sorted[N-1] = rank 1 = appears last at visual top (champion)
// column-reverse: DOM order maps sorted[0]→bottom, sorted[N-1]→top

function HifzSection({ memorizations, phase, revealed, onStart }: {
  memorizations: StudentMemorization[]; phase: Phase; revealed: number; onStart: () => void
}) {
  const sorted = useMemo(() =>
    [...memorizations].filter(m => m.pages > 0).sort((a, b) => a.pages - b.pages),
    [memorizations]
  )
  const totalPages = useMemo(() => sorted.reduce((s, m) => s + m.pages, 0), [sorted])
  const n = sorted.length

  // During reveal: scroll down to keep newest card in view
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (phase === 'done') return
    sentinelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [revealed, phase])

  // When done: flip order to rank-1-first, then scroll container to top
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (phase !== 'done') return
    const t = setTimeout(() => {
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }, 600)
    return () => clearTimeout(t)
  }, [phase])

  if (phase === 'idle') return (
    <IdleScreen icon="📖" title="بيانات الحفظ"
      subtitle={`${sorted.length} طالب · ${totalPages.toLocaleString('ar-SA')} صفحة`}
      onStart={onStart} />
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{
        padding: '14px 22px', flexShrink: 0,
        background: 'rgba(99,102,241,0.04)', borderBottom: '1px solid rgba(99,102,241,0.1)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 26 }}>📖</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#f0f0e0' }}>بيانات الحفظ</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{n} طالب</div>
        </div>
        {phase === 'done' && <span style={{ fontSize: 18 }}>🏅</span>}
      </div>

      {/* Reveal: ascending (rank N→1). Done: reversed (rank 1 at top→N at bottom). */}
      <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {(phase === 'done' ? [...sorted].reverse() : sorted.slice(0, revealed)).map((m, i) => {
          const originalIdx = sorted.indexOf(m)
          const rank     = n - originalIdx   // always correct regardless of display order
          const isNew    = phase !== 'done' && originalIdx === revealed - 1
          const isGold   = rank === 1
          const isSilver = rank === 2
          const isBronze = rank === 3
          const isPodium = isGold || isSilver || isBronze

          const medalEmoji   = isGold ? '🥇' : isSilver ? '🥈' : isBronze ? '🥉' : null
          const podiumColor  = isGold ? '#fbbf24' : isSilver ? '#94a3b8' : isBronze ? '#fb923c' : '#6366f1'
          const podiumBg     = isGold ? 'rgba(212,160,23,0.18)' : isSilver ? 'rgba(148,163,184,0.15)' : isBronze ? 'rgba(251,146,60,0.15)' : 'rgba(99,102,241,0.12)'
          const podiumBorder = isGold ? 'rgba(212,160,23,0.42)' : isSilver ? 'rgba(148,163,184,0.35)' : isBronze ? 'rgba(251,146,60,0.35)' : 'rgba(99,102,241,0.18)'
          const cardBg       = isGold ? 'rgba(212,160,23,0.14)' : isSilver ? 'rgba(148,163,184,0.07)' : isBronze ? 'rgba(251,146,60,0.07)' : 'rgba(99,102,241,0.04)'

          return (
            <div key={m.name} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: cardBg,
                border: `${isPodium ? '2px' : '1px'} solid ${podiumBorder}`,
                borderRadius: 14, padding: '14px 18px', marginBottom: 10,
                animation: isNew
                  ? 'hifz-card-in 0.55s cubic-bezier(0.34,1.56,0.64,1) both'
                  : (isGold && phase === 'done' ? 'champ-glow 2s ease-in-out infinite' : 'none'),
              }}>
              <div style={{
                width: isPodium ? 44 : 38, height: isPodium ? 44 : 38,
                borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isPodium ? 22 : 13, fontWeight: 700,
                color: podiumColor, background: podiumBg,
                border: `1px solid ${podiumBorder}`,
                animation: isGold && phase === 'done' ? 'winner-glow 1.8s ease-in-out infinite' : 'none',
              }}>
                {medalEmoji ?? rank}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: isGold ? 17 : 15, fontWeight: isPodium ? 800 : 700,
                  color: isGold ? '#fbbf24' : isSilver ? '#cbd5e1' : isBronze ? '#fdba74' : '#e2e8f0',
                  marginBottom: 4,
                  animation: isGold && phase === 'done' ? 'winner-glow 1.8s ease-in-out infinite' : 'none',
                }}>
                  {m.name}
                </div>
                {(m.startSura || m.endSura) && (
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {m.startSura && <span>من <span style={{ color: '#a5b4fc' }}>{m.startSura}</span></span>}
                    {m.startSura && m.endSura && <span> · </span>}
                    {m.endSura && <span>إلى <span style={{ color: '#a5b4fc' }}>{m.endSura}</span></span>}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'left', flexShrink: 0 }}>
                <div style={{
                  fontSize: isGold ? 28 : isPodium ? 24 : 22, fontWeight: 900,
                  color: podiumColor,
                  animation: isGold && phase === 'done' ? 'winner-glow 1.8s ease-in-out infinite' : 'none',
                }}>
                  {m.pages.toLocaleString('ar-SA')}
                </div>
                <div style={{ fontSize: 11, color: '#475569', textAlign: 'center' }}>صفحة</div>
              </div>
            </div>
          )
        })}
        <div ref={sentinelRef} style={{ height: 1 }} />
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function HassadDashboard({ data }: { data: DashboardData }) {
  const { students, families, weekEnabled, maxPossibleScore, memorizations } = data

  const sequence = useMemo(() => buildSequence(weekEnabled), [weekEnabled])
  const [section, setSection] = useState<Section>('intro')
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Week state
  const [weekPhase,    setWeekPhase]    = useState<Record<1|2|3, Phase>>({ 1: 'idle', 2: 'idle', 3: 'idle' })
  const [weekRevealed, setWeekRevealed] = useState<Record<1|2|3, number>>({ 1: 0, 2: 0, 3: 0 })

  // Total state
  const [totalPhase,    setTotalPhase]    = useState<Phase>('idle')
  const [totalRevealed, setTotalRevealed] = useState(0)

  // Family state
  const [familyPhase,    setFamilyPhase]    = useState<Record<FwKey, Phase>>({ fw1: 'idle', fw2: 'idle', fw3: 'idle' })
  const [familyRevealed, setFamilyRevealed] = useState<Record<FwKey, number>>({ fw1: 0, fw2: 0, fw3: 0 })

  // Final state (lifted to main for skip button access)
  const [finalPhase,    setFinalPhase]    = useState<FinalPhase>('suspense')
  const [suspenseCount, setSuspenseCount] = useState(10)
  const [darkCount,     setDarkCount]     = useState(5)
  const [winnerCount,   setWinnerCount]   = useState(30)

  // Hifz state
  const [hifzPhase,    setHifzPhase]    = useState<Phase>('idle')
  const [hifzRevealed, setHifzRevealed] = useState(0)

  // Sorted data
  const sortedByWeek = useMemo(() => ({
    1: [...students].sort((a, b) => b.week1 - a.week1),
    2: [...students].sort((a, b) => b.week2 - a.week2),
    3: [...students].sort((a, b) => b.week3 - a.week3),
  }), [students])
  const sortedByTotal   = useMemo(() => [...students].sort((a, b) => b.total - a.total), [students])
  const sortedFamilies  = useMemo(() => [...families].sort((a, b) => b.total - a.total), [families])
  const hifzSorted      = useMemo(() => [...memorizations].filter(m => m.pages > 0).sort((a, b) => a.pages - b.pages), [memorizations])

  // ── Reset final state when entering ──────────────────────────────────────────
  useEffect(() => {
    if (section === 'final') {
      setFinalPhase('suspense')
      setSuspenseCount(10)
      setDarkCount(5)
      setWinnerCount(30)
    }
  }, [section])

  // ── Auto-reveal: weeks ────────────────────────────────────────────────────────
  const activeWn: 1|2|3|null = section === 'w1' ? 1 : section === 'w2' ? 2 : section === 'w3' ? 3 : null
  useEffect(() => {
    if (!activeWn || weekPhase[activeWn] !== 'revealing') return
    const total = sortedByWeek[activeWn].length
    if (weekRevealed[activeWn] >= total) { setWeekPhase(p => ({ ...p, [activeWn]: 'done' })); return }
    const t = setTimeout(() => setWeekRevealed(p => ({ ...p, [activeWn]: p[activeWn] + 1 })), STUDENT_DELAY)
    return () => clearTimeout(t)
  }, [activeWn, weekPhase, weekRevealed, sortedByWeek])

  // ── Auto-reveal: total ────────────────────────────────────────────────────────
  useEffect(() => {
    if (section !== 'total' || totalPhase !== 'revealing') return
    if (totalRevealed >= sortedByTotal.length) { setTotalPhase('done'); return }
    const t = setTimeout(() => setTotalRevealed(n => n + 1), STUDENT_DELAY)
    return () => clearTimeout(t)
  }, [section, totalPhase, totalRevealed, sortedByTotal.length])

  // ── Auto-reveal: families ─────────────────────────────────────────────────────
  const activeFw: FwKey|null = section === 'fw1' ? 'fw1' : section === 'fw2' ? 'fw2' : section === 'fw3' ? 'fw3' : null
  useEffect(() => {
    if (!activeFw || familyPhase[activeFw] !== 'revealing') return
    if (familyRevealed[activeFw] >= sortedFamilies.length) { setFamilyPhase(p => ({ ...p, [activeFw]: 'done' })); return }
    const t = setTimeout(() => setFamilyRevealed(p => ({ ...p, [activeFw]: p[activeFw] + 1 })), FAMILY_DELAY)
    return () => clearTimeout(t)
  }, [activeFw, familyPhase, familyRevealed, sortedFamilies.length])

  // ── Final timers ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (section !== 'final' || finalPhase !== 'suspense') return
    if (suspenseCount <= 0) { setFinalPhase('dark'); return }
    const t = setInterval(() => setSuspenseCount(c => c - 1), 1000)
    return () => clearInterval(t)
  }, [section, finalPhase, suspenseCount])

  // 5 seconds of silent darkness → fake winner (if 2nd place exists, else real winner)
  useEffect(() => {
    if (section !== 'final' || finalPhase !== 'dark') return
    if (darkCount <= 0) {
      setFinalPhase(sortedFamilies.length >= 2 ? 'fake' : 'winner')
      return
    }
    const t = setInterval(() => setDarkCount(c => c - 1), 1000)
    return () => clearInterval(t)
  }, [section, finalPhase, darkCount, sortedFamilies.length])

  // Fake winner shown for 3 seconds, then real reveal
  useEffect(() => {
    if (section !== 'final' || finalPhase !== 'fake') return
    const t = setTimeout(() => setFinalPhase('winner'), 3000)
    return () => clearTimeout(t)
  }, [section, finalPhase])

  useEffect(() => {
    if (section !== 'final' || finalPhase !== 'winner') return
    if (winnerCount <= 0) { setFinalPhase('results'); return }
    const t = setInterval(() => setWinnerCount(c => c - 1), 1000)
    return () => clearInterval(t)
  }, [section, finalPhase, winnerCount])

  // ── Auto-reveal: hifz (last 3 get 5s delay for suspense) ─────────────────────
  useEffect(() => {
    if (section !== 'hifz' || hifzPhase !== 'revealing') return
    if (hifzRevealed >= hifzSorted.length) { setHifzPhase('done'); return }
    const isTop3 = hifzRevealed >= hifzSorted.length - 3
    const t = setTimeout(() => setHifzRevealed(n => n + 1), isTop3 ? 5000 : STUDENT_DELAY)
    return () => clearTimeout(t)
  }, [section, hifzPhase, hifzRevealed, hifzSorted.length])

  // ── Navigation ────────────────────────────────────────────────────────────────
  const fwSections    = sequence.filter(s => s === 'fw1' || s === 'fw2' || s === 'fw3') as FwKey[]
  const lastFwSection = fwSections[fwSections.length - 1] as FwKey | undefined

  const navigateNext = useCallback(() => {
    const idx = sequence.indexOf(section)
    if (idx >= 0 && idx < sequence.length - 1) setSection(sequence[idx + 1])
  }, [section, sequence])

  const goTo = useCallback((s: Section) => { setSection(s); setDrawerOpen(false) }, [])

  const goNext = useCallback(() => {
    if (section === 'w1' || section === 'w2' || section === 'w3') {
      const wn = (section === 'w1' ? 1 : section === 'w2' ? 2 : 3) as 1|2|3
      if (weekPhase[wn] === 'idle') { setWeekPhase(p => ({ ...p, [wn]: 'revealing' })); return }
      navigateNext(); return
    }
    if (section === 'total') {
      if (totalPhase === 'idle') { setTotalPhase('revealing'); return }
      navigateNext(); return
    }
    if (activeFw) {
      if (familyPhase[activeFw] === 'idle') { setFamilyPhase(p => ({ ...p, [activeFw]: 'revealing' })); return }
      if (familyPhase[activeFw] === 'done' && activeFw === lastFwSection) { setSection('final'); return }
      navigateNext(); return
    }
    if (section === 'hifz') {
      if (hifzPhase === 'idle') { setHifzPhase('revealing'); return }
    }
  }, [section, weekPhase, totalPhase, familyPhase, activeFw, lastFwSection, hifzPhase, navigateNext])

  // ── Skip button ────────────────────────────────────────────────────────────────
  const isRevealing =
    (activeWn !== null && weekPhase[activeWn] === 'revealing') ||
    (section === 'total' && totalPhase === 'revealing') ||
    (activeFw !== null && familyPhase[activeFw] === 'revealing') ||
    (section === 'hifz' && hifzPhase === 'revealing') ||
    (section === 'final' && (finalPhase === 'suspense' || finalPhase === 'dark' || finalPhase === 'fake' || finalPhase === 'winner'))

  const handleSkip = useCallback(() => {
    if (activeWn) { setWeekPhase(p => ({ ...p, [activeWn]: 'done' })); navigateNext(); return }
    if (section === 'total') { setTotalPhase('done'); navigateNext(); return }
    if (activeFw) {
      setFamilyPhase(p => ({ ...p, [activeFw]: 'done' }))
      if (activeFw === lastFwSection) setSection('final')
      else navigateNext()
      return
    }
    if (section === 'final') {
      if (finalPhase === 'suspense') { setFinalPhase('dark'); return }
      if (finalPhase === 'dark')    { setFinalPhase(sortedFamilies.length >= 2 ? 'fake' : 'winner'); return }
      if (finalPhase === 'fake')    { setFinalPhase('winner'); setWinnerCount(30); return }
      if (finalPhase === 'winner')  { setFinalPhase('results'); return }
    }
    if (section === 'hifz') { setHifzPhase('done'); return }
  }, [activeWn, section, activeFw, lastFwSection, finalPhase, navigateNext])

  // ── fw → week number mapping ───────────────────────────────────────────────────
  const fwWeekNum = (fw: FwKey): 1|2|3 => {
    const enabledFws   = sequence.filter(s => s === 'fw1' || s === 'fw2' || s === 'fw3') as FwKey[]
    const idx          = enabledFws.indexOf(fw)
    const enabledWeeks = ([1, 2, 3] as const).filter(w => weekEnabled[`week${w}` as keyof WeekEnabled])
    return enabledWeeks[idx] ?? 1
  }

  const stepNum      = section === 'intro' ? 0 : sequence.indexOf(section) + 1
  const stepTot      = sequence.length
  const navItems     = sequence.filter(s => NAV_LABELS[s])

  return (
    <div dir="rtl" style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse at 50% 0%, #12192e 0%, #0a0f1e 65%)',
      fontFamily: '"Tajawal", "Cairo", sans-serif',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      color: '#e2e8f0',
    }}>
      <style>{`
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(212,160,23,0.2);border-radius:99px}
        @keyframes glow-pulse    {0%,100%{opacity:0.4}50%{opacity:1}}
        @keyframes dark-breathe  {0%,100%{opacity:0.08;transform:scale(0.95)}50%{opacity:0.32;transform:scale(1.08)}}
        @keyframes confetti-loop {0%{transform:translateY(108vh) rotate(0deg);opacity:0}5%{opacity:1}95%{opacity:1}100%{transform:translateY(-15vh) rotate(720deg);opacity:0}}
        @keyframes trophy-float  {0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-18px) rotate(4deg)}}
        @keyframes winner-glow   {0%,100%{text-shadow:0 0 40px rgba(251,191,36,0.5)}50%{text-shadow:0 0 100px rgba(251,191,36,1)}}
        @keyframes winner-explode{0%{opacity:0;transform:scale(0.1) rotate(-15deg)}55%{opacity:1;transform:scale(1.18) rotate(4deg)}75%{transform:scale(0.94) rotate(-2deg)}100%{opacity:1;transform:scale(1) rotate(0deg)}}
        @keyframes fake-in       {0%{opacity:0;transform:scale(0.6) rotate(-8deg)}60%{transform:scale(1.12) rotate(2deg)}100%{opacity:1;transform:scale(1) rotate(0deg)}}
        @keyframes winner-flash  {0%{opacity:1}100%{opacity:0}}
        @keyframes real-shake    {0%,100%{transform:scale(1)}18%{transform:scale(1.06) rotate(-1.5deg)}36%{transform:scale(1.1) rotate(1.5deg)}54%{transform:scale(1.07) rotate(-1deg)}72%{transform:scale(1.04) rotate(0.5deg)}88%{transform:scale(1.02)}}
        @keyframes count-tick    {from{transform:scale(1.4);opacity:0.3}to{transform:scale(1);opacity:1}}
        @keyframes dot-wave      {0%,100%{transform:translateY(0);opacity:0.3}50%{transform:translateY(-8px);opacity:1}}
        @keyframes section-enter {from{opacity:0.5;transform:scale(0.975)}to{opacity:1;transform:scale(1)}}
        @keyframes drawer-in     {from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes hifz-card-in  {from{transform:translateY(70px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes champ-glow    {0%,100%{box-shadow:0 0 24px rgba(212,160,23,0.25)}50%{box-shadow:0 0 52px rgba(212,160,23,0.55)}}
      `}</style>

      {/* ── Drawer overlay (rendered at root, above everything) ── */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(0,0,0,0.58)', backdropFilter: 'blur(3px)',
        }} />
      )}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 272, zIndex: 401,
        background: '#0d1320',
        transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        borderLeft: '1px solid rgba(212,160,23,0.15)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(212,160,23,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#d4a017' }}>🌾 التنقل</span>
          <button onClick={() => setDrawerOpen(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none', color: '#64748b', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 8, paddingBottom: 8 }}>
          {navItems.map(s => (
            <button key={s} onClick={() => goTo(s)} style={{
              width: '100%', padding: '13px 20px',
              background: s === section ? 'rgba(212,160,23,0.12)' : 'transparent',
              border: 'none', borderRight: `3px solid ${s === section ? '#d4a017' : 'transparent'}`,
              cursor: 'pointer', fontFamily: 'inherit',
              color: s === section ? '#f0c040' : '#94a3b8',
              fontSize: 14, textAlign: 'right', display: 'block',
              fontWeight: s === section ? 700 : 400,
            }}>
              {NAV_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Skip button ── */}
      {isRevealing && (
        <button onClick={handleSkip} style={{
          position: 'fixed', left: 18, top: '50%', transform: 'translateY(-50%)',
          zIndex: 50,
          background: 'rgba(10,15,30,0.88)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 999, padding: '10px 14px',
          color: '#475569', fontSize: 12, cursor: 'pointer',
          fontFamily: 'inherit', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        }}>
          <span style={{ fontSize: 16 }}>⬅</span>
          <span>تخطي</span>
        </button>
      )}

      {/* ── Header ── */}
      {section !== 'intro' && (
        <header style={{
          flexShrink: 0, height: 52,
          background: 'rgba(10,15,30,0.92)',
          borderBottom: '1px solid rgba(212,160,23,0.1)',
          display: 'flex', alignItems: 'center', paddingRight: 14, paddingLeft: 14, gap: 12,
        }}>
          <button onClick={() => setDrawerOpen(true)} style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,160,23,0.18)',
            color: '#d4a017', fontSize: 17, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>☰</button>
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

      {/* ── Main content ── */}
      <main key={section} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'section-enter 0.35s cubic-bezier(0.16,1,0.3,1) both' }}>

        {section === 'intro' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 28px' }}>
            <FadeIn>
              <div style={{ textAlign: 'center', maxWidth: 380 }}>
                <div style={{ fontSize: 80, marginBottom: 20 }}>🌾</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: '#f0c040', marginBottom: 12 }}>الحصاد الأسري</div>
                <div style={{ fontSize: 15, color: '#64748b', lineHeight: 1.8, marginBottom: 12 }}>نتائج البرنامج عبر الأسابيع الثلاثة</div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 44 }}>
                  {[{ icon: '👤', val: students.length, label: 'طالب' }, { icon: '👨‍👩‍👦', val: families.length, label: 'أسرة' }].map(k => (
                    <div key={k.label} style={{ background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.15)', borderRadius: 14, padding: '14px 20px', textAlign: 'center', minWidth: 90 }}>
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

        {section === 'w1' && weekEnabled.week1 && <WeekSection weekNum={1} students={students} phase={weekPhase[1]} revealed={weekRevealed[1]} onStart={goNext} onNext={goNext} />}
        {section === 'w2' && weekEnabled.week2 && <WeekSection weekNum={2} students={students} phase={weekPhase[2]} revealed={weekRevealed[2]} onStart={goNext} onNext={goNext} />}
        {section === 'w3' && weekEnabled.week3 && <WeekSection weekNum={3} students={students} phase={weekPhase[3]} revealed={weekRevealed[3]} onStart={goNext} onNext={goNext} />}

        {section === 'total' && <TotalSection students={students} maxScore={maxPossibleScore} phase={totalPhase} revealed={totalRevealed} onStart={goNext} onNext={goNext} />}

        {activeFw && <FamilyWeekSection families={families} weekNum={fwWeekNum(activeFw)} phase={familyPhase[activeFw]} revealed={familyRevealed[activeFw]} onStart={goNext} onNext={goNext} isLastFw={activeFw === lastFwSection} />}

        {section === 'final' && (
          <FinalSection
            families={sortedFamilies}
            finalPhase={finalPhase}
            suspenseCount={suspenseCount}
            onGoHifz={() => setSection('hifz')}
            hasHifz={hifzSorted.length > 0}
          />
        )}

        {section === 'hifz' && <HifzSection memorizations={memorizations} phase={hifzPhase} revealed={hifzRevealed} onStart={goNext} />}

      </main>
    </div>
  )
}
