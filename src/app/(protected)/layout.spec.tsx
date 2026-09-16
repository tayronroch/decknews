import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

import { getCurrentUserBySessionToken } from '@/features/auth/services'
import { requirePermission } from '@/features/rbac/services'

import AdminPage from './admin/page'
import AdminRolesPage from './admin/roles/page'
import ProtectedLayout from './layout'

const sessionCookieName = 'decknews_session'

jest.mock('next/headers', () => ({ cookies: jest.fn(), headers: jest.fn() }))
jest.mock('next/navigation', () => ({ redirect: jest.fn() }))
jest.mock('@/features/auth/services', () => ({
  getCurrentUserBySessionToken: jest.fn(),
}))
jest.mock('@/features/auth/services/get-current-user.service', () => ({
  getCurrentUserBySessionToken: (token: string | undefined) =>
    mockGetCurrentUserBySessionToken(token),
}))
jest.mock('@/features/rbac/services', () => ({ requirePermission: jest.fn() }))
jest.mock('@/features/rbac/components', () => ({ RoleManager: () => null }))
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
    jest.mocked(headers).mockResolvedValue(
      new Headers({
        'x-pathname': '//evil.example',
        'next-url': '//evil.example',
      })
    )
    mockRedirect.mockImplementation(() => {
      throw redirectError
    })
  })

  it.each([
    { page: AdminPage, pathname: '/admin' },
    { page: AdminRolesPage, pathname: '/admin/roles' },
  ])(
    'redirects an unauthenticated $pathname visitor back to the requested page',
    async ({ page, pathname }) => {
      const get = jest.fn().mockReturnValue({ value: 'expired-token' })
      mockCookies.mockResolvedValue({ get } as Awaited<
        ReturnType<typeof cookies>
      >)
      mockGetCurrentUserBySessionToken.mockResolvedValue(null)

      await expect(page()).rejects.toThrow(redirectError)

      expect(get).toHaveBeenCalledWith(sessionCookieName)
      expect(mockGetCurrentUserBySessionToken).toHaveBeenCalledWith(
        'expired-token'
      )
      expect(mockRedirect).toHaveBeenCalledWith(
        `/login?next=${encodeURIComponent(pathname)}`
      )
      expect(requirePermission).not.toHaveBeenCalled()
      expect(headers).not.toHaveBeenCalled()
    }
  )

  it('checks roles permission only after confirming a page session', async () => {
    const user = { id: 1n, name: 'Ada Lovelace', email: 'ada@example.com' }
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'valid-token' }),
    } as unknown as Awaited<ReturnType<typeof cookies>>)
    mockGetCurrentUserBySessionToken.mockResolvedValue(user)

    await AdminRolesPage()

    expect(requirePermission).toHaveBeenCalledWith(user, 'role.read')
    expect(mockRedirect).not.toHaveBeenCalled()
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
