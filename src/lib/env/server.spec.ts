/**
 * @jest-environment node
 */

describe('env/server', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('parses a valid environment', async () => {
    process.env.NODE_ENV = 'development'
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
    process.env.PORT = '3000'
    delete process.env.DATABASE_POOL_SIZE

    const { env } = await import('./server')

    expect(env).toEqual({
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      PORT: 3000,
      DATABASE_POOL_SIZE: 10,
      PASSWORD_PEPPER: 'jest-setup-test-pepper-token-123456',
    })
  })

  it('throws a formatted error when a required variable is missing', async () => {
    delete process.env.DATABASE_URL
    process.env.NODE_ENV = 'development'
    process.env.PORT = '3000'

    await expect(import('./server')).rejects.toThrow(/DATABASE_URL/)
  })

  it('throws when a variable has an invalid value', async () => {
    process.env.NODE_ENV = 'development'
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
    process.env.PORT = 'not-a-number'

    await expect(import('./server')).rejects.toThrow(/PORT/)
  })

  it('throws when PASSWORD_PEPPER is missing', async () => {
    process.env.NODE_ENV = 'development'
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
    process.env.PORT = '3000'
    delete process.env.PASSWORD_PEPPER

    await expect(import('./server')).rejects.toThrow(/PASSWORD_PEPPER/)
  })

  it('throws when PASSWORD_PEPPER is shorter than 16 characters', async () => {
    process.env.NODE_ENV = 'development'
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
    process.env.PORT = '3000'
    process.env.PASSWORD_PEPPER = 'short-pepper'

    await expect(import('./server')).rejects.toThrow(/PASSWORD_PEPPER/)
  })

  it('parses PASSWORD_PEPPER_PREVIOUS when provided', async () => {
    process.env.NODE_ENV = 'development'
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
    process.env.PORT = '3000'
    process.env.PASSWORD_PEPPER = 'jest-setup-test-pepper-token-123456'
    process.env.PASSWORD_PEPPER_PREVIOUS = 'previous-pepper-token-123456'

    const { env } = await import('./server')

    expect(env.PASSWORD_PEPPER_PREVIOUS).toBe('previous-pepper-token-123456')
  })
})
