import { execFile } from 'node:child_process'
import fs from 'node:fs'
import { resolve } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export class MigrationInProgressError extends Error {
  constructor(message = 'A migration execution is already in progress.') {
    super(message)
    this.name = 'MigrationInProgressError'
  }
}

export class MigrationExecutionError extends Error {
  public readonly output: string
  public readonly details: string

  constructor(message: string, options: { output: string; details: string }) {
    super(message)
    this.name = 'MigrationExecutionError'
    this.output = options.output
    this.details = options.details
  }
}

let isMigrating = false

export function resolvePrismaCli(): { file: string; baseArgs: string[] } {
  const directPath = resolve(
    process.cwd(),
    'node_modules/prisma/build/index.js'
  )

  if (fs.existsSync(directPath)) {
    return {
      file: process.execPath,
      baseArgs: [directPath],
    }
  }

  try {
    const resolvedPath = require.resolve('prisma/build/index.js')
    if (fs.existsSync(resolvedPath)) {
      return {
        file: process.execPath,
        baseArgs: [resolvedPath],
      }
    }
  } catch {
    // Fallback to pnpm if direct script is not found
  }

  return {
    file: 'pnpm',
    baseArgs: ['prisma'],
  }
}

async function executePrisma(args: string[]): Promise<{
  stdout: string
  stderr: string
}> {
  const { file, baseArgs } = resolvePrismaCli()
  return execFileAsync(file, [...baseArgs, ...args])
}

function extractErrorStreams(error: unknown): {
  output: string
  details: string
} {
  const errorObj =
    error && typeof error === 'object'
      ? (error as Record<string, unknown>)
      : null

  const output = errorObj && 'stdout' in errorObj ? String(errorObj.stdout) : ''
  const details =
    errorObj && 'stderr' in errorObj
      ? String(errorObj.stderr)
      : String(error ?? '')

  return { output, details }
}

function isSchemaUpToDate(output: string): boolean {
  return (
    output.includes('Database schema is up to date') ||
    output.includes('No pending migrations')
  )
}

export async function checkMigrationStatus(): Promise<{
  status: 'up_to_date' | 'pending'
  message: string
  output: string
}> {
  try {
    const { stdout, stderr } = await executePrisma(['migrate', 'status'])
    const combinedOutput = `${stdout}\n${stderr}`.trim()
    const isUpToDate = isSchemaUpToDate(combinedOutput)

    return {
      status: isUpToDate ? 'up_to_date' : 'pending',
      message: isUpToDate
        ? 'Database schema is up to date.'
        : 'There are pending database migrations.',
      output: combinedOutput,
    }
  } catch (error: unknown) {
    const { output: errorOutput, details: errorDetails } =
      extractErrorStreams(error)
    const combinedOutput = `${errorOutput}\n${errorDetails}`.trim()

    if (isSchemaUpToDate(combinedOutput)) {
      return {
        status: 'up_to_date',
        message: 'Database schema is up to date.',
        output: combinedOutput,
      }
    }

    if (combinedOutput.includes('have not yet been applied')) {
      return {
        status: 'pending',
        message: 'There are pending database migrations.',
        output: combinedOutput,
      }
    }

    throw new MigrationExecutionError('Failed to inspect migration status.', {
      output: errorOutput,
      details: errorDetails,
    })
  }
}

export async function runPendingMigrations(): Promise<{
  status: 'success'
  message: string
  output: string
}> {
  if (isMigrating) {
    throw new MigrationInProgressError()
  }

  isMigrating = true
  try {
    const { stdout, stderr } = await executePrisma(['migrate', 'deploy'])
    const combinedOutput = `${stdout}\n${stderr}`.trim()
    return {
      status: 'success',
      message: 'Migrations executed successfully.',
      output: combinedOutput,
    }
  } catch (error: unknown) {
    const { output: errorOutput, details: errorDetails } =
      extractErrorStreams(error)

    throw new MigrationExecutionError('Failed to apply database migrations.', {
      output: errorOutput,
      details: errorDetails,
    })
  } finally {
    isMigrating = false
  }
}
