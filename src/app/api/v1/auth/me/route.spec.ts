/**
 * @jest-environment node
 */
import { validateSessionService } from '@/features/sessions/services'
import type { ValidateSessionResult } from '@/features/sessions/types'
import { SESSION_COOKIE_NAME } from '@/infra/http'
import { logger } from '@/infra/logging'

import { GET } from './route'

const validatedSession: ValidateSessionResult = {
  session: {
    id: 111222333444555666n,
    tokenHash: 'session-token-hash',
    userId: 987654321012345678n,
    expiresAt: new Date('2026-09-22T12:00:00.000Z'),
    createdAt: new Date('2026-09-15T12:00:00.000Z'),
  },
  user: {
    id: 987654321012345678n,
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    role: 'USER',
    createdAt: new Date('2026-09-01T12:00:00.000Z'),
    updatedAt: new Date('2026-09-01T12:00:00.000Z'),
  },
}

describe('GET /api/v1/auth/me', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.spyOn(logger, 'error').mockImplementation(() => {})
  })

  it('returns the current user for a valid session', async () => {
    jest
      .spyOn(validateSessionService, 'execute')
      .mockResolvedValueOnce(validatedSession)

    const response = await GET(
      new Request('http://localhost:3000/api/v1/auth/me', {
        headers: { cookie: `${SESSION_COOKIE_NAME}=valid-session-token` },
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      user: {
        id: '987654321012345678',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        role: 'USER',
      },
    })
  })

  it('returns 401 when the request has no session cookie', async () => {
    const response = await GET(
      new Request('http://localhost:3000/api/v1/auth/me')
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Não autorizado',
      },
    })
  })

  it('returns a safe 500 response when session validation fails unexpectedly', async () => {
    jest
      .spyOn(validateSessionService, 'execute')
      .mockRejectedValueOnce(new Error('database connection failed'))

    const response = await GET(
      new Request('http://localhost:3000/api/v1/auth/me', {
        headers: { cookie: `${SESSION_COOKIE_NAME}=valid-session-token` },
      })
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro interno do servidor',
      },
    })
  })
})
