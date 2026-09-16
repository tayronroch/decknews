/**
 * @jest-environment node
 */
import { GET as getMe } from '@/features/auth/../../app/api/v1/auth/me/route'
import { invalidateSessionService } from '@/features/sessions/services'
import { SESSION_COOKIE_NAME } from '@/infra/http'
import { logger } from '@/infra/logging'

import { POST } from './route'

jest.mock('@/features/sessions/services', () => ({
  invalidateSessionService: {
    execute: jest.fn(),
  },
  validateSessionService: {
    execute: jest.fn(),
  },
}))

const mockInvalidateExecute = jest.mocked(invalidateSessionService.execute)

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
    mockInvalidateExecute.mockResolvedValueOnce()

    const request = createRequest(rawToken)
    const response = await POST(request)

    expect(response.status).toBe(204)
    expect(mockInvalidateExecute).toHaveBeenCalledWith(rawToken)

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
    mockInvalidateExecute.mockResolvedValueOnce()

    const request = createRequest()
    const response = await POST(request)

    expect(response.status).toBe(204)
    expect(mockInvalidateExecute).toHaveBeenCalledWith(null)

    const responseBody = await response.text()
    expect(responseBody).toBe('')

    const cookie = response.cookies.get(SESSION_COOKIE_NAME)
    expect(cookie).toBeDefined()
    expect(cookie?.value).toBe('')
  })

  it('returns 204 No Content when session does not exist or was already removed', async () => {
    mockInvalidateExecute.mockResolvedValueOnce()

    const request = createRequest('nonexistent-session-token')
    const response = await POST(request)

    expect(response.status).toBe(204)
    expect(mockInvalidateExecute).toHaveBeenCalledWith(
      'nonexistent-session-token'
    )
  })

  it('is idempotent when called repeatedly', async () => {
    const rawToken = 'repeat-session-token'
    mockInvalidateExecute.mockResolvedValue(undefined)

    const response1 = await POST(createRequest(rawToken))
    const response2 = await POST(createRequest(rawToken))

    expect(response1.status).toBe(204)
    expect(response2.status).toBe(204)
    expect(mockInvalidateExecute).toHaveBeenCalledTimes(2)
  })

  it('does not leak sensitive information in response headers or body', async () => {
    const rawToken = 'super-secret-token'
    mockInvalidateExecute.mockResolvedValueOnce()

    const response = await POST(createRequest(rawToken))
    const text = await response.text()
    const setCookie = response.headers.get('set-cookie') ?? ''

    expect(text).not.toContain(rawToken)
    expect(text).not.toContain('tokenHash')
    expect(setCookie).not.toContain(rawToken)
  })

  it('delegates unhandled service errors to handleApiError and returns 500', async () => {
    mockInvalidateExecute.mockRejectedValueOnce(
      new Error('Database connectivity lost')
    )

    const response = await POST(createRequest('any-token'))

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json).toHaveProperty('error.code', 'INTERNAL_SERVER_ERROR')
  })

  it('ensures invalidated session no longer authenticates in /auth/me', async () => {
    const rawToken = 'session-to-invalidate'
    const { validateSessionService } = jest.requireMock(
      '@/features/sessions/services'
    )

    // 1. Session is invalidated via logout
    mockInvalidateExecute.mockResolvedValueOnce()
    const logoutResponse = await POST(createRequest(rawToken))
    expect(logoutResponse.status).toBe(204)

    // 2. Validate session now returns null (session was deleted from DB)
    validateSessionService.execute.mockResolvedValueOnce(null)

    // 3. /auth/me with the same token returns 401
    const meResponse = await getMe(
      new Request('http://localhost:3000/api/v1/auth/me', {
        headers: { cookie: `${SESSION_COOKIE_NAME}=${rawToken}` },
      })
    )

    expect(meResponse.status).toBe(401)
    const meBody = await meResponse.json()
    expect(meBody).toHaveProperty('error.code', 'UNAUTHORIZED')
  })
})
