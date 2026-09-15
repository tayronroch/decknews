/**
 * @jest-environment node
 */
import type { SessionRepository } from '@/features/sessions/repositories'
import type { SessionRecord } from '@/features/sessions/types'
import type { IdGenerator } from '@/infra/id'
import type { SessionTokenGenerator } from '@/infra/security/session'

import {
  CreateSessionService,
  createSessionService,
} from './create-session.service'

describe('CreateSessionService', () => {
  const mockSessionRepository: jest.Mocked<
    Pick<SessionRepository, 'createSession'>
  > = {
    createSession: jest.fn(),
  }

  const mockIdGenerator: jest.Mocked<IdGenerator> = {
    next: jest.fn(),
  }

  const mockTokenGenerator: jest.Mocked<SessionTokenGenerator> = {
    generate: jest.fn(),
    hash: jest.fn(),
  }

  const fixedNow = new Date('2026-09-15T12:00:00.000Z')
  const ttlSeconds = 604800 // 7 days
  const expectedExpiresAt = new Date('2026-09-22T12:00:00.000Z')

  let service: CreateSessionService

  beforeEach(() => {
    jest.clearAllMocks()

    service = new CreateSessionService({
      sessionRepository: mockSessionRepository,
      idGenerator: mockIdGenerator,
      tokenGenerator: mockTokenGenerator,
      sessionTtlInSeconds: ttlSeconds,
      now: () => fixedNow,
    })
  })

  it('generates an ID, secure token, and hashes the token for persistence', async () => {
    const generatedId = 987654321012345678n
    const rawToken = 'random-crypto-token-value-32-bytes'
    const tokenHash = 'computed-sha256-hash-64-characters'
    const userId = 123456789012345678n

    mockIdGenerator.next.mockReturnValueOnce(generatedId)
    mockTokenGenerator.generate.mockReturnValueOnce(rawToken)
    mockTokenGenerator.hash.mockReturnValueOnce(tokenHash)

    const persistedSession: SessionRecord = {
      id: generatedId,
      tokenHash,
      userId,
      expiresAt: expectedExpiresAt,
      createdAt: fixedNow,
    }

    mockSessionRepository.createSession.mockResolvedValueOnce(persistedSession)

    const result = await service.execute({ userId })

    // Validates that idGenerator and tokenGenerator are called
    expect(mockIdGenerator.next).toHaveBeenCalledTimes(1)
    expect(mockTokenGenerator.generate).toHaveBeenCalledTimes(1)
    expect(mockTokenGenerator.hash).toHaveBeenCalledWith(rawToken)

    // Validates that ONLY the tokenHash is passed to the repository, never rawToken
    expect(mockSessionRepository.createSession).toHaveBeenCalledWith({
      id: generatedId,
      tokenHash,
      userId,
      expiresAt: expectedExpiresAt,
    })
    expect(
      mockSessionRepository.createSession.mock.calls[0][0]
    ).not.toHaveProperty('rawToken')
    expect(
      mockSessionRepository.createSession.mock.calls[0][0].tokenHash
    ).not.toBe(rawToken)

    // Validates the returned structure
    expect(result).toEqual({
      session: persistedSession,
      rawToken,
    })
  })

  it('propagates repository errors when persistence fails', async () => {
    mockIdGenerator.next.mockReturnValueOnce(1n)
    mockTokenGenerator.generate.mockReturnValueOnce('token')
    mockTokenGenerator.hash.mockReturnValueOnce('hash')
    mockSessionRepository.createSession.mockRejectedValueOnce(
      new Error('Database write error')
    )

    await expect(service.execute({ userId: 123n })).rejects.toThrow(
      'Database write error'
    )
  })

  it('exports a default singleton instance', () => {
    expect(createSessionService).toBeInstanceOf(CreateSessionService)
  })
})
