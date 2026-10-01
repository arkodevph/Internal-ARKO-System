import { hash } from 'bcryptjs'
import { prisma } from '../src/index'

function isLocalDatabase(value: string | undefined) {
  if (!value) return false
  try {
    const url = new URL(value)
    return ['127.0.0.1', 'localhost', '::1'].includes(url.hostname)
  } catch {
    return false
  }
}

async function main() {
  const isLocal = isLocalDatabase(process.env.DATABASE_URL) && isLocalDatabase(process.env.DIRECT_URL)
  if (!isLocal && process.env.ALLOW_REMOTE_ADMIN_SEED !== 'true') {
    throw new Error('Remote admin seeding requires ALLOW_REMOTE_ADMIN_SEED=true.')
  }

  const email = (process.env.ADMIN_SEED_EMAIL ?? process.env.LOCAL_SEED_EMAIL)?.trim().toLowerCase()
  const password = process.env.ADMIN_SEED_PASSWORD ?? process.env.LOCAL_SEED_PASSWORD
  if (!email || !password || password.length < 20) {
    throw new Error('Set ADMIN_SEED_EMAIL and a 20+ character ADMIN_SEED_PASSWORD.')
  }

  const hashed = await hash(password, 12)
  await prisma.user.upsert({
    where: { email },
    create: {
      name: process.env.ADMIN_SEED_NAME?.trim() || 'ARKO Admin',
      email,
      password: hashed,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    update: { password: hashed, role: 'ADMIN', status: 'ACTIVE' },
  })
  console.log(`Admin account seeded: ${email}.`)
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'Admin seeding failed.')
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
