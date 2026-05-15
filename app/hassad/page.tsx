import { getDashboardData } from '@/lib/sheetsApi'
import { HassadDashboard } from '@/components/hassad/HassadDashboard'

export const dynamic = 'force-dynamic'

export default async function HassadPage() {
  const data = await getDashboardData()
  return <HassadDashboard data={data} />
}
