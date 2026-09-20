/**
 * @jest-environment node
 */
import { requireAuthenticatedUser } from '@/features/auth/services'
import { listPermissions } from '@/features/rbac/services'
import { ForbiddenError, UnauthorizedError } from '@/infra/errors'

import { GET } from './route'

jest.mock('@/features/auth/services', () => ({
  requireAuthenticatedUser: jest.fn(),
}))
jest.mock('@/features/rbac/services', () => ({
  listPermissions: jest.fn(),
}))

const mockRequireAuthenticatedUser = jest.mocked(requireAuthenticatedUser)
const mockListPermissions = jest.mocked(listPermissions)

const actor = { id: 1n, name: 'Ada Lovelace', email: 'ada@example.com' }

function getRequest() {
  return new Request('http://localhost/api/v1/admin/permissions')
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/v1/admin/permissions', () => {
  it('returns 200 with permission ids serialized as strings and preserved fields', async () => {
    mockRequireAuthenticatedUser.mockResolvedValueOnce(actor)
    mockListPermissions.mockResolvedValueOnce([
      { id: 1n, key: 'post.read', description: 'Ler posts', module: 'post' },
      { id: 2n, key: 'post.create', description: null, module: 'post' },
    ])

    const response = await GET(getRequest())
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({
      permissions: [
        { id: '1', key: 'post.read', description: 'Ler posts', module: 'post' },
        { id: '2', key: 'post.create', description: null, module: 'post' },
      ],
    })
    expect(mockListPermissions).toHaveBeenCalledWith(actor)
  })

  it('returns 401 without a session', async () => {
    mockRequireAuthenticatedUser.mockRejectedValueOnce(new UnauthorizedError())

    const response = await GET(getRequest())
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error.code).toBe('UNAUTHORIZED')
    expect(mockListPermissions).not.toHaveBeenCalled()
  })

  it('returns 403 when the actor lacks role.read', async () => {
    mockRequireAuthenticatedUser.mockResolvedValueOnce(actor)
    mockListPermissions.mockRejectedValueOnce(new ForbiddenError())

    const response = await GET(getRequest())
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error.code).toBe('FORBIDDEN')
  })
})
