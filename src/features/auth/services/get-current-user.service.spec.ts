/**
 * @jest-environment node
 */
import { validateSessionService } from '@/features/sessions/services'
import type { ValidateSessionResult } from '@/features/sessions/types'
import { userRepository } from '@/features/users/repositories'
import type { UserRecord } from '@/features/users/types'
import { UnauthorizedError } from '@/infra/errors'
import { SESSION_COOKIE_NAME } from '@/infra/http'

import {
  getCurrentUser,
  requireAuthenticatedUser,
} from './get-current-user.service'

const validatedSession: ValidateSessionResult = {
  session: {
    id: 111222333444555666n,
    tokenHash: 'session-token-hash',
    userId: 987654321012345678n,
    expiresAt: new Date('2026-09-22T12:00:00.000Z'),
    createdAt: new Date('2026-09-15T12:00:00.000Z'),
  },
}

const authenticatedUser: UserRecord = {
  id: 987654321012345678n,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  role: 'USER',
  createdAt: new Date('2026-09-01T12:00:00.000Z'),
  updatedAt: new Date('2026-09-01T12:00:00.000Z'),
}

describe('current authenticated user', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('returns only public fields for a valid session', async () => {
    jest
      .spyOn(validateSessionService, 'execute')
      .mockResolvedValueOnce(validatedSession)
    jest
      .spyOn(userRepository, 'findUserById')
      .mockResolvedValueOnce(authenticatedUser)

    const user = await getCurrentUser(
      new Request('http://localhost:3000', {
        headers: { cookie: `${SESSION_COOKIE_NAME}=valid-session-token` },
      })
    )

    expect(user).toEqual({
      id: 987654321012345678n,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    })
    expect(userRepository.findUserById).toHaveBeenCalledWith(
      validatedSession.session.userId
    )
  })

  it('returns null when the request has no session cookie', async () => {
    await expect(
      getCurrentUser(new Request('http://localhost:3000'))
    ).resolves.toBeNull()
  })

  it('returns null when the session token is invalid', async () => {
    jest.spyOn(validateSessionService, 'execute').mockResolvedValueOnce(null)

    await expect(
      getCurrentUser(
        new Request('http://localhost:3000', {
          headers: { cookie: `${SESSION_COOKIE_NAME}=invalid-session-token` },
        })
      )
    ).resolves.toBeNull()
  })

  it('returns null when the session user no longer exists', async () => {
    jest
      .spyOn(validateSessionService, 'execute')
      .mockResolvedValueOnce(validatedSession)
    jest.spyOn(userRepository, 'findUserById').mockResolvedValueOnce(null)

    await expect(
      getCurrentUser(
        new Request('http://localhost:3000', {
          headers: { cookie: `${SESSION_COOKIE_NAME}=valid-session-token` },
        })
      )
    ).resolves.toBeNull()
  })

  it('rejects an unauthenticated request', async () => {
    await expect(
      requireAuthenticatedUser(new Request('http://localhost:3000'))
    ).rejects.toBeInstanceOf(UnauthorizedError)
  })
})
