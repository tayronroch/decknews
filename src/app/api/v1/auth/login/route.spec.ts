/**
 * @jest-environment node
 */
import { authenticateUserService } from '@/features/auth/services'
import { UnauthorizedError } from '@/infra/errors'
import { logger } from '@/infra/logging'

import { POST } from './route'

jest.mock('@/features/auth/services', () => ({
  authenticateUserService: {
    execute: jest.fn(),
  },
}))

const mockExecute = jest.mocked(authenticateUserService.execute)

describe('POST /api/v1/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(logger, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  function createRequest(body: unknown): Request {
    return new Request('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  }

  it('returns 200 OK with serialized user on valid payload', async () => {
    mockExecute.mockResolvedValueOnce({
      id: 987654321012345678n,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'USER',
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
        role: 'USER',
      },
    })
    // Garante que nem password nem passwordHash vazam
    expect(json.user.password).toBeUndefined()
    expect(json.user.passwordHash).toBeUndefined()
  })

  it('passes normalized email to the service when email contains mixed case and whitespace', async () => {
    mockExecute.mockResolvedValueOnce({
      id: 987654321012345678n,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'USER',
    })

    const request = createRequest({
      email: '  ADA@EXAMPLE.COM  ',
      password: 'secure-password-123',
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    expect(mockExecute).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'secure-password-123',
    })
  })

  it('returns 400 Bad Request when JSON is malformed', async () => {
    const request = new Request('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json{',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(mockExecute).not.toHaveBeenCalled()
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
    expect(mockExecute).not.toHaveBeenCalled()
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
    expect(mockExecute).not.toHaveBeenCalled()
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
    expect(mockExecute).not.toHaveBeenCalled()
  })

  it('returns 401 Unauthorized with generic message when service rejects credentials', async () => {
    mockExecute.mockRejectedValueOnce(
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
  })

  it('returns 500 Internal Server Error without exposing internal details on unexpected error', async () => {
    mockExecute.mockRejectedValueOnce(new Error('Unexpected database failure'))

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
  })
})
