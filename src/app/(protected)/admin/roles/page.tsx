import { AdminPageShell } from '@/components/layout'
import { requirePageUser } from '@/features/auth/services/require-page-user'
import { RoleManager } from '@/features/rbac/components'
import { listEffectivePermissionKeys } from '@/features/rbac/services'

export default async function AdminRolesPage() {
  const user = await requirePageUser('/admin/roles')
  // Server-resolved: the panel only adjusts the experience, the API still authorizes.
  const granted = new Set(await listEffectivePermissionKeys(user))

  if (!granted.has('role.read')) {
    return (
      <AdminPageShell
        eyebrow="// Acesso"
        title="Acesso não autorizado"
        description="Você não tem permissão para administrar cargos e permissões."
        backHref="/admin"
        backLabel="Voltar para o painel"
      >
        <p className="text-muted-foreground max-w-prose text-sm">
          Peça a um administrador para conceder a permissão de visualizar
          cargos.
        </p>
      </AdminPageShell>
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
