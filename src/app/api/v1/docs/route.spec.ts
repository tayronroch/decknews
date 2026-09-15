/**
 * @jest-environment node
 */
jest.mock('@scalar/nextjs-api-reference', () => ({
  ApiReference: jest.fn(
    () => () =>
      new Response('<!doctype html><title>Decknews API Reference</title>', {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      })
  ),
}))

import { ApiReference } from '@scalar/nextjs-api-reference'

import { GET } from './route'

describe('GET /api/v1/docs', () => {
  it('returns the Scalar HTML reference configured for the local OpenAPI contract', async () => {
    const response = GET()
    const html = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(html).toContain('Decknews API Reference')
    expect(ApiReference).toHaveBeenCalledWith({
      url: '/api/v1/openapi.json',
      pageTitle: 'Decknews API Reference',
      theme: 'moon',
      cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.67.0',
    })
  })
})
