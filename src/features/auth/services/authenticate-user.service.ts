import type { UserRepository } from '@/features/users/repositories'
import { userRepository as defaultUserRepository } from '@/features/users/repositories'
import { UnauthorizedError } from '@/infra/errors'
import type { PasswordHasher } from '@/infra/security/password'
import { passwordHasher as defaultPasswordHasher } from '@/infra/security/password'

import type { LoginInput } from '../schemas/login.schema'
import type { AuthenticateUserResult } from '../types/login.types'

export type AuthenticateUserRepository = Pick<
  UserRepository,
  'findUserAuthByEmail' | 'updatePasswordHash'
>

export interface AuthenticateUserServiceDependencies {
  userRepository: AuthenticateUserRepository
  passwordHasher: PasswordHasher
  dummyPasswordHash?: string
}

/**
 * Valid static Argon2id hash used to equalize execution timing when the user is not found.
 * Matches production cost parameters (m=65536, t=3, p=1) without corresponding to any real account.
 */
export const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,t=3,p=1$iPcmYVA4207HtEuVKrVhNA$Ark7TAigO1P0vYcdNWd4BqGIaOR9mLeqJjYlpV2B4l4'

const defaultDependencies: AuthenticateUserServiceDependencies = {
  userRepository: defaultUserRepository,
  passwordHasher: defaultPasswordHasher,
  dummyPasswordHash: DUMMY_PASSWORD_HASH,
}

export class AuthenticateUserService {
  private readonly deps: AuthenticateUserServiceDependencies

  constructor(dependencies: Partial<AuthenticateUserServiceDependencies> = {}) {
    this.deps = {
      userRepository:
        dependencies.userRepository ?? defaultDependencies.userRepository,
      passwordHasher:
        dependencies.passwordHasher ?? defaultDependencies.passwordHasher,
      dummyPasswordHash:
        dependencies.dummyPasswordHash ?? defaultDependencies.dummyPasswordHash,
    }
  }

  async execute(input: LoginInput): Promise<AuthenticateUserResult> {
    const email = input.email.trim().toLowerCase()
    const user = await this.deps.userRepository.findUserAuthByEmail(email)

    if (!user) {
      // Execute Argon2id with dummy hash over all configured peppers to avoid timing side-channel
      await this.deps.passwordHasher.verifyWithRehash(
        input.password,
        this.deps.dummyPasswordHash!
      )

      throw new UnauthorizedError('Credenciais inválidas')
    }

    const verifyResult = await this.deps.passwordHasher.verifyWithRehash(
      input.password,
      user.passwordHash
    )

    if (!verifyResult.valid) {
      throw new UnauthorizedError('Credenciais inválidas')
    }

    if (verifyResult.needsRehash) {
      const newPasswordHash = await this.deps.passwordHasher.hash(
        input.password
      )
      await this.deps.userRepository.updatePasswordHash(
        user.id,
        newPasswordHash
      )
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    }
  }
}

export const authenticateUserService = new AuthenticateUserService()
