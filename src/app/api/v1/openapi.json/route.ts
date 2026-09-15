import { NextResponse } from 'next/server'

import { openApiSpec } from '@/infra/docs/openapi-spec'

export function GET() {
  return NextResponse.json(openApiSpec)
}
