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
  if (!isLocalDatabase(process.env.DATABASE_URL) || !isLocalDatabase(process.env.DIRECT_URL)) {
    throw new Error('Local admin seeding is only allowed with localhost DATABASE_URL and DIRECT_URL.')
  }

  const email = process.env.LOCAL_SEED_EMAIL?.trim().toLowerCase()
  const password = process.env.LOCAL_SEED_PASSWORD
  if (!email || !password || password.length < 20) {
    throw new Error('Set LOCAL_SEED_EMAIL and a 20+ character LOCAL_SEED_PASSWORD in the ignored development env file.')
  }

  const hashed = await hash(password, 12)
  await prisma.user.upsert({
    where: { email },
    create: { name: 'Local Admin', email, password: hashed, role: 'ADMIN', status: 'ACTIVE' },
    update: { password: hashed, role: 'ADMIN', status: 'ACTIVE' },
  })
  console.log(`Local admin seeded: ${email}. Password is in apps/web/.env.development.local.`)
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'Local admin seeding failed.')
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
