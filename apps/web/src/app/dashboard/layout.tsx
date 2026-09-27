import { DashboardShell } from './_components/dashboard-shell'
import { auth } from '../../lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/auth/login')
  if (process.env.ARKO_SURFACE === 'internal' && session.user?.role === 'CLIENT') {
    redirect(process.env.ARKO_PORTAL_URL || 'https://portal.arkodevph.com')
  }

  return <DashboardShell>{children}</DashboardShell>
}
