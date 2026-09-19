import { requirePageUser } from '@/features/auth/services/require-page-user'
import { UserRoleManager } from '@/features/rbac/components'
import { listEffectivePermissionKeys } from '@/features/rbac/services'

export default async function AdminUsersPage() {
  const user = await requirePageUser('/admin/users')
  // Server-resolved: the panel only adjusts the experience, the API still authorizes.
  const granted = new Set(await listEffectivePermissionKeys(user))

  if (!granted.has('user.read')) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center p-6">
        <section className="w-full rounded-xl border p-8 text-center">
          <h1 className="text-2xl font-semibold">Acesso não autorizado</h1>
          <p className="text-muted-foreground mt-2">
            Você não tem permissão para administrar usuários.
          </p>
        </section>
      </main>
    )
  }

  return (
    <UserRoleManager
      capabilities={{ canManageRoles: granted.has('user.manage') }}
    />
  )
}
