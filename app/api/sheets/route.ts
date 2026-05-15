import { NextResponse } from 'next/server'
import { getDashboardData } from '@/lib/sheetsApi'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await getDashboardData()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Dashboard data error:', error)
    return NextResponse.json(
      { error: 'فشل في جلب البيانات', details: String(error) },
      { status: 500 }
    )
  }
}
