import { NextResponse } from 'next/server'

import { loginSchema } from '@/features/auth/schemas'
import { authenticateUserService } from '@/features/auth/services'
import type { LoginSuccessResponse } from '@/features/auth/types'
import { ValidationError } from '@/infra/errors'
import { handleApiError, parseJsonBody } from '@/infra/http'

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

    const response: LoginSuccessResponse = {
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }

    return NextResponse.json(response, {
      status: 200,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
