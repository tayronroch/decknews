/**
 * @jest-environment node
 */
import { requireAuthenticatedUser } from '@/features/auth/services'
import { listUserRoles, replaceUserRoles } from '@/features/rbac/services'
import { ConflictError, ForbiddenError } from '@/infra/errors'

import { GET, PUT } from './route'

jest.mock('@/features/auth/services', () => ({
  requireAuthenticatedUser: jest.fn(),
}))
jest.mock('@/features/rbac/services', () => ({
  listUserRoles: jest.fn(),
  replaceUserRoles: jest.fn(),
}))

const mockRequireAuthenticatedUser = jest.mocked(requireAuthenticatedUser)
const mockListUserRoles = jest.mocked(listUserRoles)
const mockReplaceUserRoles = jest.mocked(replaceUserRoles)

const actor = { id: 1n, name: 'Ada Lovelace', email: 'ada@example.com' }

function getRequest() {
  return new Request('http://localhost/api/v1/admin/users/1/roles')
}

function putRequest(body: unknown) {
  return new Request('http://localhost/api/v1/admin/users/1/roles', {
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

describe('GET /api/v1/admin/users/[id]/roles', () => {
  it('returns 200 with role ids serialized as strings', async () => {
    mockListUserRoles.mockResolvedValueOnce([
      {
        id: 10n,
        name: 'Administrador',
        description: 'Acesso total',
        isSystem: true,
        permissions: [],
      },
    ])

    const response = await GET(getRequest(), paramsFor('1'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({
      roles: [
        {
          id: '10',
          name: 'Administrador',
          description: 'Acesso total',
          isSystem: true,
        },
      ],
    })
    expect(mockListUserRoles).toHaveBeenCalledWith(actor, 1n)
  })
})

describe('PUT /api/v1/admin/users/[id]/roles', () => {
  it('converts string role ids to bigint and returns 204', async () => {
    mockReplaceUserRoles.mockResolvedValueOnce(undefined)

    const response = await PUT(
      putRequest({ roleIds: ['10', '11'] }),
      paramsFor('1')
    )
    const text = await response.text()

    expect(response.status).toBe(204)
    expect(text).toBe('')
    expect(mockReplaceUserRoles).toHaveBeenCalledWith(actor, 1n, [10n, 11n])
  })

  it('returns 400 VALIDATION_ERROR when a role id is not numeric', async () => {
    const response = await PUT(putRequest({ roleIds: ['abc'] }), paramsFor('1'))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(mockReplaceUserRoles).not.toHaveBeenCalled()
  })

  it('accepts an empty roleIds array and returns 204', async () => {
    mockReplaceUserRoles.mockResolvedValueOnce(undefined)

    const response = await PUT(putRequest({ roleIds: [] }), paramsFor('1'))

    expect(response.status).toBe(204)
    expect(mockReplaceUserRoles).toHaveBeenCalledWith(actor, 1n, [])
  })

  it('returns 409 when removing the last administrator', async () => {
    mockReplaceUserRoles.mockRejectedValueOnce(
      new ConflictError('O último administrador não pode ser removido')
    )

    const response = await PUT(putRequest({ roleIds: [] }), paramsFor('1'))
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json).toEqual({
      error: {
        code: 'CONFLICT',
        message: 'O último administrador não pode ser removido',
      },
    })
  })

  it('returns 403 when the actor lacks user.manage', async () => {
    mockReplaceUserRoles.mockRejectedValueOnce(new ForbiddenError())

    const response = await PUT(putRequest({ roleIds: ['10'] }), paramsFor('1'))
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error.code).toBe('FORBIDDEN')
  })
})
