import type {
  CreateUserRepositoryInput,
  UserAuthRecord,
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
  role: string
  createdAt: Date
  updatedAt: Date
}

type PersistedAuthUser = PersistedUser & {
  passwordHash: string
}

const USER_PUBLIC_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const

const USER_AUTH_FIELDS = {
  ...USER_PUBLIC_FIELDS,
  passwordHash: true,
} as const

/**
 * Maps the raw persistence result to the feature's own contract, so any field
 * Prisma adds to the `User` model in the future does not silently leak through.
 */
function toUserRecord(user: PersistedUser): UserRecord {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

function toUserAuthRecord(user: PersistedAuthUser): UserAuthRecord {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export interface UserRepository {
  findUserById(id: bigint): Promise<UserRecord | null>
  findUserByEmail(email: string): Promise<UserRecord | null>
  findUserAuthByEmail(email: string): Promise<UserAuthRecord | null>
  updatePasswordHash(userId: bigint, passwordHash: string): Promise<void>
  createUser(input: CreateUserRepositoryInput): Promise<UserRecord>
}

export async function findUserById(id: bigint): Promise<UserRecord | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: USER_PUBLIC_FIELDS,
  })
  return user ? toUserRecord(user) : null
}

export async function findUserByEmail(
  email: string
): Promise<UserRecord | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: USER_PUBLIC_FIELDS,
  })
  return user ? toUserRecord(user) : null
}

export async function findUserAuthByEmail(
  email: string
): Promise<UserAuthRecord | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: USER_AUTH_FIELDS,
  })
  return user ? toUserAuthRecord(user) : null
}

export async function updatePasswordHash(
  userId: bigint,
  passwordHash: string
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  })
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
      select: USER_PUBLIC_FIELDS,
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
  findUserAuthByEmail,
  updatePasswordHash,
  createUser,
}
