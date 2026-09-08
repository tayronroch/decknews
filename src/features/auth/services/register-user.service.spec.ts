/**
 * @jest-environment node
 */
import { ConflictError } from '@/infra/errors'
import { UniqueConstraintError } from '@/shared/errors/persistence'

import { RegisterUserService } from './register-user.service'

describe('RegisterUserService', () => {
  const mockIdGenerator = { next: jest.fn() }
  const mockPasswordHasher = { hash: jest.fn(), verify: jest.fn() }
  const mockUserRepository = {
    findUserByEmail: jest.fn(),
    createUser: jest.fn(),
  }

  function createService() {
    return new RegisterUserService({
      idGenerator: mockIdGenerator,
      passwordHasher: mockPasswordHasher,
      userRepository: mockUserRepository,
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('successfully creates a valid user and returns RegisterUserResult without passwordHash', async () => {
    const service = createService()
    const input = {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secure-password-123',
    }

    mockUserRepository.findUserByEmail.mockResolvedValue(null)
    mockIdGenerator.next.mockReturnValue(123456789n)
    mockPasswordHasher.hash.mockResolvedValue('$argon2id$hashed-pass')
    mockUserRepository.createUser.mockResolvedValue({
      id: 123456789n,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      passwordHash: '$argon2id$hashed-pass',
      role: 'USER',
      createdAt: new Date('2026-09-07T23:00:00.000Z'),
      updatedAt: new Date('2026-09-07T23:00:00.000Z'),
    })

    const result = await service.execute(input)

    expect(result).toEqual({
      id: 123456789n,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'USER',
      createdAt: new Date('2026-09-07T23:00:00.000Z'),
    })
    expect((result as Record<string, unknown>).passwordHash).toBeUndefined()
  })

  it('checks for existing user by normalized email and throws ConflictError if found', async () => {
    const service = createService()
    mockUserRepository.findUserByEmail.mockResolvedValue({
      id: 999n,
      email: 'existing@example.com',
    })

    await expect(
      service.execute({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'secure-password-123',
      })
    ).rejects.toThrow(ConflictError)

    expect(mockUserRepository.createUser).not.toHaveBeenCalled()
  })

  it('calls IdGenerator.next() synchronously and passes generated ID to repository', async () => {
    const service = createService()
    mockUserRepository.findUserByEmail.mockResolvedValue(null)
    mockIdGenerator.next.mockReturnValue(987654321n)
    mockPasswordHasher.hash.mockResolvedValue('hashed')
    mockUserRepository.createUser.mockResolvedValue({
      id: 987654321n,
      name: 'Test',
      email: 'test@example.com',
      passwordHash: 'hashed',
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await service.execute({
      name: 'Test',
      email: 'test@example.com',
      password: 'secure-password-123',
    })

    expect(mockIdGenerator.next).toHaveBeenCalledTimes(1)
    expect(mockUserRepository.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ id: 987654321n })
    )
  })

  it('passes the plaintext password to PasswordHasher and never to the repository', async () => {
    const service = createService()
    mockUserRepository.findUserByEmail.mockResolvedValue(null)
    mockIdGenerator.next.mockReturnValue(1n)
    mockPasswordHasher.hash.mockResolvedValue('hashed-pass')
    mockUserRepository.createUser.mockResolvedValue({
      id: 1n,
      name: 'Test',
      email: 'test@example.com',
      passwordHash: 'hashed-pass',
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await service.execute({
      name: 'Test',
      email: 'test@example.com',
      password: 'plain-password-123',
    })

    expect(mockPasswordHasher.hash).toHaveBeenCalledWith('plain-password-123')
    expect(mockUserRepository.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ passwordHash: 'hashed-pass' })
    )
    expect(mockUserRepository.createUser).not.toHaveBeenCalledWith(
      expect.objectContaining({ password: 'plain-password-123' })
    )
  })

  it('translates UniqueConstraintError on email during race condition to ConflictError', async () => {
    const service = createService()
    mockUserRepository.findUserByEmail.mockResolvedValue(null)
    mockIdGenerator.next.mockReturnValue(1n)
    mockPasswordHasher.hash.mockResolvedValue('hashed-pass')
    mockUserRepository.createUser.mockRejectedValue(
      new UniqueConstraintError(['email'])
    )

    await expect(
      service.execute({
        name: 'Concurrent User',
        email: 'concurrent@example.com',
        password: 'secure-password-123',
      })
    ).rejects.toThrow(ConflictError)
  })

  it('rethrows UniqueConstraintError on non-email fields without masking as ConflictError', async () => {
    const service = createService()
    mockUserRepository.findUserByEmail.mockResolvedValue(null)
    mockIdGenerator.next.mockReturnValue(1n)
    mockPasswordHasher.hash.mockResolvedValue('hashed-pass')
    mockUserRepository.createUser.mockRejectedValue(
      new UniqueConstraintError(['slug'])
    )

    await expect(
      service.execute({
        name: 'Slug User',
        email: 'slug@example.com',
        password: 'secure-password-123',
      })
    ).rejects.toThrow(UniqueConstraintError)
  })

  it('propagates unexpected repository errors', async () => {
    const service = createService()
    mockUserRepository.findUserByEmail.mockResolvedValue(null)
    mockIdGenerator.next.mockReturnValue(1n)
    mockPasswordHasher.hash.mockResolvedValue('hashed-pass')
    mockUserRepository.createUser.mockRejectedValue(new Error('DB crash'))

    await expect(
      service.execute({
        name: 'Crash',
        email: 'crash@example.com',
        password: 'secure-password-123',
      })
    ).rejects.toThrow('DB crash')
  })
})
