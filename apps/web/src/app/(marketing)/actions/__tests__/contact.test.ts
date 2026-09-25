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

describe('sendContact action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.RESEND_API_KEY = 're_test_key_123'
    delete (globalThis as any).__rlKey
  })

  it('successfully submits valid form data with short English words and flexible budget', async () => {
    mockSend.mockResolvedValue({ error: null })
    mockCookieGet.mockReturnValue(undefined)

    const formData = new FormData()
    formData.append('name', 'Jane Doe')
    formData.append('email', 'jane@example.com')
    formData.append('projectType', 'Website')
    formData.append('message', 'We need a modern website for our growing team.')
    formData.append('currency', 'USD')
    formData.append('budget', '$50,000')
    formData.append('timeline', '2 months')

    const result = await sendContact({ status: 'idle' }, formData)

    expect(result.status).toBe('success')
    expect(result.message).toBe('Got it. We will get back to you within a day.')
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'contact@arkodevph.com',
        replyTo: 'jane@example.com',
        subject: 'New project inquiry from Jane Doe',
      }),
    )
  })

  it('accepts concise brief descriptions', async () => {
    mockSend.mockResolvedValue({ error: null })
    mockCookieGet.mockReturnValue(undefined)

    const formData = new FormData()
    formData.append('name', 'Jane Doe')
    formData.append('email', 'jane@example.com')
    formData.append('message', 'Web app MVP')

    const result = await sendContact({ status: 'idle' }, formData)
    expect(result.status).toBe('success')
  })

  it('rejects submissions missing name or email', async () => {
    const formData = new FormData()
    formData.append('name', '')
    formData.append('email', 'jane@example.com')
    formData.append('message', 'We need a website.')

    const result = await sendContact({ status: 'idle' }, formData)
    expect(result.status).toBe('error')
    expect(result.message).toBe('Add your name and email so we can reply.')
  })

  it('rejects invalid email addresses', async () => {
    const formData = new FormData()
    formData.append('name', 'Jane')
    formData.append('email', 'not-an-email')
    formData.append('message', 'We need a website.')

    const result = await sendContact({ status: 'idle' }, formData)
    expect(result.status).toBe('error')
    expect(result.message).toBe('That email does not look right.')
  })

  it('rejects empty or whitespace-only messages', async () => {
    const formData = new FormData()
    formData.append('name', 'Jane')
    formData.append('email', 'jane@example.com')
    formData.append('message', ' ')

    const result = await sendContact({ status: 'idle' }, formData)
    expect(result.status).toBe('error')
    expect(result.message).toBe('Tell us a bit about what you are building.')
  })

  it('rejects excessive keyboard smash', async () => {
    const formData = new FormData()
    formData.append('name', 'Jane')
    formData.append('email', 'jane@example.com')
    formData.append('message', 'aaaaaaaaaaaaaaaaaaaa')

    const result = await sendContact({ status: 'idle' }, formData)
    expect(result.status).toBe('error')
    expect(result.message).toBe(
      'Please write a real message - we are people, not robots.',
    )
  })
})
