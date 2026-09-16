import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { authClient } from '../client'
import { AuthenticatedHeader } from './authenticated-header'

const mockReplace = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
    replace: mockReplace,
  }),
}))

jest.mock('../client', () => ({
  authClient: {
    logout: jest.fn(),
  },
}))

const mockLogout = jest.mocked(authClient.logout)

describe('AuthenticatedHeader', () => {
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

  it('shows the authenticated user and redirects to login after logout', async () => {
    mockLogout.mockResolvedValue(undefined)

    await act(async () => {
      root.render(
        <AuthenticatedHeader
          user={{ id: 1n, name: 'Ada Lovelace', email: 'ada@example.com' }}
        />
      )
    })

    expect(container.textContent).toContain('Ada Lovelace')

    const logoutButton = container.querySelector('button')
    expect(logoutButton?.textContent).toBe('Sair')

    await act(async () => logoutButton?.click())

    expect(authClient.logout).toHaveBeenCalledTimes(1)
    expect(mockReplace).toHaveBeenCalledWith('/login')
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('disables the logout button until the API request finishes', async () => {
    let resolveLogout: (() => void) | undefined
    mockLogout.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveLogout = resolve
      })
    )

    await act(async () => {
      root.render(
        <AuthenticatedHeader
          user={{ id: 1n, name: 'Ada Lovelace', email: 'ada@example.com' }}
        />
      )
    })

    const logoutButton = container.querySelector('button')
    expect(logoutButton?.textContent).toBe('Sair')

    await act(async () => logoutButton?.click())

    expect(logoutButton?.disabled).toBe(true)

    await act(async () => resolveLogout?.())

    expect(mockReplace).toHaveBeenCalledWith('/login')
    expect(logoutButton?.disabled).toBe(false)
  })
})
