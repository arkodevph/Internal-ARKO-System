import { redirect } from 'next/navigation'
import LoginRedirectPage from '../page'

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

describe('/login', () => {
  it('redirects to the canonical login page', () => {
    LoginRedirectPage()

    expect(redirect).toHaveBeenCalledWith('/auth/login')
  })
})
