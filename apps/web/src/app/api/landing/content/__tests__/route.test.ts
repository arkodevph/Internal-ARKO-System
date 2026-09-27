import { describe, expect, it, jest } from '@jest/globals'

jest.mock('../../../../../lib/landing/get-content', () => ({
  loadLandingContent: jest.fn(async () => ({ hero: { title: 'ARKO' } })),
}))

import { GET } from '../route'

describe('landing content route', () => {
  it('returns content for the separate public site', async () => {
    const response = await GET()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ hero: { title: 'ARKO' } })
  })
})
