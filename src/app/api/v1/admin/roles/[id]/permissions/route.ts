import { NextResponse } from 'next/server'

import { requireAuthenticatedUser } from '@/features/auth/services'
import { parseBigIntId, permissionKeysSchema } from '@/features/rbac/schemas'
import { replaceRolePermissions } from '@/features/rbac/services'
import { ValidationError } from '@/infra/errors'
import { handleApiError, parseJsonBody } from '@/infra/http'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const parsed = permissionKeysSchema.safeParse(await parseJsonBody(request))
    if (!parsed.success)
      throw new ValidationError('Dados inválidos', { cause: parsed.error })
    await replaceRolePermissions(
      await requireAuthenticatedUser(request),
      parseBigIntId((await params).id),
      parsed.data.permissions
    )
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
