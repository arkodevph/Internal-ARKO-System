import FinancePage from '../../../web/src/app/dashboard/finance/page'
import { AuthGate, SignOutButton } from '@arko/edge-auth/gate'

export default function Page() {
  return <AuthGate><header className="flex items-center justify-between border-b border-border px-6 py-4"><span className="font-semibold">ARKO Finance</span><SignOutButton /></header><main className="p-6"><FinancePage /></main></AuthGate>
}
