/**
 * @jest-environment node
 */
import { GET as getMe } from '@/app/api/v1/auth/me/route'
import { sessionRepository } from '@/features/sessions/repositories'
import { invalidateSessionService } from '@/features/sessions/services'
import { userRepository } from '@/features/users/repositories'
import { SESSION_COOKIE_NAME } from '@/infra/http'
import { logger } from '@/infra/logging'
import { sessionTokenGenerator } from '@/infra/security/session'

import { POST } from './route'

describe('POST /api/v1/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(logger, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  function createRequest(token?: string): Request {
    const headers = new Headers()
    if (token !== undefined) {
      headers.set('cookie', `${SESSION_COOKIE_NAME}=${token}`)
    }
    return new Request('http://localhost:3000/api/v1/auth/logout', {
      method: 'POST',
      headers,
    })
  }

  it('returns 204 No Content, invalidates session, and clears session cookie when cookie is present', async () => {
    const rawToken = 'test-session-token-12345'
    const invalidateSession = jest
      .spyOn(invalidateSessionService, 'execute')
      .mockResolvedValueOnce()

    const request = createRequest(rawToken)
    const response = await POST(request)

    expect(response.status).toBe(204)
    expect(invalidateSession).toHaveBeenCalledWith(rawToken)

    const responseBody = await response.text()
    expect(responseBody).toBe('')

    const cookie = response.cookies.get(SESSION_COOKIE_NAME)
    expect(cookie).toBeDefined()
    expect(cookie?.value).toBe('')

    const setCookie = response.headers.get('set-cookie')
    expect(setCookie).toBeDefined()
    expect(setCookie).not.toContain(rawToken)
  })

  it('returns 204 No Content and clears cookie when no session cookie is provided', async () => {
    const invalidateSession = jest
      .spyOn(invalidateSessionService, 'execute')
      .mockResolvedValueOnce()

    const request = createRequest()
    const response = await POST(request)

    expect(response.status).toBe(204)
    expect(invalidateSession).toHaveBeenCalledWith(null)

    const responseBody = await response.text()
    expect(responseBody).toBe('')

    const cookie = response.cookies.get(SESSION_COOKIE_NAME)
    expect(cookie).toBeDefined()
    expect(cookie?.value).toBe('')
  })

  it('returns 204 No Content when session does not exist or was already removed', async () => {
    const invalidateSession = jest
      .spyOn(invalidateSessionService, 'execute')
      .mockResolvedValueOnce()

    const request = createRequest('nonexistent-session-token')
    const response = await POST(request)

    expect(response.status).toBe(204)
    expect(invalidateSession).toHaveBeenCalledWith('nonexistent-session-token')
  })

  it('is idempotent when called repeatedly', async () => {
    const rawToken = 'repeat-session-token'
    const invalidateSession = jest
      .spyOn(invalidateSessionService, 'execute')
      .mockResolvedValue(undefined)

    const response1 = await POST(createRequest(rawToken))
    const response2 = await POST(createRequest(rawToken))

    expect(response1.status).toBe(204)
    expect(response2.status).toBe(204)
    expect(invalidateSession).toHaveBeenCalledTimes(2)
  })

  it('does not leak sensitive information in response headers or body', async () => {
    const rawToken = 'super-secret-token'
    jest.spyOn(invalidateSessionService, 'execute').mockResolvedValueOnce()

    const response = await POST(createRequest(rawToken))
    const text = await response.text()
    const setCookie = response.headers.get('set-cookie') ?? ''

    expect(text).not.toContain(rawToken)
    expect(text).not.toContain('tokenHash')
    expect(setCookie).not.toContain(rawToken)
  })

  it('delegates unhandled service errors to handleApiError and returns 500', async () => {
    jest
      .spyOn(invalidateSessionService, 'execute')
      .mockRejectedValueOnce(new Error('Database connectivity lost'))

    const response = await POST(createRequest('any-token'))

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json).toHaveProperty('error.code', 'INTERNAL_SERVER_ERROR')
  })

  it('ensures invalidated session no longer authenticates in /auth/me', async () => {
    const rawToken = 'session-to-invalidate'
    const tokenHash = 'hash-of-session-to-invalidate'
    const activeSessions = new Map([
      [
        tokenHash,
        {
          id: 111222333444555666n,
          tokenHash,
          userId: 987654321012345678n,
          expiresAt: new Date('2026-09-22T12:00:00.000Z'),
          createdAt: new Date('2026-09-15T12:00:00.000Z'),
        },
      ],
    ])

    jest.spyOn(sessionTokenGenerator, 'hash').mockReturnValue(tokenHash)
    const deleteSession = jest
      .spyOn(sessionRepository, 'deleteSessionByTokenHash')
      .mockImplementation(async (hash) => {
        activeSessions.delete(hash)
      })
    const findSession = jest
      .spyOn(sessionRepository, 'findSessionByTokenHash')
      .mockImplementation(async (hash) => activeSessions.get(hash) ?? null)
    const findUser = jest.spyOn(userRepository, 'findUserById')

    const logoutResponse = await POST(createRequest(rawToken))
    expect(logoutResponse.status).toBe(204)
    expect(deleteSession).toHaveBeenCalledWith(tokenHash)

    const meResponse = await getMe(
      new Request('http://localhost:3000/api/v1/auth/me', {
        headers: { cookie: `${SESSION_COOKIE_NAME}=${rawToken}` },
      })
    )

    expect(meResponse.status).toBe(401)
    expect(findSession).toHaveBeenCalledWith(tokenHash)
    expect(findUser).not.toHaveBeenCalled()
    const meBody = await meResponse.json()
    expect(meBody).toHaveProperty('error.code', 'UNAUTHORIZED')
  })
})
