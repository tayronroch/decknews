import { NextResponse } from 'next/server'

import { handleApiError } from '@/infra/http'

export async function GET() {
  try {
    return NextResponse.json({
      status: 'ok',
      version: 'v1',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
