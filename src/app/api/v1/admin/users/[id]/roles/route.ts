import { NextResponse } from 'next/server'

import { requireAuthenticatedUser } from '@/features/auth/services'
import { parseBigIntId, roleIdsSchema } from '@/features/rbac/schemas'
import { listUserRoles, replaceUserRoles } from '@/features/rbac/services'
import { ValidationError } from '@/infra/errors'
import { handleApiError, parseJsonBody } from '@/infra/http'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const roles = await listUserRoles(
      await requireAuthenticatedUser(request),
      parseBigIntId((await params).id)
    )
    return NextResponse.json({
      roles: roles.map((role) => ({
        id: role.id.toString(),
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const parsed = roleIdsSchema.safeParse(await parseJsonBody(request))
    if (!parsed.success)
      throw new ValidationError('Dados inválidos', { cause: parsed.error })
    await replaceUserRoles(
      await requireAuthenticatedUser(request),
      parseBigIntId((await params).id),
      parsed.data.roleIds.map(BigInt)
    )
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
