'use client'

import {
  PencilIcon,
  SearchIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
import { Input } from '@/components/ui/input'

import { rbacClient } from '../client'
import type { PermissionDto, RoleDto, RolePanelCapabilities } from '../types'
import { PermissionList } from './permission-list'
import { UnsavedNotice } from './unsaved-notice'

export function RoleCard({
  role,
  permissions,
  capabilities,
  deleting,
  onEdit,
  onDelete,
  onUpdated,
}: {
  role: RoleDto
  permissions: PermissionDto[]
  capabilities: RolePanelCapabilities
  deleting: boolean
  onEdit: (role: RoleDto) => void
  onDelete: (role: RoleDto) => void
  onUpdated: (role: RoleDto) => void
}) {
  const savedKeys = useMemo(
    () => role.permissions.map((permission) => permission.key),
    [role]
  )
  const [selected, setSelected] = useState(() => new Set(savedKeys))
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    setSelected(new Set(savedKeys))
  }, [savedKeys])

  const changed =
    selected.size !== savedKeys.length ||
    savedKeys.some((key) => !selected.has(key))

  function toggle(key: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (!next.delete(key)) next.add(key)
      return next
    })
  }

  async function savePermissions() {
    setSaving(true)
    try {
      await rbacClient.replaceRolePermissions(role.id, [...selected])
      onUpdated({
        ...role,
        permissions: permissions.filter((permission) =>
          selected.has(permission.key)
        ),
      })
      toast.success('Permissões salvas.')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar as permissões.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card
      className={`border-border/70 rounded-xs shadow-none transition-opacity ${deleting ? 'opacity-60' : ''}`}
    >
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base font-medium tracking-tight">
          {role.name}
          {role.isSystem && (
            <Badge
              variant="secondary"
              className="rounded-xs font-mono text-[11px] font-normal"
            >
              <ShieldCheckIcon /> Cargo do sistema
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {role.description?.trim() ? role.description : 'Sem descrição.'}
        </CardDescription>
        {(capabilities.canUpdate || capabilities.canDelete) && (
          <CardAction className="flex gap-1">
            {capabilities.canUpdate && (
              <Button
                size="icon-sm"
                variant="ghost"
                className="rounded-xs"
                onClick={() => onEdit(role)}
                aria-label={`Editar ${role.name}`}
              >
                <PencilIcon />
              </Button>
            )}
            {capabilities.canDelete && (
              <Button
                size="icon-sm"
                variant="ghost"
                className="hover:text-destructive rounded-xs"
                disabled={role.isSystem || deleting}
                onClick={() => setConfirming(true)}
                aria-label={`Excluir ${role.name}`}
              >
                <Trash2Icon />
              </Button>
            )}
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="relative">
          <SearchIcon className="text-muted-foreground absolute top-2.5 left-3 size-4" />
          <Input
            className="rounded-xs pl-9"
            placeholder="Buscar permissão..."
            aria-label={`Buscar permissão em ${role.name}`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <PermissionList
          permissions={permissions}
          selected={selected}
          search={search}
          disabled={!capabilities.canManagePermissions || saving || deleting}
          onToggle={toggle}
        />
        {changed && (
          <UnsavedNotice>
            Existem alterações de permissões ainda não salvas.
          </UnsavedNotice>
        )}
        {deleting && (
          <p className="text-muted-foreground flex items-center gap-2 font-mono text-xs">
            <span
              aria-hidden="true"
              className="bg-destructive size-1.5 animate-pulse rounded-full"
            />
            Excluindo...
          </p>
        )}
        {capabilities.canManagePermissions && (
          <Button
            onClick={() => void savePermissions()}
            disabled={!changed || saving || deleting}
          >
            {saving ? 'Salvando...' : 'Salvar permissões'}
          </Button>
        )}
      </CardContent>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent className="rounded-xs">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Tem certeza que deseja excluir este cargo?
            </AlertDialogTitle>
            <AlertDialogDescription>
              O cargo {role.name} e suas associações serão removidos. Esta ação
              não pode ser desfeita.
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
