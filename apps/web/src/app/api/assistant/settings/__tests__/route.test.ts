import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

const upsert = jest.fn()

jest.mock('@arko/db', () => ({
  prisma: { assistantConfiguration: { upsert } },
}))
jest.mock('../../../../../lib/auth', () => ({ auth: jest.fn() }))
jest.mock('../../../../../server/services/assistant-config', () => ({
  assistantConfigSchema: jest.requireActual(
    '../../../../../server/services/assistant-config',
  ).assistantConfigSchema,
  getAssistantConfig: jest.fn(),
}))
jest.mock('../../../../../server/services/assistant', () => ({
  generateAssistantReply: jest.fn(),
}))
jest.mock('../../../../../server/services/assistant-rate-limit', () => ({
  consumeAssistantRequest: jest.fn(),
}))

import { auth } from '../../../../../lib/auth'
import { getAssistantConfig } from '../../../../../server/services/assistant-config'
import { GET, PUT } from '../route'

const authMock = jest.mocked(auth)
const getConfigMock = jest.mocked(getAssistantConfig)

const config = {
  assistantName: 'Arko Assistant',
  personality: 'Calm, concise, practical, and direct.',
  projectId: 'project-c7724978-a9d8',
  location: 'global',
  model: 'gemini-2.5-flash',
  gcpProjectNumber: '787644651015',
  serviceAccountEmail: 'vertex@test-project.iam.gserviceaccount.com',
  workloadIdentityPoolId: 'vercel',
  workloadIdentityProviderId: 'vercel',
}

function request(body: unknown) {
  return new NextRequest('http://localhost/api/assistant/settings', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

describe('assistant settings route', () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as any)
    getConfigMock.mockResolvedValue(config)
    upsert.mockResolvedValue(config)
  })

  it('is unavailable to non-admin users', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } } as any)

    expect((await GET()).status).toBe(403)
    expect((await PUT(request(config))).status).toBe(403)
  })

  it('returns the server-managed identity without credentials', async () => {
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.identity).toBe(config.serviceAccountEmail)
    expect(JSON.stringify(body)).not.toContain('private_key')
  })

  it('rejects invalid project configuration', async () => {
    expect((await PUT(request({ ...config, projectId: 'not valid' }))).status).toBe(400)
    expect(upsert).not.toHaveBeenCalled()
  })

  it('persists valid settings with the admin audit owner', async () => {
    const response = await PUT(request(config))

    expect(response.status).toBe(200)
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ updatedById: 'admin-1' }),
      }),
    )
  })
})
