import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import {
  checkMigrationStatus,
  MigrationExecutionError,
  MigrationInProgressError,
  runPendingMigrations,
} from './migrator'

jest.mock('node:child_process', () => {
  const mockExec = jest.fn()
  const fn = jest.fn()
  // @ts-expect-error custom promisifier symbol
  fn[Symbol.for('nodejs.util.promisify.custom')] = mockExec
  return {
    execFile: fn,
  }
})

jest.mock('child_process', () => {
  const mockExec = jest.fn()
  const fn = jest.fn()
  // @ts-expect-error custom promisifier symbol
  fn[Symbol.for('nodejs.util.promisify.custom')] = mockExec
  return {
    execFile: fn,
  }
})

// @ts-expect-error custom promisifier symbol access
const mockExecFileAsync = execFile[promisify.custom] as jest.Mock

describe('migrator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockExecFileAsync.mockReset()
  })

  describe('MigrationInProgressError', () => {
    it('uses default error message and sets name', () => {
      const error = new MigrationInProgressError()
      expect(error.name).toBe('MigrationInProgressError')
      expect(error.message).toBe(
        'A migration execution is already in progress.'
      )
      expect(error).toBeInstanceOf(Error)
    })

    it('accepts custom error message', () => {
      const error = new MigrationInProgressError('Custom lock message')
      expect(error.name).toBe('MigrationInProgressError')
      expect(error.message).toBe('Custom lock message')
    })
  })

  describe('MigrationExecutionError', () => {
    it('stores output and details with custom name', () => {
      const error = new MigrationExecutionError('Execution failed', {
        output: 'stdout output',
        details: 'stderr details',
      })
      expect(error.name).toBe('MigrationExecutionError')
      expect(error.message).toBe('Execution failed')
      expect(error.output).toBe('stdout output')
      expect(error.details).toBe('stderr details')
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('checkMigrationStatus', () => {
    it('returns up_to_date when output contains "Database schema is up to date"', async () => {
      mockExecFileAsync.mockResolvedValueOnce({
        stdout: 'Database schema is up to date.\n',
        stderr: '',
      })

      const result = await checkMigrationStatus()

      expect(mockExecFileAsync).toHaveBeenCalledWith('pnpm', [
        'prisma',
        'migrate',
        'status',
      ])
      expect(result).toEqual({
        status: 'up_to_date',
        message: 'Database schema is up to date.',
        output: 'Database schema is up to date.',
      })
    })

    it('returns up_to_date when output contains "No pending migrations"', async () => {
      mockExecFileAsync.mockResolvedValueOnce({
        stdout: 'No pending migrations found.\n',
        stderr: '',
      })

      const result = await checkMigrationStatus()

      expect(result.status).toBe('up_to_date')
      expect(result.message).toBe('Database schema is up to date.')
      expect(result.output).toContain('No pending migrations')
    })

    it('returns pending when successful output does not match up_to_date markers', async () => {
      mockExecFileAsync.mockResolvedValueOnce({
        stdout: '1 migration found that has not been applied yet.\n',
        stderr: '',
      })

      const result = await checkMigrationStatus()

      expect(result.status).toBe('pending')
      expect(result.message).toBe('There are pending database migrations.')
      expect(result.output).toContain('1 migration found')
    })

    it('returns up_to_date when execFile rejects but combined output contains up to date message', async () => {
      const error = Object.assign(new Error('Process exited with code 0/1'), {
        stdout: 'Database schema is up to date.\n',
        stderr: '',
      })
      mockExecFileAsync.mockRejectedValueOnce(error)

      const result = await checkMigrationStatus()

      expect(result.status).toBe('up_to_date')
      expect(result.message).toBe('Database schema is up to date.')
    })

    it('returns pending when execFile rejects with "have not yet been applied" output', async () => {
      const error = Object.assign(new Error('Command failed'), {
        stdout:
          'Following migrations have not yet been applied:\n20260916_init',
        stderr: '',
      })
      mockExecFileAsync.mockRejectedValueOnce(error)

      const result = await checkMigrationStatus()

      expect(result.status).toBe('pending')
      expect(result.message).toBe('There are pending database migrations.')
      expect(result.output).toContain('have not yet been applied')
    })

    it('throws MigrationExecutionError when command fails with unexpected error', async () => {
      const error = Object.assign(new Error('Connection to database refused'), {
        stdout: 'Some stdout before crash',
        stderr: 'FATAL: database unavailable',
      })
      mockExecFileAsync.mockRejectedValueOnce(error)

      await expect(checkMigrationStatus()).rejects.toThrow(
        MigrationExecutionError
      )

      await expect(checkMigrationStatus()).rejects.toMatchObject({
        name: 'MigrationExecutionError',
        message: 'Failed to inspect migration status.',
      })
    })

    it('handles non-object errors when command fails unexpectedly', async () => {
      mockExecFileAsync.mockRejectedValueOnce('raw error string')

      await expect(checkMigrationStatus()).rejects.toThrow(
        MigrationExecutionError
      )
    })
  })

  describe('runPendingMigrations', () => {
    it('executes prisma migrate deploy and returns success result', async () => {
      mockExecFileAsync.mockResolvedValueOnce({
        stdout: '1 migration applied successfully.',
        stderr: '',
      })

      const result = await runPendingMigrations()

      expect(mockExecFileAsync).toHaveBeenCalledWith('pnpm', [
        'prisma',
        'migrate',
        'deploy',
      ])
      expect(result).toEqual({
        status: 'success',
        message: 'Migrations executed successfully.',
        output: '1 migration applied successfully.',
      })
    })

    it('prevents concurrent migration runs by throwing MigrationInProgressError', async () => {
      let resolveFirstRun: (value: { stdout: string; stderr: string }) => void
      const firstRunPromise = new Promise<{ stdout: string; stderr: string }>(
        (resolve) => {
          resolveFirstRun = resolve
        }
      )

      mockExecFileAsync.mockImplementationOnce(() => firstRunPromise)

      const runningTask = runPendingMigrations()

      await expect(runPendingMigrations()).rejects.toThrow(
        MigrationInProgressError
      )

      resolveFirstRun!({
        stdout: 'Done migrating.',
        stderr: '',
      })
      await expect(runningTask).resolves.toEqual({
        status: 'success',
        message: 'Migrations executed successfully.',
        output: 'Done migrating.',
      })
    })

    it('releases lock after successful run allowing subsequent executions', async () => {
      mockExecFileAsync.mockResolvedValueOnce({
        stdout: 'First run done.',
        stderr: '',
      })

      const firstResult = await runPendingMigrations()
      expect(firstResult.status).toBe('success')

      mockExecFileAsync.mockResolvedValueOnce({
        stdout: 'Second run done.',
        stderr: '',
      })

      const secondResult = await runPendingMigrations()
      expect(secondResult.status).toBe('success')
      expect(mockExecFileAsync).toHaveBeenCalledTimes(2)
    })

    it('releases lock after failed run allowing subsequent executions', async () => {
      const error = Object.assign(new Error('Migration failed'), {
        stdout: 'Applying migration 2026...',
        stderr: 'Error: table already exists',
      })
      mockExecFileAsync.mockRejectedValueOnce(error)

      await expect(runPendingMigrations()).rejects.toThrow(
        MigrationExecutionError
      )

      mockExecFileAsync.mockResolvedValueOnce({
        stdout: 'Retried migration successfully.',
        stderr: '',
      })

      const retryResult = await runPendingMigrations()
      expect(retryResult.status).toBe('success')
      expect(retryResult.output).toBe('Retried migration successfully.')
    })

    it('throws MigrationExecutionError with output and details on failure', async () => {
      const error = Object.assign(new Error('Process exited with code 1'), {
        stdout: 'Partial stdout',
        stderr: 'Critical database connection failure',
      })
      mockExecFileAsync.mockRejectedValueOnce(error)

      try {
        await runPendingMigrations()
        fail('Should have thrown MigrationExecutionError')
      } catch (err) {
        expect(err).toBeInstanceOf(MigrationExecutionError)
        const execError = err as MigrationExecutionError
        expect(execError.message).toBe('Failed to apply database migrations.')
        expect(execError.output).toBe('Partial stdout')
        expect(execError.details).toBe('Critical database connection failure')
      }
    })

    it('handles non-object error on migration failure', async () => {
      mockExecFileAsync.mockRejectedValueOnce('raw string error')

      try {
        await runPendingMigrations()
        fail('Should have thrown MigrationExecutionError')
      } catch (err) {
        expect(err).toBeInstanceOf(MigrationExecutionError)
        const execError = err as MigrationExecutionError
        expect(execError.output).toBe('')
        expect(execError.details).toBe('raw string error')
      }
    })
  })
})
