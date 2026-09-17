import type { AuthenticatedUser } from '@/features/auth/services/get-current-user.service'
import { ForbiddenError, UnauthorizedError } from '@/infra/errors'

import { rbacRepository } from '../repositories'

// Server-resolved permission set: the UI never supplies its own permissions.
export async function listEffectivePermissionKeys(
  user: AuthenticatedUser | null
): Promise<string[]> {
  if (!user) return []
  return [...(await rbacRepository.findEffectiveKeysByUserId(user.id))].sort()
}

export async function hasPermission(
  user: AuthenticatedUser | null,
  permission: string
): Promise<boolean> {
  if (!user) return false
  return (await rbacRepository.findEffectiveKeysByUserId(user.id)).has(
    permission
  )
}

export async function requirePermission(
  user: AuthenticatedUser | null,
  permission: string
): Promise<void> {
  if (!user) throw new UnauthorizedError()
  if (!(await hasPermission(user, permission))) throw new ForbiddenError()
}
