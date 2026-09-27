import MessagesPage from '../../../../../web/src/app/dashboard/messages/page'
import { AuthGate } from '@arko/edge-auth/gate'

export default function Page() {
  return <AuthGate><main className="p-6"><a href="/" className="mb-4 inline-block text-sm text-emerald-400">← Portal</a><MessagesPage /></main></AuthGate>
}
