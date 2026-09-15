import type {
  CreateSessionRepositoryInput,
  SessionRecord,
  SessionWithUserRecord,
} from '@/features/sessions/types'
import type { UserRole } from '@/features/users/types'
import { getUniqueConstraintFields, prisma } from '@/infra/database'
import { UniqueConstraintError } from '@/shared/errors/persistence'

/**
 * Persisted session shape as returned by the Prisma client, described structurally
 * (repositories may not import `@prisma/client` directly).
 */
type PersistedSession = {
  id: bigint
  tokenHash: string
  userId: bigint
  expiresAt: Date
  createdAt: Date
}

type PersistedSessionWithUser = PersistedSession & {
  user: {
    id: bigint
    name: string
    email: string
    role: string
    createdAt: Date
    updatedAt: Date
  }
}

const SESSION_FIELDS = {
  id: true,
  tokenHash: true,
  userId: true,
  expiresAt: true,
  createdAt: true,
} as const

const USER_PUBLIC_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const

function toSessionRecord(session: PersistedSession): SessionRecord {
  return {
    id: session.id,
    tokenHash: session.tokenHash,
    userId: session.userId,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
  }
}

function toSessionWithUserRecord(
  session: PersistedSessionWithUser
): SessionWithUserRecord {
  return {
    id: session.id,
    tokenHash: session.tokenHash,
    userId: session.userId,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role as UserRole,
      createdAt: session.user.createdAt,
      updatedAt: session.user.updatedAt,
    },
  }
}

export interface SessionRepository {
  createSession(input: CreateSessionRepositoryInput): Promise<SessionRecord>
  findSessionByTokenHash(tokenHash: string): Promise<SessionRecord | null>
  findSessionWithUserByTokenHash(
    tokenHash: string
  ): Promise<SessionWithUserRecord | null>
  deleteSessionById(id: bigint): Promise<void>
  deleteSessionsByUserId(userId: bigint): Promise<void>
}

export async function createSession(
  input: CreateSessionRepositoryInput
): Promise<SessionRecord> {
  try {
    const session = await prisma.session.create({
      data: {
        id: input.id,
        tokenHash: input.tokenHash,
        userId: input.userId,
        expiresAt: input.expiresAt,
      },
      select: SESSION_FIELDS,
    })
    return toSessionRecord(session)
  } catch (error) {
    const fields = getUniqueConstraintFields(error)
    if (fields !== null) {
      throw new UniqueConstraintError(fields, { cause: error })
    }
    throw error
  }
}

export async function findSessionByTokenHash(
  tokenHash: string
): Promise<SessionRecord | null> {
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    select: SESSION_FIELDS,
  })
  return session ? toSessionRecord(session) : null
}

export async function findSessionWithUserByTokenHash(
  tokenHash: string
): Promise<SessionWithUserRecord | null> {
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    select: {
      ...SESSION_FIELDS,
      user: {
        select: USER_PUBLIC_FIELDS,
      },
    },
  })
  return session ? toSessionWithUserRecord(session) : null
}

export async function deleteSessionById(id: bigint): Promise<void> {
  await prisma.session.deleteMany({
    where: { id },
  })
}

export async function deleteSessionsByUserId(userId: bigint): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  })
}

export const sessionRepository: SessionRepository = {
  createSession,
  findSessionByTokenHash,
  findSessionWithUserByTokenHash,
  deleteSessionById,
  deleteSessionsByUserId,
}
