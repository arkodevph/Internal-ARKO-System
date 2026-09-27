import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: 'ADMIN' | 'ACCOUNTANT' | 'MEMBER' | 'USER' | 'CLIENT' | 'DEMO'
      permissions?: unknown
    }
  }
}
