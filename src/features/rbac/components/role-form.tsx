'use client'

import { SearchIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { rbacClient } from '../client'
import type { PermissionDto, RoleDto } from '../types'
import { PermissionList } from './permission-list'

export function RoleForm({
  role,
  permissions,
  canManagePermissions,
  onClose,
  onSaved,
}: {
  role: RoleDto | null
  permissions: PermissionDto[]
  canManagePermissions: boolean
  onClose: () => void
  onSaved: (role: RoleDto) => void
}) {
  const initialKeys = useMemo(
    () => new Set(role?.permissions.map((permission) => permission.key) ?? []),
    [role]
  )
  const [name, setName] = useState(role?.name ?? '')
  const [description, setDescription] = useState(role?.description ?? '')
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialKeys)
  )
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const permissionsChanged =
    canManagePermissions &&
    (selected.size !== initialKeys.size ||
      [...initialKeys].some((key) => !selected.has(key)))

  function toggle(key: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (!next.delete(key)) next.add(key)
      return next
    })
  }

  // Permissions are persisted through their own endpoint, after the role exists.
  async function persistPermissions(id: string): Promise<PermissionDto[]> {
    await rbacClient.replaceRolePermissions(id, [...selected])
    return permissions.filter((permission) => selected.has(permission.key))
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)

    const trimmedDescription = description.trim()
    let saved: RoleDto

    // Step 1: the role itself. If this fails, nothing was persisted — keep
    // the dialog open and report the error, same as before.
    try {
      if (role) {
        const updated = await rbacClient.updateRole(role.id, {
          name: name.trim(),
          description: trimmedDescription === '' ? null : trimmedDescription,
        })
        saved = { ...updated, permissions: role.permissions }
      } else {
        const created = await rbacClient.createRole({
          name: name.trim(),
          ...(trimmedDescription === ''
            ? {}
            : { description: trimmedDescription }),
        })
        saved = created
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível salvar.'
      )
      setSaving(false)
      return
    }

    // Step 2: permissions, only when there's something to write. The role
    // above already exists in the database at this point, so a failure here
    // must not hide it from the grid or keep the dialog open — it only
    // means permissions weren't the ones requested.
    const shouldPersistPermissions = role
      ? permissionsChanged
      : canManagePermissions && selected.size > 0
    const successMessage = role ? 'Cargo atualizado.' : 'Cargo criado.'

    if (shouldPersistPermissions) {
      try {
        saved = { ...saved, permissions: await persistPermissions(saved.id) }
        toast.success(successMessage)
      } catch (error) {
        const reason =
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar as permissões.'
        toast.error(
          `${role ? 'Cargo atualizado' : 'Cargo criado'}, mas não foi possível salvar as permissões: ${reason}`
        )
      }
    } else {
      toast.success(successMessage)
    }

    onSaved(saved)
    onClose()
    setSaving(false)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{role ? 'Editar cargo' : 'Novo cargo'}</DialogTitle>
          <DialogDescription>
            Defina nome, descrição e as permissões concedidas a este cargo.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={save}>
          <div className="grid gap-1.5">
            <Label htmlFor="role-name">Nome</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={100}
              required
              autoFocus
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="role-description">Descrição</Label>
            <Textarea
              id="role-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="permission-search">Permissões</Label>
            <div className="relative">
              <SearchIcon className="text-muted-foreground absolute top-2.5 left-3 size-4" />
              <Input
                id="permission-search"
                className="pl-9"
                placeholder="Buscar permissão..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <PermissionList
              permissions={permissions}
              selected={selected}
              search={search}
              disabled={!canManagePermissions || saving}
              onToggle={toggle}
            />
            {!canManagePermissions && (
              <p className="text-muted-foreground text-xs">
                Você não tem permissão para alterar as permissões deste cargo.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? 'Salvando...'
                : role
                  ? 'Salvar alterações'
                  : 'Criar cargo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
