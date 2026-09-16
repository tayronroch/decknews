/**
 * @jest-environment node
 */
import { authenticateUserService } from '@/features/auth/services'
import { createSessionService } from '@/features/sessions/services'
import { UnauthorizedError } from '@/infra/errors'
import { SESSION_COOKIE_NAME } from '@/infra/http'
import { logger } from '@/infra/logging'

import { POST } from './route'

jest.mock('@/features/auth/services', () => ({
  authenticateUserService: {
    execute: jest.fn(),
  },
}))

jest.mock('@/features/sessions/services', () => ({
  createSessionService: {
    execute: jest.fn(),
  },
}))

const mockAuthenticateExecute = jest.mocked(authenticateUserService.execute)
const mockCreateSessionExecute = jest.mocked(createSessionService.execute)

describe('POST /api/v1/auth/login', () => {
  const originalEnv = process.env.NODE_ENV
  const fixedExpiresAt = new Date('2026-09-22T12:00:00.000Z')
  const rawToken = 'opaque-cryptographically-secure-token-123456'

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(logger, 'error').mockImplementation(() => {})
    process.env.NODE_ENV = 'development'
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
    jest.restoreAllMocks()
  })

  function createRequest(body: unknown): Request {
    return new Request('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  }

  it('returns 200 OK, sets HttpOnly session cookie, and returns public user on valid credentials', async () => {
    const userId = 987654321012345678n

    mockAuthenticateExecute.mockResolvedValueOnce({
      id: userId,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'USER',
    })

    mockCreateSessionExecute.mockResolvedValueOnce({
      session: {
        id: 111222333444555666n,
        tokenHash: 'sha256-hash-of-the-token',
        userId,
        expiresAt: fixedExpiresAt,
        createdAt: new Date('2026-09-15T12:00:00.000Z'),
      },
      rawToken,
    })

    const request = createRequest({
      email: 'ada@example.com',
      password: 'secure-password-123',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({
      user: {
        id: '987654321012345678',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
      },
    })

    // Verify session creation service called with authenticated userId
    expect(mockCreateSessionExecute).toHaveBeenCalledWith({ userId })

    // Verify Set-Cookie header contains HttpOnly session cookie
    const setCookie = response.headers.get('set-cookie')
    expect(setCookie).toBeDefined()
    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=${rawToken}`)
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('Path=/')
    expect(setCookie?.toLowerCase()).toContain('samesite=lax')

    // Verify no sensitive fields leak in response body
    expect(json.user.password).toBeUndefined()
    expect(json.user.passwordHash).toBeUndefined()
    expect(json.tokenHash).toBeUndefined()
    expect(JSON.stringify(json)).not.toContain('sha256-hash-of-the-token')
  })

  it('sets Secure flag on session cookie in production environment', async () => {
    process.env.NODE_ENV = 'production'
    const userId = 987654321012345678n

    mockAuthenticateExecute.mockResolvedValueOnce({
      id: userId,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'USER',
    })

    mockCreateSessionExecute.mockResolvedValueOnce({
      session: {
        id: 111222333444555666n,
        tokenHash: 'sha256-hash',
        userId,
        expiresAt: fixedExpiresAt,
        createdAt: new Date('2026-09-15T12:00:00.000Z'),
      },
      rawToken,
    })

    const request = createRequest({
      email: 'ada@example.com',
      password: 'secure-password-123',
    })

    const response = await POST(request)
    const setCookie = response.headers.get('set-cookie')

    expect(setCookie).toContain('Secure')
  })

  it('passes normalized email to the service when email contains mixed case and whitespace', async () => {
    mockAuthenticateExecute.mockResolvedValueOnce({
      id: 987654321012345678n,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'USER',
    })

    mockCreateSessionExecute.mockResolvedValueOnce({
      session: {
        id: 111222333444555666n,
        tokenHash: 'sha256-hash',
        userId: 987654321012345678n,
        expiresAt: fixedExpiresAt,
        createdAt: new Date(),
      },
      rawToken,
    })

    const request = createRequest({
      email: '  ADA@EXAMPLE.COM  ',
      password: 'secure-password-123',
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    expect(mockAuthenticateExecute).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'secure-password-123',
    })
  })

  it('returns 400 Bad Request when JSON is malformed and does not create session', async () => {
    const request = new Request('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json{',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(mockAuthenticateExecute).not.toHaveBeenCalled()
    expect(mockCreateSessionExecute).not.toHaveBeenCalled()
    expect(response.headers.get('set-cookie')).toBeNull()
  })

  it('returns 400 Bad Request when email is invalid', async () => {
    const request = createRequest({
      email: 'not-an-email',
      password: 'secure-password-123',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(mockAuthenticateExecute).not.toHaveBeenCalled()
    expect(mockCreateSessionExecute).not.toHaveBeenCalled()
  })

  it('returns 400 Bad Request when password is empty', async () => {
    const request = createRequest({
      email: 'ada@example.com',
      password: '',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(mockAuthenticateExecute).not.toHaveBeenCalled()
    expect(mockCreateSessionExecute).not.toHaveBeenCalled()
  })

  it('returns 400 Bad Request when extra fields like role are supplied', async () => {
    const request = createRequest({
      email: 'ada@example.com',
      password: 'secure-password-123',
      role: 'ADMIN',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(mockAuthenticateExecute).not.toHaveBeenCalled()
    expect(mockCreateSessionExecute).not.toHaveBeenCalled()
  })

  it('returns 401 Unauthorized when credentials are rejected and does not set session cookie', async () => {
    mockAuthenticateExecute.mockRejectedValueOnce(
      new UnauthorizedError('Credenciais inválidas')
    )

    const request = createRequest({
      email: 'ada@example.com',
      password: 'wrong-password',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Credenciais inválidas',
      },
    })
    expect(mockCreateSessionExecute).not.toHaveBeenCalled()
    expect(response.headers.get('set-cookie')).toBeNull()
  })

  it('returns 500 Internal Server Error without exposing internal details on unexpected error', async () => {
    mockAuthenticateExecute.mockRejectedValueOnce(
      new Error('Unexpected database failure')
    )

    const request = createRequest({
      email: 'ada@example.com',
      password: 'secure-password-123',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json).toEqual({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro interno do servidor',
      },
    })
    expect(JSON.stringify(json)).not.toContain('database failure')
    expect(mockCreateSessionExecute).not.toHaveBeenCalled()
    expect(response.headers.get('set-cookie')).toBeNull()
  })
})
