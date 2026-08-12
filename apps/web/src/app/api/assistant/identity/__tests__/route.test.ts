import { describe, expect, it, jest } from '@jest/globals'

jest.mock('../../../../../server/services/assistant-config', () => ({
  getAssistantConfig: jest.fn(() =>
    Promise.resolve({
      assistantName: 'NEX',
      iconStyle: 'ORBIT',
      accentColor: '#22D3EE',
      greeting: 'Ask NEX about your ARKO workspace.',
      personality: 'Calm, concise, practical, and direct.',
      projectId: 'private-project',
      location: 'global',
      model: 'gemini-2.5-flash',
      gcpProjectNumber: '787644651015',
      serviceAccountEmail: 'vertex@example.iam.gserviceaccount.com',
      workloadIdentityPoolId: 'vercel',
      workloadIdentityProviderId: 'vercel',
    }),
  ),
}))

import { GET } from '../route'

describe('assistant identity route', () => {
  it('returns only public mascot fields', async () => {
    const response = await GET()
    const body = await response.json()

    expect(body).toEqual({
      assistantName: 'NEX',
      iconStyle: 'ORBIT',
      accentColor: '#22D3EE',
      greeting: 'Ask NEX about your ARKO workspace.',
    })
    expect(JSON.stringify(body)).not.toContain('serviceAccountEmail')
    expect(response.headers.get('cache-control')).toContain('s-maxage=60')
  })
})
