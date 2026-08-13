import { isNearChatBottom } from '../chat-scroll'

describe('isNearChatBottom', () => {
  it('keeps following new content while the reader is near the bottom', () => {
    expect(isNearChatBottom({ scrollHeight: 600, scrollTop: 170, clientHeight: 400 })).toBe(true)
  })

  it('stops following new content after the reader scrolls up', () => {
    expect(isNearChatBottom({ scrollHeight: 600, scrollTop: 80, clientHeight: 400 })).toBe(false)
  })
})
