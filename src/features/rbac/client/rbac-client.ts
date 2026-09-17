import type { PermissionDto, RoleDto, RoleSummaryDto } from '../types'

const ADMIN_BASE_PATH = '/api/v1/admin'

export class RbacClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message)
    this.name = 'RbacClientError'
  }
}

type ApiErrorBody = { error?: { code?: string; message?: string } }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: init?.body
      ? { 'Content-Type': 'application/json', ...init.headers }
      : (init?.headers ?? {}),
  })

  if (response.ok) {
    return (response.status === 204 ? undefined : await response.json()) as T
  }

  const body = (await response.json().catch(() => ({}))) as ApiErrorBody

  throw new RbacClientError(
    response.status === 403
      ? 'Você não tem permissão para realizar esta ação.'
      : (body.error?.message ?? 'Não foi possível concluir a operação.'),
    response.status
  )
}

export const rbacClient = {
  async listRoles(): Promise<RoleDto[]> {
    return (await request<{ roles: RoleDto[] }>(`${ADMIN_BASE_PATH}/roles`))
      .roles
  },

  async listPermissions(): Promise<PermissionDto[]> {
    return (
      await request<{ permissions: PermissionDto[] }>(
        `${ADMIN_BASE_PATH}/permissions`
      )
    ).permissions
  },

  async createRole(input: {
    name: string
    description?: string
  }): Promise<RoleDto> {
    return (
      await request<{ role: RoleDto }>(`${ADMIN_BASE_PATH}/roles`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    ).role
  },

  async updateRole(
    id: string,
    input: { name?: string; description?: string | null }
  ): Promise<RoleSummaryDto> {
    return (
      await request<{ role: RoleSummaryDto }>(`${ADMIN_BASE_PATH}/roles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      })
    ).role
  },

  deleteRole(id: string): Promise<void> {
    return request<void>(`${ADMIN_BASE_PATH}/roles/${id}`, { method: 'DELETE' })
  },

  replaceRolePermissions(id: string, permissions: string[]): Promise<void> {
    return request<void>(`${ADMIN_BASE_PATH}/roles/${id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    })
  },
}
