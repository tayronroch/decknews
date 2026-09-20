/**
 * @jest-environment node
 */
import { ForbiddenError, UnauthorizedError } from '@/infra/errors'

import { rbacRepository } from '../repositories'
import {
  hasPermission,
  listEffectivePermissionKeys,
  requirePermission,
} from './authorization.service'

const user = {
  id: 987654321012345678n,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
}

describe('RBAC authorization', () => {
  beforeEach(() => jest.restoreAllMocks())

  it('combines server-resolved permissions to authorize a user', async () => {
    jest
      .spyOn(rbacRepository, 'findEffectiveKeysByUserId')
      .mockResolvedValue(new Set(['post.create', 'post.delete.any']))

    await expect(hasPermission(user, 'post.delete.any')).resolves.toBe(true)
    await expect(
      requirePermission(user, 'post.create')
    ).resolves.toBeUndefined()
  })

  it('does not trust a missing authenticated user', async () => {
    await expect(
      requirePermission(null, 'role.permissions.manage')
    ).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('rejects an authenticated user without the requested permission', async () => {
    jest
      .spyOn(rbacRepository, 'findEffectiveKeysByUserId')
      .mockResolvedValue(new Set(['post.read']))

    await expect(
      requirePermission(user, 'role.permissions.manage')
    ).rejects.toBeInstanceOf(ForbiddenError)
  })

  it('lists the effective permission keys of an authenticated user', async () => {
    jest
      .spyOn(rbacRepository, 'findEffectiveKeysByUserId')
      .mockResolvedValue(new Set(['role.update', 'role.read']))

    await expect(listEffectivePermissionKeys(user)).resolves.toEqual([
      'role.read',
      'role.update',
    ])
  })

  it('resolves no permission keys without an authenticated user', async () => {
    const finder = jest.spyOn(rbacRepository, 'findEffectiveKeysByUserId')

    await expect(listEffectivePermissionKeys(null)).resolves.toEqual([])
    expect(finder).not.toHaveBeenCalled()
  })
})
