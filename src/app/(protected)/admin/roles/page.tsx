import { requirePageUser } from '@/features/auth/services/require-page-user'
import { RoleManager } from '@/features/rbac/components'
import { listEffectivePermissionKeys } from '@/features/rbac/services'

export default async function AdminRolesPage() {
  const user = await requirePageUser('/admin/roles')
  // Server-resolved: the panel only adjusts the experience, the API still authorizes.
  const granted = new Set(await listEffectivePermissionKeys(user))

  if (!granted.has('role.read')) {
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

  return (
    <RoleManager
      capabilities={{
        canCreate: granted.has('role.create'),
        canUpdate: granted.has('role.update'),
        canDelete: granted.has('role.delete'),
        canManagePermissions: granted.has('role.permissions.manage'),
      }}
    />
  )
}
