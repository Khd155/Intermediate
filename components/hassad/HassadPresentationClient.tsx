'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { DashboardData, StudentData, FamilyStats } from '@/lib/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const WEEK_MAX: Record<number, number> = { 1: 2700, 2: 2800, 3: 2800 }
const WEEK_LABEL: Record<number, string> = { 1: 'الأول', 2: 'الثاني', 3: 'الثالث' }

// ─── Section types ────────────────────────────────────────────────────────────

interface SectionDef {
  id: string
  navLabel: string
  type: 'hero' | 'stats' | 'week' | 'total' | 'families' | 'closing'
  weekNum?: 1 | 2 | 3
  itemCount: number
}

function buildSections(data: DashboardData): SectionDef[] {
  const { students, families, weekEnabled } = data
  const s: SectionDef[] = []
  s.push({ id: 'hero',     type: 'hero',     navLabel: 'البداية',    itemCount: 0 })
  s.push({ id: 'stats',    type: 'stats',    navLabel: 'الإنجازات',  itemCount: 4 })
  if (weekEnabled.week1) s.push({ id: 'week1', type: 'week', weekNum: 1, navLabel: 'أسبوع ١', itemCount: students.length })
  if (weekEnabled.week2) s.push({ id: 'week2', type: 'week', weekNum: 2, navLabel: 'أسبوع ٢', itemCount: students.length })
  if (weekEnabled.week3) s.push({ id: 'week3', type: 'week', weekNum: 3, navLabel: 'أسبوع ٣', itemCount: students.length })
  s.push({ id: 'total',    type: 'total',    navLabel: 'الكلي',      itemCount: students.length })
  s.push({ id: 'families', type: 'families', navLabel: 'الأسر',      itemCount: families.length })
  s.push({ id: 'closing',  type: 'closing',  navLabel: 'الختام',     itemCount: 3 })
  return s
}

// ─── Entry animation wrapper ──────────────────────────────────────────────────

function RevealItem({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 40)
    return () => clearTimeout(t)
  }, [])
  return (
    <div style={{
      opacity: show ? 1 : 0,
      transform: show ? 'none' : 'translateY(14px)',
      transition: 'opacity 0.45s ease, transform 0.45s ease',
    }}>
      {children}
    </div>
  )
}

// ─── Medal badge ──────────────────────────────────────────────────────────────

function MedalBadge({ rank }: { rank: number }) {
  const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null
  return (
    <div style={{
      width: 42, height: 42, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      fontSize: emoji ? 22 : 14, fontWeight: 700,
      background: rank === 1 ? 'rgba(234,179,8,0.14)' : rank === 2 ? 'rgba(148,163,184,0.1)' : rank === 3 ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.05)',
      border: `1px solid ${rank === 1 ? 'rgba(234,179,8,0.3)' : rank === 2 ? 'rgba(148,163,184,0.2)' : rank === 3 ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.07)'}`,
      color: rank === 1 ? '#fbbf24' : rank === 2 ? '#94a3b8' : rank === 3 ? '#fb923c' : '#64748b',
    }}>
      {emoji ?? rank}
    </div>
  )
}

function pctColor(p: number) {
  return p >= 85 ? '#22c55e' : p >= 65 ? '#d4a017' : p >= 45 ? '#f97316' : '#ef4444'
}

// ─── Student row ──────────────────────────────────────────────────────────────

function StudentRow({ student, rank, score, maxScore }: {
  student: StudentData; rank: number; score: number; maxScore: number
}) {
  const pct = maxScore > 0 ? Math.min(100, Math.round(score / maxScore * 100)) : 0
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: rank <= 3 ? `rgba(212,160,23,${0.1 - (rank - 1) * 0.025})` : 'rgba(255,255,255,0.03)',
      border: `1px solid rgba(212,160,23,${rank <= 3 ? 0.25 : 0.08})`,
      borderRadius: 12, padding: '11px 16px', marginBottom: 8,
    }}>
      <MedalBadge rank={rank} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>{student.name}</span>
          <span style={{ fontSize: 11, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', borderRadius: 99, padding: '1px 8px', flexShrink: 0 }}>
            {student.family}
          </span>
        </div>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pctColor(pct), borderRadius: 99, transition: 'width 0.8s ease' }} />
        </div>
      </div>
      <div style={{ textAlign: 'left', flexShrink: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#f0c040', lineHeight: 1 }}>{score.toLocaleString('ar-SA')}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{pct}%</div>
      </div>
    </div>
  )
}

// ─── Family row ───────────────────────────────────────────────────────────────

function FamilyRow({ family, rank }: { family: FamilyStats; rank: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: rank <= 3 ? `rgba(212,160,23,${0.1 - (rank - 1) * 0.025})` : 'rgba(255,255,255,0.03)',
      border: `1px solid rgba(212,160,23,${rank <= 3 ? 0.25 : 0.08})`,
      borderRadius: 12, padding: '14px 16px', marginBottom: 10,
    }}>
      <MedalBadge rank={rank} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#e2e8f0', marginBottom: 4 }}>{family.name}</div>
        <div style={{ fontSize: 12, color: '#64748b' }}>{family.count} طالب · متوسط {family.average} درجة</div>
      </div>
      <div style={{ textAlign: 'left', flexShrink: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#f0c040' }}>{family.total.toLocaleString('ar-SA')}</div>
        <div style={{ fontSize: 11, color: '#64748b' }}>إجمالي</div>
      </div>
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroContent({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '0 24px', userSelect: 'none' }}>
      <div style={{ fontSize: 60, marginBottom: 20, lineHeight: 1 }}>🌾</div>
      <div style={{
        display: 'inline-block', fontSize: 11, color: '#d4a017', letterSpacing: 3,
        border: '1px solid rgba(212,160,23,0.3)', borderRadius: 99, padding: '4px 18px', marginBottom: 22,
        textTransform: 'uppercase',
      }}>
        البرنامج الأسري • 1447هـ
      </div>
      <h1 style={{ fontSize: 'clamp(34px,8vw,72px)', fontWeight: 900, color: '#f0f0e0', margin: '0 0 12px', lineHeight: 1.1 }}>
        الحصاد الأسري
      </h1>
      <p style={{ fontSize: 17, color: '#94a3b8', marginBottom: 44 }}>نتائج وترتيبات البرنامج</p>
      <button onClick={onStart} style={{
        background: 'linear-gradient(135deg, #d4a017, #f0c040)',
        border: 'none', borderRadius: 14, padding: '15px 40px',
        fontSize: 16, fontWeight: 800, color: '#0a0f1e', cursor: 'pointer',
        boxShadow: '0 6px 28px rgba(212,160,23,0.35)', letterSpacing: 0.5,
      }}>
        اكتشف الحصاد ↓
      </button>
    </div>
  )
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function StatsContent({ data, revealed }: { data: DashboardData; revealed: number }) {
  const { students, families, weekEnabled } = data
  const totalScore = students.reduce((s, st) => s + st.total, 0)
  const enabledWeeks = [weekEnabled.week1, weekEnabled.week2, weekEnabled.week3].filter(Boolean).length
  const topStudent = [...students].sort((a, b) => b.total - a.total)[0]
  const topFamily  = [...families].sort((a, b)  => b.total - a.total)[0]

  const cards = [
    { icon: '👥', label: 'إجمالي الطلاب',   value: String(students.length),              sub: `في ${enabledWeeks} أسابيع` },
    { icon: '📊', label: 'مجموع الدرجات',   value: totalScore.toLocaleString('ar-SA'),   sub: 'لجميع الطلاب' },
    { icon: '🥇', label: 'أفضل طالب',       value: topStudent?.name ?? '—',              sub: topStudent ? `${topStudent.total} درجة` : undefined },
    { icon: '🏆', label: 'أفضل أسرة',       value: topFamily?.name ?? '—',               sub: topFamily ? `${topFamily.total} درجة إجمالي` : undefined },
  ]

  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <SectionHeader badge="الإنجازات" title="ملخص الحصاد" />
      {cards.slice(0, revealed).map((card, i) => (
        <RevealItem key={i}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.15)',
            borderRadius: 16, padding: '18px 22px', marginBottom: 12,
          }}>
            <span style={{ fontSize: 32, flexShrink: 0 }}>{card.icon}</span>
            <div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 3 }}>{card.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#f0c040' }}>{card.value}</div>
              {card.sub && <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{card.sub}</div>}
            </div>
          </div>
        </RevealItem>
      ))}
    </div>
  )
}

// ─── Rankings (week or total) ─────────────────────────────────────────────────

function RankingContent({ data, section, revealed }: {
  data: DashboardData; section: SectionDef; revealed: number
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const isWeek   = section.type === 'week'
  const weekNum  = section.weekNum
  const weekKey  = weekNum ? (`week${weekNum}` as keyof StudentData) : null
  const weekMax  = weekNum ? WEEK_MAX[weekNum] : data.maxPossibleScore
  const weekLabel = weekNum ? WEEK_LABEL[weekNum] : ''

  const sorted = isWeek && weekKey
    ? [...data.students].sort((a, b) => (b[weekKey] as number) - (a[weekKey] as number))
    : [...data.students].sort((a, b) => b.total - a.total)

  useEffect(() => {
    const el = contentRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [revealed])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 600, height: '100%' }}>
      <SectionHeader
        badge={isWeek ? `الأسبوع ${weekLabel}` : 'الإجمالي'}
        title={isWeek ? `ترتيب الأسبوع ${weekLabel}` : 'الترتيب الكلي'}
        sub={isWeek ? `الحد الأقصى: ${weekMax.toLocaleString('ar-SA')} درجة` : 'مجموع جميع الأسابيع'}
      />
      <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        {sorted.slice(0, revealed).map((student, i) => {
          const score = (weekKey ? student[weekKey] : student.total) as number
          return (
            <RevealItem key={student.name}>
              <StudentRow student={student} rank={i + 1} score={score} maxScore={weekMax} />
            </RevealItem>
          )
        })}
      </div>
    </div>
  )
}

// ─── Families ─────────────────────────────────────────────────────────────────

function FamiliesContent({ data, revealed }: { data: DashboardData; revealed: number }) {
  const sorted = [...data.families].sort((a, b) => b.total - a.total)
  const contentRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = contentRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [revealed])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 560, height: '100%' }}>
      <SectionHeader badge="الأسر" title="ترتيب الأسر" />
      <div ref={contentRef} style={{ flex: 1, overflowY: 'auto' }}>
        {sorted.slice(0, revealed).map((family, i) => (
          <RevealItem key={family.name}>
            <FamilyRow family={family} rank={i + 1} />
          </RevealItem>
        ))}
      </div>
    </div>
  )
}

// ─── Closing ──────────────────────────────────────────────────────────────────

function ClosingContent({ data, revealed }: { data: DashboardData; revealed: number }) {
  const students  = data.students
  const totalScore = students.reduce((s, st) => s + st.total, 0)
  const topStudent = [...students].sort((a, b) => b.total - a.total)[0]

  return (
    <div style={{ textAlign: 'center', maxWidth: 540, padding: '0 24px' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🌟</div>
      <h2 style={{ fontSize: 'clamp(24px,5vw,44px)', fontWeight: 900, color: '#f0f0e0', marginBottom: 8 }}>
        حصادٌ طيّب
      </h2>
      <p style={{ fontSize: 15, color: '#64748b', marginBottom: 32 }}>في برنامج أسري مثمر</p>

      {revealed >= 1 && (
        <RevealItem key="stats">
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap', marginBottom: 28 }}>
            {[
              { num: students.length,                  label: 'طالب مشارك' },
              { num: totalScore.toLocaleString('ar-SA'), label: 'درجة إجمالي' },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 38, fontWeight: 900, color: '#f0c040' }}>{item.num}</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </RevealItem>
      )}

      {revealed >= 2 && topStudent && (
        <RevealItem key="top">
          <div style={{
            background: 'rgba(212,160,23,0.07)', border: '1px solid rgba(212,160,23,0.2)',
            borderRadius: 14, padding: '16px 24px', marginBottom: 20,
          }}>
            <div style={{ fontSize: 12, color: '#d4a017', letterSpacing: 2, marginBottom: 6 }}>الطالب الأول</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f0f0e0' }}>🥇 {topStudent.name}</div>
            <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>{topStudent.total.toLocaleString('ar-SA')} درجة</div>
          </div>
        </RevealItem>
      )}

      {revealed >= 3 && (
        <RevealItem key="quote">
          <p style={{
            fontSize: 15, color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.8,
            borderRight: '3px solid rgba(212,160,23,0.3)', paddingRight: 16,
            textAlign: 'right', margin: 0,
          }}>
            "كل بذرة جهدٍ زُرعت هذا البرنامج، ستُثمر في قلوب طلابنا على مر السنين"
          </p>
        </RevealItem>
      )}
    </div>
  )
}

// ─── Section header helper ────────────────────────────────────────────────────

function SectionHeader({ badge, title, sub }: { badge: string; title: string; sub?: string }) {
  return (
    <div style={{ textAlign: 'center', paddingBottom: 24, flexShrink: 0 }}>
      <div style={{ fontSize: 11, letterSpacing: 3, color: '#d4a017', marginBottom: 8, textTransform: 'uppercase' }}>{badge}</div>
      <h2 style={{ fontSize: 'clamp(20px,4vw,30px)', fontWeight: 800, color: '#f0f0e0', margin: 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: 13, color: '#64748b', marginTop: 6, marginBottom: 0 }}>{sub}</p>}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HassadPresentationClient({ data }: { data: DashboardData }) {
  const sections = buildSections(data)
  const [sIdx, setSIdx] = useState(0)
  const [revealed, setRevealed] = useState<number[]>(() => sections.map(() => 0))

  const section    = sections[sIdx]
  const revCount   = revealed[sIdx]
  const totalItems = section.itemCount
  const isAtEnd    = sIdx === sections.length - 1 && revCount >= totalItems
  const isAtStart  = sIdx === 0

  const goNext = useCallback(() => {
    if (revCount < totalItems) {
      setRevealed(r => r.map((v, i) => i === sIdx ? v + 1 : v))
    } else if (sIdx < sections.length - 1) {
      setSIdx(i => i + 1)
    }
  }, [sIdx, revCount, totalItems, sections.length])

  const goBack = useCallback(() => {
    if (revCount > 0) {
      setRevealed(r => r.map((v, i) => i === sIdx ? v - 1 : v))
    } else if (sIdx > 0) {
      setSIdx(i => i - 1)
    }
  }, [sIdx, revCount])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowDown', ' '].includes(e.key)) { e.preventDefault(); goNext() }
      if (['ArrowLeft', 'ArrowUp'].includes(e.key)) { e.preventDefault(); goBack() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goBack])

  const nextLabel = isAtEnd ? null : revCount < totalItems ? 'التالي ←' : 'القسم التالي ←'

  const renderContent = () => {
    switch (section.type) {
      case 'hero':     return <HeroContent onStart={goNext} />
      case 'stats':    return <StatsContent data={data} revealed={revCount} />
      case 'week':     return <RankingContent data={data} section={section} revealed={revCount} />
      case 'total':    return <RankingContent data={data} section={section} revealed={revCount} />
      case 'families': return <FamiliesContent data={data} revealed={revCount} />
      case 'closing':  return <ClosingContent data={data} revealed={revCount} />
    }
  }

  const btnBase: React.CSSProperties = {
    position: 'fixed', bottom: 24, zIndex: 200,
    borderRadius: 12, padding: '12px 26px',
    fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
    transition: 'opacity 0.2s',
  }

  return (
    <div dir="rtl" style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse at 50% 0%, #12192e 0%, #0a0f1e 65%)',
      fontFamily: '"Tajawal", "Cairo", sans-serif',
      overflow: 'hidden', color: '#e2e8f0',
    }}>

      {/* Back to dashboard */}
      <Link href="/dashboard" style={{
        position: 'fixed', top: 18, right: 18, zIndex: 200,
        display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none',
        color: '#475569', fontSize: 13,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 8, padding: '6px 12px',
      }}>
        ← لوحة المتابعة
      </Link>

      {/* Section content */}
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        justifyContent: section.type === 'hero' ? 'center' : 'flex-start',
        paddingTop: section.type === 'hero' ? 0 : 72,
        paddingBottom: 90,
        paddingLeft: 32, paddingRight: 48,
        overflow: 'hidden',
      }}>
        {renderContent()}
      </div>

      {/* Nav dots */}
      <div style={{
        position: 'fixed', left: 14, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 10, zIndex: 200,
      }}>
        {sections.map((s, i) => (
          <button key={s.id} title={s.navLabel} onClick={() => setSIdx(i)} style={{
            width: i === sIdx ? 10 : 7, height: i === sIdx ? 10 : 7,
            borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
            background: i === sIdx ? '#d4a017' : i < sIdx ? 'rgba(212,160,23,0.35)' : 'rgba(255,255,255,0.1)',
            transition: 'all 0.3s',
          }} />
        ))}
      </div>

      {/* Progress counter */}
      <div style={{
        position: 'fixed', bottom: 34, left: '50%', transform: 'translateX(-50%)',
        fontSize: 12, color: '#1e293b', zIndex: 200, whiteSpace: 'nowrap', userSelect: 'none',
      }}>
        {sIdx + 1} / {sections.length}
        {totalItems > 0 && ` · ${revCount} / ${totalItems}`}
      </div>

      {/* Back button */}
      {!isAtStart && (
        <button onClick={goBack} style={{
          ...btnBase, right: 20,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#64748b',
        }}>
          ← رجوع
        </button>
      )}

      {/* Next button */}
      {nextLabel && (
        <button onClick={goNext} style={{
          ...btnBase, left: 20,
          background: 'rgba(212,160,23,0.12)', border: '1px solid rgba(212,160,23,0.35)',
          color: '#f0c040', fontWeight: 700,
          boxShadow: '0 2px 14px rgba(212,160,23,0.15)',
        }}>
          {nextLabel}
        </button>
      )}

      {/* End state — back to dashboard */}
      {isAtEnd && (
        <Link href="/dashboard" style={{
          ...btnBase, left: 20,
          background: 'rgba(212,160,23,0.12)', border: '1px solid rgba(212,160,23,0.35)',
          color: '#f0c040', textDecoration: 'none', fontWeight: 700,
        }}>
          العودة للوحة ←
        </Link>
      )}
    </div>
  )
}
