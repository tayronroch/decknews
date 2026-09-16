'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { authClient } from '../client'
import type { AuthenticatedUser } from '../services'

type AuthenticatedHeaderProps = {
  user: AuthenticatedUser
}

export function AuthenticatedHeader({ user }: AuthenticatedHeaderProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  async function handleLogout() {
    setIsLoggingOut(true)
    setLogoutError(null)

    try {
      await authClient.logout()
      router.replace('/login')
      router.refresh()
    } catch {
      setLogoutError('Não foi possível sair. Tente novamente.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="border-b px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <p className="text-sm">{user.name}</p>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="rounded-md border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          Sair
        </button>
      </div>
      {logoutError ? (
        <p
          className="text-destructive mx-auto mt-2 max-w-7xl text-sm"
          role="alert"
        >
          {logoutError}
        </p>
      ) : null}
    </header>
  )
}
