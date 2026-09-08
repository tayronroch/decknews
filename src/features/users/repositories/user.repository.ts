import type {
  CreateUserRepositoryInput,
  UserRecord,
  UserRole,
} from '@/features/users/types'
import { getUniqueConstraintFields, prisma } from '@/infra/database'
import { UniqueConstraintError } from '@/shared/errors/persistence'

/**
 * Persisted user shape as returned by the Prisma client, described structurally
 * (not imported from `@prisma/client`, which repositories may not import directly).
 */
type PersistedUser = {
  id: bigint
  name: string
  email: string
  passwordHash: string
  role: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Maps the raw persistence result to the feature's own contract, so any field
 * Prisma adds to the `User` model in the future does not silently leak through.
 */
function toUserRecord(user: PersistedUser): UserRecord {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role as UserRole,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export interface UserRepository {
  findUserById(id: bigint): Promise<UserRecord | null>
  findUserByEmail(email: string): Promise<UserRecord | null>
  createUser(input: CreateUserRepositoryInput): Promise<UserRecord>
}

export async function findUserById(id: bigint): Promise<UserRecord | null> {
  const user = await prisma.user.findUnique({ where: { id } })
  return user ? toUserRecord(user) : null
}

export async function findUserByEmail(
  email: string
): Promise<UserRecord | null> {
  const user = await prisma.user.findUnique({ where: { email } })
  return user ? toUserRecord(user) : null
}

export async function createUser(
  input: CreateUserRepositoryInput
): Promise<UserRecord> {
  try {
    const user = await prisma.user.create({
      data: {
        id: input.id,
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
      },
    })
    return toUserRecord(user)
  } catch (error) {
    const fields = getUniqueConstraintFields(error)

    if (fields !== null) {
      throw new UniqueConstraintError(fields, {
        cause: error,
      })
    }

    throw error
  }
}

export const userRepository: UserRepository = {
  findUserById,
  findUserByEmail,
  createUser,
}
