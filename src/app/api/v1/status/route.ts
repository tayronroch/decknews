import { NextResponse } from 'next/server'

import { checkDatabaseStatus } from '@/features/status/repositories/status.repository'
import type { StatusResponse } from '@/features/status/types/status-response'
import { ServiceUnavailableError } from '@/infra/errors'
import { handleApiError } from '@/infra/http'
import { env } from '@/lib/env/server'

export async function GET() {
  try {
    const dbStatus = await checkDatabaseStatus().catch((error) => {
      throw new ServiceUnavailableError(
        'Serviço temporariamente indisponível',
        {
          cause: error,
        }
      )
    })

    const response: StatusResponse = {
      status: 'ok',
      updatedAt: new Date().toISOString(),
      database: {
        status: 'healthy',
        connections: dbStatus.connections,
        poolLimit: env.DATABASE_POOL_SIZE,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    return handleApiError(error)
  }
}
