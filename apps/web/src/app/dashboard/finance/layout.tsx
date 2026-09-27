import { auth } from '../../../lib/auth'
import { hasPermission } from '../../../lib/rbac'
import { redirect } from 'next/navigation'

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/auth/login')
  if (!hasPermission(session.user?.role, 'transactions:read', session.user?.permissions)) {
    redirect('/dashboard')
  }
  return children
}
