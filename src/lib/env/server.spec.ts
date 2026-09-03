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

    const { env } = await import('./server')

    expect(env).toEqual({
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      PORT: 3000,
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
})
