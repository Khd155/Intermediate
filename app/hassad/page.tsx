import { getDashboardData } from '@/lib/sheetsApi'
import { HassadDashboard } from '@/components/hassad/HassadDashboard'

export const revalidate = 300

export default async function HassadPage() {
  const data = await getDashboardData()
  return <HassadDashboard data={data} />
}
