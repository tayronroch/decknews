export type UserRole = 'USER' | 'ADMIN'

export type UserRecord = {
  id: bigint
  name: string
  email: string
  passwordHash: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export type CreateUserRepositoryInput = {
  id: bigint
  name: string
  email: string
  passwordHash: string
}
