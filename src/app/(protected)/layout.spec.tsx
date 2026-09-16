import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

import { getCurrentUserBySessionToken } from '@/features/auth/services'

import ProtectedLayout from './layout'

const sessionCookieName = 'decknews_session'

jest.mock('next/headers', () => ({ cookies: jest.fn() }))
jest.mock('next/navigation', () => ({ redirect: jest.fn() }))
jest.mock('@/features/auth/services', () => ({
  getCurrentUserBySessionToken: jest.fn(),
}))
jest.mock('@/infra/http', () => ({ SESSION_COOKIE_NAME: 'decknews_session' }))

const mockCookies = jest.mocked(cookies)
const mockRedirect = jest.mocked(redirect)
const mockGetCurrentUserBySessionToken = jest.mocked(
  getCurrentUserBySessionToken
)

describe('ProtectedLayout', () => {
  const redirectError = new Error('redirect')

  beforeEach(() => {
    jest.clearAllMocks()
    mockRedirect.mockImplementation(() => {
      throw redirectError
    })
  })

  it('redirects visitors without a valid session to the login page', async () => {
    const get = jest.fn().mockReturnValue({ value: 'expired-token' })
    mockCookies.mockResolvedValue({ get } as Awaited<
      ReturnType<typeof cookies>
    >)
    mockGetCurrentUserBySessionToken.mockResolvedValue(null)

    await expect(
      ProtectedLayout({ children: 'Protected content' })
    ).rejects.toThrow(redirectError)

    expect(get).toHaveBeenCalledWith(sessionCookieName)
    expect(mockGetCurrentUserBySessionToken).toHaveBeenCalledWith(
      'expired-token'
    )
    expect(mockRedirect).toHaveBeenCalledWith('/login?next=/admin')
  })

  it('renders authenticated content for a valid session', async () => {
    const get = jest.fn().mockReturnValue({ value: 'valid-token' })
    mockCookies.mockResolvedValue({ get } as Awaited<
      ReturnType<typeof cookies>
    >)
    mockGetCurrentUserBySessionToken.mockResolvedValue({
      id: 1n,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    })

    const result = await ProtectedLayout({
      children: 'Protected content' as ReactNode,
    })

    expect(result).toBeTruthy()
    expect(mockRedirect).not.toHaveBeenCalled()
  })
})
