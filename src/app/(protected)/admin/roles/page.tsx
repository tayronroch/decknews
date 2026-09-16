import { requirePageUser } from '@/features/auth/services/require-page-user'
import { RoleManager } from '@/features/rbac/components'
import { requirePermission } from '@/features/rbac/services'
import { ForbiddenError } from '@/infra/errors'

export default async function AdminRolesPage() {
  const user = await requirePageUser('/admin/roles')

  try {
    await requirePermission(user, 'role.read')
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error
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
