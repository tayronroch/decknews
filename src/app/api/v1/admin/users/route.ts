import { NextResponse } from 'next/server'

import { requireAuthenticatedUser } from '@/features/auth/services'
import {
  listUsersWithRoles,
  serializeRoleSummary,
} from '@/features/rbac/services'
import { handleApiError } from '@/infra/http'

export async function GET(request: Request) {
  try {
    const users = await listUsersWithRoles(
      await requireAuthenticatedUser(request)
    )

    return NextResponse.json({
      users: users.map((user) => ({
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        roles: user.roles.map(serializeRoleSummary),
      })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
