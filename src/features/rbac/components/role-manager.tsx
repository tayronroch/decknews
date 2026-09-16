'use client'

import {
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

type Permission = {
  id: string
  key: string
  description: string | null
  module: string | null
}

type Role = {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  permissions: Permission[]
}

type ApiError = { error?: { message?: string } }

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { 'content-type': 'application/json', ...options?.headers },
  })
  if (response.ok) {
    return (response.status === 204 ? undefined : response.json()) as T
  }

  const body = (await response.json().catch(() => ({}))) as ApiError
  if (response.status === 403)
    throw new Error('Você não tem permissão para realizar esta ação.')
  throw new Error(
    body.error?.message ?? 'Não foi possível concluir a operação.'
  )
}

function PermissionList({
  permissions,
  selected,
  onToggle,
  filter,
  disabled,
}: {
  permissions: Permission[]
  selected: Set<string>
  onToggle: (key: string) => void
  filter: string
  disabled: boolean
}) {
  const groups = useMemo(() => {
    const term = filter.trim().toLocaleLowerCase('pt-BR')
    return permissions
      .filter((permission) => {
        if (!term) return true
        return [permission.key, permission.description, permission.module].some(
          (value) => value?.toLocaleLowerCase('pt-BR').includes(term)
        )
      })
      .reduce<Record<string, Permission[]>>((result, permission) => {
        const moduleName = permission.module ?? 'Outras permissões'
        result[moduleName] ??= []
        result[moduleName].push(permission)
        return result
      }, {})
  }, [filter, permissions])

  return (
    <div className="space-y-5">
      {Object.entries(groups).map(([module, items]) => (
        <section key={module}>
          <h3 className="mb-2 text-sm font-semibold">{module}</h3>
          <div className="space-y-2">
            {items.map((permission) => (
              <label
                key={permission.key}
                className="hover:bg-accent/50 flex cursor-pointer items-start gap-3 rounded-md p-2 transition-colors"
              >
                <Checkbox
                  checked={selected.has(permission.key)}
                  disabled={disabled}
                  onCheckedChange={() => onToggle(permission.key)}
                  aria-label={permission.description ?? permission.key}
                />
                <span className="grid gap-0.5">
                  <span className="text-sm">
                    {permission.description ?? permission.key}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {permission.key}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </section>
      ))}
      {Object.keys(groups).length === 0 && (
        <p className="text-muted-foreground py-5 text-sm">
          Nenhuma permissão encontrada.
        </p>
      )}
    </div>
  )
}

function RoleForm({
  role,
  onClose,
  onSaved,
}: {
  role: Role | null
  onClose: () => void
  onSaved: (role: Role) => void
}) {
  const [name, setName] = useState(role?.name ?? '')
  const [description, setDescription] = useState(role?.description ?? '')
  const [saving, setSaving] = useState(false)

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      const result = role
        ? await request<{ role: Role }>(`/api/v1/admin/roles/${role.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ name, description: description || null }),
          })
        : await request<{ role: Role }>('/api/v1/admin/roles', {
            method: 'POST',
            body: JSON.stringify({
              name,
              description: description || undefined,
            }),
          })
      onSaved(result.role)
      toast.success(role ? 'Cargo atualizado.' : 'Cargo criado.')
      onClose()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível salvar.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{role ? 'Editar cargo' : 'Novo cargo'}</DialogTitle>
          <DialogDescription>
            Defina um nome e uma descrição que ajudem a identificar o cargo.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={save}>
          <label className="grid gap-1.5 text-sm font-medium">
            Nome
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={100}
              required
              autoFocus
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Descrição
            <textarea
              className="border-input bg-background min-h-20 rounded-md border p-3 text-sm outline-none focus-visible:ring-2"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
            />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RoleCard({
  role,
  permissions,
  onUpdated,
  onDelete,
  onEdit,
}: {
  role: Role
  permissions: Permission[]
  onUpdated: (role: Role) => void
  onDelete: (role: Role) => void
  onEdit: (role: Role) => void
}) {
  const [selected, setSelected] = useState(
    () => new Set(role.permissions.map((permission) => permission.key))
  )
  const [filter, setFilter] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const changed =
    selected.size !== role.permissions.length ||
    role.permissions.some((permission) => !selected.has(permission.key))

  useEffect(() => {
    setSelected(new Set(role.permissions.map((permission) => permission.key)))
  }, [role])

  function toggle(key: string) {
    setSelected((current) => {
      const next = new Set(current)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  async function savePermissions() {
    setSaving(true)
    try {
      await request<void>(`/api/v1/admin/roles/${role.id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissions: [...selected] }),
      })
      onUpdated({
        ...role,
        permissions: permissions.filter((permission) =>
          selected.has(permission.key)
        ),
      })
      toast.success('Permissões salvas.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível salvar.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {role.name}
          {role.isSystem && (
            <Badge variant="secondary">
              <ShieldCheckIcon /> Cargo do sistema
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {role.description ?? 'Sem descrição.'}
        </CardDescription>
        <CardAction className="flex gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => onEdit(role)}
            aria-label={`Editar ${role.name}`}
          >
            <PencilIcon />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={role.isSystem}
            onClick={() => setConfirmDelete(true)}
            aria-label={`Excluir ${role.name}`}
          >
            <Trash2Icon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="relative">
          <SearchIcon className="text-muted-foreground absolute top-2.5 left-3 size-4" />
          <Input
            className="pl-9"
            placeholder="Buscar permissões"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
        </div>
        <PermissionList
          permissions={permissions}
          selected={selected}
          onToggle={toggle}
          filter={filter}
          disabled={saving}
        />
        {changed && (
          <div className="border-warning bg-warning/10 text-warning-foreground rounded-md border p-3 text-sm">
            Existem alterações de permissões ainda não salvas.
          </div>
        )}
        <Button onClick={savePermissions} disabled={!changed || saving}>
          {saving ? 'Salvando...' : 'Salvar permissões'}
        </Button>
      </CardContent>
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {role.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o cargo e suas associações. Ela não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => onDelete(role)}
            >
              Excluir cargo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

export function RoleManager() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Role | null | undefined>(undefined)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [roleResult, permissionResult] = await Promise.all([
        request<{ roles: Role[] }>('/api/v1/admin/roles'),
        request<{ permissions: Permission[] }>('/api/v1/admin/permissions'),
      ])
      setRoles(roleResult.roles)
      setPermissions(permissionResult.permissions)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível carregar os cargos.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function updateRole(updated: Role) {
    setRoles((current) =>
      current.some((role) => role.id === updated.id)
        ? current.map((role) =>
            role.id === updated.id ? { ...role, ...updated } : role
          )
        : [...current, updated].sort((a, b) =>
            a.name.localeCompare(b.name, 'pt-BR')
          )
    )
  }

  async function removeRole(role: Role) {
    try {
      await request<void>(`/api/v1/admin/roles/${role.id}`, {
        method: 'DELETE',
      })
      setRoles((current) => current.filter((item) => item.id !== role.id))
      toast.success('Cargo excluído.')
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : 'Não foi possível excluir.'
      )
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
        <Button onClick={() => setEditing(null)}>
          <PlusIcon /> Novo cargo
        </Button>
      </header>

      {loading && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-96" />
          ))}
        </div>
      )}
      {error && (
        <section className="border-destructive/50 rounded-xl border p-6">
          <h2 className="font-semibold">Não foi possível carregar o painel</h2>
          <p className="text-muted-foreground mt-1 text-sm">{error}</p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => void load()}
          >
            <RefreshCwIcon /> Tentar novamente
          </Button>
        </section>
      )}
      {!loading && !error && roles.length === 0 && (
        <section className="rounded-xl border border-dashed p-10 text-center">
          <h2 className="font-semibold">Nenhum cargo encontrado</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Crie o primeiro cargo para começar a organizar acessos.
          </p>
        </section>
      )}
      {!loading && !error && roles.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              permissions={permissions}
              onUpdated={updateRole}
              onDelete={removeRole}
              onEdit={setEditing}
            />
          ))}
        </div>
      )}
      {editing !== undefined && (
        <RoleForm
          role={editing}
          onClose={() => setEditing(undefined)}
          onSaved={updateRole}
        />
      )}
    </main>
  )
}
