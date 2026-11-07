import { auth } from '../../../lib/auth'
import { redirect } from 'next/navigation'
import { InternLogin } from '../../../components/interns/intern-login'
export const metadata = { title: 'Arko Intern Portal · Sign in' }
export default async function LoginPage() {
  const session = await auth()
  if (session?.user?.role === 'INTERN') redirect('/intern')
  if (session?.user?.role === 'ADMIN') redirect('/dashboard/interns')
  return <InternLogin />
}
