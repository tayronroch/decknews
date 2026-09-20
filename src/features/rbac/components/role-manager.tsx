'use client'

import { PlusIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { AdminPageShell } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { rbacClient } from '../client'
import type { PermissionDto, RoleDto, RolePanelCapabilities } from '../types'
import { LoadingError } from './loading-error'
import { RoleCard } from './role-card'
import { RoleForm } from './role-form'

function messageOf(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback
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
    // Untouched roles keep their object identity so RoleCard's savedKeys
    // effect (keyed on `role`) doesn't fire and wipe unsaved local edits.
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
    <AdminPageShell
      eyebrow="// Cargos"
      title="Cargos e permissões"
      description="Crie cargos e defina as permissões concedidas a cada um deles."
      backHref="/admin"
      backLabel="Voltar para o painel"
      action={
        capabilities.canCreate ? (
          <Button onClick={() => setEditing(null)}>
            <PlusIcon /> Novo cargo
          </Button>
        ) : undefined
      }
    >
      {loading && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-96 rounded-xs" />
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
        <section className="border-border/70 rounded-xs border border-dashed p-10 text-center">
          <h2 className="text-base font-medium tracking-tight">
            Nenhum cargo encontrado
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Crie o primeiro cargo para começar a organizar acessos.
          </p>
        </section>
      )}

      {!loading && !rolesError && roles.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
    </AdminPageShell>
  )
}
