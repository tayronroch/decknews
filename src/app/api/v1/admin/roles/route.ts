import { NextResponse } from 'next/server'

import { requireAuthenticatedUser } from '@/features/auth/services'
import { roleSchema } from '@/features/rbac/schemas'
import { createRole, listRoles } from '@/features/rbac/services'
import { ValidationError } from '@/infra/errors'
import { handleApiError, parseJsonBody } from '@/infra/http'

function serializeRole(role: Awaited<ReturnType<typeof listRoles>>[number]) {
  return {
    id: role.id.toString(),
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    permissions: role.permissions.map((permission) => ({
      id: permission.id.toString(),
      key: permission.key,
      description: permission.description,
      module: permission.module,
    })),
  }
}

export async function GET(request: Request) {
  try {
    return NextResponse.json({
      roles: (await listRoles(await requireAuthenticatedUser(request))).map(
        serializeRole
      ),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const parsed = roleSchema.safeParse(await parseJsonBody(request))
    if (!parsed.success)
      throw new ValidationError('Dados inválidos', { cause: parsed.error })
    return NextResponse.json(
      {
        role: serializeRole(
          await createRole(await requireAuthenticatedUser(request), parsed.data)
        ),
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
