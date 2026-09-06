/**
 * @jest-environment node
 */
import { prisma } from '@/infra/database'

import { checkDatabaseStatus } from './status.repository'

jest.mock('@/infra/database', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('checkDatabaseStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns the connection count when the database responds', async () => {
    jest
      .mocked(mockPrisma.$queryRaw)
      .mockResolvedValueOnce([{ connections: 3 }])

    const result = await checkDatabaseStatus()

    expect(result).toEqual({ connections: 3 })
  })

  it('propagates the error when Prisma throws', async () => {
    const dbError = new Error('Connection refused')
    jest.mocked(mockPrisma.$queryRaw).mockRejectedValueOnce(dbError)

    await expect(checkDatabaseStatus()).rejects.toThrow('Connection refused')
  })

  it('executes exactly one raw query against the database', async () => {
    jest
      .mocked(mockPrisma.$queryRaw)
      .mockResolvedValueOnce([{ connections: 1 }])

    await checkDatabaseStatus()

    expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1)
  })
})
