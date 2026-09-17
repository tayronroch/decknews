import { rbacClient, RbacClientError } from './rbac-client'

const permission = {
  id: '10',
  key: 'post.create',
  description: 'Criar postagens',
  module: 'Posts',
}

const role = {
  id: '1',
  name: 'Editor',
  description: 'Cargo editorial',
  isSystem: false,
  permissions: [permission],
}

function jsonResponse(body: unknown, status = 200) {
  return { ok: status < 400, status, json: async () => body } as Response
}

describe('rbacClient', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = jest.fn()
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    })
  })

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'fetch')
  })

  it('loads roles from the admin API', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ roles: [role] }))

    await expect(rbacClient.listRoles()).resolves.toEqual([role])
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/admin/roles',
      expect.objectContaining({ credentials: 'same-origin' })
    )
  })

  it('loads permissions from the admin API', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ permissions: [permission] }))

    await expect(rbacClient.listPermissions()).resolves.toEqual([permission])
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/admin/permissions',
      expect.objectContaining({ credentials: 'same-origin' })
    )
  })

  it('creates a role with the submitted payload', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ role }, 201))

    await expect(
      rbacClient.createRole({ name: 'Editor', description: 'Cargo editorial' })
    ).resolves.toEqual(role)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/admin/roles',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Editor', description: 'Cargo editorial' }),
      })
    )
  })

  it('replaces role permissions with the technical keys', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 204 } as Response)

    await expect(
      rbacClient.replaceRolePermissions('1', ['post.create'])
    ).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/admin/roles/1/permissions',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ permissions: ['post.create'] }),
      })
    )
  })

  it('translates a forbidden response into a permission message', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { code: 'FORBIDDEN', message: 'Forbidden' } }, 403)
    )

    await expect(rbacClient.deleteRole('1')).rejects.toMatchObject({
      statusCode: 403,
      message: 'Você não tem permissão para realizar esta ação.',
    })
  })

  it('surfaces the API message for other failures', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: 'CONFLICT',
            message: 'Cargo de sistema não pode ser removido',
          },
        },
        409
      )
    )

    const failure = rbacClient.deleteRole('2')

    await expect(failure).rejects.toBeInstanceOf(RbacClientError)
    await expect(failure).rejects.toThrow(
      'Cargo de sistema não pode ser removido'
    )
  })

  it('falls back to a generic message when the error body is unreadable', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('invalid json')
      },
    } as unknown as Response)

    await expect(rbacClient.listRoles()).rejects.toThrow(
      'Não foi possível concluir a operação.'
    )
  })
})
