/**
 * @jest-environment node
 */
import { requireAuthenticatedUser } from '@/features/auth/services'
import { replaceRolePermissions } from '@/features/rbac/services'
import { ConflictError, UnauthorizedError } from '@/infra/errors'

import { PUT } from './route'

jest.mock('@/features/auth/services', () => ({
  requireAuthenticatedUser: jest.fn(),
}))
jest.mock('@/features/rbac/services', () => ({
  replaceRolePermissions: jest.fn(),
}))

const mockRequireAuthenticatedUser = jest.mocked(requireAuthenticatedUser)
const mockReplaceRolePermissions = jest.mocked(replaceRolePermissions)

const actor = { id: 1n, name: 'Ada Lovelace', email: 'ada@example.com' }

function putRequest(body: unknown) {
  return new Request('http://localhost/api/v1/admin/roles/1/permissions', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

function paramsFor(id: string) {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRequireAuthenticatedUser.mockResolvedValue(actor)
})

describe('PUT /api/v1/admin/roles/[id]/permissions', () => {
  it('replaces the role permissions and returns 204', async () => {
    mockReplaceRolePermissions.mockResolvedValueOnce(undefined)

    const response = await PUT(
      putRequest({ permissions: ['post.read', 'post.create'] }),
      paramsFor('1')
    )
    const text = await response.text()

    expect(response.status).toBe(204)
    expect(text).toBe('')
    expect(mockReplaceRolePermissions).toHaveBeenCalledWith(actor, 1n, [
      'post.read',
      'post.create',
    ])
  })

  it('accepts an empty permissions array to clear all permissions', async () => {
    mockReplaceRolePermissions.mockResolvedValueOnce(undefined)

    const response = await PUT(putRequest({ permissions: [] }), paramsFor('1'))

    expect(response.status).toBe(204)
    expect(mockReplaceRolePermissions).toHaveBeenCalledWith(actor, 1n, [])
  })

  it('returns 400 VALIDATION_ERROR when permissions is not an array', async () => {
    const response = await PUT(
      putRequest({ permissions: 'post.read' }),
      paramsFor('1')
    )
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(mockReplaceRolePermissions).not.toHaveBeenCalled()
  })

  it('returns 400 VALIDATION_ERROR when an unexpected property is present', async () => {
    const response = await PUT(
      putRequest({ permissions: [], extra: 1 }),
      paramsFor('1')
    )
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(mockReplaceRolePermissions).not.toHaveBeenCalled()
  })

  it('returns 409 with the service message when the last manager permission would be removed', async () => {
    mockReplaceRolePermissions.mockRejectedValueOnce(
      new ConflictError(
        'A última permissão administrativa não pode ser removida'
      )
    )

    const response = await PUT(putRequest({ permissions: [] }), paramsFor('1'))
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json).toEqual({
      error: {
        code: 'CONFLICT',
        message: 'A última permissão administrativa não pode ser removida',
      },
    })
  })

  it('returns 401 without a session', async () => {
    mockRequireAuthenticatedUser.mockReset()
    mockRequireAuthenticatedUser.mockRejectedValueOnce(new UnauthorizedError())

    const response = await PUT(
      putRequest({ permissions: ['post.read'] }),
      paramsFor('1')
    )
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error.code).toBe('UNAUTHORIZED')
    expect(mockReplaceRolePermissions).not.toHaveBeenCalled()
  })
})
