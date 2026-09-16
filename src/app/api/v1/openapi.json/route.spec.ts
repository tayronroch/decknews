/**
 * @jest-environment node
 */
jest.mock('@/infra/docs/is-api-documentation-enabled', () => ({
  isApiDocumentationEnabled: jest.fn(() => true),
}))

import { isApiDocumentationEnabled } from '@/infra/docs/is-api-documentation-enabled'

import { GET } from './route'

const mockIsApiDocumentationEnabled = jest.mocked(isApiDocumentationEnabled)

describe('GET /api/v1/openapi.json', () => {
  it('returns the OpenAPI 3.1 contract for public endpoints', async () => {
    const response = GET()
    const spec = await response.json()

    expect(response.headers.get('content-type')).toContain('application/json')
    expect(spec.openapi).toBe('3.1.0')
    expect(spec.servers).toEqual([{ url: '/' }])
    expect(spec.paths).toEqual(
      expect.objectContaining({
        '/api/v1/auth/register': expect.any(Object),
        '/api/v1/auth/login': expect.any(Object),
        '/api/v1/auth/me': expect.any(Object),
        '/api/v1/auth/logout': expect.any(Object),
        '/api/v1/admin/roles': expect.any(Object),
        '/api/v1/admin/permissions': expect.any(Object),
        '/api/v1/status': expect.any(Object),
        '/api/v1/health': expect.any(Object),
      })
    )
  })

  it('documents strict registration input and the standard error response', async () => {
    const spec = await GET().json()

    expect(spec.components.schemas.RegisterInput).toEqual(
      expect.objectContaining({
        additionalProperties: false,
        required: ['name', 'email', 'password'],
      })
    )
    expect(spec.components.schemas.RegisterInput.properties.password).toEqual(
      expect.objectContaining({ minLength: 12, maxLength: 256 })
    )
    expect(spec.components.schemas.ErrorResponse).toEqual(
      expect.objectContaining({
        additionalProperties: false,
        required: ['error'],
      })
    )
  })

  it('documents the login response and unified unauthorized error', async () => {
    const spec = await GET().json()

    expect(spec.paths['/api/v1/auth/login'].post.responses).toEqual(
      expect.objectContaining({
        '200': expect.any(Object),
        '400': expect.any(Object),
        '401': { $ref: '#/components/responses/UnauthorizedError' },
        '500': expect.any(Object),
      })
    )
    expect(spec.components.schemas.LoginInput.properties.password).toEqual(
      expect.objectContaining({ minLength: 1, maxLength: 256 })
    )
  })

  it('documents the authenticated current-user endpoint', async () => {
    const spec = await GET().json()

    expect(spec.paths['/api/v1/auth/me'].get).toEqual(
      expect.objectContaining({
        security: [{ sessionCookie: [] }],
        responses: expect.objectContaining({
          '200': expect.any(Object),
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '500': expect.any(Object),
        }),
      })
    )
    expect(spec.components.securitySchemes.sessionCookie).toEqual({
      type: 'apiKey',
      in: 'cookie',
      name: 'decknews_session',
    })
  })

  it('documents the logout endpoint with sessionCookie security and 204 response', async () => {
    const spec = await GET().json()

    expect(spec.paths['/api/v1/auth/logout'].post).toEqual({
      tags: ['Auth'],
      operationId: 'logout',
      summary: 'Encerra a sessão atual do usuário',
      security: [{ sessionCookie: [] }],
      responses: {
        '204': {
          description: 'Sessão encerrada com sucesso.',
        },
      },
    })
  })

  it('returns 404 outside development', async () => {
    mockIsApiDocumentationEnabled.mockReturnValueOnce(false)

    const response = GET()

    expect(response.status).toBe(404)
  })
})
