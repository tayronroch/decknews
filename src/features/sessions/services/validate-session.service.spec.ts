/**
 * @jest-environment node
 */
import type { SessionRepository } from '@/features/sessions/repositories'
import type { SessionWithUserRecord } from '@/features/sessions/types'
import type { SessionTokenGenerator } from '@/infra/security/session'

import {
  ValidateSessionService,
  validateSessionService,
} from './validate-session.service'

describe('ValidateSessionService', () => {
  const mockSessionRepository: jest.Mocked<
    Pick<SessionRepository, 'findSessionWithUserByTokenHash'>
  > = {
    findSessionWithUserByTokenHash: jest.fn(),
  }

  const mockTokenGenerator: jest.Mocked<Pick<SessionTokenGenerator, 'hash'>> = {
    hash: jest.fn(),
  }

  const fixedNow = new Date('2026-09-15T12:00:00.000Z')
  const futureExpiration = new Date('2026-09-22T12:00:00.000Z')
  const pastExpiration = new Date('2026-09-15T11:59:59.000Z')

  const validSessionWithUser: SessionWithUserRecord = {
    id: 111222333444555666n,
    tokenHash: 'computed-sha256-hash',
    userId: 987654321012345678n,
    expiresAt: futureExpiration,
    createdAt: new Date('2026-09-15T00:00:00.000Z'),
    user: {
      id: 987654321012345678n,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'USER',
      createdAt: new Date('2026-09-01T00:00:00.000Z'),
      updatedAt: new Date('2026-09-01T00:00:00.000Z'),
    },
  }

  let service: ValidateSessionService

  beforeEach(() => {
    jest.clearAllMocks()

    service = new ValidateSessionService({
      sessionRepository: mockSessionRepository,
      tokenGenerator: mockTokenGenerator,
      now: () => fixedNow,
    })
  })

  it('authenticates and returns session and user when token is valid and unexpired', async () => {
    const rawToken = 'valid-session-token'
    const tokenHash = 'computed-sha256-hash'

    mockTokenGenerator.hash.mockReturnValueOnce(tokenHash)
    mockSessionRepository.findSessionWithUserByTokenHash.mockResolvedValueOnce(
      validSessionWithUser
    )

    const result = await service.execute(rawToken)

    expect(mockTokenGenerator.hash).toHaveBeenCalledWith(rawToken)
    expect(
      mockSessionRepository.findSessionWithUserByTokenHash
    ).toHaveBeenCalledWith(tokenHash)

    expect(result).toEqual({
      session: {
        id: validSessionWithUser.id,
        tokenHash: validSessionWithUser.tokenHash,
        userId: validSessionWithUser.userId,
        expiresAt: validSessionWithUser.expiresAt,
        createdAt: validSessionWithUser.createdAt,
      },
      user: validSessionWithUser.user,
    })
  })

  it('returns null when session does not exist in repository', async () => {
    mockTokenGenerator.hash.mockReturnValueOnce('hash-not-found')
    mockSessionRepository.findSessionWithUserByTokenHash.mockResolvedValueOnce(
      null
    )

    const result = await service.execute('invalid-token')

    expect(result).toBeNull()
  })

  it('returns null when session is expired', async () => {
    const expiredSession: SessionWithUserRecord = {
      ...validSessionWithUser,
      expiresAt: pastExpiration,
    }

    mockTokenGenerator.hash.mockReturnValueOnce('hash-expired')
    mockSessionRepository.findSessionWithUserByTokenHash.mockResolvedValueOnce(
      expiredSession
    )

    const result = await service.execute('expired-token')

    expect(result).toBeNull()
  })

  it('returns null immediately when token is empty, null, or undefined', async () => {
    expect(await service.execute('')).toBeNull()
    expect(await service.execute('   ')).toBeNull()
    expect(await service.execute(null)).toBeNull()
    expect(await service.execute(undefined)).toBeNull()

    expect(mockTokenGenerator.hash).not.toHaveBeenCalled()
    expect(
      mockSessionRepository.findSessionWithUserByTokenHash
    ).not.toHaveBeenCalled()
  })

  it('exports a default singleton instance', () => {
    expect(validateSessionService).toBeInstanceOf(ValidateSessionService)
  })
})
