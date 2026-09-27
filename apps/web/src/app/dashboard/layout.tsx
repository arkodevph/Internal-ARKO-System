import { DashboardShell } from './_components/dashboard-shell'
import { auth } from '../../lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/auth/login')
  if (session.user?.role === 'CLIENT') {
    const path = (await headers()).get('x-arko-pathname') || ''
    const clientPath = path === '/dashboard/client-portal' ||
      path.startsWith('/dashboard/client-portal/') ||
      path === '/dashboard/messages' || path.startsWith('/dashboard/messages/') ||
      path === '/dashboard/settings'
    if (!clientPath) {
      redirect(process.env.ARKO_SURFACE === 'internal'
        ? process.env.ARKO_PORTAL_URL || 'https://portal.arkodevph.com'
        : '/dashboard/client-portal')
    }
  }

  return <DashboardShell>{children}</DashboardShell>
}
