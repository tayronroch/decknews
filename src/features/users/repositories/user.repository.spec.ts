/**
 * @jest-environment node
 */
import type { CreateUserRepositoryInput } from '@/features/users/types'
import { getUniqueConstraintFields, prisma } from '@/infra/database'
import { UniqueConstraintError } from '@/shared/errors/persistence'

import {
  createUser,
  findUserAuthByEmail,
  findUserByEmail,
  findUserById,
  updatePasswordHash,
  userRepository,
} from './user.repository'

jest.mock('@/infra/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
  getUniqueConstraintFields: jest.fn(),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockGetUniqueConstraintFields = jest.mocked(getUniqueConstraintFields)

const expectedPublicSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
}

const expectedAuthSelect = {
  ...expectedPublicSelect,
  passwordHash: true,
}

const dbUser = {
  id: 123456789012345678n,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  passwordHash: 'hashed-value',
  role: 'USER' as const,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

const publicUser = {
  id: dbUser.id,
  name: dbUser.name,
  email: dbUser.email,
  createdAt: dbUser.createdAt,
  updatedAt: dbUser.updatedAt,
}

describe('UserRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUniqueConstraintFields.mockReturnValue(null)
  })

  describe('findUserById', () => {
    it('queries using the bigint id with public select projection (without passwordHash)', async () => {
      jest.mocked(mockPrisma.user.findUnique).mockResolvedValueOnce(publicUser)

      await findUserById(dbUser.id)

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: dbUser.id },
        select: expectedPublicSelect,
      })
      expect(typeof mockPrisma.user.findUnique.mock.calls[0][0].where.id).toBe(
        'bigint'
      )
    })

    it('returns the mapped user without passwordHash when found', async () => {
      jest.mocked(mockPrisma.user.findUnique).mockResolvedValueOnce(publicUser)

      const result = await findUserById(dbUser.id)

      expect(result).toEqual(publicUser)
      expect((result as Record<string, unknown>).passwordHash).toBeUndefined()
    })

    it('returns null when not found', async () => {
      jest.mocked(mockPrisma.user.findUnique).mockResolvedValueOnce(null)

      const result = await findUserById(999n)

      expect(result).toBeNull()
    })
  })

  describe('findUserByEmail', () => {
    it('queries using the given email with public select projection (without passwordHash)', async () => {
      jest.mocked(mockPrisma.user.findUnique).mockResolvedValueOnce(publicUser)

      await findUserByEmail('ADA@example.com')

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'ADA@example.com' },
        select: expectedPublicSelect,
      })
    })

    it('returns the mapped user without passwordHash when found', async () => {
      jest.mocked(mockPrisma.user.findUnique).mockResolvedValueOnce(publicUser)

      const result = await findUserByEmail(dbUser.email)

      expect(result).toEqual(publicUser)
      expect((result as Record<string, unknown>).passwordHash).toBeUndefined()
    })

    it('returns null when not found', async () => {
      jest.mocked(mockPrisma.user.findUnique).mockResolvedValueOnce(null)

      const result = await findUserByEmail('missing@example.com')

      expect(result).toBeNull()
    })

    it('does not normalize the email or apply business rules', async () => {
      jest.mocked(mockPrisma.user.findUnique).mockResolvedValueOnce(null)

      await findUserByEmail('  Mixed@Case.com  ')

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: '  Mixed@Case.com  ' },
        select: expectedPublicSelect,
      })
    })
  })

  describe('findUserAuthByEmail', () => {
    it('queries using the given email with auth select projection (including passwordHash)', async () => {
      jest.mocked(mockPrisma.user.findUnique).mockResolvedValueOnce(dbUser)

      await findUserAuthByEmail('ada@example.com')

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'ada@example.com' },
        select: expectedAuthSelect,
      })
    })

    it('returns UserAuthRecord containing passwordHash when found', async () => {
      jest.mocked(mockPrisma.user.findUnique).mockResolvedValueOnce(dbUser)

      const result = await findUserAuthByEmail(dbUser.email)

      expect(result).toEqual({
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        passwordHash: dbUser.passwordHash,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt,
      })
      expect(result?.passwordHash).toBe('hashed-value')
    })

    it('returns null when not found', async () => {
      jest.mocked(mockPrisma.user.findUnique).mockResolvedValueOnce(null)

      const result = await findUserAuthByEmail('missing@example.com')

      expect(result).toBeNull()
    })

    it('does not normalize email or apply business rules', async () => {
      jest.mocked(mockPrisma.user.findUnique).mockResolvedValueOnce(null)

      await findUserAuthByEmail('  Mixed@Case.com  ')

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: '  Mixed@Case.com  ' },
        select: expectedAuthSelect,
      })
    })
  })

  describe('updatePasswordHash', () => {
    it('updates passwordHash for the user by id', async () => {
      jest.mocked(mockPrisma.user.update).mockResolvedValueOnce(dbUser)

      await updatePasswordHash(123456789012345678n, 'new-hashed-value')

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 123456789012345678n },
        data: { passwordHash: 'new-hashed-value' },
      })
    })
  })

  describe('createUser', () => {
    const input = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      passwordHash: dbUser.passwordHash,
    }

    it('persists data using given id and selects only public fields (does not return passwordHash)', async () => {
      jest.mocked(mockPrisma.user.create).mockResolvedValueOnce(publicUser)

      const result = await createUser(input)

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          id: input.id,
          name: input.name,
          email: input.email,
          passwordHash: input.passwordHash,
          roles: {
            create: {
              role: {
                connect: { name: 'Usuário' },
              },
            },
          },
        },
        select: expectedPublicSelect,
      })
      expect(result).toEqual(publicUser)
      expect((result as Record<string, unknown>).passwordHash).toBeUndefined()
    })

    it('does not accept a plaintext password or an externally controlled role in its input type', () => {
      // Compile-time guarantee, checked by `tsc`: CreateUserRepositoryInput
      // rejects `password` and `role`, so this only type-checks if both
      // assignments below are actually rejected by the compiler.
      // @ts-expect-error - `password` is not part of CreateUserRepositoryInput
      const withPassword: CreateUserRepositoryInput = {
        ...input,
        password: 'plain',
      }
      // @ts-expect-error - `role` is not part of CreateUserRepositoryInput
      const withRole: CreateUserRepositoryInput = { ...input, role: 'ADMIN' }

      expect(withPassword).toBeDefined()
      expect(withRole).toBeDefined()
    })

    it('throws UniqueConstraintError when Prisma reports a unique constraint violation', async () => {
      const p2002Error = new Error('Unique constraint failed')
      jest.mocked(mockPrisma.user.create).mockRejectedValueOnce(p2002Error)
      mockGetUniqueConstraintFields.mockReturnValueOnce(['email'])

      await expect(createUser(input)).rejects.toThrow(UniqueConstraintError)
    })

    it('attaches the violation fields and original cause to UniqueConstraintError', async () => {
      const p2002Error = new Error('Unique constraint failed')
      jest.mocked(mockPrisma.user.create).mockRejectedValueOnce(p2002Error)
      mockGetUniqueConstraintFields.mockReturnValueOnce(['email'])

      let thrownError: unknown = null
      try {
        await createUser(input)
      } catch (error) {
        thrownError = error
      }

      expect(thrownError).toBeInstanceOf(UniqueConstraintError)
      const constraintError = thrownError as UniqueConstraintError
      expect(constraintError.fields).toEqual(['email'])
      expect(constraintError.cause).toBe(p2002Error)
      expect(mockGetUniqueConstraintFields).toHaveBeenCalledWith(p2002Error)
    })
  })

  describe('userRepository singleton', () => {
    it('exposes all defined repository methods', () => {
      expect(userRepository.findUserById).toBe(findUserById)
      expect(userRepository.findUserByEmail).toBe(findUserByEmail)
      expect(userRepository.findUserAuthByEmail).toBe(findUserAuthByEmail)
      expect(userRepository.updatePasswordHash).toBe(updatePasswordHash)
      expect(userRepository.createUser).toBe(createUser)
    })
  })

  describe('error propagation', () => {
    const input = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      passwordHash: dbUser.passwordHash,
    }

    it('propagates unexpected Prisma errors from findUserById', async () => {
      const dbError = new Error('Connection refused')
      jest.mocked(mockPrisma.user.findUnique).mockRejectedValueOnce(dbError)

      await expect(findUserById(dbUser.id)).rejects.toThrow(
        'Connection refused'
      )
    })

    it('propagates unexpected Prisma errors from findUserByEmail', async () => {
      const dbError = new Error('Connection refused')
      jest.mocked(mockPrisma.user.findUnique).mockRejectedValueOnce(dbError)

      await expect(findUserByEmail(dbUser.email)).rejects.toThrow(
        'Connection refused'
      )
    })

    it('propagates unexpected Prisma errors from findUserAuthByEmail', async () => {
      const dbError = new Error('Connection refused')
      jest.mocked(mockPrisma.user.findUnique).mockRejectedValueOnce(dbError)

      await expect(findUserAuthByEmail(dbUser.email)).rejects.toThrow(
        'Connection refused'
      )
    })

    it('propagates unexpected Prisma errors from updatePasswordHash', async () => {
      const dbError = new Error('Connection refused')
      jest.mocked(mockPrisma.user.update).mockRejectedValueOnce(dbError)

      await expect(updatePasswordHash(dbUser.id, 'new-hash')).rejects.toThrow(
        'Connection refused'
      )
    })

    it('propagates unexpected Prisma errors from createUser without translating them', async () => {
      const dbError = new Error('Connection refused')
      jest.mocked(mockPrisma.user.create).mockRejectedValueOnce(dbError)
      mockGetUniqueConstraintFields.mockReturnValueOnce(null)

      await expect(createUser(input)).rejects.toThrow('Connection refused')
    })
  })
})
