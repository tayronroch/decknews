'use client'

import { PlusIcon, RefreshCwIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { rbacClient } from '../client'
import type { PermissionDto, RoleDto, RolePanelCapabilities } from '../types'
import { RoleCard } from './role-card'
import { RoleForm } from './role-form'

function messageOf(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback
}

function LoadingError({
  title,
  message,
  onRetry,
}: {
  title: string
  message: string
  onRetry: () => void
}) {
  return (
    <section className="border-destructive/50 mb-5 rounded-xl border p-6">
      <h2 className="font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{message}</p>
      <Button className="mt-4" variant="outline" onClick={onRetry}>
        <RefreshCwIcon /> Tentar novamente
      </Button>
    </section>
  )
}

export function RoleManager({
  capabilities,
}: {
  capabilities: RolePanelCapabilities
}) {
  const [roles, setRoles] = useState<RoleDto[]>([])
  const [permissions, setPermissions] = useState<PermissionDto[]>([])
  const [loading, setLoading] = useState(true)
  const [rolesError, setRolesError] = useState<string | null>(null)
  const [permissionsError, setPermissionsError] = useState<string | null>(null)
  // undefined = dialog closed, null = creating, RoleDto = editing.
  const [editing, setEditing] = useState<RoleDto | null | undefined>(undefined)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setRolesError(null)
    setPermissionsError(null)

    const [roleResult, permissionResult] = await Promise.allSettled([
      rbacClient.listRoles(),
      rbacClient.listPermissions(),
    ])

    if (roleResult.status === 'fulfilled') setRoles(roleResult.value)
    else
      setRolesError(
        messageOf(roleResult.reason, 'Não foi possível carregar os cargos.')
      )

    if (permissionResult.status === 'fulfilled')
      setPermissions(permissionResult.value)
    else
      setPermissionsError(
        messageOf(
          permissionResult.reason,
          'Não foi possível carregar as permissões.'
        )
      )

    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function upsertRole(saved: RoleDto) {
    setRoles((current) =>
      current.some((role) => role.id === saved.id)
        ? current.map((role) => (role.id === saved.id ? saved : role))
        : [...current, saved].sort((first, second) =>
            first.name.localeCompare(second.name, 'pt-BR')
          )
    )
  }

  async function removeRole(role: RoleDto) {
    setDeletingId(role.id)
    try {
      await rbacClient.deleteRole(role.id)
      setRoles((current) => current.filter((item) => item.id !== role.id))
      toast.success('Cargo excluído.')
    } catch (error) {
      toast.error(messageOf(error, 'Não foi possível excluir o cargo.'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl p-4 sm:p-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Cargos e permissões
          </h1>
          <p className="text-muted-foreground mt-2">
            Crie cargos e defina as permissões concedidas a cada um deles.
          </p>
        </div>
        {capabilities.canCreate && (
          <Button onClick={() => setEditing(null)}>
            <PlusIcon /> Novo cargo
          </Button>
        )}
      </header>

      {loading && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-96" />
          ))}
        </div>
      )}

      {!loading && rolesError && (
        <LoadingError
          title="Não foi possível carregar os cargos"
          message={rolesError}
          onRetry={() => void load()}
        />
      )}

      {!loading && permissionsError && (
        <LoadingError
          title="Não foi possível carregar as permissões"
          message={permissionsError}
          onRetry={() => void load()}
        />
      )}

      {!loading && !rolesError && roles.length === 0 && (
        <section className="rounded-xl border border-dashed p-10 text-center">
          <h2 className="font-semibold">Nenhum cargo encontrado</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Crie o primeiro cargo para começar a organizar acessos.
          </p>
        </section>
      )}

      {!loading && !rolesError && roles.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              permissions={permissions}
              capabilities={capabilities}
              deleting={deletingId === role.id}
              onEdit={setEditing}
              onDelete={(target) => void removeRole(target)}
              onUpdated={upsertRole}
            />
          ))}
        </div>
      )}

      {editing !== undefined && (
        <RoleForm
          role={editing}
          permissions={permissions}
          canManagePermissions={capabilities.canManagePermissions}
          onClose={() => setEditing(undefined)}
          onSaved={upsertRole}
        />
      )}
    </main>
  )
}
