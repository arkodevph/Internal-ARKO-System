import { beforeEach, describe, expect, it, jest } from '@jest/globals'

const mockSend = jest.fn()
const mockCookieSet = jest.fn()
const mockCookieGet = jest.fn()

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    get: mockCookieGet,
    set: mockCookieSet,
  })),
}))

import { sendContact } from '../contact'

describe('sendContact action - flexible behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.RESEND_API_KEY = 're_test_key_123'
    delete (globalThis as any).__rlKey
  })

  it('accepts short descriptions like "MVP", "Redesign", "Mobile app"', async () => {
    mockSend.mockResolvedValue({ error: null })
    mockCookieGet.mockReturnValue(undefined)

    const samples = ['MVP', 'Redesign', 'Mobile app', 'Help with AI', 'Store UI']
    for (const msg of samples) {
      const formData = new FormData()
      formData.append('name', 'Alex')
      formData.append('email', 'alex@example.com')
      formData.append('message', msg)

      const res = await sendContact({ status: 'idle' }, formData)
      expect(res.status).toBe('success')
    }
  })

  it('accepts flexible budget strings ($50k, ₱150,000, 20k - 50k)', async () => {
    mockSend.mockResolvedValue({ error: null })
    mockCookieGet.mockReturnValue(undefined)

    const budgets = ['$50k', '₱150,000', '20k - 50k', '100,000', '50000']
    for (const b of budgets) {
      const formData = new FormData()
      formData.append('name', 'Alex')
      formData.append('email', 'alex@example.com')
      formData.append('budget', b)
      formData.append('currency', 'USD')
      formData.append('message', 'We want to build a platform.')

      const res = await sendContact({ status: 'idle' }, formData)
      expect(res.status).toBe('success')
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining(b),
        }),
      )
    }
  })

  it('accepts omitted projectType and defaults gracefully', async () => {
    mockSend.mockResolvedValue({ error: null })
    mockCookieGet.mockReturnValue(undefined)

    const formData = new FormData()
    formData.append('name', 'Alex')
    formData.append('email', 'alex@example.com')
    formData.append('message', 'General consultation.')

    const res = await sendContact({ status: 'idle' }, formData)
    expect(res.status).toBe('success')
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Project type: Not specified'),
      }),
    )
  })

  it('accepts "Other" project type', async () => {
    mockSend.mockResolvedValue({ error: null })
    mockCookieGet.mockReturnValue(undefined)

    const formData = new FormData()
    formData.append('name', 'Alex')
    formData.append('email', 'alex@example.com')
    formData.append('projectType', 'Other')
    formData.append('message', 'Custom system integration.')

    const res = await sendContact({ status: 'idle' }, formData)
    expect(res.status).toBe('success')
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Project type: Other'),
      }),
    )
  })

  it('rejects spam with 8+ repeated characters but allows casual emphasis like "hellooo"', async () => {
    mockSend.mockResolvedValue({ error: null })
    mockCookieGet.mockReturnValue(undefined)

    // Allowed: moderate emphasis (e.g. 3-4 repeated letters)
    const validFormData = new FormData()
    validFormData.append('name', 'Alex')
    validFormData.append('email', 'alex@example.com')
    validFormData.append('message', 'Hellooo, looking for an estimate!')
    const validRes = await sendContact({ status: 'idle' }, validFormData)
    expect(validRes.status).toBe('success')

    // Rejected: 8+ repeated letters keyboard smash
    const spamFormData = new FormData()
    spamFormData.append('name', 'Spammer')
    spamFormData.append('email', 'spam@example.com')
    spamFormData.append('message', 'aaaaaaaaaaaaaaaaaaa')
    const spamRes = await sendContact({ status: 'idle' }, spamFormData)
    expect(spamRes.status).toBe('error')
    expect(spamRes.message).toBe('Please write a real message - we are people, not robots.')
  })
})
