import {
  type SessionRepository,
  sessionRepository as defaultSessionRepository,
} from '@/features/sessions/repositories'
import type { ValidateSessionResult } from '@/features/sessions/types'
import {
  type SessionTokenGenerator,
  sessionTokenGenerator as defaultSessionTokenGenerator,
} from '@/infra/security/session'

export interface ValidateSessionServiceDependencies {
  sessionRepository: Pick<SessionRepository, 'findSessionWithUserByTokenHash'>
  tokenGenerator: Pick<SessionTokenGenerator, 'hash'>
  now?: () => Date
}

const defaultDependencies: ValidateSessionServiceDependencies = {
  sessionRepository: defaultSessionRepository,
  tokenGenerator: defaultSessionTokenGenerator,
}

export class ValidateSessionService {
  private readonly deps: ValidateSessionServiceDependencies

  constructor(dependencies: Partial<ValidateSessionServiceDependencies> = {}) {
    this.deps = {
      sessionRepository:
        dependencies.sessionRepository ?? defaultDependencies.sessionRepository,
      tokenGenerator:
        dependencies.tokenGenerator ?? defaultDependencies.tokenGenerator,
      now: dependencies.now,
    }
  }

  async execute(
    token: string | undefined | null
  ): Promise<ValidateSessionResult | null> {
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return null
    }

    const tokenHash = this.deps.tokenGenerator.hash(token)
    const sessionWithUser =
      await this.deps.sessionRepository.findSessionWithUserByTokenHash(
        tokenHash
      )

    if (!sessionWithUser) {
      return null
    }

    const now = this.deps.now ? this.deps.now() : new Date()

    if (sessionWithUser.expiresAt <= now) {
      return null
    }

    return {
      session: {
        id: sessionWithUser.id,
        tokenHash: sessionWithUser.tokenHash,
        userId: sessionWithUser.userId,
        expiresAt: sessionWithUser.expiresAt,
        createdAt: sessionWithUser.createdAt,
      },
      user: sessionWithUser.user,
    }
  }
}

export const validateSessionService = new ValidateSessionService()
