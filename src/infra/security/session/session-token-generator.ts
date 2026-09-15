import { createHash, randomBytes } from 'node:crypto'

export interface SessionTokenGenerator {
  generate(): string
  hash(token: string): string
}

export class CryptoSessionTokenGenerator implements SessionTokenGenerator {
  /**
   * Generates a cryptographically secure random token.
   * 32 bytes of entropy encoded as base64url (~43 characters).
   * base64url is URL/cookie-safe (no +, /, or = padding).
   */
  generate(): string {
    return randomBytes(32).toString('base64url')
  }

  /**
   * Computes the SHA-256 hex digest of the given raw token.
   * Only this hash is stored in the database.
   */
  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }
}

export const sessionTokenGenerator = new CryptoSessionTokenGenerator()
