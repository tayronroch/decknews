import { AdminPageShell } from '@/components/layout'
import { requirePageUser } from '@/features/auth/services/require-page-user'
import { AdminNav, type AdminNavItem } from '@/features/rbac/components'
import { listEffectivePermissionKeys } from '@/features/rbac/services'

export default async function AdminPage() {
  const user = await requirePageUser('/admin')
  // Server-resolved: the visitor only sees the areas their permissions allow.
  const granted = new Set(await listEffectivePermissionKeys(user))

  const items: AdminNavItem[] = [
    ...(granted.has('role.read')
      ? [
          {
            href: '/admin/roles',
            title: 'Cargos e permissões',
            description:
              'Crie cargos e defina as permissões concedidas a cada um deles.',
          },
        ]
      : []),
    ...(granted.has('user.read')
      ? [
          {
            href: '/admin/users',
            title: 'Usuários',
            description: 'Defina quais cargos cada pessoa possui.',
          },
        ]
      : []),
  ]

  return (
    <AdminPageShell
      eyebrow="// Painel"
      title="Painel administrativo"
      description="Área administrativa do Decknews."
    >
      <AdminNav items={items} />
    </AdminPageShell>
  )
}
