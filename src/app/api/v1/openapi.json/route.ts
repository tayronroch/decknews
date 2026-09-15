import { NextResponse } from 'next/server'

import { isApiDocumentationEnabled } from '@/infra/docs/is-api-documentation-enabled'
import { openApiSpec } from '@/infra/docs/openapi-spec'
import { NotFoundError } from '@/infra/errors'
import { handleApiError } from '@/infra/http'
import { env } from '@/lib/env/server'

export const dynamic = 'force-dynamic'

export function GET() {
  if (!isApiDocumentationEnabled(env.NODE_ENV)) {
    return handleApiError(new NotFoundError())
  }

  return NextResponse.json(openApiSpec)
}
