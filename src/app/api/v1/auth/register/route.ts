import { NextResponse } from 'next/server'

import { registerSchema } from '@/features/auth/schemas'
import { registerUserService } from '@/features/auth/services'
import type { RegisterSuccessResponse } from '@/features/auth/types'
import { ValidationError } from '@/infra/errors'
import { handleApiError, parseJsonBody } from '@/infra/http'

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request)

    const parseResult = registerSchema.safeParse(body)
    if (!parseResult.success) {
      throw new ValidationError('Dados inválidos', {
        cause: parseResult.error,
      })
    }

    const user = await registerUserService.execute(parseResult.data)

    const response: RegisterSuccessResponse = {
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    }

    return NextResponse.json(response, {
      status: 201,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
