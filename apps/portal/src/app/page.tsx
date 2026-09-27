import ClientPortalPage from '../../../web/src/app/dashboard/client-portal/page'
import { AuthGate, SignOutButton } from '@arko/edge-auth/gate'

export default function Page() {
  return <AuthGate><header className="flex items-center justify-between border-b border-border px-6 py-4"><span className="font-semibold">ARKO Client Portal</span><SignOutButton /></header><main className="p-6"><ClientPortalPage /></main></AuthGate>
}
