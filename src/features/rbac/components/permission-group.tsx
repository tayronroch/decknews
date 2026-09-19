'use client'

import { Checkbox } from '@/components/ui/checkbox'

import type { PermissionDto } from '../types'

export function PermissionGroup({
  module,
  permissions,
  selected,
  disabled,
  onToggle,
}: {
  module: string
  permissions: PermissionDto[]
  selected: ReadonlySet<string>
  disabled: boolean
  onToggle: (key: string) => void
}) {
  return (
    <section aria-label={`Permissões de ${module}`}>
      <h3 className="mb-2 text-sm font-semibold">{module}</h3>
      <div className="space-y-2">
        {permissions.map((permission) => (
          <label
            key={permission.key}
            className="hover:bg-accent/50 flex cursor-pointer items-start gap-3 rounded-md p-2 transition-colors"
          >
            <Checkbox
              className="mt-0.5"
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
  )
}
