import type { ReactNode } from 'react'

/**
 * Marginal note for pending edits. The palette is neutral plus `destructive`,
 * and an unsaved change is not an error — so it borrows the editorial accent
 * used elsewhere for attention marks instead of introducing a warning hue.
 */
export function UnsavedNotice({ children }: { children: ReactNode }) {
  return (
    <p className="border-accent-editorial bg-accent-editorial/5 flex items-start gap-2.5 rounded-xs border-l-2 py-2.5 pr-3 pl-3 text-sm">
      <span
        aria-hidden="true"
        className="bg-accent-editorial mt-1.5 size-1.5 shrink-0 rounded-full"
      />
      {children}
    </p>
  )
}
