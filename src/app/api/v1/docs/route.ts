import { ApiReference } from '@scalar/nextjs-api-reference'

import { isApiDocumentationEnabled } from '@/infra/docs/is-api-documentation-enabled'
import { NotFoundError } from '@/infra/errors'
import { handleApiError } from '@/infra/http'
import { env } from '@/lib/env/server'

export const dynamic = 'force-dynamic'

const scalarReference = ApiReference({
  url: '/api/v1/openapi.json',
  pageTitle: 'Decknews API Reference',
  theme: 'moon',
  cdn: 'https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.67.0',
})

export function GET() {
  if (!isApiDocumentationEnabled(env.NODE_ENV)) {
    return handleApiError(new NotFoundError())
  }

  return scalarReference()
}
