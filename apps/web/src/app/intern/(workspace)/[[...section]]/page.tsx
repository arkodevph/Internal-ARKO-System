import { notFound } from 'next/navigation'
import { InternPortal } from '../../../../components/interns/intern-portal'

export default async function InternPage({ params }: { params: Promise<{ section?: string[] }> }) {
  const { section } = await params
  const page = section?.[0] ?? 'log'
  if ((section?.length ?? 0) > 1 || !['log', 'studies', 'tasks', 'profile'].includes(page)) notFound()
  return <InternPortal section={page} />
}
