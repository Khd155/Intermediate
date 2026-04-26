import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'لوحة متابعة الحصاد الأسري    ',
  description: '',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
