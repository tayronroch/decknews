/**
 * @jest-environment node
 */
import { registerUserService } from '@/features/auth/services'
import { ConflictError } from '@/infra/errors'
import { logger } from '@/infra/logging'

import { POST } from './route'

jest.mock('@/features/auth/services', () => ({
  registerUserService: {
    execute: jest.fn(),
  },
}))

const mockExecute = jest.mocked(registerUserService.execute)

describe('POST /api/v1/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(logger, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  function createRequest(body: unknown): Request {
    return new Request('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  }

  it('returns 201 Created with serialized user on valid payload', async () => {
    mockExecute.mockResolvedValueOnce({
      id: 987654321012345678n,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'USER',
      createdAt: new Date('2026-09-07T23:00:00.000Z'),
    })

    const request = createRequest({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secure-password-123',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json).toEqual({
      user: {
        id: '987654321012345678',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        role: 'USER',
        createdAt: '2026-09-07T23:00:00.000Z',
      },
    })
    // Garante que nem password nem passwordHash vazam
    expect(json.user.password).toBeUndefined()
    expect(json.user.passwordHash).toBeUndefined()
  })

  it('returns 400 Bad Request when JSON is malformed', async () => {
    const request = new Request('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json{',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 Bad Request when email is invalid', async () => {
    const request = createRequest({
      name: 'Ada Lovelace',
      email: 'not-an-email',
      password: 'secure-password-123',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 Bad Request when password is under 12 characters', async () => {
    const request = createRequest({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'short',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 Bad Request when extra fields like role are supplied', async () => {
    const request = createRequest({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secure-password-123',
      role: 'ADMIN',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 409 Conflict when email already exists', async () => {
    mockExecute.mockRejectedValueOnce(new ConflictError('E-mail já cadastrado'))

    const request = createRequest({
      name: 'Ada Lovelace',
      email: 'existing@example.com',
      password: 'secure-password-123',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json).toEqual({
      error: {
        code: 'CONFLICT',
        message: 'E-mail já cadastrado',
      },
    })
  })

  it('returns 500 Internal Server Error without exposing internal details on unexpected error', async () => {
    mockExecute.mockRejectedValueOnce(new Error('Unexpected database failure'))

    const request = createRequest({
      name: 'Ada Lovelace',
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
