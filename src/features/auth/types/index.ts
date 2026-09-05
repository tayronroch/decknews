export interface Session {
  userId: string
  token: string
  expiresAt: Date
}

export interface AuthCredentials {
  email: string
  passwordHash: string
}
