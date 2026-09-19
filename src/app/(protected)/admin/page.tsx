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
    <main className="mx-auto min-h-screen max-w-5xl p-4 sm:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Painel administrativo
        </h1>
        <p className="text-muted-foreground mt-2">
          Área administrativa do Decknews.
        </p>
      </header>
      <AdminNav items={items} />
    </main>
  )
}
