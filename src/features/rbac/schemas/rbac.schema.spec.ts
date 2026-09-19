import { roleUpdateSchema } from './rbac.schema'

describe('roleUpdateSchema', () => {
  it('accepts a null description so the panel can clear it', () => {
    expect(
      roleUpdateSchema.safeParse({ name: 'Editor', description: null }).success
    ).toBe(true)
  })

  it('still accepts a partial payload with only the name', () => {
    expect(roleUpdateSchema.safeParse({ name: 'Editor' }).success).toBe(true)
  })

  it('rejects unexpected properties', () => {
    expect(
      roleUpdateSchema.safeParse({ name: 'Editor', isSystem: true }).success
    ).toBe(false)
  })

  it('rejects an empty payload', () => {
    expect(roleUpdateSchema.safeParse({}).success).toBe(false)
  })
})
