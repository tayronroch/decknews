'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

import { rbacClient } from '../client'
import type { AdminUserDto, RoleSummaryDto } from '../types'

export function UserCard({
  user,
  roles,
  canManageRoles,
  onUpdated,
}: {
  user: AdminUserDto
  roles: RoleSummaryDto[]
  canManageRoles: boolean
  onUpdated: (user: AdminUserDto) => void
}) {
  const savedIds = useMemo(() => user.roles.map((role) => role.id), [user])
  const [selected, setSelected] = useState(() => new Set(savedIds))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setSelected(new Set(savedIds))
  }, [savedIds])

  const changed =
    selected.size !== savedIds.length ||
    savedIds.some((id) => !selected.has(id))

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }

  async function saveRoles() {
    setSaving(true)
    try {
      await rbacClient.replaceUserRoles(user.id, [...selected])
      onUpdated({
        ...user,
        roles: roles.filter((role) => selected.has(role.id)),
      })
      toast.success('Cargos salvos.')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar os cargos.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="space-y-2">
          {roles.map((role) => (
            <label
              key={role.id}
              className="hover:bg-accent/50 flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors"
            >
              <Checkbox
                checked={selected.has(role.id)}
                disabled={!canManageRoles || saving}
                onCheckedChange={() => toggle(role.id)}
                aria-label={role.name}
              />
              <span className="flex items-center gap-2 text-sm">
                {role.name}
                {role.isSystem && <Badge variant="secondary">Sistema</Badge>}
              </span>
            </label>
          ))}
        </div>
        {changed && (
          <p className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
            Existem alterações de cargos ainda não salvas.
          </p>
        )}
        {canManageRoles && (
          <Button
            onClick={() => void saveRoles()}
            disabled={!changed || saving}
          >
            {saving ? 'Salvando...' : 'Salvar cargos'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
