'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { DashboardData, StudentData, FamilyStats, WeekEnabled } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const STUDENT_DELAY = 2000
const WEEK_MAX: Record<number, number> = { 1: 2700, 2: 2900, 3: 2300 }
const WEEK_LABEL: Record<number, string> = { 1: 'الأول', 2: 'الثاني', 3: 'الثالث' }
const WEEK_ICON: Record<number, string> = { 1: '🌱', 2: '🌿', 3: '🌾' }

type Section = 'w1' | 'w2' | 'w3' | 'total' | 'fw1' | 'fw2' | 'fw3' | 'final'

const SECTION_LABELS: Record<Section, string> = {
  w1: '🌱 أسبوع ١', w2: '🌿 أسبوع ٢', w3: '🌾 أسبوع ٣',
  total: '🏅 الإجمالي',
  fw1: '👨‍👩‍👦 أسر — أسبوع ١', fw2: '👨‍👩‍👦 أسر — أسبوع ٢', fw3: '👨‍👩‍👦 أسر — أسبوع ٣',
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

const CONFETTI = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: `${(i * 37 + 5) % 100}%`,
  delay: `${(i * 0.12) % 2.5}s`,
  dur: `${2.2 + (i * 0.08) % 2}s`,
  emoji: ['🎉', '⭐', '✨', '🎊', '💫', '🌟', '🎈', '🏆'][i % 8],
}))

// ─── FadeIn ───────────────────────────────────────────────────────────────────

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 40 + delay)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <div style={{
      opacity: show ? 1 : 0,
      transform: show ? 'none' : 'translateY(20px)',
      transition: 'opacity 0.45s ease, transform 0.45s ease',
    }}>
      {children}
    </div>
  )
}

// ─── ScoreBar ─────────────────────────────────────────────────────────────────

function ScoreBar({ pct, color }: { pct: number; color: string }) {
  const [w, setW] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setW(pct), 120)
    return () => clearTimeout(t)
  }, [pct])
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
  const pct = maxScore > 0 ? Math.min(100, Math.round(score / maxScore * 100)) : 0
  const m = medalEmoji(rank)
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
        fontFamily: 'inherit', boxShadow: '0 4px 28px rgba(212,160,23,0.45)',
        letterSpacing: 0.5, transition: 'transform 0.15s',
      }}>
        {label}
      </button>
    </div>
  )
}

// ─── Week section ─────────────────────────────────────────────────────────────

function WeekSection({ weekNum, students, revealed, onNext }: {
  weekNum: 1 | 2 | 3; students: StudentData[]; revealed: number; onNext: () => void
}) {
  const scoreKey = `week${weekNum}` as keyof StudentData
  const maxScore = WEEK_MAX[weekNum]
  const sorted = useMemo(() =>
    [...students].sort((a, b) => (b[scoreKey] as number) - (a[scoreKey] as number)),
    [students, scoreKey]
  )
  const ref = useRef<HTMLDivElement>(null)
  const allDone = revealed >= sorted.length && sorted.length > 0

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' })
  }, [revealed])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{
        padding: '16px 22px', flexShrink: 0,
        background: 'rgba(212,160,23,0.04)', borderBottom: '1px solid rgba(212,160,23,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <span style={{ fontSize: 30 }}>{WEEK_ICON[weekNum]}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#f0f0e0' }}>الأسبوع {WEEK_LABEL[weekNum]}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {sorted.length} طالب · {maxScore.toLocaleString('ar-SA')} درجة قصوى
            </div>
          </div>
          {allDone && <span style={{ fontSize: 20 }}>✅</span>}
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: allDone ? '#22c55e' : '#d4a017',
            width: `${sorted.length > 0 ? Math.min(100, (revealed / sorted.length) * 100) : 0}%`,
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>
      <div ref={ref} style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {sorted.slice(0, revealed).map((s, i) => (
          <StudentCard key={s.name} student={s} rank={i + 1}
            score={s[scoreKey] as number} maxScore={maxScore} />
        ))}
        {!allDone && revealed > 0 && (
          <div style={{ textAlign: 'center', color: '#334155', fontSize: 13, padding: '14px 0' }}>
            ⏳ الطالب التالي خلال ثانيتين…
          </div>
        )}
      </div>
      <NextButton onNext={onNext} />
    </div>
  )
}

// ─── Total section ────────────────────────────────────────────────────────────

function TotalSection({ students, maxScore, revealed, onNext }: {
  students: StudentData[]; maxScore: number; revealed: number; onNext: () => void
}) {
  const sorted = useMemo(() => [...students].sort((a, b) => b.total - a.total), [students])
  const ref = useRef<HTMLDivElement>(null)
  const allDone = revealed >= sorted.length && sorted.length > 0

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' })
  }, [revealed])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{
        padding: '16px 22px', flexShrink: 0,
        background: 'rgba(212,160,23,0.04)', borderBottom: '1px solid rgba(212,160,23,0.08)',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <span style={{ fontSize: 30 }}>🏅</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#f0f0e0' }}>الترتيب الكلي</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            مجموع الأسابيع · {maxScore.toLocaleString('ar-SA')} درجة قصوى
          </div>
        </div>
        {allDone && <span style={{ fontSize: 20 }}>✅</span>}
      </div>
      <div ref={ref} style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {sorted.slice(0, revealed).map((s, i) => (
          <StudentCard key={s.name} student={s} rank={i + 1} score={s.total} maxScore={maxScore} />
        ))}
        {!allDone && revealed > 0 && (
          <div style={{ textAlign: 'center', color: '#334155', fontSize: 13, padding: '14px 0' }}>⏳…</div>
        )}
      </div>
      <NextButton onNext={onNext} />
    </div>
  )
}

// ─── Family overlay (fullscreen) ──────────────────────────────────────────────

function FamilyOverlay({ family, weekNum, onClose }: {
  family: FamilyStats; weekNum: 1 | 2 | 3; onClose: () => void
}) {
  const weekScore = weekNum === 1 ? family.week1 : weekNum === 2 ? family.week2 : family.week3
  const eval_ = weekNum === 1 ? family.w1Eval : weekNum === 2 ? family.w2Eval : family.w3Eval
  const m = medalEmoji(family.rank)

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(3,6,16,0.96)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'linear-gradient(160deg, #0d1526, #1b2240)',
        border: '1.5px solid rgba(212,160,23,0.35)',
        borderRadius: 26, padding: '40px 32px', maxWidth: 440, width: '100%',
        textAlign: 'center', position: 'relative',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, left: 16,
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', border: 'none',
          color: '#64748b', fontSize: 16, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>

        <div style={{ fontSize: m ? 56 : 40, marginBottom: 10 }}>{m ?? `#${family.rank}`}</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#f0f0e0', marginBottom: 4 }}>{family.name}</div>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 28 }}>
          {WEEK_ICON[weekNum]} الأسبوع {WEEK_LABEL[weekNum]}
        </div>

        <div style={{
          background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.22)',
          borderRadius: 18, padding: '18px 24px', marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, color: '#d4a017', letterSpacing: 2, marginBottom: 8 }}>مجموع الأسبوع</div>
          <div style={{ fontSize: 52, fontWeight: 900, color: '#f0c040', lineHeight: 1 }}>
            {weekScore.toLocaleString('ar-SA')}
          </div>
        </div>

        {eval_ && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[
              { label: 'رياضي', icon: '⚽', val: eval_.athletic, color: '#38bdf8' },
              { label: 'شعبيات', icon: '🎵', val: eval_.popular, color: '#fb923c' },
              { label: 'ثقافي', icon: '🧠', val: eval_.cultural, color: '#a78bfa' },
            ].map(r => (
              <div key={r.label} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '14px 8px',
              }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{r.icon}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{r.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: r.val > 0 ? r.color : '#334155' }}>
                  {r.val.toLocaleString('ar-SA')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Families section ─────────────────────────────────────────────────────────

function FamiliesSection({ families, section, onNext, isLast }: {
  families: FamilyStats[]; section: 'fw1' | 'fw2' | 'fw3'; onNext: () => void; isLast: boolean
}) {
  const [openFamily, setOpenFamily] = useState<string | null>(null)
  const weekNum: 1 | 2 | 3 = section === 'fw1' ? 1 : section === 'fw2' ? 2 : 3

  const sorted = useMemo(() =>
    [...families].sort((a, b) => {
      const as_ = weekNum === 1 ? a.week1 : weekNum === 2 ? a.week2 : a.week3
      const bs_ = weekNum === 1 ? b.week1 : weekNum === 2 ? b.week2 : b.week3
      return bs_ - as_
    }),
    [families, weekNum]
  )

  const openFamilyData = openFamily ? families.find(f => f.name === openFamily) ?? null : null

  return (
    <>
      {openFamilyData && (
        <FamilyOverlay family={openFamilyData} weekNum={weekNum} onClose={() => setOpenFamily(null)} />
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{
          padding: '16px 22px', flexShrink: 0,
          background: 'rgba(212,160,23,0.04)', borderBottom: '1px solid rgba(212,160,23,0.08)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span style={{ fontSize: 30 }}>👨‍👩‍👦</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#f0f0e0' }}>
              حصاد الأسر — الأسبوع {WEEK_LABEL[weekNum]}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>اضغط على أسرة لعرض تفاصيلها</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 20px' }}>
          {sorted.map((f, i) => {
            const weekScore = weekNum === 1 ? f.week1 : weekNum === 2 ? f.week2 : f.week3
            const m = medalEmoji(i + 1)
            return (
              <FadeIn key={f.name} delay={i * 120}>
                <button onClick={() => setOpenFamily(f.name)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 20,
                  background: i === 0 ? 'rgba(212,160,23,0.09)' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid rgba(212,160,23,${i === 0 ? 0.3 : 0.1})`,
                  borderRadius: 24, padding: '22px 26px', marginBottom: 18,
                  cursor: 'pointer', color: 'inherit', fontFamily: 'inherit', textAlign: 'right',
                  boxShadow: i === 0 ? '0 4px 24px rgba(212,160,23,0.12)' : 'none',
                  transition: 'transform 0.18s, box-shadow 0.18s',
                }}>
                  <div style={{
                    width: 62, height: 62, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: m ? 30 : 18, fontWeight: 700,
                    background: m ? 'rgba(212,160,23,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `2px solid rgba(212,160,23,${m ? 0.3 : 0.08})`,
                  }}>
                    {m ?? (i + 1)}
                  </div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#f0f0e0', marginBottom: 4 }}>{f.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>اضغط للتفاصيل ↗</div>
                  </div>
                  <div style={{ textAlign: 'left', flexShrink: 0 }}>
                    <div style={{ fontSize: 30, fontWeight: 900, color: '#f0c040' }}>
                      {weekScore.toLocaleString('ar-SA')}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>درجة</div>
                  </div>
                </button>
              </FadeIn>
            )
          })}
        </div>

        <NextButton onNext={onNext} label={isLast ? 'إعلان الفائزة 🏆' : 'الأسبوع التالي ←'} />
      </div>
    </>
  )
}

// ─── Celebration ──────────────────────────────────────────────────────────────

function Celebration({ winner, onDone }: { winner: FamilyStats; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 5500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'radial-gradient(ellipse at 50% 30%, #1e1200 0%, #080d1e 70%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes rise-up { from { transform: translateY(110vh) scale(0.6); opacity: 1 } to { transform: translateY(-15vh) scale(1.1); opacity: 0 } }
        @keyframes winner-glow { 0%,100%{text-shadow:0 0 40px rgba(251,191,36,0.5);transform:scale(1)} 50%{text-shadow:0 0 90px rgba(251,191,36,0.95);transform:scale(1.06)} }
        @keyframes trophy-float { 0%,100%{transform:translateY(0) rotate(-4deg)} 50%{transform:translateY(-18px) rotate(4deg)} }
      `}</style>

      {CONFETTI.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: p.left, bottom: '-5%',
          fontSize: `${18 + (p.id % 4) * 7}px`,
          animation: `rise-up ${p.dur} ${p.delay} ease-out both`,
          pointerEvents: 'none', userSelect: 'none',
        }}>
          {p.emoji}
        </div>
      ))}

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 10, padding: '0 32px' }}>
        <div style={{ fontSize: 90, animation: 'trophy-float 1.3s ease-in-out infinite', marginBottom: 20 }}>🏆</div>
        <div style={{ fontSize: 17, color: '#d4a017', letterSpacing: 3, marginBottom: 14, fontWeight: 600 }}>
          🎉 الفائزة بالحصاد الأسري 🎉
        </div>
        <div style={{
          fontSize: 44, fontWeight: 900, color: '#fbbf24', marginBottom: 12,
          animation: 'winner-glow 1.8s ease-in-out infinite',
        }}>
          {winner.name}
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#f0c040' }}>
          {winner.total.toLocaleString('ar-SA')} درجة
        </div>
      </div>

      <button onClick={onDone} style={{
        position: 'absolute', bottom: 36,
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 999, padding: '12px 36px', color: '#94a3b8',
        fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
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
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', overflowY: 'auto',
    }}>
      <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <FadeIn>
          <div style={{ fontSize: 72, marginBottom: 16 }}>🏆</div>
          <div style={{ fontSize: 14, color: '#d4a017', letterSpacing: 2, marginBottom: 10 }}>
            الفائزة بالحصاد الأسري
          </div>
          <div style={{ fontSize: 38, fontWeight: 900, color: '#fbbf24', marginBottom: 8 }}>
            {winner?.name}
          </div>
          <div style={{ fontSize: 22, color: '#f0c040', marginBottom: 40 }}>
            {winner?.total.toLocaleString('ar-SA')} درجة
          </div>
        </FadeIn>

        <div style={{ textAlign: 'right', width: '100%' }}>
          {sorted.map((f, i) => (
            <FadeIn key={f.name} delay={200 + i * 180}>
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

// ─── Nav menu ─────────────────────────────────────────────────────────────────

function NavMenu({ section, sequence, goTo }: {
  section: Section; sequence: Section[]; goTo: (s: Section) => void
}) {
  const [open, setOpen] = useState(false)
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
            position: 'absolute', top: 48, left: 0,
            background: '#0e1422', border: '1px solid rgba(212,160,23,0.2)',
            borderRadius: 14, padding: '8px 0', minWidth: 215,
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)', zIndex: 99,
          }}>
            {sequence.map(s => (
              <button key={s} onClick={() => { goTo(s); setOpen(false) }} style={{
                width: '100%', display: 'block', padding: '11px 18px',
                background: s === section ? 'rgba(212,160,23,0.12)' : 'transparent',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                color: s === section ? '#f0c040' : '#94a3b8',
                fontSize: 14, textAlign: 'right',
                fontWeight: s === section ? 700 : 400,
              }}>
                {SECTION_LABELS[s]}
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
  const [section, setSection] = useState<Section>(sequence[0])
  const [showCelebration, setShowCelebration] = useState(false)
  const [weekRevealed, setWeekRevealed] = useState<Record<1 | 2 | 3, number>>({ 1: 0, 2: 0, 3: 0 })
  const [totalRevealed, setTotalRevealed] = useState(0)

  const sortedByWeek = useMemo(() => ({
    1: [...students].sort((a, b) => b.week1 - a.week1),
    2: [...students].sort((a, b) => b.week2 - a.week2),
    3: [...students].sort((a, b) => b.week3 - a.week3),
  }), [students])
  const sortedByTotal = useMemo(() => [...students].sort((a, b) => b.total - a.total), [students])

  // Auto-reveal weeks
  const activeWeekNum: 1 | 2 | 3 | null = section === 'w1' ? 1 : section === 'w2' ? 2 : section === 'w3' ? 3 : null
  useEffect(() => {
    if (!activeWeekNum) return
    const total = sortedByWeek[activeWeekNum].length
    if (weekRevealed[activeWeekNum] >= total) return
    const delay = weekRevealed[activeWeekNum] === 0 ? 400 : STUDENT_DELAY
    const t = setTimeout(() =>
      setWeekRevealed(prev => ({ ...prev, [activeWeekNum]: prev[activeWeekNum] + 1 }))
    , delay)
    return () => clearTimeout(t)
  }, [section, weekRevealed, activeWeekNum, sortedByWeek])

  // Auto-reveal total
  useEffect(() => {
    if (section !== 'total') return
    if (totalRevealed >= sortedByTotal.length) return
    const delay = totalRevealed === 0 ? 400 : STUDENT_DELAY
    const t = setTimeout(() => setTotalRevealed(n => n + 1), delay)
    return () => clearTimeout(t)
  }, [section, totalRevealed, sortedByTotal.length])

  const goNext = useCallback(() => {
    const idx = sequence.indexOf(section)
    if (idx < 0 || idx >= sequence.length - 1) return
    const next = sequence[idx + 1]
    if (next === 'final') {
      setShowCelebration(true)
    } else {
      setSection(next)
    }
  }, [section, sequence])

  const goTo = useCallback((s: Section) => setSection(s), [])

  const fwSections = sequence.filter(s => s === 'fw1' || s === 'fw2' || s === 'fw3')
  const lastFwSection = fwSections[fwSections.length - 1]
  const isFamilySection = section === 'fw1' || section === 'fw2' || section === 'fw3'

  const winnerFamily = useMemo(() =>
    [...families].sort((a, b) => b.total - a.total)[0],
    [families]
  )

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

      {showCelebration && winnerFamily && (
        <Celebration winner={winnerFamily} onDone={() => { setShowCelebration(false); setSection('final') }} />
      )}

      <header style={{
        flexShrink: 0, height: 54,
        background: 'rgba(10,15,30,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(212,160,23,0.1)',
        display: 'flex', alignItems: 'center', paddingRight: 16, paddingLeft: 16, gap: 12,
      }}>
        <NavMenu section={section} sequence={sequence} goTo={goTo} />
        <div style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#d4a017' }}>
          🌾 الحصاد الأسري
        </div>
        <div style={{ fontSize: 12, color: '#334155', flexShrink: 0 }}>
          {sequence.indexOf(section) + 1} / {sequence.length}
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {section === 'w1' && weekEnabled.week1 && (
          <WeekSection weekNum={1} students={students} revealed={weekRevealed[1]} onNext={goNext} />
        )}
        {section === 'w2' && weekEnabled.week2 && (
          <WeekSection weekNum={2} students={students} revealed={weekRevealed[2]} onNext={goNext} />
        )}
        {section === 'w3' && weekEnabled.week3 && (
          <WeekSection weekNum={3} students={students} revealed={weekRevealed[3]} onNext={goNext} />
        )}
        {section === 'total' && (
          <TotalSection students={students} maxScore={maxPossibleScore} revealed={totalRevealed} onNext={goNext} />
        )}
        {isFamilySection && (
          <FamiliesSection
            families={families}
            section={section as 'fw1' | 'fw2' | 'fw3'}
            onNext={goNext}
            isLast={section === lastFwSection}
          />
        )}
        {section === 'final' && <FinalSection families={families} />}
      </main>
    </div>
  )
}
