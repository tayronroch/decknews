/**
 * @jest-environment node
 */
import {
  Argon2PasswordHasher,
  DEFAULT_MEMORY_COST,
  DEFAULT_PARALLELISM,
  DEFAULT_TIME_COST,
  InvalidHasherConfigError,
  InvalidPepperError,
  passwordHasher,
} from './index'

describe('Argon2PasswordHasher', () => {
  const currentPepper = 'test-current-pepper-key-12345'
  const previousPepper = 'test-previous-pepper-key-67890'
  const unrelatedPepper = 'test-unrelated-pepper-key-99999'

  const fastOptions = {
    pepper: currentPepper,
    memoryCost: 4096,
    timeCost: 1,
    parallelism: 1,
  }

  describe('configuration validation', () => {
    it('throws InvalidPepperError when pepper is missing or undefined', () => {
      expect(
        () =>
          new Argon2PasswordHasher({
            ...fastOptions,
            pepper: undefined as unknown as string,
          })
      ).toThrow(InvalidPepperError)
    })

    it('throws InvalidPepperError when options is missing', () => {
      expect(
        () =>
          new Argon2PasswordHasher(undefined as unknown as { pepper: string })
      ).toThrow(InvalidPepperError)
    })

    it('throws InvalidPepperError when pepper is empty or whitespace only', () => {
      expect(
        () =>
          new Argon2PasswordHasher({
            ...fastOptions,
            pepper: '',
          })
      ).toThrow(InvalidPepperError)

      expect(
        () =>
          new Argon2PasswordHasher({
            ...fastOptions,
            pepper: '               ',
          })
      ).toThrow(InvalidPepperError)
    })

    it('throws InvalidPepperError when pepper has fewer than 16 characters', () => {
      expect(
        () =>
          new Argon2PasswordHasher({
            ...fastOptions,
            pepper: 'short-pepper-12',
          })
      ).toThrow(InvalidPepperError)
    })

    it('throws InvalidPepperError when any previous pepper has fewer than 16 characters', () => {
      expect(
        () =>
          new Argon2PasswordHasher({
            ...fastOptions,
            previousPeppers: ['short'],
          })
      ).toThrow(InvalidPepperError)
    })

    it('throws InvalidPepperError when previousPeppers is not an array', () => {
      expect(
        () =>
          new Argon2PasswordHasher({
            ...fastOptions,
            previousPeppers: 'not-an-array' as unknown as string[],
          })
      ).toThrow(InvalidPepperError)
    })

    it('throws InvalidHasherConfigError when memoryCost is less than or equal to 0', () => {
      expect(
        () =>
          new Argon2PasswordHasher({
            ...fastOptions,
            memoryCost: 0,
          })
      ).toThrow(InvalidHasherConfigError)

      expect(
        () =>
          new Argon2PasswordHasher({
            ...fastOptions,
            memoryCost: -1024,
          })
      ).toThrow(InvalidHasherConfigError)
    })

    it('throws InvalidHasherConfigError when timeCost is less than or equal to 0', () => {
      expect(
        () =>
          new Argon2PasswordHasher({
            ...fastOptions,
            timeCost: 0,
          })
      ).toThrow(InvalidHasherConfigError)

      expect(
        () =>
          new Argon2PasswordHasher({
            ...fastOptions,
            timeCost: -1,
          })
      ).toThrow(InvalidHasherConfigError)
    })

    it('throws InvalidHasherConfigError when parallelism is less than or equal to 0', () => {
      expect(
        () =>
          new Argon2PasswordHasher({
            ...fastOptions,
            parallelism: 0,
          })
      ).toThrow(InvalidHasherConfigError)

      expect(
        () =>
          new Argon2PasswordHasher({
            ...fastOptions,
            parallelism: -1,
          })
      ).toThrow(InvalidHasherConfigError)
    })

    it('accepts valid configuration and applies default production cost parameters when omitted', () => {
      const hasher = new Argon2PasswordHasher({
        pepper: currentPepper,
      })

      expect(hasher).toBeDefined()
      expect(DEFAULT_MEMORY_COST).toBe(65536)
      expect(DEFAULT_TIME_COST).toBe(3)
      expect(DEFAULT_PARALLELISM).toBe(1)
    })

    it('ensures error messages never leak the pepper value (Zero Leak)', () => {
      const secretPepper = 'secret-pepper-not-to-be-leaked-12345'
      try {
        new Argon2PasswordHasher({
          pepper: secretPepper,
          memoryCost: -1,
        })
      } catch (error) {
        expect((error as Error).message).not.toContain(secretPepper)
      }

      try {
        new Argon2PasswordHasher({
          pepper: secretPepper,
          previousPeppers: ['short'],
        })
      } catch (error) {
        expect((error as Error).message).not.toContain(secretPepper)
        expect((error as Error).message).not.toContain('short')
      }

      try {
        new Argon2PasswordHasher({
          pepper: 'short',
        })
      } catch (error) {
        expect((error as Error).message).not.toContain('short')
      }
    })
  })

  describe('hash', () => {
    it('returns a valid Argon2id string starting with $argon2id$', async () => {
      const hasher = new Argon2PasswordHasher(fastOptions)
      const hash = await hasher.hash('MySecurePassword123!')

      expect(typeof hash).toBe('string')
      expect(hash.startsWith('$argon2id$')).toBe(true)
    })

    it('generates different hashes for the same password due to random salt', async () => {
      const hasher = new Argon2PasswordHasher(fastOptions)
      const hash1 = await hasher.hash('SamePassword123!')
      const hash2 = await hasher.hash('SamePassword123!')

      expect(hash1).not.toBe(hash2)
    })

    it('does not contain the plaintext password or the pepper in the resulting hash string', async () => {
      const password = 'SuperSecretPlainPassword!'
      const hasher = new Argon2PasswordHasher(fastOptions)
      const hash = await hasher.hash(password)

      expect(hash.includes(password)).toBe(false)
      expect(hash.includes(currentPepper)).toBe(false)
    })

    it('throws an error if password is empty or not a string', async () => {
      const hasher = new Argon2PasswordHasher(fastOptions)

      await expect(hasher.hash('')).rejects.toThrow()
      await expect(
        hasher.hash(undefined as unknown as string)
      ).rejects.toThrow()
    })
  })

  describe('verify', () => {
    it('returns true for the correct password', async () => {
      const hasher = new Argon2PasswordHasher(fastOptions)
      const password = 'CorrectPassword456#'
      const hash = await hasher.hash(password)

      const isValid = await hasher.verify(password, hash)
      expect(isValid).toBe(true)
    })

    it('returns false for an incorrect password', async () => {
      const hasher = new Argon2PasswordHasher(fastOptions)
      const password = 'CorrectPassword456#'
      const hash = await hasher.hash(password)

      const isValid = await hasher.verify('WrongPassword789$', hash)
      expect(isValid).toBe(false)
    })

    it('returns false safely when hash is malformed or corrupted without throwing', async () => {
      const hasher = new Argon2PasswordHasher(fastOptions)

      const malformedHashes = [
        'invalid-hash-format',
        '$argon2id$v=19$corrupted_payload',
        '',
        'random-text-12345',
      ]

      for (const malformed of malformedHashes) {
        const result = await hasher.verify('password', malformed)
        expect(result).toBe(false)
      }
    })

    it('returns false when verifying with an incorrect or modified pepper', async () => {
      const hasherA = new Argon2PasswordHasher({
        ...fastOptions,
        pepper: currentPepper,
      })
      const hasherB = new Argon2PasswordHasher({
        ...fastOptions,
        pepper: unrelatedPepper,
      })

      const password = 'UserPassword777*'
      const hash = await hasherA.hash(password)

      const isValidWithHasherB = await hasherB.verify(password, hash)
      expect(isValidWithHasherB).toBe(false)
    })

    it('returns false when password or hash is empty', async () => {
      const hasher = new Argon2PasswordHasher(fastOptions)
      const hash = await hasher.hash('ValidPassword')

      expect(await hasher.verify('', hash)).toBe(false)
      expect(await hasher.verify('ValidPassword', '')).toBe(false)
    })
  })

  describe('verifyWithRehash (Zero Downtime Pepper Rotation)', () => {
    it('returns valid: true and needsRehash: false when password matches current pepper', async () => {
      const hasher = new Argon2PasswordHasher({
        ...fastOptions,
        pepper: currentPepper,
        previousPeppers: [previousPepper],
      })

      const password = 'CurrentPepperPassword123'
      const hash = await hasher.hash(password)

      const result = await hasher.verifyWithRehash(password, hash)
      expect(result).toEqual({
        valid: true,
        needsRehash: false,
      })
    })

    it('returns valid: true and needsRehash: true when password matches previous pepper', async () => {
      const oldHasher = new Argon2PasswordHasher({
        ...fastOptions,
        pepper: previousPepper,
      })

      const rotatedHasher = new Argon2PasswordHasher({
        ...fastOptions,
        pepper: currentPepper,
        previousPeppers: [previousPepper],
      })

      const password = 'RotatedUserPassword456'
      const oldHash = await oldHasher.hash(password)

      const result = await rotatedHasher.verifyWithRehash(password, oldHash)
      expect(result).toEqual({
        valid: true,
        needsRehash: true,
      })
    })

    it('returns valid: false and needsRehash: false when password was hashed with an unconfigured previous pepper', async () => {
      const unconfiguredHasher = new Argon2PasswordHasher({
        ...fastOptions,
        pepper: unrelatedPepper,
      })

      const rotatedHasher = new Argon2PasswordHasher({
        ...fastOptions,
        pepper: currentPepper,
        previousPeppers: [previousPepper],
      })

      const password = 'UnconfiguredPepperPassword789'
      const hash = await unconfiguredHasher.hash(password)

      const result = await rotatedHasher.verifyWithRehash(password, hash)
      expect(result).toEqual({
        valid: false,
        needsRehash: false,
      })
    })

    it('returns valid: false and needsRehash: false when password is wrong', async () => {
      const hasher = new Argon2PasswordHasher({
        ...fastOptions,
        pepper: currentPepper,
        previousPeppers: [previousPepper],
      })

      const hash = await hasher.hash('RightPassword')
      const result = await hasher.verifyWithRehash('WrongPassword', hash)

      expect(result).toEqual({
        valid: false,
        needsRehash: false,
      })
    })

    it('returns valid: false and needsRehash: false when hash or password is empty or invalid', async () => {
      const hasher = new Argon2PasswordHasher(fastOptions)
      const hash = await hasher.hash('ValidPassword')

      expect(await hasher.verifyWithRehash('', hash)).toEqual({
        valid: false,
        needsRehash: false,
      })
      expect(await hasher.verifyWithRehash('ValidPassword', '')).toEqual({
        valid: false,
        needsRehash: false,
      })
    })
  })

  describe('passwordHasher singleton (index.ts)', () => {
    it('exports passwordHasher singleton as an instance of Argon2PasswordHasher', () => {
      expect(passwordHasher).toBeInstanceOf(Argon2PasswordHasher)
    })

    it('implements PasswordHasher interface with hash, verify, and verifyWithRehash methods', () => {
      expect(typeof passwordHasher.hash).toBe('function')
      expect(typeof passwordHasher.verify).toBe('function')
      expect(typeof passwordHasher.verifyWithRehash).toBe('function')
    })
  })
})
