import { NextResponse } from 'next/server'

import { requireAuthenticatedUser } from '@/features/auth/services'
import type { LoginSuccessResponse } from '@/features/auth/types'
import { handleApiError } from '@/infra/http'

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request)

    const response: LoginSuccessResponse = {
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    return handleApiError(error)
  }
}
