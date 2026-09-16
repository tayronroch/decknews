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
  sessionRepository: Pick<SessionRepository, 'findSessionByTokenHash'>
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
    const session =
      await this.deps.sessionRepository.findSessionByTokenHash(tokenHash)

    if (!session) {
      return null
    }

    const now = this.deps.now ? this.deps.now() : new Date()

    if (session.expiresAt <= now) {
      return null
    }

    return {
      session,
    }
  }
}

export const validateSessionService = new ValidateSessionService()
