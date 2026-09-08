export interface PasswordVerifyResult {
  /**
   * Indicates whether the provided password matches the persisted hash.
   */
  valid: boolean

  /**
   * Indicates whether the password was verified successfully using a previous pepper
   * (PASSWORD_PEPPER_PREVIOUS), signaling that the hash should be updated
   * with the current pepper.
   */
  needsRehash: boolean
}

export interface PasswordHasher {
  /**
   * Generates a password hash using HMAC-SHA-256 (with current pepper) + Argon2id.
   * Returns the complete encoded Argon2 string.
   */
  hash(password: string): Promise<string>

  /**
   * Verifies the password against the persisted hash.
   * Returns true if the password is valid (with current or previous pepper), or false otherwise.
   */
  verify(password: string, hash: string): Promise<boolean>

  /**
   * Verifies the password against the hash and indicates if a rehash is needed
   * due to verification with a previous pepper.
   */
  verifyWithRehash(
    password: string,
    hash: string
  ): Promise<PasswordVerifyResult>
}
