import type { LoginInput } from '../schemas/login.schema'
import type { RegisterInput } from '../schemas/register.schema'
import type { LoginSuccessResponse } from '../types/login.types'
import type { RegisterSuccessResponse } from '../types/register.types'

const AUTH_BASE_PATH = '/api/v1/auth'

export class AuthClientError extends Error {
  constructor(public readonly statusCode: number) {
    super(`Authentication request failed with status ${statusCode}`)
    this.name = 'AuthClientError'
  }
}

export function getSafeNext(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/')) return '/admin'

  try {
    const decodedValue = decodeURIComponent(value)
    const origin = 'https://decknews.invalid'
    const candidates = [value, decodedValue]

    for (const candidate of candidates) {
      if (
        candidate.startsWith('//') ||
        candidate.includes('\\') ||
        [...candidate].some((character) => character.charCodeAt(0) < 32)
      ) {
        return '/admin'
      }

      const url = new URL(candidate, origin)
      if (url.origin !== origin || url.pathname.startsWith('//')) {
        return '/admin'
      }
    }

    const destination = new URL(value, origin)
    return destination.pathname + destination.search + destination.hash
  } catch {
    return '/admin'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
  })

  if (response.ok) {
    return response.status === 204 ? (undefined as T) : response.json()
  }

  throw new AuthClientError(response.status)
}

function jsonPost(body?: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }
}

export const authClient = {
  login(input: LoginInput): Promise<LoginSuccessResponse> {
    return request<LoginSuccessResponse>(
      `${AUTH_BASE_PATH}/login`,
      jsonPost(input)
    )
  },

  register(input: RegisterInput): Promise<RegisterSuccessResponse> {
    return request<RegisterSuccessResponse>(
      `${AUTH_BASE_PATH}/register`,
      jsonPost(input)
    )
  },

  getCurrentUser(): Promise<LoginSuccessResponse> {
    return request<LoginSuccessResponse>(`${AUTH_BASE_PATH}/me`)
  },

  logout(): Promise<void> {
    return request<void>(`${AUTH_BASE_PATH}/logout`, jsonPost())
  },
}
