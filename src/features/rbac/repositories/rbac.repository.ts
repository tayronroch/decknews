import { prisma } from '@/infra/database'

import type { PermissionRecord, RoleRecord, RoleSummaryRecord } from '../types'

const permissionFields = {
  id: true,
  key: true,
  description: true,
  module: true,
} as const
const roleFields = {
  id: true,
  name: true,
  description: true,
  isSystem: true,
  permissions: { select: { permission: { select: permissionFields } } },
} as const
// Same shape as roleFields but without the permissions fan-out: callers that
// only need id/name/description/isSystem (one role per user, at a listing
// scale) shouldn't pay for every permission row of every role.
const roleSummaryFields = {
  id: true,
  name: true,
  description: true,
  isSystem: true,
} as const

function toRole(role: {
  id: bigint
  name: string
  description: string | null
  isSystem: boolean
  permissions: { permission: PermissionRecord }[]
}): RoleRecord {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    permissions: role.permissions.map((item) => item.permission),
  }
}

function toRoleSummary(role: {
  id: bigint
  name: string
  description: string | null
  isSystem: boolean
}): RoleSummaryRecord {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
  }
}

export interface RbacRepository {
  findEffectiveKeysByUserId(userId: bigint): Promise<Set<string>>
  listRoles(): Promise<RoleRecord[]>
  findRoleById(id: bigint): Promise<RoleRecord | null>
  createRole(input: {
    id: bigint
    name: string
    description?: string
  }): Promise<RoleRecord>
  updateRole(
    id: bigint,
    input: { name?: string; description?: string | null }
  ): Promise<RoleRecord | null>
  deleteRole(id: bigint): Promise<boolean>
  listPermissions(): Promise<PermissionRecord[]>
  replaceRolePermissions(roleId: bigint, keys: string[]): Promise<boolean>
  findUserRoles(userId: bigint): Promise<RoleRecord[]>
  replaceUserRoles(userId: bigint, roleIds: bigint[]): Promise<boolean>
  findRolesByUserIds(
    userIds: bigint[]
  ): Promise<Map<bigint, RoleSummaryRecord[]>>
}

export async function findEffectiveKeysByUserId(
  userId: bigint
): Promise<Set<string>> {
  const rows = await prisma.userRole.findMany({
    where: { userId },
    select: {
      role: {
        select: {
          permissions: { select: { permission: { select: { key: true } } } },
        },
      },
    },
  })
  return new Set(
    rows.flatMap((row) =>
      row.role.permissions.map((item) => item.permission.key)
    )
  )
}

export async function listRoles(): Promise<RoleRecord[]> {
  return (
    await prisma.role.findMany({ select: roleFields, orderBy: { name: 'asc' } })
  ).map(toRole)
}

export async function findRoleById(id: bigint): Promise<RoleRecord | null> {
  const role = await prisma.role.findUnique({
    where: { id },
    select: roleFields,
  })
  return role ? toRole(role) : null
}

export async function createRole(input: {
  id: bigint
  name: string
  description?: string
}): Promise<RoleRecord> {
  return toRole(await prisma.role.create({ data: input, select: roleFields }))
}

export async function updateRole(
  id: bigint,
  input: { name?: string; description?: string | null }
): Promise<RoleRecord | null> {
  const role = await prisma.role
    .update({ where: { id }, data: input, select: roleFields })
    .catch(() => null)
  return role ? toRole(role) : null
}

export async function deleteRole(id: bigint): Promise<boolean> {
  const result = await prisma.role.deleteMany({
    where: { id, isSystem: false },
  })
  return result.count === 1
}

export async function listPermissions(): Promise<PermissionRecord[]> {
  return prisma.permission.findMany({
    select: permissionFields,
    orderBy: [{ module: 'asc' }, { key: 'asc' }],
  })
}

export async function replaceRolePermissions(
  roleId: bigint,
  keys: string[]
): Promise<boolean> {
  const permissions = await prisma.permission.findMany({
    where: { key: { in: keys } },
    select: { id: true },
  })
  if (permissions.length !== new Set(keys).size) return false
  const replaced = await prisma
    .$transaction(async (tx) => {
      const role = await tx.role.findUnique({
        where: { id: roleId },
        select: { id: true },
      })
      if (!role) throw new Error('ROLE_NOT_FOUND')
      await tx.rolePermission.deleteMany({ where: { roleId } })
      if (permissions.length)
        await tx.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId,
            permissionId: permission.id,
          })),
        })
      const managerPermission = await tx.permission.findUnique({
        where: { key: 'role.permissions.manage' },
        select: { id: true },
      })
      if (managerPermission) {
        const managers = await tx.userRole.count({
          where: {
            role: {
              permissions: { some: { permissionId: managerPermission.id } },
            },
          },
        })
        if (managers === 0) throw new Error('LAST_MANAGER')
      }
    })
    .catch((error) => {
      if ((error as Error).message === 'ROLE_NOT_FOUND') return null
      throw error
    })
  return replaced !== null
}

export async function findUserRoles(userId: bigint): Promise<RoleRecord[]> {
  const rows = await prisma.userRole.findMany({
    where: { userId },
    select: { role: { select: roleFields } },
  })
  return rows.map((row) => toRole(row.role))
}

export async function replaceUserRoles(
  userId: bigint,
  roleIds: bigint[]
): Promise<boolean> {
  const uniqueIds = [...new Set(roleIds)]
  const roles = await prisma.role.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true },
  })
  if (roles.length !== uniqueIds.length) return false
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })
  if (!user) return false
  await prisma.$transaction(async (tx) => {
    await tx.userRole.deleteMany({ where: { userId } })
    if (uniqueIds.length)
      await tx.userRole.createMany({
        data: uniqueIds.map((roleId) => ({ userId, roleId })),
      })
    const managerPermission = await tx.permission.findUnique({
      where: { key: 'role.permissions.manage' },
      select: { id: true },
    })
    if (managerPermission) {
      const managers = await tx.userRole.count({
        where: {
          role: {
            permissions: { some: { permissionId: managerPermission.id } },
          },
        },
      })
      if (managers === 0) throw new Error('LAST_MANAGER')
    }
  })
  return true
}

export async function findRolesByUserIds(
  userIds: bigint[]
): Promise<Map<bigint, RoleSummaryRecord[]>> {
  const rows = await prisma.userRole.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, role: { select: roleSummaryFields } },
  })

  return rows.reduce((result, row) => {
    const roles = result.get(row.userId) ?? []
    roles.push(toRoleSummary(row.role))
    return result.set(row.userId, roles)
  }, new Map<bigint, RoleSummaryRecord[]>())
}

export const rbacRepository: RbacRepository = {
  findEffectiveKeysByUserId,
  listRoles,
  findRoleById,
  createRole,
  updateRole,
  deleteRole,
  listPermissions,
  replaceRolePermissions,
  findUserRoles,
  replaceUserRoles,
  findRolesByUserIds,
}
