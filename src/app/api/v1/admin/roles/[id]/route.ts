import { NextResponse } from 'next/server'

import { requireAuthenticatedUser } from '@/features/auth/services'
import { parseBigIntId, roleUpdateSchema } from '@/features/rbac/schemas'
import { deleteRole, updateRole } from '@/features/rbac/services'
import { ValidationError } from '@/infra/errors'
import { handleApiError, parseJsonBody } from '@/infra/http'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const parsed = roleUpdateSchema.safeParse(await parseJsonBody(request))
    if (!parsed.success)
      throw new ValidationError('Dados inválidos', { cause: parsed.error })
    const role = await updateRole(
      await requireAuthenticatedUser(request),
      parseBigIntId((await params).id),
      parsed.data
    )
    return NextResponse.json({
      role: {
        id: role.id.toString(),
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await deleteRole(
      await requireAuthenticatedUser(request),
      parseBigIntId((await params).id)
    )
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
