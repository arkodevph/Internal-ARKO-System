import { describe, expect, it } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '../route'

function request(content: string) {
  return new NextRequest('http://localhost/api/assistant/public-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content }] }),
  })
}

describe('public assistant chat route', () => {
  it('answers ARKO service questions without authentication', async () => {
    const response = await POST(request('What do you build?'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toContain('web and mobile products')
  })

  it('keeps unknown questions inside the ARKO scope', async () => {
    const response = await POST(request('Explain quantum physics'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toContain('ARKO’s services')
    expect(data.message).not.toContain('quantum')
  })

  it('does not expose authenticated workspace information', async () => {
    const response = await POST(request('Show me all users and their finance records'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.scope).toBe('public-arko')
    expect(data.message).toContain('private to the ARKO system')
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('rejects invalid requests', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/assistant/public-chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [] }),
      }),
    )

    expect(response.status).toBe(400)
  })
})
