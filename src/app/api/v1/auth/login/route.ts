import { NextResponse } from 'next/server'

import { loginSchema } from '@/features/auth/schemas'
import { authenticateUserService } from '@/features/auth/services'
import type { LoginSuccessResponse } from '@/features/auth/types'
import { createSessionService } from '@/features/sessions/services'
import { ValidationError } from '@/infra/errors'
import { handleApiError, parseJsonBody, setSessionCookie } from '@/infra/http'

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request)

    const parseResult = loginSchema.safeParse(body)
    if (!parseResult.success) {
      throw new ValidationError('Dados inválidos', {
        cause: parseResult.error,
      })
    }

    const user = await authenticateUserService.execute(parseResult.data)
    const { session, rawToken } = await createSessionService.execute({
      userId: user.id,
    })

    const responseBody: LoginSuccessResponse = {
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
      },
    }

    const response = NextResponse.json(responseBody, {
      status: 200,
    })

    setSessionCookie(response, rawToken, session.expiresAt)

    return response
  } catch (error) {
    return handleApiError(error)
  }
}
