import type { UserRecord } from '@/features/users/types'

export interface SessionRecord {
  id: bigint
  tokenHash: string
  userId: bigint
  expiresAt: Date
  createdAt: Date
}

export interface SessionWithUserRecord extends SessionRecord {
  user: UserRecord
}

export interface CreateSessionRepositoryInput {
  id: bigint
  tokenHash: string
  userId: bigint
  expiresAt: Date
}

export interface CreateSessionInput {
  userId: bigint
}

export interface CreateSessionResult {
  session: SessionRecord
  rawToken: string
}

export interface ValidateSessionResult {
  session: SessionRecord
  user: UserRecord
}
