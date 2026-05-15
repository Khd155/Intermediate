import { Suspense } from 'react'
import { getDashboardData } from '@/lib/sheetsApi'
import { DashboardClient } from '@/components/DashboardClient'
import { DashboardSkeleton } from '@/components/cards/DashboardSkeleton'

export const dynamic = 'force-dynamic'

async function DashboardContent() {
  const data = await getDashboardData()
  return <DashboardClient data={data} />
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
