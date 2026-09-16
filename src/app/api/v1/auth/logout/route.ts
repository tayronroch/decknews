import { NextResponse } from 'next/server'

import { invalidateSessionService } from '@/features/sessions/services'
import {
  deleteSessionCookie,
  extractSessionToken,
  handleApiError,
} from '@/infra/http'

export async function POST(request: Request) {
  try {
    const token = extractSessionToken(request)
    await invalidateSessionService.execute(token)

    const response = new NextResponse(null, {
      status: 204,
    })

    deleteSessionCookie(response)

    return response
  } catch (error) {
    return handleApiError(error)
  }
}
