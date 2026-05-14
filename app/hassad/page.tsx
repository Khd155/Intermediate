import { getDashboardData } from '@/lib/sheetsApi'
import { HassadAutoPlay } from '@/components/hassad/HassadAutoPlay'

export const revalidate = 300

export default async function HassadPage() {
  const data = await getDashboardData()
  return <HassadAutoPlay data={data} />
}
