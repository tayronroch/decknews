import { loginSchema } from './login.schema'

describe('loginSchema', () => {
  it('accepts valid credentials and normalizes email with trim and lowercase', () => {
    const input = {
      email: '  ADA@EXAMPLE.COM  ',
      password: 'valid-secure-password-123',
    }

    const result = loginSchema.parse(input)

    expect(result.email).toBe('ada@example.com')
    // Senha NUNCA deve sofrer trim ou lowercase
    expect(result.password).toBe('valid-secure-password-123')
  })

  it('preserves leading and trailing whitespace in password without modification', () => {
    const input = {
      email: 'ada@example.com',
      password: '  secure-password-with-spaces  ',
    }

    const result = loginSchema.parse(input)
    expect(result.password).toBe('  secure-password-with-spaces  ')
  })

  it('accepts passwords shorter than 12 characters (does not enforce registration creation policy)', () => {
    const input = {
      email: 'ada@example.com',
      password: 'short-8c',
    }

    const result = loginSchema.parse(input)
    expect(result.password).toBe('short-8c')
  })

  it('rejects empty password', () => {
    const input = {
      email: 'ada@example.com',
      password: '',
    }

    expect(() => loginSchema.parse(input)).toThrow()
  })

  it('rejects password longer than 256 characters', () => {
    const input = {
      email: 'ada@example.com',
      password: 'a'.repeat(257),
    }

    expect(() => loginSchema.parse(input)).toThrow()
  })

  it('rejects invalid email formats', () => {
    const input = {
      email: 'not-an-email',
      password: 'valid-secure-password-123',
    }

    expect(() => loginSchema.parse(input)).toThrow()
  })

  it('rejects additional unexpected properties due to strict mode', () => {
    const input = {
      email: 'ada@example.com',
      password: 'valid-secure-password-123',
      role: 'ADMIN',
    }

    expect(() => loginSchema.parse(input)).toThrow()
  })
})
