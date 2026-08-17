import { redirect } from 'next/navigation'
import { auth } from '../../../lib/auth'
import { hasPermission } from '../../../lib/rbac'
import { LandingEditor } from './landing-editor'

// Server-side gate: only ADMINs can reach the landing CMS, even via direct URL.
export default async function LandingAdminPage() {
  const session = await auth()
  if (!hasPermission(session?.user?.role, 'landing:manage', session?.user?.permissions)) redirect('/dashboard')
  return <LandingEditor />
}
