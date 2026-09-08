import type { UserRole } from '@/features/users/types'

export type RegisterUserResult = {
  id: bigint
  name: string
  email: string
  role: UserRole
  createdAt: Date
}

export type RegisterSuccessResponse = {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
    createdAt: string
  }
}
