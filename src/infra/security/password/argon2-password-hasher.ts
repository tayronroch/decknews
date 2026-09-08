import { createHmac } from 'node:crypto'

import * as argon2 from '@node-rs/argon2'

import { InvalidHasherConfigError, InvalidPepperError } from './errors'
import type { PasswordHasher, PasswordVerifyResult } from './password-hasher'

export const DEFAULT_MEMORY_COST = 65536
export const DEFAULT_TIME_COST = 3
export const DEFAULT_PARALLELISM = 1

/**
 * Numeric value for Algorithm.Argon2id in @node-rs/argon2.
 * Defined as a local constant because @node-rs/argon2 exports Algorithm as an ambient
 * const enum, which TypeScript isolatedModules mode prohibits referencing directly at runtime.
 */
const ARGON2ID_ALGORITHM = 2

export interface Argon2PasswordHasherOptions {
  /**
   * Primary secret pepper (required, minimum 16 characters).
   */
  pepper: string

  /**
   * Optional list of previous peppers to support zero downtime rotation.
   */
  previousPeppers?: string[]

  /**
   * Memory cost in KiB. Production default: 65536 (64 MiB).
   */
  memoryCost?: number

  /**
   * Time cost / iterations. Production default: 3.
   */
  timeCost?: number

  /**
   * Parallelism degree / thread count. Production default: 1.
   */
  parallelism?: number
}

export class Argon2PasswordHasher implements PasswordHasher {
  private readonly pepper: string
  private readonly previousPeppers: string[]
  private readonly memoryCost: number
  private readonly timeCost: number
  private readonly parallelism: number

  constructor(options: Argon2PasswordHasherOptions) {
    if (!options || typeof options !== 'object') {
      throw new InvalidPepperError()
    }

    this.validatePepper(options.pepper)
    this.validatePreviousPeppers(options.previousPeppers)
    this.validateCostParam(options.memoryCost)
    this.validateCostParam(options.timeCost)
    this.validateCostParam(options.parallelism)

    this.pepper = options.pepper
    this.previousPeppers = options.previousPeppers
      ? [...options.previousPeppers]
      : []
    this.memoryCost = options.memoryCost ?? DEFAULT_MEMORY_COST
    this.timeCost = options.timeCost ?? DEFAULT_TIME_COST
    this.parallelism = options.parallelism ?? DEFAULT_PARALLELISM
  }

  private validatePepper(pepper: unknown): void {
    if (!pepper || typeof pepper !== 'string' || pepper.trim().length < 16) {
      throw new InvalidPepperError()
    }
  }

  private validatePreviousPeppers(peppers?: string[]): void {
    if (peppers === undefined) {
      return
    }

    if (!Array.isArray(peppers)) {
      throw new InvalidPepperError()
    }

    for (const prevPepper of peppers) {
      this.validatePepper(prevPepper)
    }
  }

  private validateCostParam(costParam: number | undefined): void {
    if (
      costParam !== undefined &&
      (!Number.isInteger(costParam) || costParam <= 0)
    ) {
      throw new InvalidHasherConfigError()
    }
  }

  /**
   * Prepares the raw password using HMAC-SHA-256 with the given pepper.
   * Produces a constant 64-character hexadecimal digest (32 bytes).
   */
  private preparePassword(password: string, pepper: string): string {
    return createHmac('sha256', pepper).update(password).digest('hex')
  }

  /**
   * Safely verifies hash using Argon2, catching malformed hashes and returning false.
   */
  private async safeVerify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain)
    } catch {
      return false
    }
  }

  /**
   * Generates a password hash using HMAC-SHA-256 (with current pepper) + Argon2id.
   */
  async hash(password: string): Promise<string> {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string')
    }

    const prepared = this.preparePassword(password, this.pepper)

    return argon2.hash(prepared, {
      algorithm: ARGON2ID_ALGORITHM,
      memoryCost: this.memoryCost,
      timeCost: this.timeCost,
      parallelism: this.parallelism,
    })
  }

  /**
   * Verifies the password against the persisted hash.
   * Returns true if valid with either current or any previous pepper.
   */
  async verify(password: string, hash: string): Promise<boolean> {
    const result = await this.verifyWithRehash(password, hash)
    return result.valid
  }

  /**
   * Verifies the password against the hash and indicates if a rehash is needed
   * due to verification with a previous pepper.
   */
  async verifyWithRehash(
    password: string,
    hash: string
  ): Promise<PasswordVerifyResult> {
    if (
      !password ||
      !hash ||
      typeof password !== 'string' ||
      typeof hash !== 'string'
    ) {
      return { valid: false, needsRehash: false }
    }

    // 1. Attempt verification with current pepper
    const currentPrepared = this.preparePassword(password, this.pepper)
    const isCurrentValid = await this.safeVerify(hash, currentPrepared)

    if (isCurrentValid) {
      return { valid: true, needsRehash: false }
    }

    // 2. Fallback verification with previous peppers (Zero Downtime Rotation)
    for (const prevPepper of this.previousPeppers) {
      const prevPrepared = this.preparePassword(password, prevPepper)
      const isPrevValid = await this.safeVerify(hash, prevPrepared)

      if (isPrevValid) {
        return { valid: true, needsRehash: true }
      }
    }

    return { valid: false, needsRehash: false }
  }
}
