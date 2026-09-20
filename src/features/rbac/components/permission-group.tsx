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
      <h3 className="text-muted-foreground border-border/60 mb-2 border-b pb-1.5 font-mono text-xs font-medium tracking-wider uppercase">
        {module}
      </h3>
      <div className="space-y-1">
        {permissions.map((permission) => (
          <label
            key={permission.key}
            className="hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-xs p-2 transition-colors"
          >
            <Checkbox
              className="mt-0.5"
              checked={selected.has(permission.key)}
              disabled={disabled}
              onCheckedChange={() => onToggle(permission.key)}
              aria-label={permission.description ?? permission.key}
            />
            <span className="grid gap-0.5">
              <span className="text-sm leading-snug">
                {permission.description ?? permission.key}
              </span>
              <span className="text-muted-foreground/80 font-mono text-[11px]">
                {permission.key}
              </span>
            </span>
          </label>
        ))}
      </div>
    </section>
  )
}
