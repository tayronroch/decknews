import {
  type SessionRepository,
  sessionRepository as defaultSessionRepository,
} from '@/features/sessions/repositories'
import {
  type SessionTokenGenerator,
  sessionTokenGenerator as defaultSessionTokenGenerator,
} from '@/infra/security/session'

export interface InvalidateSessionServiceDependencies {
  sessionRepository: Pick<SessionRepository, 'deleteSessionByTokenHash'>
  tokenGenerator: Pick<SessionTokenGenerator, 'hash'>
}

const defaultDependencies: InvalidateSessionServiceDependencies = {
  sessionRepository: defaultSessionRepository,
  tokenGenerator: defaultSessionTokenGenerator,
}

export class InvalidateSessionService {
  private readonly deps: InvalidateSessionServiceDependencies

  constructor(
    dependencies: Partial<InvalidateSessionServiceDependencies> = {}
  ) {
    this.deps = {
      sessionRepository:
        dependencies.sessionRepository ?? defaultDependencies.sessionRepository,
      tokenGenerator:
        dependencies.tokenGenerator ?? defaultDependencies.tokenGenerator,
    }
  }

  async execute(token: string | undefined | null): Promise<void> {
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return
    }

    const tokenHash = this.deps.tokenGenerator.hash(token)
    await this.deps.sessionRepository.deleteSessionByTokenHash(tokenHash)
  }
}

export const invalidateSessionService = new InvalidateSessionService()
