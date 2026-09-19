/**
 * @jest-environment node
 */
import { requireAuthenticatedUser } from '@/features/auth/services'
import { listUsersWithRoles } from '@/features/rbac/services'
import { ForbiddenError, UnauthorizedError } from '@/infra/errors'

import { GET } from './route'

jest.mock('@/features/auth/services', () => ({
  requireAuthenticatedUser: jest.fn(),
}))
jest.mock('@/features/rbac/services', () => ({
  listUsersWithRoles: jest.fn(),
}))

const mockRequireAuthenticatedUser = jest.mocked(requireAuthenticatedUser)
const mockListUsersWithRoles = jest.mocked(listUsersWithRoles)

const actor = { id: 1n, name: 'Ada Lovelace', email: 'ada@example.com' }

function getRequest() {
  return new Request('http://localhost/api/v1/admin/users')
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/v1/admin/users', () => {
  it('returns 200 with ids as strings and createdAt as ISO string', async () => {
    mockRequireAuthenticatedUser.mockResolvedValueOnce(actor)
    mockListUsersWithRoles.mockResolvedValueOnce([
      {
        id: 1n,
        name: 'Grace Hopper',
        email: 'grace@example.com',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        roles: [
          {
            id: 10n,
            name: 'Administrador',
            description: 'Acesso total',
            isSystem: true,
            permissions: [],
          },
        ],
      },
    ])

    const response = await GET(getRequest())
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({
      users: [
        {
          id: '1',
          name: 'Grace Hopper',
          email: 'grace@example.com',
          createdAt: '2026-01-01T00:00:00.000Z',
          roles: [
            {
              id: '10',
              name: 'Administrador',
              description: 'Acesso total',
              isSystem: true,
            },
          ],
        },
      ],
    })
    expect(mockListUsersWithRoles).toHaveBeenCalledWith(actor)
  })

  it('returns roles as an empty array for a user without roles', async () => {
    mockRequireAuthenticatedUser.mockResolvedValueOnce(actor)
    mockListUsersWithRoles.mockResolvedValueOnce([
      {
        id: 2n,
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
        roles: [],
      },
    ])

    const response = await GET(getRequest())
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.users[0].roles).toEqual([])
  })

  it('returns 401 without a session', async () => {
    mockRequireAuthenticatedUser.mockRejectedValueOnce(new UnauthorizedError())

    const response = await GET(getRequest())
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error.code).toBe('UNAUTHORIZED')
    expect(mockListUsersWithRoles).not.toHaveBeenCalled()
  })

  it('returns 403 when the actor lacks user.read', async () => {
    mockRequireAuthenticatedUser.mockResolvedValueOnce(actor)
    mockListUsersWithRoles.mockRejectedValueOnce(new ForbiddenError())

    const response = await GET(getRequest())
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error.code).toBe('FORBIDDEN')
  })
})
