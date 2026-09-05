/**
 * @jest-environment node
 */
import { ERROR_CODES } from '@/infra/errors'
import { logger } from '@/infra/logging'

import { GET } from './route'

jest.mock('@/features/status/repositories/status.repository', () => ({
  checkDatabaseStatus: jest.fn(),
}))

import { checkDatabaseStatus } from '@/features/status/repositories/status.repository'

const mockCheckDatabaseStatus = jest.mocked(checkDatabaseStatus)

describe('GET /api/v1/status', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(logger, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when the database is healthy', () => {
    beforeEach(() => {
      mockCheckDatabaseStatus.mockResolvedValue(undefined)
    })

    it('returns HTTP 200', async () => {
      const response = await GET()
      expect(response.status).toBe(200)
    })

    it('returns status: ok', async () => {
      const response = await GET()
      const body = await response.json()
      expect(body.status).toBe('ok')
    })

    it('returns updatedAt as ISO 8601 timestamp', async () => {
      const response = await GET()
      const body = await response.json()
      expect(body.updatedAt).toBeDefined()
      expect(new Date(body.updatedAt).toISOString()).toBe(body.updatedAt)
    })

    it('returns database.status: healthy', async () => {
      const response = await GET()
      const body = await response.json()
      expect(body.database).toEqual({ status: 'healthy' })
    })
  })

  describe('when the database is unavailable', () => {
    beforeEach(() => {
      mockCheckDatabaseStatus.mockRejectedValue(
        new Error('Connection refused: prod-db:5432')
      )
    })

    it('returns HTTP 503', async () => {
      const response = await GET()
      expect(response.status).toBe(503)
    })

    it('returns the SERVICE_UNAVAILABLE error code', async () => {
      const response = await GET()
      const body = await response.json()
      expect(body.error.code).toBe(ERROR_CODES.SERVICE_UNAVAILABLE)
    })

    it('does not expose the original Prisma/database error message', async () => {
      const response = await GET()
      const body = await response.json()
      const jsonString = JSON.stringify(body)
      expect(jsonString).not.toContain('Connection refused')
      expect(jsonString).not.toContain('prod-db:5432')
    })

    it('does not expose stack trace to the client', async () => {
      const response = await GET()
      const body = await response.json()
      const jsonString = JSON.stringify(body)
      expect(jsonString).not.toContain('stack')
      expect(jsonString).not.toContain('.ts:')
    })

    it('logs the error on the server', async () => {
      await GET()
      expect(logger.error).toHaveBeenCalledTimes(1)
    })
  })
})
