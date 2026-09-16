import { createHash, timingSafeEqual } from 'node:crypto'

import { NextRequest, NextResponse } from 'next/server'

// eslint-disable-next-line no-restricted-imports
import {
  checkMigrationStatus,
  MigrationExecutionError,
  MigrationInProgressError,
  runPendingMigrations,
} from '@/infra/database/migrator'
import { env } from '@/lib/env/server'

export const dynamic = 'force-dynamic'

function authenticateMigrationRequest(
  request: NextRequest
): NextResponse | null {
  if (!env.MIGRATION_TOKEN) {
    return NextResponse.json(
      {
        error: 'MigrationTokenNotConfigured',
        message: 'Server has no MIGRATION_TOKEN configured.',
      },
      { status: 500 }
    )
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Missing or malformed Authorization header.',
      },
      { status: 401 }
    )
  }

  const providedToken = authHeader.slice(7).trim()
  const expectedHash = createHash('sha256').update(env.MIGRATION_TOKEN).digest()
  const providedHash = createHash('sha256').update(providedToken).digest()

  if (!timingSafeEqual(expectedHash, providedHash)) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid migration token.' },
      { status: 401 }
    )
  }

  return null
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authError = authenticateMigrationRequest(request)
  if (authError) return authError

  try {
    const status = await checkMigrationStatus()
    return NextResponse.json(status, { status: 200 })
  } catch (error: unknown) {
    if (error instanceof MigrationExecutionError) {
      return NextResponse.json(
        {
          error: 'MigrationCheckFailed',
          message: error.message,
          details: error.details,
        },
        { status: 500 }
      )
    }
    return NextResponse.json(
      {
        error: 'InternalServerError',
        message: 'Unexpected error inspecting migrations.',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authError = authenticateMigrationRequest(request)
  if (authError) return authError

  try {
    const result = await runPendingMigrations()
    return NextResponse.json(result, { status: 200 })
  } catch (error: unknown) {
    if (error instanceof MigrationInProgressError) {
      return NextResponse.json(
        { error: 'MigrationInProgress', message: error.message },
        { status: 409 }
      )
    }
    if (error instanceof MigrationExecutionError) {
      return NextResponse.json(
        {
          error: 'MigrationFailed',
          message: error.message,
          details: error.details,
        },
        { status: 500 }
      )
    }
    return NextResponse.json(
      {
        error: 'InternalServerError',
        message: 'Unexpected error applying migrations.',
      },
      { status: 500 }
    )
  }
}
