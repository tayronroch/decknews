import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { ReactElement, ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { getCurrentUserBySessionToken } from '@/features/auth/services'
import type { AdminNavItem } from '@/features/rbac/components'
import { listEffectivePermissionKeys } from '@/features/rbac/services'

import AdminPage from './admin/page'
import AdminRolesPage from './admin/roles/page'
import AdminUsersPage from './admin/users/page'
import ProtectedLayout from './layout'

const sessionCookieName = 'decknews_session'

// AdminPage renders <AdminPageShell><AdminNav items={…} /></AdminPageShell>:
// reach the nav through the shell's children instead of a positional index, so
// a layout change fails with a clear message instead of `undefined`.
function navItemsOf(page: unknown): AdminNavItem[] {
  const items = (
    page as { props?: { children?: { props?: { items?: AdminNavItem[] } } } }
  ).props?.children?.props?.items

  if (!items) throw new Error('AdminNav não foi encontrado no AdminPageShell')

  return items
}

jest.mock('next/headers', () => ({ cookies: jest.fn(), headers: jest.fn() }))
jest.mock('next/navigation', () => ({ redirect: jest.fn() }))
jest.mock('@/features/auth/services', () => ({
  getCurrentUserBySessionToken: jest.fn(),
}))
jest.mock('@/features/auth/services/get-current-user.service', () => ({
  getCurrentUserBySessionToken: (token: string | undefined) =>
    mockGetCurrentUserBySessionToken(token),
}))
jest.mock('@/features/rbac/services', () => ({
  listEffectivePermissionKeys: jest.fn(),
}))
jest.mock('@/features/rbac/components', () => ({
  AdminNav: () => null,
  RoleManager: () => null,
  UserRoleManager: () => null,
}))
jest.mock('@/infra/http', () => ({ SESSION_COOKIE_NAME: 'decknews_session' }))

const mockCookies = jest.mocked(cookies)
const mockRedirect = jest.mocked(redirect)
const mockGetCurrentUserBySessionToken = jest.mocked(
  getCurrentUserBySessionToken
)
const mockListEffectivePermissionKeys = jest.mocked(listEffectivePermissionKeys)

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
    mockListEffectivePermissionKeys.mockResolvedValue(['role.read'])
  })

  it.each([
    { page: AdminPage, pathname: '/admin' },
    { page: AdminRolesPage, pathname: '/admin/roles' },
    { page: AdminUsersPage, pathname: '/admin/users' },
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
      expect(mockListEffectivePermissionKeys).not.toHaveBeenCalled()
      expect(headers).not.toHaveBeenCalled()
    }
  )

  it('resolves the viewer permissions only after confirming a page session', async () => {
    const user = { id: 1n, name: 'Ada Lovelace', email: 'ada@example.com' }
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'valid-token' }),
    } as unknown as Awaited<ReturnType<typeof cookies>>)
    mockGetCurrentUserBySessionToken.mockResolvedValue(user)

    await AdminRolesPage()

    expect(mockListEffectivePermissionKeys).toHaveBeenCalledWith(user)
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('denies the roles panel to a session without role.read', async () => {
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'valid-token' }),
    } as unknown as Awaited<ReturnType<typeof cookies>>)
    mockGetCurrentUserBySessionToken.mockResolvedValue({
      id: 1n,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    })
    mockListEffectivePermissionKeys.mockResolvedValue(['post.read'])

    const result = await AdminRolesPage()

    expect(renderToStaticMarkup(result as ReactElement)).toContain(
      'Acesso não autorizado'
    )
  })

  it('passes the server-resolved capabilities to the roles panel', async () => {
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'valid-token' }),
    } as unknown as Awaited<ReturnType<typeof cookies>>)
    mockGetCurrentUserBySessionToken.mockResolvedValue({
      id: 1n,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    })
    mockListEffectivePermissionKeys.mockResolvedValue([
      'role.read',
      'role.update',
    ])

    const result = (await AdminRolesPage()) as {
      props: { capabilities: Record<string, boolean> }
    }

    expect(result.props.capabilities).toEqual({
      canCreate: false,
      canUpdate: true,
      canDelete: false,
      canManagePermissions: false,
    })
  })

  it('denies the users panel to a session without user.read', async () => {
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'valid-token' }),
    } as unknown as Awaited<ReturnType<typeof cookies>>)
    mockGetCurrentUserBySessionToken.mockResolvedValue({
      id: 1n,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    })
    mockListEffectivePermissionKeys.mockResolvedValue(['role.read'])

    const result = await AdminUsersPage()

    expect(renderToStaticMarkup(result as ReactElement)).toContain(
      'Acesso não autorizado'
    )
  })

  it('passes the server-resolved capabilities to the users panel', async () => {
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'valid-token' }),
    } as unknown as Awaited<ReturnType<typeof cookies>>)
    mockGetCurrentUserBySessionToken.mockResolvedValue({
      id: 1n,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    })
    mockListEffectivePermissionKeys.mockResolvedValue([
      'user.read',
      'user.manage',
    ])

    const result = (await AdminUsersPage()) as {
      props: { capabilities: Record<string, boolean> }
    }

    expect(result.props.capabilities).toEqual({
      canManageRoles: true,
    })
  })

  it('lists both administrative areas for a session with role.read and user.read', async () => {
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'valid-token' }),
    } as unknown as Awaited<ReturnType<typeof cookies>>)
    mockGetCurrentUserBySessionToken.mockResolvedValue({
      id: 1n,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    })
    mockListEffectivePermissionKeys.mockResolvedValue([
      'role.read',
      'user.read',
    ])

    const items = navItemsOf(await AdminPage())

    expect(items).toHaveLength(2)
    expect(items.map((item) => item.href)).toEqual([
      '/admin/roles',
      '/admin/users',
    ])
  })

  it('lists only the roles area for a session with just role.read', async () => {
    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: 'valid-token' }),
    } as unknown as Awaited<ReturnType<typeof cookies>>)
    mockGetCurrentUserBySessionToken.mockResolvedValue({
      id: 1n,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    })
    mockListEffectivePermissionKeys.mockResolvedValue(['role.read'])

    const items = navItemsOf(await AdminPage())

    expect(items).toHaveLength(1)
    expect(items[0]?.href).toBe('/admin/roles')
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
