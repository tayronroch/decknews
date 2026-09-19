import type { AuthenticatedUser } from '@/features/auth/services/get-current-user.service'
import { userRepository } from '@/features/users/repositories'
import { ConflictError, NotFoundError } from '@/infra/errors'
import { idGenerator } from '@/infra/id'

import { rbacRepository } from '../repositories'
import type { AdminUserRecord, RoleRecord } from '../types'
import { requirePermission } from './authorization.service'

export async function listRoles(actor: AuthenticatedUser) {
  await requirePermission(actor, 'role.read')
  return rbacRepository.listRoles()
}

export async function createRole(
  actor: AuthenticatedUser,
  input: { name: string; description?: string }
): Promise<RoleRecord> {
  await requirePermission(actor, 'role.create')
  return rbacRepository.createRole({ id: idGenerator.next(), ...input })
}

export async function updateRole(
  actor: AuthenticatedUser,
  id: bigint,
  input: { name?: string; description?: string | null }
) {
  await requirePermission(actor, 'role.update')
  const role = await rbacRepository.updateRole(id, input)
  if (!role) throw new NotFoundError('Cargo não encontrado')
  return role
}

export async function deleteRole(
  actor: AuthenticatedUser,
  id: bigint
): Promise<void> {
  await requirePermission(actor, 'role.delete')
  const role = await rbacRepository.findRoleById(id)
  if (!role) throw new NotFoundError('Cargo não encontrado')
  if (role.isSystem)
    throw new ConflictError('Cargo de sistema não pode ser removido')
  await rbacRepository.deleteRole(id)
}

export async function listPermissions(actor: AuthenticatedUser) {
  await requirePermission(actor, 'role.read')
  return rbacRepository.listPermissions()
}

export async function replaceRolePermissions(
  actor: AuthenticatedUser,
  id: bigint,
  permissions: string[]
): Promise<void> {
  await requirePermission(actor, 'role.permissions.manage')
  try {
    if (!(await rbacRepository.replaceRolePermissions(id, permissions)))
      throw new NotFoundError('Cargo ou permissão não encontrado')
  } catch (error) {
    if (error instanceof Error && error.message === 'LAST_MANAGER') {
      throw new ConflictError(
        'A última permissão administrativa não pode ser removida'
      )
    }
    throw error
  }
}

export async function listUserRoles(actor: AuthenticatedUser, userId: bigint) {
  await requirePermission(actor, 'user.read')
  return rbacRepository.findUserRoles(userId)
}

export async function replaceUserRoles(
  actor: AuthenticatedUser,
  userId: bigint,
  roleIds: bigint[]
): Promise<void> {
  await requirePermission(actor, 'user.manage')
  try {
    if (!(await rbacRepository.replaceUserRoles(userId, roleIds)))
      throw new NotFoundError('Usuário ou cargo não encontrado')
  } catch (error) {
    if (error instanceof Error && error.message === 'LAST_MANAGER') {
      throw new ConflictError('O último administrador não pode ser removido')
    }
    throw error
  }
}

// One query for the users, one for every assignment: no N+1 per user.
export async function listUsersWithRoles(
  actor: AuthenticatedUser
): Promise<AdminUserRecord[]> {
  await requirePermission(actor, 'user.read')

  const users = await userRepository.listUsers()
  if (users.length === 0) return []

  const rolesByUser = await rbacRepository.findRolesByUserIds(
    users.map((user) => user.id)
  )

  return users.map(({ id, name, email, createdAt }) => ({
    id,
    name,
    email,
    createdAt,
    roles: rolesByUser.get(id) ?? [],
  }))
}
