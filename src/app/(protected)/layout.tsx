import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

import { AuthenticatedHeader } from '@/features/auth/components'
import { getCurrentUserBySessionToken } from '@/features/auth/services'
import { SESSION_COOKIE_NAME } from '@/infra/http'

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value
  const user = await getCurrentUserBySessionToken(token)

  if (!user) redirect('/login?next=/admin')

  return (
    <>
      <AuthenticatedHeader user={user} />
      {children}
    </>
  )
}
