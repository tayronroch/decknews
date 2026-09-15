import type { NextResponse } from 'next/server'

export const SESSION_COOKIE_NAME = 'decknews_session'

export interface SessionCookieOptions {
  name: string
  value: string
  httpOnly: boolean
  secure: boolean
  sameSite: 'lax'
  path: string
  expires: Date
}

export function buildSessionCookieOptions(
  rawToken: string,
  expiresAt: Date
): SessionCookieOptions {
  return {
    name: SESSION_COOKIE_NAME,
    value: rawToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  }
}

/**
 * Sets the secure HttpOnly session cookie on the given NextResponse.
 */
export function setSessionCookie(
  response: NextResponse,
  rawToken: string,
  expiresAt: Date
): void {
  const options = buildSessionCookieOptions(rawToken, expiresAt)
  response.cookies.set(options)
}

/**
 * Deletes the session cookie on the given NextResponse by expiring it immediately.
 */
export function deleteSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  })
}

/**
 * Extracts the raw session token from the Request headers or NextRequest cookies.
 */
export function extractSessionToken(request: Request): string | null {
  // 1. NextRequest instance check (cookies property)
  const nextRequestWithCookies = request as {
    cookies?: { get: (name: string) => { value: string } | undefined }
  }

  if (
    nextRequestWithCookies.cookies &&
    typeof nextRequestWithCookies.cookies.get === 'function'
  ) {
    const cookie = nextRequestWithCookies.cookies.get(SESSION_COOKIE_NAME)
    return cookie?.value ?? null
  }

  // 2. Standard Request Cookie header parser
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) {
    return null
  }

  const cookies = cookieHeader.split(';')
  for (const cookie of cookies) {
    const [rawName, ...rest] = cookie.trim().split('=')
    if (rawName === SESSION_COOKIE_NAME) {
      const value = rest.join('=')
      return value.length > 0 ? value : null
    }
  }

  return null
}
