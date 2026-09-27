import { Board } from '../../../../../pm/src/components/board'
import { auth } from '../../../lib/auth'
import { hasPermission } from '../../../lib/rbac'
import { redirect } from 'next/navigation'

export default async function PMPage() {
  const session = await auth()
  if (!session) redirect('/auth/login')
  if (!hasPermission(session.user?.role, 'tasks:read', session.user?.permissions)) {
    if (['ADMIN', 'MEMBER', 'USER', 'ACCOUNTANT'].includes(session.user?.role ?? '')) {
      return <Board />
    }
    redirect('/dashboard')
  }
  redirect('/dashboard/tasks')
}
