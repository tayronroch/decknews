import { ApiReference } from '@scalar/nextjs-api-reference'

const scalarReference = ApiReference({
  url: '/api/v1/openapi.json',
  pageTitle: 'Decknews API Reference',
  theme: 'moon',
  cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.67.0',
})

export function GET() {
  return scalarReference()
}
