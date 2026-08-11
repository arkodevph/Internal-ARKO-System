import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

jest.mock('@arko/db', () => ({ prisma: {} }))
jest.mock('../../../../../server/services/landing-analytics', () => ({
  landingDayKey: jest.fn(() => '2026-08-11'),
  recordLandingVisit: jest.fn(() => Promise.resolve()),
}))

import { recordLandingVisit } from '../../../../../server/services/landing-analytics'
import { POST } from '../route'

const recordLandingVisitMock = jest.mocked(recordLandingVisit)

describe('landing view route', () => {
  beforeEach(() => {
    recordLandingVisitMock.mockClear()
  })

  it('does not count the same browser twice on one day', async () => {
    const request = new NextRequest('http://localhost/api/landing/view', {
      method: 'POST',
      headers: { cookie: 'arko_landing_visit_day=2026-08-11' },
    })

    const response = await POST(request)

    expect(response.status).toBe(204)
    expect(recordLandingVisitMock).not.toHaveBeenCalled()
  })

  it('records a new daily visit and sets the deduplication cookie', async () => {
    const request = new NextRequest('http://localhost/api/landing/view', {
      method: 'POST',
    })

    const response = await POST(request)

    expect(response.status).toBe(204)
    expect(recordLandingVisitMock).toHaveBeenCalledTimes(1)
    expect(response.headers.get('set-cookie')).toContain(
      'arko_landing_visit_day=2026-08-11',
    )
    expect(response.headers.get('set-cookie')).toContain('HttpOnly')
  })
})
