import { getDashboardData } from '@/lib/sheetsApi'
import { HassadPresentationClient } from '@/components/hassad/HassadPresentationClient'

export const revalidate = 300

export default async function HassadPage() {
  const data = await getDashboardData()
  return <HassadPresentationClient data={data} />
}
