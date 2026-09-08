import { env } from '@/lib/env/server'

import { Argon2PasswordHasher } from './argon2-password-hasher'
import type { PasswordHasher } from './password-hasher'

export * from './argon2-password-hasher'
export * from './errors'
export * from './password-hasher'

export const passwordHasher: PasswordHasher = new Argon2PasswordHasher({
  pepper: env.PASSWORD_PEPPER,
  previousPeppers: env.PASSWORD_PEPPER_PREVIOUS
    ? [env.PASSWORD_PEPPER_PREVIOUS]
    : undefined,
})
