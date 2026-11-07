import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { assignedOrCompany, ownedOrCompany, userCanSeeCompanyRecords } from '../record-scope'

describe('record scope policy', () => {
  it('restricts interns to their own records and assigned tasks', () => {
    expect(userCanSeeCompanyRecords('INTERN')).toBe(false)
    expect(ownedOrCompany('i1', 'INTERN')).toEqual({ userId: 'i1' })
    expect(assignedOrCompany('i1', 'INTERN')).toEqual({ assigneeId: 'i1' })
  })
  it('lets internal users query their personal records and company records', () => {
    expect(ownedOrCompany('u1', 'USER')).toEqual({
      OR: [{ userId: 'u1' }, { scope: 'COMPANY' }],
    })
  })

  it('does not treat client accounts as company members', () => {
    expect(userCanSeeCompanyRecords('CLIENT')).toBe(false)
    expect(ownedOrCompany('client-1', 'CLIENT')).toEqual({ userId: 'client-1' })
  })

  it('migrates existing records to personal visibility by default', () => {
    const migration = readFileSync(
      resolve(process.cwd(), '../../packages/db/prisma/migrations/20260808200000_add_universal_record_scope/migration.sql'),
      'utf8',
    )
    expect(migration.match(/ADD COLUMN "scope" "TransactionScope" NOT NULL DEFAULT 'PERSONAL'/g)).toHaveLength(9)
  })
})
