/**
 * @jest-environment node
 */
import type { SessionRepository } from '@/features/sessions/repositories'
import type { SessionTokenGenerator } from '@/infra/security/session'

import {
  InvalidateSessionService,
  invalidateSessionService,
} from './invalidate-session.service'

describe('InvalidateSessionService', () => {
  const mockSessionRepository: jest.Mocked<
    Pick<SessionRepository, 'deleteSessionByTokenHash'>
  > = {
    deleteSessionByTokenHash: jest.fn(),
  }

  const mockTokenGenerator: jest.Mocked<Pick<SessionTokenGenerator, 'hash'>> = {
    hash: jest.fn(),
  }

  let service: InvalidateSessionService

  beforeEach(() => {
    jest.clearAllMocks()

    service = new InvalidateSessionService({
      sessionRepository: mockSessionRepository,
      tokenGenerator: mockTokenGenerator,
    })
  })

  it('hashes a valid token and deletes session by tokenHash', async () => {
    const rawToken = 'valid-session-token'
    const tokenHash = 'computed-sha256-hash'

    mockTokenGenerator.hash.mockReturnValueOnce(tokenHash)
    mockSessionRepository.deleteSessionByTokenHash.mockResolvedValueOnce()

    await service.execute(rawToken)

    expect(mockTokenGenerator.hash).toHaveBeenCalledWith(rawToken)
    expect(mockSessionRepository.deleteSessionByTokenHash).toHaveBeenCalledWith(
      tokenHash
    )
  })

  it('terminates without hashing or calling repository when token is empty, whitespace, null, or undefined', async () => {
    await service.execute('')
    await service.execute('   ')
    await service.execute(null)
    await service.execute(undefined)

    expect(mockTokenGenerator.hash).not.toHaveBeenCalled()
    expect(
      mockSessionRepository.deleteSessionByTokenHash
    ).not.toHaveBeenCalled()
  })

  it('propagates unexpected repository errors', async () => {
    const rawToken = 'valid-session-token'
    const tokenHash = 'computed-sha256-hash'
    const dbError = new Error('Database connection failed')

    mockTokenGenerator.hash.mockReturnValueOnce(tokenHash)
    mockSessionRepository.deleteSessionByTokenHash.mockRejectedValueOnce(
      dbError
    )

    await expect(service.execute(rawToken)).rejects.toThrow(
      'Database connection failed'
    )
    expect(mockTokenGenerator.hash).toHaveBeenCalledWith(rawToken)
    expect(mockSessionRepository.deleteSessionByTokenHash).toHaveBeenCalledWith(
      tokenHash
    )
  })

  it('exports a default singleton instance', () => {
    expect(invalidateSessionService).toBeInstanceOf(InvalidateSessionService)
  })
})
