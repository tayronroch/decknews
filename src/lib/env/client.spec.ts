import { clientEnv } from './client'

describe('env/client', () => {
  it('parses without throwing when no public variables are declared', () => {
    expect(clientEnv).toEqual({})
  })
})
