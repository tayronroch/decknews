import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { authClient, AuthClientError } from '../client'
import { RegisterForm } from './register-form'

const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}))
jest.mock('../client', () => {
  const actual = jest.requireActual<typeof import('../client')>('../client')

  return {
    ...actual,
    authClient: {
      register: jest.fn(),
    },
  }
})

const mockRegister = jest.mocked(authClient.register)

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

async function fillValidForm(container: HTMLElement) {
  await act(async () => {
    changeInput(inputForLabel(container, 'Nome'), 'Ada Lovelace')
    changeInput(inputForLabel(container, 'E-mail'), 'ada@example.com')
    changeInput(inputForLabel(container, 'Senha'), 'password-password')
    changeInput(
      inputForLabel(container, 'Confirmar senha'),
      'password-password'
    )
  })
}

describe('RegisterForm', () => {
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

  it('blocks a mismatched confirmation without calling the API', async () => {
    await act(async () => {
      root.render(<RegisterForm />)
    })

    await act(async () => {
      changeInput(inputForLabel(container, 'Nome'), 'Ada Lovelace')
      changeInput(inputForLabel(container, 'E-mail'), 'ada@example.com')
      changeInput(inputForLabel(container, 'Senha'), 'password-password')
      changeInput(
        inputForLabel(container, 'Confirmar senha'),
        'different-password'
      )
      container.querySelector<HTMLButtonElement>('button')?.click()
    })

    expect(mockRegister).not.toHaveBeenCalled()
    expect(container.textContent).toContain('As senhas não coincidem.')
  })

  it('sends only the explicit registration payload and redirects to login', async () => {
    mockRegister.mockResolvedValue({
      user: {
        id: '1',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        createdAt: '2026-09-16T00:00:00.000Z',
      },
    })

    await act(async () => {
      root.render(<RegisterForm />)
    })
    await fillValidForm(container)

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button')?.click()
    })

    expect(mockRegister).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'password-password',
    })
    expect(mockReplace).toHaveBeenCalledWith('/login')
  })

  it('shows a safe email-in-use message for a 409 response', async () => {
    mockRegister.mockRejectedValue(new AuthClientError(409))

    await act(async () => {
      root.render(<RegisterForm />)
    })
    await fillValidForm(container)

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button')?.click()
    })

    expect(container.textContent).toContain('E-mail já cadastrado')
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('uses accessible registration autocomplete values and prevents duplicate submissions', async () => {
    let resolveRegister: (() => void) | undefined
    mockRegister.mockReturnValue(
      new Promise((resolve) => {
        resolveRegister = () =>
          resolve({
            user: {
              id: '1',
              name: 'Ada Lovelace',
              email: 'ada@example.com',
              createdAt: '2026-09-16T00:00:00.000Z',
            },
          })
      })
    )

    await act(async () => {
      root.render(<RegisterForm />)
    })
    await fillValidForm(container)

    const nameInput = inputForLabel(container, 'Nome')
    const emailInput = inputForLabel(container, 'E-mail')
    const passwordInput = inputForLabel(container, 'Senha')
    const confirmationInput = inputForLabel(container, 'Confirmar senha')
    const button = container.querySelector<HTMLButtonElement>('button')

    expect(nameInput.autocomplete).toBe('name')
    expect(emailInput.autocomplete).toBe('email')
    expect(passwordInput.autocomplete).toBe('new-password')
    expect(confirmationInput.autocomplete).toBe('new-password')

    await act(async () => {
      button?.click()
      button?.click()
    })

    expect(mockRegister).toHaveBeenCalledTimes(1)
    expect(button?.disabled).toBe(true)

    await act(async () => resolveRegister?.())
  })
})
