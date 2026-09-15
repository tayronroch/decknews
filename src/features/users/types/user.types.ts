export type UserRole = 'USER' | 'ADMIN'

export type UserRecord = {
  id: bigint
  name: string
  email: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export type UserAuthRecord = {
  id: bigint
  name: string
  email: string
  role: UserRole
  passwordHash: string
  createdAt: Date
  updatedAt: Date
}

export type CreateUserRepositoryInput = {
  id: bigint
  name: string
  email: string
  passwordHash: string
}
