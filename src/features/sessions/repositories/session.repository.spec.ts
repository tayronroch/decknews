/**
 * @jest-environment node
 */
import type { CreateSessionRepositoryInput } from '@/features/sessions/types'
import { getUniqueConstraintFields, prisma } from '@/infra/database'
import { UniqueConstraintError } from '@/shared/errors/persistence'

import {
  createSession,
  deleteSessionById,
  deleteSessionByTokenHash,
  deleteSessionsByUserId,
  findSessionByTokenHash,
  sessionRepository,
} from './session.repository'

jest.mock('@/infra/database', () => ({
  prisma: {
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
  getUniqueConstraintFields: jest.fn(),
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockGetUniqueConstraintFields = jest.mocked(getUniqueConstraintFields)

const expectedSessionFields = {
  id: true,
  tokenHash: true,
  userId: true,
  expiresAt: true,
  createdAt: true,
}

const dbSession = {
  id: 111222333444555666n,
  tokenHash: 'a'.repeat(64),
  userId: 987654321012345678n,
  expiresAt: new Date('2026-09-22T00:00:00.000Z'),
  createdAt: new Date('2026-09-15T00:00:00.000Z'),
}

describe('SessionRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUniqueConstraintFields.mockReturnValue(null)
  })

  describe('createSession', () => {
    const input: CreateSessionRepositoryInput = {
      id: dbSession.id,
      tokenHash: dbSession.tokenHash,
      userId: dbSession.userId,
      expiresAt: dbSession.expiresAt,
    }

    it('persists data using given id and selects session fields', async () => {
      jest.mocked(mockPrisma.session.create).mockResolvedValueOnce(dbSession)

      const result = await createSession(input)

      expect(mockPrisma.session.create).toHaveBeenCalledWith({
        data: {
          id: input.id,
          tokenHash: input.tokenHash,
          userId: input.userId,
          expiresAt: input.expiresAt,
        },
        select: expectedSessionFields,
      })
      expect(result).toEqual(dbSession)
    })

    it('throws UniqueConstraintError when tokenHash unique constraint fails', async () => {
      const p2002Error = new Error('Unique constraint failed')
      jest.mocked(mockPrisma.session.create).mockRejectedValueOnce(p2002Error)
      mockGetUniqueConstraintFields.mockReturnValueOnce(['tokenHash'])

      await expect(createSession(input)).rejects.toThrow(UniqueConstraintError)
    })
  })

  describe('findSessionByTokenHash', () => {
    it('queries using tokenHash with session select projection', async () => {
      jest
        .mocked(mockPrisma.session.findUnique)
        .mockResolvedValueOnce(dbSession)

      const result = await findSessionByTokenHash(dbSession.tokenHash)

      expect(mockPrisma.session.findUnique).toHaveBeenCalledWith({
        where: { tokenHash: dbSession.tokenHash },
        select: expectedSessionFields,
      })
      expect(result).toEqual(dbSession)
    })

    it('returns null when session is not found', async () => {
      jest.mocked(mockPrisma.session.findUnique).mockResolvedValueOnce(null)

      const result = await findSessionByTokenHash('nonexistent-hash')

      expect(result).toBeNull()
    })
  })

  describe('deleteSessionById', () => {
    it('deletes session using deleteMany with id', async () => {
      jest
        .mocked(mockPrisma.session.deleteMany)
        .mockResolvedValueOnce({ count: 1 })

      await deleteSessionById(dbSession.id)

      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
        where: { id: dbSession.id },
      })
    })
  })

  describe('deleteSessionByTokenHash', () => {
    it('deletes session using deleteMany with tokenHash', async () => {
      jest
        .mocked(mockPrisma.session.deleteMany)
        .mockResolvedValueOnce({ count: 1 })

      await deleteSessionByTokenHash(dbSession.tokenHash)

      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
        where: { tokenHash: dbSession.tokenHash },
      })
    })

    it('succeeds without error when session does not exist (idempotent)', async () => {
      jest
        .mocked(mockPrisma.session.deleteMany)
        .mockResolvedValueOnce({ count: 0 })

      await expect(
        deleteSessionByTokenHash('nonexistent-hash')
      ).resolves.toBeUndefined()

      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
        where: { tokenHash: 'nonexistent-hash' },
      })
    })
  })

  describe('deleteSessionsByUserId', () => {
    it('deletes sessions using deleteMany with userId', async () => {
      jest
        .mocked(mockPrisma.session.deleteMany)
        .mockResolvedValueOnce({ count: 2 })

      await deleteSessionsByUserId(dbSession.userId)

      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: dbSession.userId },
      })
    })
  })

  describe('sessionRepository singleton', () => {
    it('exposes all defined repository methods', () => {
      expect(sessionRepository.createSession).toBe(createSession)
      expect(sessionRepository.findSessionByTokenHash).toBe(
        findSessionByTokenHash
      )
      expect(sessionRepository.deleteSessionById).toBe(deleteSessionById)
      expect(sessionRepository.deleteSessionByTokenHash).toBe(
        deleteSessionByTokenHash
      )
      expect(sessionRepository.deleteSessionsByUserId).toBe(
        deleteSessionsByUserId
      )
    })
  })

  describe('error propagation', () => {
    it('propagates database error from findSessionByTokenHash', async () => {
      const error = new Error('Database connection timeout')
      jest.mocked(mockPrisma.session.findUnique).mockRejectedValueOnce(error)

      await expect(findSessionByTokenHash(dbSession.tokenHash)).rejects.toThrow(
        'Database connection timeout'
      )
    })
  })
})
