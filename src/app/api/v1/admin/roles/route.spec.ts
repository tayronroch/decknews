/**
 * @jest-environment node
 */
import { requireAuthenticatedUser } from '@/features/auth/services'
import { createRole, listRoles } from '@/features/rbac/services'
import { ForbiddenError, UnauthorizedError } from '@/infra/errors'

import { GET, POST } from './route'

jest.mock('@/features/auth/services', () => ({
  requireAuthenticatedUser: jest.fn(),
}))
jest.mock('@/features/rbac/services', () => ({
  listRoles: jest.fn(),
  createRole: jest.fn(),
}))

const mockRequireAuthenticatedUser = jest.mocked(requireAuthenticatedUser)
const mockListRoles = jest.mocked(listRoles)
const mockCreateRole = jest.mocked(createRole)

const actor = { id: 1n, name: 'Ada Lovelace', email: 'ada@example.com' }

function getRequest() {
  return new Request('http://localhost/api/v1/admin/roles')
}

function postRequest(body: unknown) {
  return new Request('http://localhost/api/v1/admin/roles', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('GET /api/v1/admin/roles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 without a session and does not call listRoles', async () => {
    mockRequireAuthenticatedUser.mockRejectedValueOnce(new UnauthorizedError())

    const response = await GET(getRequest())
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json).toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Não autorizado' },
    })
    expect(mockListRoles).not.toHaveBeenCalled()
  })

  it('returns 200 with role and permission ids serialized as strings', async () => {
    mockRequireAuthenticatedUser.mockResolvedValueOnce(actor)
    mockListRoles.mockResolvedValueOnce([
      {
        id: 1n,
        name: 'Editor',
        description: 'Edita posts',
        isSystem: false,
        permissions: [
          {
            id: 10n,
            key: 'post.read',
            description: 'Ler posts',
            module: 'post',
          },
        ],
      },
    ])

    const response = await GET(getRequest())
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({
      roles: [
        {
          id: '1',
          name: 'Editor',
          description: 'Edita posts',
          isSystem: false,
          permissions: [
            {
              id: '10',
              key: 'post.read',
              description: 'Ler posts',
              module: 'post',
            },
          ],
        },
      ],
    })
    expect(mockListRoles).toHaveBeenCalledWith(actor)
  })

  it('returns 403 when the actor lacks role.read', async () => {
    mockRequireAuthenticatedUser.mockResolvedValueOnce(actor)
    mockListRoles.mockRejectedValueOnce(new ForbiddenError())

    const response = await GET(getRequest())
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json).toEqual({
      error: { code: 'FORBIDDEN', message: 'Acesso negado' },
    })
  })
})

describe('POST /api/v1/admin/roles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a role with a valid payload and returns 201', async () => {
    mockRequireAuthenticatedUser.mockResolvedValueOnce(actor)
    mockCreateRole.mockResolvedValueOnce({
      id: 2n,
      name: 'Editor',
      description: 'Edita posts',
      isSystem: false,
      permissions: [],
    })

    const response = await POST(
      postRequest({ name: 'Editor', description: 'Edita posts' })
    )
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(mockCreateRole).toHaveBeenCalledWith(actor, {
      name: 'Editor',
      description: 'Edita posts',
    })
    expect(json).toEqual({
      role: {
        id: '2',
        name: 'Editor',
        description: 'Edita posts',
        isSystem: false,
        permissions: [],
      },
    })
  })

  it('rejects unexpected properties with 400 and does not call createRole', async () => {
    const response = await POST(postRequest({ name: 'Editor', isSystem: true }))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(mockCreateRole).not.toHaveBeenCalled()
  })

  it('returns 400 VALIDATION_ERROR on malformed JSON instead of 500', async () => {
    const response = await POST(postRequest('{'))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(mockCreateRole).not.toHaveBeenCalled()
  })

  it('returns 400 when name has only 1 character', async () => {
    const response = await POST(postRequest({ name: 'E' }))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(mockCreateRole).not.toHaveBeenCalled()
  })
})
