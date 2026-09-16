import { validateSessionService } from '@/features/sessions/services'
import { userRepository } from '@/features/users/repositories'
import type { UserRecord } from '@/features/users/types'
import { UnauthorizedError } from '@/infra/errors'
import { extractSessionToken } from '@/infra/http'

export type AuthenticatedUser = Pick<UserRecord, 'id' | 'name' | 'email'>

export async function getCurrentUserBySessionToken(
  token: string | null | undefined
): Promise<AuthenticatedUser | null> {
  if (!token) return null

  const result = await validateSessionService.execute(token)
  if (!result) return null

  const user = await userRepository.findUserById(result.session.userId)
  if (!user) return null

  const { id, name, email } = user
  return { id, name, email }
}

export async function getCurrentUser(
  request: Request
): Promise<AuthenticatedUser | null> {
  return getCurrentUserBySessionToken(extractSessionToken(request))
}

export async function requireAuthenticatedUser(
  request: Request
): Promise<AuthenticatedUser> {
  const user = await getCurrentUser(request)
  if (!user) {
    throw new UnauthorizedError()
  }

  return user
}
