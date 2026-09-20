/**
 * @jest-environment node
 */
import { userRepository } from '@/features/users/repositories'
import { ForbiddenError } from '@/infra/errors'

import { rbacRepository } from '../repositories'
import { listUsersWithRoles } from './rbac-management.service'

const actor = { id: 1n, name: 'Ada Lovelace', email: 'ada@example.com' }

const administrator = {
  id: 10n,
  name: 'Administrador',
  description: 'Cargo administrativo',
  isSystem: true,
}

describe('listUsersWithRoles', () => {
  beforeEach(() => jest.restoreAllMocks())

  it('combines users with the roles assigned to each one', async () => {
    jest
      .spyOn(rbacRepository, 'findEffectiveKeysByUserId')
      .mockResolvedValue(new Set(['user.read']))
    jest.spyOn(userRepository, 'listUsers').mockResolvedValue([
      {
        id: 1n,
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        id: 2n,
        name: 'Grace Hopper',
        email: 'grace@example.com',
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ])
    jest
      .spyOn(rbacRepository, 'findRolesByUserIds')
      .mockResolvedValue(new Map([[1n, [administrator]]]))

    const users = await listUsersWithRoles(actor)

    expect(rbacRepository.findRolesByUserIds).toHaveBeenCalledWith([1n, 2n])
    expect(users).toEqual([
      {
        id: 1n,
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        roles: [administrator],
      },
      {
        id: 2n,
        name: 'Grace Hopper',
        email: 'grace@example.com',
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        roles: [],
      },
    ])
  })

  it('refuses an actor without user.read', async () => {
    jest
      .spyOn(rbacRepository, 'findEffectiveKeysByUserId')
      .mockResolvedValue(new Set(['role.read']))
    const listUsers = jest.spyOn(userRepository, 'listUsers')

    await expect(listUsersWithRoles(actor)).rejects.toBeInstanceOf(
      ForbiddenError
    )
    expect(listUsers).not.toHaveBeenCalled()
  })

  it('does not query roles when there is no user', async () => {
    jest
      .spyOn(rbacRepository, 'findEffectiveKeysByUserId')
      .mockResolvedValue(new Set(['user.read']))
    jest.spyOn(userRepository, 'listUsers').mockResolvedValue([])
    const findRoles = jest.spyOn(rbacRepository, 'findRolesByUserIds')

    await expect(listUsersWithRoles(actor)).resolves.toEqual([])
    expect(findRoles).not.toHaveBeenCalled()
  })
})
