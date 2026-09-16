/**
 * @jest-environment node
 */
import { UnauthorizedError } from '@/infra/errors'

import { AuthenticateUserService } from './authenticate-user.service'

describe('AuthenticateUserService', () => {
  const mockPasswordHasher = {
    hash: jest.fn(),
    verify: jest.fn(),
    verifyWithRehash: jest.fn(),
  }

  const mockUserRepository = {
    findUserAuthByEmail: jest.fn(),
    updatePasswordHash: jest.fn(),
  }

  function createService() {
    return new AuthenticateUserService({
      passwordHasher: mockPasswordHasher,
      userRepository: mockUserRepository,
    })
  }

  const dbUser = {
    id: 123456789012345678n,
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    role: 'USER' as const,
    passwordHash: '$argon2id$v=19$persisted-hash',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('authenticates user with valid credentials and returns public result without secrets', async () => {
    const service = createService()
    const input = {
      email: 'ada@example.com',
      password: 'correct-password-123',
    }

    mockUserRepository.findUserAuthByEmail.mockResolvedValueOnce(dbUser)
    mockPasswordHasher.verifyWithRehash.mockResolvedValueOnce({
      valid: true,
      needsRehash: false,
    })

    const result = await service.execute(input)

    expect(result).toEqual({
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
    })
    expect((result as Record<string, unknown>).password).toBeUndefined()
    expect((result as Record<string, unknown>).passwordHash).toBeUndefined()
    expect(mockUserRepository.updatePasswordHash).not.toHaveBeenCalled()
  })

  it('rehashes password with current pepper and updates repository when needsRehash is true', async () => {
    const service = createService()
    const input = {
      email: 'ada@example.com',
      password: 'previous-pepper-password',
    }

    mockUserRepository.findUserAuthByEmail.mockResolvedValueOnce(dbUser)
    mockPasswordHasher.verifyWithRehash.mockResolvedValueOnce({
      valid: true,
      needsRehash: true,
    })
    mockPasswordHasher.hash.mockResolvedValueOnce(
      '$argon2id$v=19$new-rehashed-value'
    )
    mockUserRepository.updatePasswordHash.mockResolvedValueOnce(undefined)

    const result = await service.execute(input)

    expect(result).toEqual({
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
    })
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith(
      'previous-pepper-password'
    )
    expect(mockUserRepository.updatePasswordHash).toHaveBeenCalledWith(
      dbUser.id,
      '$argon2id$v=19$new-rehashed-value'
    )
  })

  it('throws UnauthorizedError with "Credenciais inválidas" when password is wrong', async () => {
    const service = createService()
    const input = {
      email: 'ada@example.com',
      password: 'wrong-password',
    }

    mockUserRepository.findUserAuthByEmail.mockResolvedValueOnce(dbUser)
    mockPasswordHasher.verifyWithRehash.mockResolvedValueOnce({
      valid: false,
      needsRehash: false,
    })

    await expect(service.execute(input)).rejects.toThrow(
      new UnauthorizedError('Credenciais inválidas')
    )
    expect(mockUserRepository.updatePasswordHash).not.toHaveBeenCalled()
  })

  it('performs dummy verification using an Argon2id-compatible dummy hash and throws UnauthorizedError when user does not exist', async () => {
    const service = createService()
    const input = {
      email: 'missing@example.com',
      password: 'any-password',
    }

    mockUserRepository.findUserAuthByEmail.mockResolvedValueOnce(null)
    mockPasswordHasher.verifyWithRehash.mockResolvedValueOnce({
      valid: false,
      needsRehash: false,
    })

    await expect(service.execute(input)).rejects.toThrow(
      new UnauthorizedError('Credenciais inválidas')
    )

    expect(mockPasswordHasher.verifyWithRehash).toHaveBeenCalledTimes(1)
    expect(mockPasswordHasher.verifyWithRehash).toHaveBeenCalledWith(
      input.password,
      expect.stringMatching(/^\$argon2id\$/)
    )
    expect(mockUserRepository.updatePasswordHash).not.toHaveBeenCalled()
  })

  it('normalizes email defensively with trim and lowercase before querying repository', async () => {
    const service = createService()
    const input = {
      email: '   ADA@EXAMPLE.COM   ',
      password: 'correct-password-123',
    }

    mockUserRepository.findUserAuthByEmail.mockResolvedValueOnce(dbUser)
    mockPasswordHasher.verifyWithRehash.mockResolvedValueOnce({
      valid: true,
      needsRehash: false,
    })

    await service.execute(input)

    expect(mockUserRepository.findUserAuthByEmail).toHaveBeenCalledWith(
      'ada@example.com'
    )
  })

  it('passes original password intact without trimming or transformations to hasher', async () => {
    const service = createService()
    const input = {
      email: 'ada@example.com',
      password: '   spaces around password   ',
    }

    mockUserRepository.findUserAuthByEmail.mockResolvedValueOnce(dbUser)
    mockPasswordHasher.verifyWithRehash.mockResolvedValueOnce({
      valid: true,
      needsRehash: false,
    })

    await service.execute(input)

    expect(mockPasswordHasher.verifyWithRehash).toHaveBeenCalledWith(
      '   spaces around password   ',
      dbUser.passwordHash
    )
  })

  it('propagates unexpected repository errors', async () => {
    const service = createService()
    mockUserRepository.findUserAuthByEmail.mockRejectedValueOnce(
      new Error('Database connection failure')
    )

    await expect(
      service.execute({
        email: 'ada@example.com',
        password: 'pass',
      })
    ).rejects.toThrow('Database connection failure')
  })

  it('propagates unexpected hasher errors', async () => {
    const service = createService()
    mockUserRepository.findUserAuthByEmail.mockResolvedValueOnce(dbUser)
    mockPasswordHasher.verifyWithRehash.mockRejectedValueOnce(
      new Error('Hasher execution failure')
    )

    await expect(
      service.execute({
        email: 'ada@example.com',
        password: 'pass',
      })
    ).rejects.toThrow('Hasher execution failure')
  })
})
