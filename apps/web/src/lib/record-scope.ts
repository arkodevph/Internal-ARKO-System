import { z } from 'zod'

export const recordScopeSchema = z.enum(['PERSONAL', 'COMPANY'])
export type RecordScope = z.infer<typeof recordScopeSchema>

export function userCanSeeCompanyRecords(role: string | undefined): boolean {
  return role !== 'CLIENT' && role !== 'INTERN'
}

export function ownedOrCompany(userId: string, role: string | undefined) {
  return userCanSeeCompanyRecords(role) ? { OR: [{ userId }, { scope: 'COMPANY' as const }] } : { userId }
}

export function assignedOrCompany(userId: string, role: string | undefined) {
  return userCanSeeCompanyRecords(role) ? { OR: [{ assigneeId: userId }, { scope: 'COMPANY' as const }] } : { assigneeId: userId }
}

export function canManageOwnedRecord(ownerId: string | null | undefined, userId: string, role: string | undefined) {
  return ownerId === userId || role === 'ADMIN'
}
