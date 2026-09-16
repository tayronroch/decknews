/**
 * @jest-environment node
 */
import type { SessionRepository } from '@/features/sessions/repositories'
import type { SessionRecord } from '@/features/sessions/types'
import type { SessionTokenGenerator } from '@/infra/security/session'

import {
  ValidateSessionService,
  validateSessionService,
} from './validate-session.service'

describe('ValidateSessionService', () => {
  const mockSessionRepository: jest.Mocked<
    Pick<SessionRepository, 'findSessionByTokenHash'>
  > = {
    findSessionByTokenHash: jest.fn(),
  }

  const mockTokenGenerator: jest.Mocked<Pick<SessionTokenGenerator, 'hash'>> = {
    hash: jest.fn(),
  }

  const fixedNow = new Date('2026-09-15T12:00:00.000Z')
  const futureExpiration = new Date('2026-09-22T12:00:00.000Z')
  const pastExpiration = new Date('2026-09-15T11:59:59.000Z')

  const validSession: SessionRecord = {
    id: 111222333444555666n,
    tokenHash: 'computed-sha256-hash',
    userId: 987654321012345678n,
    expiresAt: futureExpiration,
    createdAt: new Date('2026-09-15T00:00:00.000Z'),
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

  it('returns the session when token is valid and unexpired', async () => {
    const rawToken = 'valid-session-token'
    const tokenHash = 'computed-sha256-hash'

    mockTokenGenerator.hash.mockReturnValueOnce(tokenHash)
    mockSessionRepository.findSessionByTokenHash.mockResolvedValueOnce(
      validSession
    )

    const result = await service.execute(rawToken)

    expect(mockTokenGenerator.hash).toHaveBeenCalledWith(rawToken)
    expect(mockSessionRepository.findSessionByTokenHash).toHaveBeenCalledWith(
      tokenHash
    )

    expect(result).toEqual({
      session: validSession,
    })
  })

  it('returns null when session does not exist in repository', async () => {
    mockTokenGenerator.hash.mockReturnValueOnce('hash-not-found')
    mockSessionRepository.findSessionByTokenHash.mockResolvedValueOnce(null)

    const result = await service.execute('invalid-token')

    expect(result).toBeNull()
  })

  it('returns null when session is expired', async () => {
    const expiredSession: SessionRecord = {
      ...validSession,
      expiresAt: pastExpiration,
    }

    mockTokenGenerator.hash.mockReturnValueOnce('hash-expired')
    mockSessionRepository.findSessionByTokenHash.mockResolvedValueOnce(
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
    expect(mockSessionRepository.findSessionByTokenHash).not.toHaveBeenCalled()
  })

  it('exports a default singleton instance', () => {
    expect(validateSessionService).toBeInstanceOf(ValidateSessionService)
  })
})
