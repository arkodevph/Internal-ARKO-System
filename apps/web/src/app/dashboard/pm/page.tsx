import { Board } from '../../../../../pm/src/components/board'
import { auth } from '../../../lib/auth'
import { redirect } from 'next/navigation'

export default async function PMPage() {
  const session = await auth()
  if (!session) redirect('/auth/login')
  if (session.user?.role === 'CLIENT' || session.user?.role === 'DEMO') redirect('/dashboard')

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="mb-2 text-xl font-semibold">PM Board</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Nothing reaches Done without a recorded review.
      </p>
      <Board />
    </main>
  )
}
