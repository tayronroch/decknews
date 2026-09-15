import { createHash } from 'node:crypto'

import {
  CryptoSessionTokenGenerator,
  sessionTokenGenerator,
} from './session-token-generator'

describe('CryptoSessionTokenGenerator', () => {
  let generator: CryptoSessionTokenGenerator

  beforeEach(() => {
    generator = new CryptoSessionTokenGenerator()
  })

  it('generates a base64url-encoded string with 32 bytes of entropy (~43 chars)', () => {
    const token = generator.generate()

    expect(typeof token).toBe('string')
    // 32 bytes in base64url produces 43 characters without padding
    expect(token).toHaveLength(43)
    // Base64url characters: alphanumeric, hyphen, and underscore (no +, /, or =)
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('generates unique tokens on subsequent calls', () => {
    const tokens = new Set<string>()
    const count = 100

    for (let i = 0; i < count; i++) {
      tokens.add(generator.generate())
    }

    expect(tokens.size).toBe(count)
  })

  it('computes a 64-character hexadecimal SHA-256 digest', () => {
    const token = 'test-token-value-for-hashing'
    const expectedHash = createHash('sha256').update(token).digest('hex')

    const hash = generator.hash(token)

    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
    expect(hash).toBe(expectedHash)
  })

  it('produces deterministic hashes for identical input tokens', () => {
    const token = generator.generate()

    const hash1 = generator.hash(token)
    const hash2 = generator.hash(token)

    expect(hash1).toBe(hash2)
  })

  it('exports a default singleton instance', () => {
    expect(sessionTokenGenerator).toBeInstanceOf(CryptoSessionTokenGenerator)
  })
})
