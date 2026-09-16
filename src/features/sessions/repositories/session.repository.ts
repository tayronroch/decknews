import type {
  CreateSessionRepositoryInput,
  SessionRecord,
} from '@/features/sessions/types'
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

const SESSION_FIELDS = {
  id: true,
  tokenHash: true,
  userId: true,
  expiresAt: true,
  createdAt: true,
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

export interface SessionRepository {
  createSession(input: CreateSessionRepositoryInput): Promise<SessionRecord>
  findSessionByTokenHash(tokenHash: string): Promise<SessionRecord | null>
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
  deleteSessionById,
  deleteSessionsByUserId,
}
