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

  async function handleLogout() {
    setIsLoggingOut(true)

    try {
      await authClient.logout()
      router.replace('/login')
      router.refresh()
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
    </header>
  )
}
