import { NextResponse } from 'next/server'

import { requireAuthenticatedUser } from '@/features/auth/services'
import { listPermissions } from '@/features/rbac/services'
import { handleApiError } from '@/infra/http'

export async function GET(request: Request) {
  try {
    const permissions = await listPermissions(
      await requireAuthenticatedUser(request)
    )
    return NextResponse.json({
      permissions: permissions.map((permission) => ({
        ...permission,
        id: permission.id.toString(),
      })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
