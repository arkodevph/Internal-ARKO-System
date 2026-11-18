import { notFound, redirect } from 'next/navigation'
import { auth } from '../../../../lib/auth'
import { InternManagement } from '../../../../components/interns/intern-portal'
export default async function InternManagementPage({ params }: { params: Promise<{ section?: string[] }> }) {
  const session = await auth()
  if (session?.user?.role === 'INTERN') redirect('/intern')
  if (session?.user?.role !== 'ADMIN') notFound()
  const { section } = await params
  if (section?.length && (section.length !== 1 || section[0] !== 'admin')) notFound()
  return <InternManagement />
}
