import { redirect } from 'next/navigation'
import { auth } from '../../../lib/auth'
import { LandingEditor } from './landing-editor'

// Server-side gate: only ADMINs can reach the landing CMS, even via direct URL.
export default async function LandingAdminPage() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') redirect('/dashboard')
  return <LandingEditor />
}
