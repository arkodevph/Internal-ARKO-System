import { auth } from '../../../lib/auth'
import { redirect } from 'next/navigation'
import { InternShell } from '../../../components/interns/intern-shell'

export default async function InternLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/intern/login')
  if (session.user?.role === 'ADMIN') redirect('/dashboard/interns')
  if (session.user?.role !== 'INTERN') redirect('/auth/login')
  return <InternShell name={session.user.name ?? 'Intern'}>{children}</InternShell>
}
