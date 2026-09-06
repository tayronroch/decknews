import { NextResponse } from 'next/server'

import { checkDatabaseStatus } from '@/features/status/repositories/status.repository'
import type { StatusResponse } from '@/features/status/types/status-response'
import { ServiceUnavailableError } from '@/infra/errors'
import { handleApiError } from '@/infra/http'

export async function GET() {
  try {
    await checkDatabaseStatus().catch((error) => {
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
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    return handleApiError(error)
  }
}
