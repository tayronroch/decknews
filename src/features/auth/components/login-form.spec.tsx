import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import LoginPage from '@/app/(auth)/login/page'
import RegisterPage from '@/app/(auth)/register/page'
import { getCurrentUserBySessionToken } from '@/features/auth/services'

import { authClient, AuthClientError } from '../client'
import { LoginForm } from './login-form'

const mockReplace = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/headers', () => ({ cookies: jest.fn() }))
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  useRouter: () => ({ refresh: mockRefresh, replace: mockReplace }),
}))
jest.mock('@/features/auth/services', () => ({
  getCurrentUserBySessionToken: jest.fn(),
}))
jest.mock('@/infra/http', () => ({ SESSION_COOKIE_NAME: 'decknews_session' }))
jest.mock('../client', () => {
  const actual = jest.requireActual<typeof import('../client')>('../client')

  return {
    ...actual,
    authClient: {
      getCurrentUser: jest.fn(),
      login: jest.fn(),
    },
  }
})

const mockCookies = jest.mocked(cookies)
const mockRedirect = jest.mocked(redirect)
const mockGetCurrentUserBySessionToken = jest.mocked(
  getCurrentUserBySessionToken
)
const mockLogin = jest.mocked(authClient.login)
const mockGetCurrentUser = jest.mocked(authClient.getCurrentUser)

function changeInput(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value'
  )?.set

  valueSetter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function inputForLabel(container: HTMLElement, label: string) {
  const labelElement = [...container.querySelectorAll('label')].find(
    (element) => element.textContent === label
  )
  const input = labelElement?.htmlFor
    ? container.querySelector<HTMLInputElement>(`#${labelElement.htmlFor}`)
    : null

  if (!input) throw new Error(`Input for label ${label} was not found`)

  return input
}

describe('LoginForm', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    ;(
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT: boolean
      }
    ).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  it('validates fields before submitting credentials', async () => {
    await act(async () => {
      root.render(<LoginForm next="/admin" />)
    })

    const form = container.querySelector('form')
    const emailInput = inputForLabel(container, 'E-mail')
    const passwordInput = inputForLabel(container, 'Senha')

    expect(emailInput.type).toBe('email')
    expect(emailInput.autocomplete).toBe('email')
    expect(passwordInput.autocomplete).toBe('current-password')

    await act(async () => {
      form?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true })
      )
    })

    expect(mockLogin).not.toHaveBeenCalled()
    expect(container.textContent).toContain('E-mail inválido')
    expect(container.textContent).toContain('Senha é obrigatória')
  })

  it('confirms the new session and redirects after a successful login', async () => {
    mockLogin.mockResolvedValue({
      user: { id: '1', name: 'Ada Lovelace', email: 'ada@example.com' },
    })
    mockGetCurrentUser.mockResolvedValue({
      user: { id: '1', name: 'Ada Lovelace', email: 'ada@example.com' },
    })

    await act(async () => {
      root.render(<LoginForm next="/admin/roles" />)
    })

    await act(async () => {
      changeInput(inputForLabel(container, 'E-mail'), 'ada@example.com')
      changeInput(inputForLabel(container, 'Senha'), 'password-password')
    })

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button')?.click()
    })

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'password-password',
    })
    expect(mockGetCurrentUser).toHaveBeenCalledTimes(1)
    expect(mockReplace).toHaveBeenCalledWith('/admin/roles')
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('prevents a duplicate submission while the request is pending', async () => {
    let resolveLogin: (() => void) | undefined
    mockLogin.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = () =>
          resolve({
            user: { id: '1', name: 'Ada Lovelace', email: 'ada@example.com' },
          })
      })
    )

    await act(async () => {
      root.render(<LoginForm next="/admin" />)
    })

    await act(async () => {
      changeInput(inputForLabel(container, 'E-mail'), 'ada@example.com')
      changeInput(inputForLabel(container, 'Senha'), 'password-password')
    })

    const button = container.querySelector<HTMLButtonElement>('button')
    await act(async () => {
      button?.click()
      button?.click()
    })

    expect(mockLogin).toHaveBeenCalledTimes(1)
    expect(button?.disabled).toBe(true)

    await act(async () => resolveLogin?.())
  })

  it('shows the precise invalid-credentials message for a 401 response', async () => {
    mockLogin.mockRejectedValue(new AuthClientError(401))

    await act(async () => {
      root.render(<LoginForm next="/admin" />)
    })

    await act(async () => {
      changeInput(inputForLabel(container, 'E-mail'), 'ada@example.com')
      changeInput(inputForLabel(container, 'Senha'), 'password-password')
      container.querySelector<HTMLButtonElement>('button')?.click()
    })

    expect(container.textContent).toContain('Credenciais inválidas')
    expect(mockGetCurrentUser).not.toHaveBeenCalled()
  })

  it('shows a generic error for a non-credential login failure', async () => {
    mockLogin.mockRejectedValue(new Error('network unavailable'))

    await act(async () => {
      root.render(<LoginForm next="/admin" />)
    })

    await act(async () => {
      changeInput(inputForLabel(container, 'E-mail'), 'ada@example.com')
      changeInput(inputForLabel(container, 'Senha'), 'password-password')
      container.querySelector<HTMLButtonElement>('button')?.click()
    })

    expect(container.textContent).toContain(
      'Não foi possível entrar. Tente novamente.'
    )
  })

  it('redirects an authenticated visitor from login to their safe destination', async () => {
    const get = jest.fn().mockReturnValue({ value: 'valid-token' })
    mockCookies.mockResolvedValue({ get } as Awaited<
      ReturnType<typeof cookies>
    >)
    mockGetCurrentUserBySessionToken.mockResolvedValue({
      id: 1n,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    })
    const redirectError = new Error('redirect')
    mockRedirect.mockImplementation(() => {
      throw redirectError
    })

    await expect(
      LoginPage({ searchParams: Promise.resolve({ next: '/admin/roles' }) })
    ).rejects.toThrow(redirectError)

    expect(mockGetCurrentUserBySessionToken).toHaveBeenCalledWith('valid-token')
    expect(mockRedirect).toHaveBeenCalledWith('/admin/roles')
  })

  it('falls back to admin when an authenticated visitor supplies an unsafe next', async () => {
    const get = jest.fn().mockReturnValue({ value: 'valid-token' })
    mockCookies.mockResolvedValue({ get } as Awaited<
      ReturnType<typeof cookies>
    >)
    mockGetCurrentUserBySessionToken.mockResolvedValue({
      id: 1n,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    })
    const redirectError = new Error('redirect')
    mockRedirect.mockImplementation(() => {
      throw redirectError
    })

    await expect(
      LoginPage({ searchParams: Promise.resolve({ next: '//evil.example' }) })
    ).rejects.toThrow(redirectError)

    expect(mockRedirect).toHaveBeenCalledWith('/admin')
  })

  it('guards the register page with the same safe redirect policy', async () => {
    const get = jest.fn().mockReturnValue({ value: 'valid-token' })
    mockCookies.mockResolvedValue({ get } as Awaited<
      ReturnType<typeof cookies>
    >)
    mockGetCurrentUserBySessionToken.mockResolvedValue({
      id: 1n,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    })
    const redirectError = new Error('redirect')
    mockRedirect.mockImplementation(() => {
      throw redirectError
    })

    await expect(
      RegisterPage({
        searchParams: Promise.resolve({ next: '//evil.example' }),
      })
    ).rejects.toThrow(redirectError)

    expect(mockRedirect).toHaveBeenCalledWith('/admin')
  })
})
