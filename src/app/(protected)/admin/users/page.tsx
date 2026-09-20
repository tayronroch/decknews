import { AdminPageShell } from '@/components/layout'
import { requirePageUser } from '@/features/auth/services/require-page-user'
import { UserRoleManager } from '@/features/rbac/components'
import { listEffectivePermissionKeys } from '@/features/rbac/services'

export default async function AdminUsersPage() {
  const user = await requirePageUser('/admin/users')
  // Server-resolved: the panel only adjusts the experience, the API still authorizes.
  const granted = new Set(await listEffectivePermissionKeys(user))

  if (!granted.has('user.read')) {
    return (
      <AdminPageShell
        eyebrow="// Acesso"
        title="Acesso não autorizado"
        description="Você não tem permissão para administrar usuários."
        backHref="/admin"
        backLabel="Voltar para o painel"
      >
        <p className="text-muted-foreground max-w-prose text-sm">
          Peça a um administrador para conceder a permissão de visualizar
          usuários.
        </p>
      </AdminPageShell>
    )
  }

  return (
    <UserRoleManager
      capabilities={{ canManageRoles: granted.has('user.manage') }}
    />
  )
}
