import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { SESSION_COOKIE_NAME } from '@/infra/http'

import { getSafeNext } from '../client'
import { getCurrentUserBySessionToken } from './get-current-user.service'

// Pages supply their route explicitly: server layouts cannot read the pathname.
export async function requirePageUser(pathname: string) {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value
  const user = await getCurrentUserBySessionToken(token)

  if (!user)
    redirect(`/login?next=${encodeURIComponent(getSafeNext(pathname))}`)

  return user
}
