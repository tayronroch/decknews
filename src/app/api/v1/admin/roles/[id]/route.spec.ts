/**
 * @jest-environment node
 */
import { requireAuthenticatedUser } from '@/features/auth/services'
import { deleteRole, updateRole } from '@/features/rbac/services'
import { ConflictError, ForbiddenError, NotFoundError } from '@/infra/errors'

import { DELETE, PATCH } from './route'

jest.mock('@/features/auth/services', () => ({
  requireAuthenticatedUser: jest.fn(),
}))
jest.mock('@/features/rbac/services', () => ({
  updateRole: jest.fn(),
  deleteRole: jest.fn(),
}))

const mockRequireAuthenticatedUser = jest.mocked(requireAuthenticatedUser)
const mockUpdateRole = jest.mocked(updateRole)
const mockDeleteRole = jest.mocked(deleteRole)

const actor = { id: 1n, name: 'Ada Lovelace', email: 'ada@example.com' }

function patchRequest(body: unknown) {
  return new Request('http://localhost/api/v1/admin/roles/1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

function deleteRequest() {
  return new Request('http://localhost/api/v1/admin/roles/1', {
    method: 'DELETE',
  })
}

function paramsFor(id: string) {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRequireAuthenticatedUser.mockResolvedValue(actor)
})

describe('PATCH /api/v1/admin/roles/[id]', () => {
  it('updates a role and returns 200 with id as string and no permissions field', async () => {
    mockUpdateRole.mockResolvedValueOnce({
      id: 1n,
      name: 'Editor sênior',
      description: 'Edita posts',
      isSystem: false,
      permissions: [
        { id: 10n, key: 'post.read', description: null, module: 'post' },
      ],
    })

    const response = await PATCH(
      patchRequest({ name: 'Editor sênior' }),
      paramsFor('1')
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(mockUpdateRole).toHaveBeenCalledWith(actor, 1n, {
      name: 'Editor sênior',
    })
    expect(json).toEqual({
      role: {
        id: '1',
        name: 'Editor sênior',
        description: 'Edita posts',
        isSystem: false,
      },
    })
    expect(json.role.permissions).toBeUndefined()
  })

  it('accepts null description to clear it and returns 200', async () => {
    mockUpdateRole.mockResolvedValueOnce({
      id: 1n,
      name: 'Editor',
      description: null,
      isSystem: false,
      permissions: [],
    })

    const response = await PATCH(
      patchRequest({ description: null }),
      paramsFor('1')
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(mockUpdateRole).toHaveBeenCalledWith(actor, 1n, {
      description: null,
    })
    expect(json).toEqual({
      role: {
        id: '1',
        name: 'Editor',
        description: null,
        isSystem: false,
      },
    })
  })

  it('returns 400 VALIDATION_ERROR for an empty payload and does not call updateRole', async () => {
    const response = await PATCH(patchRequest({}), paramsFor('1'))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(mockUpdateRole).not.toHaveBeenCalled()
  })

  it('returns 400 VALIDATION_ERROR when the id is not numeric', async () => {
    const response = await PATCH(
      patchRequest({ name: 'Editor sênior' }),
      paramsFor('abc')
    )
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(mockUpdateRole).not.toHaveBeenCalled()
  })

  it('returns 404 when updateRole rejects with NotFoundError', async () => {
    mockUpdateRole.mockRejectedValueOnce(
      new NotFoundError('Cargo não encontrado')
    )

    const response = await PATCH(
      patchRequest({ name: 'Editor sênior' }),
      paramsFor('1')
    )
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error.code).toBe('NOT_FOUND')
  })
})

describe('DELETE /api/v1/admin/roles/[id]', () => {
  it('deletes a role and returns 204 with an empty body', async () => {
    mockDeleteRole.mockResolvedValueOnce(undefined)

    const response = await DELETE(deleteRequest(), paramsFor('1'))
    const text = await response.text()

    expect(response.status).toBe(204)
    expect(text).toBe('')
    expect(mockDeleteRole).toHaveBeenCalledWith(actor, 1n)
  })

  it('returns 409 when deleting a system role', async () => {
    mockDeleteRole.mockRejectedValueOnce(
      new ConflictError('Cargo de sistema não pode ser removido')
    )

    const response = await DELETE(deleteRequest(), paramsFor('1'))
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.error.code).toBe('CONFLICT')
  })

  it('returns 403 when the actor lacks role.delete', async () => {
    mockDeleteRole.mockRejectedValueOnce(new ForbiddenError())

    const response = await DELETE(deleteRequest(), paramsFor('1'))
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error.code).toBe('FORBIDDEN')
  })
})
