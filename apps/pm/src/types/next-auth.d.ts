import 'next-auth'

type Role = 'ADMIN' | 'ACCOUNTANT' | 'MEMBER' | 'USER' | 'CLIENT' | 'DEMO'

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: Role;
      permissions?: unknown;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    permissions?: unknown;
    authVersion?: number;
    sessionStartedAt?: number;
  }
}
