'use client'

import { useState, useEffect } from 'react'
import { DashboardData } from '@/lib/types'
import { HassadDashboard } from './HassadDashboard'

function LoadingScreen() {
  return (
    <div dir="rtl" style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse at 50% 0%, #12192e 0%, #0a0f1e 65%)',
      fontFamily: '"Tajawal", "Cairo", sans-serif',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: '#e2e8f0',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 72, marginBottom: 28, animation: 'spin 2s linear infinite' }}>🌾</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#f0c040', marginBottom: 12 }}>
          الحصاد الأسري
        </div>
        <div style={{ fontSize: 14, color: '#475569', marginBottom: 36 }}>
          جاري تحميل البيانات…
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: '50%',
              background: '#d4a017',
              animation: `dot-bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
            }} />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes spin        { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes dot-bounce  { 0%,100% { transform: translateY(0); opacity: 0.3 } 50% { transform: translateY(-10px); opacity: 1 } }
      `}</style>
    </div>
  )
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div dir="rtl" style={{
      position: 'fixed', inset: 0,
      background: '#0a0f1e',
      fontFamily: '"Tajawal", "Cairo", sans-serif',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#e2e8f0',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 360, padding: '0 24px' }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#f87171', marginBottom: 10 }}>
          فشل تحميل البيانات
        </div>
        <div style={{ fontSize: 13, color: '#475569', marginBottom: 32, wordBreak: 'break-word' }}>
          {message}
        </div>
        <button onClick={onRetry} style={{
          background: 'linear-gradient(135deg, #b8860b, #f0c040)',
          border: 'none', borderRadius: 999, padding: '13px 40px',
          fontSize: 15, fontWeight: 800, color: '#0a0f1e',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          إعادة المحاولة
        </button>
      </div>
    </div>
  )
}

export function HassadLoader() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [key, setKey] = useState(0)

  const load = () => {
    setData(null)
    setError(null)
    fetch(`/api/sheets?t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(json => {
        if (json.error) setError(json.details ?? json.error)
        else { setData(json); setKey(k => k + 1) }
      })
      .catch(err => setError(String(err)))
  }

  useEffect(() => { load() }, [])

  if (error) return <ErrorScreen message={error} onRetry={load} />
  if (!data)  return <LoadingScreen />
  return <HassadDashboard key={key} data={data} />
}
