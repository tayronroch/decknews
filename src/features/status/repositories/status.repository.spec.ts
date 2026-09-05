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

  it('resolves successfully when the database responds', async () => {
    jest.mocked(mockPrisma.$queryRaw).mockResolvedValueOnce([{ '?column?': 1 }])

    await expect(checkDatabaseStatus()).resolves.toBeUndefined()
  })

  it('propagates the error when Prisma throws', async () => {
    const dbError = new Error('Connection refused')
    jest.mocked(mockPrisma.$queryRaw).mockRejectedValueOnce(dbError)

    await expect(checkDatabaseStatus()).rejects.toThrow('Connection refused')
  })

  it('executes a raw SELECT query against the database', async () => {
    jest.mocked(mockPrisma.$queryRaw).mockResolvedValueOnce([])

    await checkDatabaseStatus()

    expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1)
  })
})
