import { cookies } from 'next/headers'
import type { ReactNode } from 'react'

import { AuthenticatedHeader } from '@/features/auth/components'
import { getCurrentUserBySessionToken } from '@/features/auth/services'
import { SESSION_COOKIE_NAME } from '@/infra/http'

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value
  const user = await getCurrentUserBySessionToken(token)

  // Each page guards its session before rendering and supplies its own return URL.
  return (
    <>
      {user ? <AuthenticatedHeader user={user} /> : null}
      {children}
    </>
  )
}
