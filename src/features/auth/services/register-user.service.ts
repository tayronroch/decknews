import type { UserRepository } from '@/features/users/repositories'
import { userRepository as defaultUserRepository } from '@/features/users/repositories'
import { ConflictError } from '@/infra/errors'
import type { IdGenerator } from '@/infra/id'
import { idGenerator as defaultIdGenerator } from '@/infra/id'
import type { PasswordHasher } from '@/infra/security/password'
import { passwordHasher as defaultPasswordHasher } from '@/infra/security/password'
import { UniqueConstraintError } from '@/shared/errors/persistence'

import type { RegisterInput } from '../schemas/register.schema'
import type { RegisterUserResult } from '../types/register.types'

export type RegisterUserRepository = Pick<
  UserRepository,
  'findUserByEmail' | 'createUser'
>

export interface RegisterUserServiceDependencies {
  userRepository: RegisterUserRepository
  idGenerator: IdGenerator
  passwordHasher: PasswordHasher
}

const defaultDependencies: RegisterUserServiceDependencies = {
  userRepository: defaultUserRepository,
  idGenerator: defaultIdGenerator,
  passwordHasher: defaultPasswordHasher,
}

export class RegisterUserService {
  private readonly deps: RegisterUserServiceDependencies

  constructor(dependencies: Partial<RegisterUserServiceDependencies> = {}) {
    this.deps = {
      userRepository:
        dependencies.userRepository ?? defaultDependencies.userRepository,
      idGenerator: dependencies.idGenerator ?? defaultDependencies.idGenerator,
      passwordHasher:
        dependencies.passwordHasher ?? defaultDependencies.passwordHasher,
    }
  }

  async execute(input: RegisterInput): Promise<RegisterUserResult> {
    const existingUser = await this.deps.userRepository.findUserByEmail(
      input.email
    )

    if (existingUser) {
      throw new ConflictError('E-mail já cadastrado')
    }

    const id = this.deps.idGenerator.next()
    const passwordHash = await this.deps.passwordHasher.hash(input.password)

    try {
      const user = await this.deps.userRepository.createUser({
        id,
        name: input.name,
        email: input.email,
        passwordHash,
      })

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      }
    } catch (error) {
      if (
        error instanceof UniqueConstraintError &&
        error.fields.includes('email')
      ) {
        throw new ConflictError('E-mail já cadastrado', { cause: error })
      }

      throw error
    }
  }
}

export const registerUserService = new RegisterUserService()
