import { isApiDocumentationEnabled } from './is-api-documentation-enabled'

describe('isApiDocumentationEnabled', () => {
  it('enables API documentation only in development', () => {
    expect(isApiDocumentationEnabled('development')).toBe(true)
    expect(isApiDocumentationEnabled('test')).toBe(false)
    expect(isApiDocumentationEnabled('production')).toBe(false)
  })
})
