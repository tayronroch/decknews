export * from './login.types'
export * from './register.types'

export interface Session {
  userId: string
  token: string
  expiresAt: Date
}
