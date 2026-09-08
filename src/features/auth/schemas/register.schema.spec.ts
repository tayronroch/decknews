import { registerSchema } from './register.schema'

describe('registerSchema', () => {
  it('accepts valid input and normalizes name and email with trim and lowercase', () => {
    const input = {
      name: '  Ada Lovelace  ',
      email: '  ADA@EXAMPLE.COM  ',
      password: 'valid-secure-password-123',
    }

    const result = registerSchema.parse(input)

    expect(result.name).toBe('Ada Lovelace')
    expect(result.email).toBe('ada@example.com')
    // Senha NUNCA deve sofrer trim ou lowercase
    expect(result.password).toBe('valid-secure-password-123')
  })

  it('preserves leading and trailing whitespace in password', () => {
    const input = {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: '  secure-password-with-spaces  ',
    }

    const result = registerSchema.parse(input)
    expect(result.password).toBe('  secure-password-with-spaces  ')
  })

  it('rejects password shorter than 12 characters', () => {
    const input = {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'short-pass',
    }

    expect(() => registerSchema.parse(input)).toThrow()
  })

  it('rejects password longer than 256 characters', () => {
    const input = {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'a'.repeat(257),
    }

    expect(() => registerSchema.parse(input)).toThrow()
  })

  it('rejects name shorter than 2 characters after trim', () => {
    const input = {
      name: ' A ',
      email: 'ada@example.com',
      password: 'valid-secure-password-123',
    }

    expect(() => registerSchema.parse(input)).toThrow()
  })

  it('rejects name longer than 100 characters', () => {
    const input = {
      name: 'a'.repeat(101),
      email: 'ada@example.com',
      password: 'valid-secure-password-123',
    }

    expect(() => registerSchema.parse(input)).toThrow()
  })

  it('rejects invalid email formats', () => {
    const input = {
      name: 'Ada Lovelace',
      email: 'not-an-email',
      password: 'valid-secure-password-123',
    }

    expect(() => registerSchema.parse(input)).toThrow()
  })

  it('rejects additional unexpected properties due to strict mode', () => {
    const input = {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'valid-secure-password-123',
      role: 'ADMIN',
    }

    expect(() => registerSchema.parse(input)).toThrow()
  })
})
