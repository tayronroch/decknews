/**
 * @jest-environment node
 */
import { NextResponse } from 'next/server'

import {
  buildSessionCookieOptions,
  deleteSessionCookie,
  extractSessionToken,
  SESSION_COOKIE_NAME,
  setSessionCookie,
} from './session-cookie'

describe('session-cookie', () => {
  const originalEnv = process.env.NODE_ENV
  const fixedExpiresAt = new Date('2026-09-22T12:00:00.000Z')
  const rawToken = 'test-raw-session-token-value'

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  describe('buildSessionCookieOptions', () => {
    it('returns options with HttpOnly=true, SameSite=lax, Path=/, and matching expiresAt', () => {
      process.env.NODE_ENV = 'development'

      const options = buildSessionCookieOptions(rawToken, fixedExpiresAt)

      expect(options).toEqual({
        name: SESSION_COOKIE_NAME,
        value: rawToken,
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        expires: fixedExpiresAt,
      })
    })

    it('sets secure=true when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production'

      const options = buildSessionCookieOptions(rawToken, fixedExpiresAt)

      expect(options.secure).toBe(true)
    })

    it('sets secure=false when NODE_ENV is test or development', () => {
      process.env.NODE_ENV = 'test'
      expect(buildSessionCookieOptions(rawToken, fixedExpiresAt).secure).toBe(
        false
      )

      process.env.NODE_ENV = 'development'
      expect(buildSessionCookieOptions(rawToken, fixedExpiresAt).secure).toBe(
        false
      )
    })
  })

  describe('setSessionCookie', () => {
    it('sets the cookie on NextResponse with configured options', () => {
      const response = NextResponse.json({ ok: true })
      setSessionCookie(response, rawToken, fixedExpiresAt)

      const cookie = response.cookies.get(SESSION_COOKIE_NAME)
      expect(cookie).toBeDefined()
      expect(cookie?.value).toBe(rawToken)
    })
  })

  describe('deleteSessionCookie', () => {
    it('sets an expired empty cookie to invalidate session on client', () => {
      const response = NextResponse.json({ ok: true })
      deleteSessionCookie(response)

      const cookie = response.cookies.get(SESSION_COOKIE_NAME)
      expect(cookie).toBeDefined()
      expect(cookie?.value).toBe('')
    })
  })

  describe('extractSessionToken', () => {
    it('extracts token from standard Request cookie header', () => {
      const request = new Request('http://localhost:3000/api/v1/resource', {
        headers: {
          cookie: `other_cookie=123; ${SESSION_COOKIE_NAME}=${rawToken}; theme=dark`,
        },
      })

      const token = extractSessionToken(request)
      expect(token).toBe(rawToken)
    })

    it('returns null when cookie header is missing', () => {
      const request = new Request('http://localhost:3000/api/v1/resource')
      expect(extractSessionToken(request)).toBeNull()
    })

    it('returns null when session cookie is not present in cookie header', () => {
      const request = new Request('http://localhost:3000/api/v1/resource', {
        headers: {
          cookie: 'other_cookie=123; theme=dark',
        },
      })
      expect(extractSessionToken(request)).toBeNull()
    })

    it('extracts token when request provides a NextRequest-like cookies object', () => {
      const mockRequest = {
        headers: new Headers(),
        cookies: {
          get: (name: string) =>
            name === SESSION_COOKIE_NAME ? { value: rawToken } : undefined,
        },
      } as unknown as Request

      const token = extractSessionToken(mockRequest)
      expect(token).toBe(rawToken)
    })

    it('returns null when cookie value is empty', () => {
      const request = new Request('http://localhost:3000/api/v1/resource', {
        headers: {
          cookie: `${SESSION_COOKIE_NAME}=`,
        },
      })
      expect(extractSessionToken(request)).toBeNull()
    })
  })
})
