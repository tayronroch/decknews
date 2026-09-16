import { cookies } from 'next/headers'

import { getCurrentUserBySessionToken } from '@/features/auth/services'
import { RoleManager } from '@/features/rbac/components'
import { requirePermission } from '@/features/rbac/services'
import { ForbiddenError, UnauthorizedError } from '@/infra/errors'
import { SESSION_COOKIE_NAME } from '@/infra/http'

export default async function AdminRolesPage() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value
  const user = await getCurrentUserBySessionToken(token)

  try {
    await requirePermission(user, 'role.read')
  } catch (error) {
    if (!(
      error instanceof ForbiddenError || error instanceof UnauthorizedError
    )) {
      throw error
    }
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center p-6">
        <section className="w-full rounded-xl border p-8 text-center">
          <h1 className="text-2xl font-semibold">Acesso não autorizado</h1>
          <p className="text-muted-foreground mt-2">
            Você não tem permissão para administrar cargos e permissões.
          </p>
        </section>
      </main>
    )
  }

  return <RoleManager />
}
