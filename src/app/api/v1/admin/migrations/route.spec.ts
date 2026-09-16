/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

import {
  checkMigrationStatus,
  MigrationExecutionError,
  MigrationInProgressError,
  runPendingMigrations,
} from '@/infra/database/migrator'

import { dynamic, GET, POST } from './route'

const VALID_TOKEN = 'test-secure-migration-token-123456'

const mockEnv: { MIGRATION_TOKEN: string | undefined } = {
  MIGRATION_TOKEN: VALID_TOKEN,
}

jest.mock('@/lib/env/server', () => ({
  get env() {
    return mockEnv
  },
}))

jest.mock('@/infra/database/migrator', () => {
  const actual = jest.requireActual<typeof import('@/infra/database/migrator')>(
    '@/infra/database/migrator'
  )
  return {
    ...actual,
    checkMigrationStatus: jest.fn(),
    runPendingMigrations: jest.fn(),
  }
})

const mockCheckMigrationStatus = jest.mocked(checkMigrationStatus)
const mockRunPendingMigrations = jest.mocked(runPendingMigrations)

function createMigrationRequest(
  method: 'GET' | 'POST',
  options: { authHeader?: string } = {}
): NextRequest {
  const headers: Record<string, string> = {}
  if (options.authHeader !== undefined) {
    headers.authorization = options.authHeader
  }

  return new NextRequest('http://localhost:3000/api/v1/admin/migrations', {
    method,
    headers,
  })
}

describe('/api/v1/admin/migrations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockEnv.MIGRATION_TOKEN = VALID_TOKEN
  })

  describe('Authentication & Configuration', () => {
    it('configures route as force-dynamic', () => {
      expect(dynamic).toBe('force-dynamic')
    })

    it('returns 500 when MIGRATION_TOKEN is not configured on server (GET)', async () => {
      mockEnv.MIGRATION_TOKEN = undefined
      const request = createMigrationRequest('GET', {
        authHeader: `Bearer ${VALID_TOKEN}`,
      })

      const response = await GET(request)
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data).toEqual({
        error: 'MigrationTokenNotConfigured',
        message: 'Server has no MIGRATION_TOKEN configured.',
      })
    })

    it('returns 500 when MIGRATION_TOKEN is not configured on server (POST)', async () => {
      mockEnv.MIGRATION_TOKEN = undefined
      const request = createMigrationRequest('POST', {
        authHeader: `Bearer ${VALID_TOKEN}`,
      })

      const response = await POST(request)
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data).toEqual({
        error: 'MigrationTokenNotConfigured',
        message: 'Server has no MIGRATION_TOKEN configured.',
      })
    })

    it('returns 401 when Authorization header is missing', async () => {
      const request = createMigrationRequest('GET')

      const response = await GET(request)
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data).toEqual({
        error: 'Unauthorized',
        message: 'Missing or malformed Authorization header.',
      })
    })

    it('returns 401 when Authorization header does not start with Bearer', async () => {
      const request = createMigrationRequest('GET', {
        authHeader: `Basic ${VALID_TOKEN}`,
      })

      const response = await GET(request)
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data).toEqual({
        error: 'Unauthorized',
        message: 'Missing or malformed Authorization header.',
      })
    })

    it('returns 401 when token length does not match', async () => {
      const request = createMigrationRequest('GET', {
        authHeader: 'Bearer wrong-length',
      })

      const response = await GET(request)
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data).toEqual({
        error: 'Unauthorized',
        message: 'Invalid migration token.',
      })
    })

    it('returns 401 when token length matches but content is invalid', async () => {
      const sameLengthInvalidToken = 'x'.repeat(VALID_TOKEN.length)
      const request = createMigrationRequest('GET', {
        authHeader: `Bearer ${sameLengthInvalidToken}`,
      })

      const response = await GET(request)
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data).toEqual({
        error: 'Unauthorized',
        message: 'Invalid migration token.',
      })
    })
  })

  describe('GET /api/v1/admin/migrations', () => {
    it('returns 200 with migration status when up_to_date', async () => {
      mockCheckMigrationStatus.mockResolvedValue({
        status: 'up_to_date',
        message: 'Database schema is up to date.',
        output: 'Database schema is up to date.',
      })

      const request = createMigrationRequest('GET', {
        authHeader: `Bearer ${VALID_TOKEN}`,
      })

      const response = await GET(request)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual({
        status: 'up_to_date',
        message: 'Database schema is up to date.',
        output: 'Database schema is up to date.',
      })
      expect(mockCheckMigrationStatus).toHaveBeenCalledTimes(1)
    })

    it('returns 200 with migration status when pending', async () => {
      mockCheckMigrationStatus.mockResolvedValue({
        status: 'pending',
        message: 'There are pending database migrations.',
        output: '1 migration found: 20260916_init',
      })

      const request = createMigrationRequest('GET', {
        authHeader: `Bearer ${VALID_TOKEN}`,
      })

      const response = await GET(request)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual({
        status: 'pending',
        message: 'There are pending database migrations.',
        output: '1 migration found: 20260916_init',
      })
      expect(mockCheckMigrationStatus).toHaveBeenCalledTimes(1)
    })

    it('returns 500 when checkMigrationStatus throws MigrationExecutionError', async () => {
      mockCheckMigrationStatus.mockRejectedValue(
        new MigrationExecutionError('Failed to inspect migration status.', {
          output: 'raw error stdout',
          details: 'database connection error',
        })
      )

      const request = createMigrationRequest('GET', {
        authHeader: `Bearer ${VALID_TOKEN}`,
      })

      const response = await GET(request)
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data).toEqual({
        error: 'MigrationCheckFailed',
        message: 'Failed to inspect migration status.',
        details: 'database connection error',
      })
    })

    it('returns 500 when checkMigrationStatus throws an unexpected error', async () => {
      mockCheckMigrationStatus.mockRejectedValue(new Error('Unknown crash'))

      const request = createMigrationRequest('GET', {
        authHeader: `Bearer ${VALID_TOKEN}`,
      })

      const response = await GET(request)
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data).toEqual({
        error: 'InternalServerError',
        message: 'Unexpected error inspecting migrations.',
      })
    })
  })

  describe('POST /api/v1/admin/migrations', () => {
    it('returns 200 with execution result on success', async () => {
      mockRunPendingMigrations.mockResolvedValue({
        status: 'success',
        message: 'Migrations executed successfully.',
        output: '1 migration applied.',
      })

      const request = createMigrationRequest('POST', {
        authHeader: `Bearer ${VALID_TOKEN}`,
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toEqual({
        status: 'success',
        message: 'Migrations executed successfully.',
        output: '1 migration applied.',
      })
      expect(mockRunPendingMigrations).toHaveBeenCalledTimes(1)
    })

    it('returns 409 when runPendingMigrations throws MigrationInProgressError', async () => {
      mockRunPendingMigrations.mockRejectedValue(
        new MigrationInProgressError(
          'A migration execution is already in progress.'
        )
      )

      const request = createMigrationRequest('POST', {
        authHeader: `Bearer ${VALID_TOKEN}`,
      })

      const response = await POST(request)
      expect(response.status).toBe(409)
      const data = await response.json()
      expect(data).toEqual({
        error: 'MigrationInProgress',
        message: 'A migration execution is already in progress.',
      })
    })

    it('returns 500 when runPendingMigrations throws MigrationExecutionError', async () => {
      mockRunPendingMigrations.mockRejectedValue(
        new MigrationExecutionError('Failed to apply database migrations.', {
          output: 'migration stdout',
          details: 'P3006: Migration failed to apply cleanly',
        })
      )

      const request = createMigrationRequest('POST', {
        authHeader: `Bearer ${VALID_TOKEN}`,
      })

      const response = await POST(request)
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data).toEqual({
        error: 'MigrationFailed',
        message: 'Failed to apply database migrations.',
        details: 'P3006: Migration failed to apply cleanly',
      })
    })

    it('returns 500 when runPendingMigrations throws an unexpected error', async () => {
      mockRunPendingMigrations.mockRejectedValue(new Error('Unknown crash'))

      const request = createMigrationRequest('POST', {
        authHeader: `Bearer ${VALID_TOKEN}`,
      })

      const response = await POST(request)
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data).toEqual({
        error: 'InternalServerError',
        message: 'Unexpected error applying migrations.',
      })
    })
  })
})
