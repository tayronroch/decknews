import {
  type SessionRepository,
  sessionRepository as defaultSessionRepository,
} from '@/features/sessions/repositories'
import type {
  CreateSessionInput,
  CreateSessionResult,
} from '@/features/sessions/types'
import { type IdGenerator, idGenerator as defaultIdGenerator } from '@/infra/id'
import {
  type SessionTokenGenerator,
  sessionTokenGenerator as defaultSessionTokenGenerator,
} from '@/infra/security/session'
import { env } from '@/lib/env/server'

export interface CreateSessionServiceDependencies {
  sessionRepository: Pick<SessionRepository, 'createSession'>
  idGenerator: IdGenerator
  tokenGenerator: SessionTokenGenerator
  sessionTtlInSeconds: number
  now?: () => Date
}

const defaultDependencies: CreateSessionServiceDependencies = {
  sessionRepository: defaultSessionRepository,
  idGenerator: defaultIdGenerator,
  tokenGenerator: defaultSessionTokenGenerator,
  sessionTtlInSeconds: env.SESSION_TTL_IN_SECONDS,
}

export class CreateSessionService {
  private readonly deps: CreateSessionServiceDependencies

  constructor(dependencies: Partial<CreateSessionServiceDependencies> = {}) {
    this.deps = {
      sessionRepository:
        dependencies.sessionRepository ?? defaultDependencies.sessionRepository,
      idGenerator: dependencies.idGenerator ?? defaultDependencies.idGenerator,
      tokenGenerator:
        dependencies.tokenGenerator ?? defaultDependencies.tokenGenerator,
      sessionTtlInSeconds:
        dependencies.sessionTtlInSeconds ??
        defaultDependencies.sessionTtlInSeconds,
      now: dependencies.now,
    }
  }

  async execute(input: CreateSessionInput): Promise<CreateSessionResult> {
    const id = this.deps.idGenerator.next()
    const rawToken = this.deps.tokenGenerator.generate()
    const tokenHash = this.deps.tokenGenerator.hash(rawToken)

    const now = this.deps.now ? this.deps.now() : new Date()
    const expiresAt = new Date(
      now.getTime() + this.deps.sessionTtlInSeconds * 1000
    )

    const session = await this.deps.sessionRepository.createSession({
      id,
      tokenHash,
      userId: input.userId,
      expiresAt,
    })

    return {
      session,
      rawToken,
    }
  }
}

export const createSessionService = new CreateSessionService()
