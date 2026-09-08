import { UniqueConstraintError } from './unique-constraint-error'

describe('UniqueConstraintError', () => {
  it('sets name to UniqueConstraintError and assigns fields array', () => {
    const error = new UniqueConstraintError(['email'])

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('UniqueConstraintError')
    expect(error.message).toBe('Unique constraint violation')
    expect(error.fields).toEqual(['email'])
    expect(error.cause).toBeUndefined()
  })

  it('preserves error cause when options with cause are provided', () => {
    const originalCause = new Error('Prisma error P2002')
    const error = new UniqueConstraintError(['email', 'tenantId'], {
      cause: originalCause,
    })

    expect(error.fields).toEqual(['email', 'tenantId'])
    expect(error.cause).toBe(originalCause)
  })
})
