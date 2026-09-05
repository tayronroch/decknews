import { NextResponse } from 'next/server'

import { AppError, ERROR_CODES } from '@/infra/errors'
import { logger } from '@/infra/logging'

export interface ErrorResponseBody {
  error: {
    code: string
    message: string
  }
}

export function handleApiError(
  error: unknown
): NextResponse<ErrorResponseBody> {
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error(error.message, { error })
    }

    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      {
        status: error.statusCode,
      }
    )
  }

  const message =
    error instanceof Error ? error.message : 'Unexpected server error'
  logger.error(message, { error })

  return NextResponse.json(
    {
      error: {
        code: ERROR_CODES.INTERNAL_SERVER,
        message: 'Erro interno do servidor',
      },
    },
    {
      status: 500,
    }
  )
}
