'use client'

import type { PermissionDto } from '../types'
import { PermissionGroup } from './permission-group'

const FALLBACK_MODULE = 'Outras permissões'

// The API already returns permissions ordered by module and key; keep that order.
export function groupPermissionsByModule(
  permissions: PermissionDto[],
  search: string
): [string, PermissionDto[]][] {
  const term = search.trim().toLocaleLowerCase('pt-BR')
  const groups = new Map<string, PermissionDto[]>()

  for (const permission of permissions) {
    const matches =
      term === '' ||
      [permission.key, permission.description, permission.module].some(
        (value) => value?.toLocaleLowerCase('pt-BR').includes(term)
      )

    if (!matches) continue

    const moduleName = permission.module ?? FALLBACK_MODULE
    groups.set(moduleName, [...(groups.get(moduleName) ?? []), permission])
  }

  return [...groups.entries()]
}

export function PermissionList({
  permissions,
  selected,
  search,
  disabled,
  onToggle,
}: {
  permissions: PermissionDto[]
  selected: ReadonlySet<string>
  search: string
  disabled: boolean
  onToggle: (key: string) => void
}) {
  const groups = groupPermissionsByModule(permissions, search)

  if (groups.length === 0) {
    return (
      <p className="text-muted-foreground py-5 text-sm">
        Nenhuma permissão encontrada.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      {groups.map(([module, items]) => (
        <PermissionGroup
          key={module}
          module={module}
          permissions={items}
          selected={selected}
          disabled={disabled}
          onToggle={onToggle}
        />
      ))}
    </div>
  )
}
