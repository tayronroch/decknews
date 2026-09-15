import type { UserRole } from '@/features/users/types'

export type AuthenticateUserResult = {
  id: bigint
  name: string
  email: string
  role: UserRole
}

export type LoginSuccessResponse = {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
  }
}
