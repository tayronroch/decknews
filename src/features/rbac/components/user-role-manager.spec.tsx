import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { rbacClient } from '../client'
import type { AdminUserDto, RoleDto, UserPanelCapabilities } from '../types'
import { UserRoleManager } from './user-role-manager'

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))
jest.mock('../client', () => ({
  rbacClient: {
    listUsers: jest.fn(),
    listRoles: jest.fn(),
    replaceUserRoles: jest.fn(),
  },
}))

const mockListUsers = jest.mocked(rbacClient.listUsers)
const mockListRoles = jest.mocked(rbacClient.listRoles)

const viewerRole: RoleDto = {
  id: '10',
  name: 'Leitor',
  description: null,
  isSystem: false,
  permissions: [],
}
const editorRole: RoleDto = {
  id: '11',
  name: 'Editor',
  description: null,
  isSystem: false,
  permissions: [],
}
const roles = [viewerRole, editorRole]

const ada: AdminUserDto = {
  id: '1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  createdAt: '2024-01-01T00:00:00.000Z',
  roles: [viewerRole],
}
const grace: AdminUserDto = {
  id: '2',
  name: 'Grace Hopper',
  email: 'grace@example.com',
  createdAt: '2024-01-02T00:00:00.000Z',
  roles: [],
}

const fullCapabilities: UserPanelCapabilities = { canManageRoles: true }

describe('UserRoleManager', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    mockListUsers.mockResolvedValue([ada, grace])
    mockListRoles.mockResolvedValue(roles)
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  async function render(capabilities: Partial<UserPanelCapabilities> = {}) {
    await act(async () => {
      root.render(
        <UserRoleManager
          capabilities={{ ...fullCapabilities, ...capabilities }}
        />
      )
    })
    await act(async () => undefined)
  }

  function buttonWithText(text: string) {
    return [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === text
    )
  }

  function searchField() {
    const element = container.querySelector<HTMLInputElement>(
      'input[aria-label="Buscar usuário"]'
    )
    if (!element) throw new Error('Search field was not found')
    return element
  }

  function search(term: string) {
    const input = searchField()
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )?.set?.call(input, term)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }

  it('loads users and roles from the API and renders each user with role checkboxes', async () => {
    await render()

    expect(mockListUsers).toHaveBeenCalledTimes(1)
    expect(mockListRoles).toHaveBeenCalledTimes(1)
    expect(container.textContent).toContain('Ada Lovelace')
    expect(container.textContent).toContain('ada@example.com')
    expect(container.textContent).toContain('Grace Hopper')
    expect(container.textContent).toContain('grace@example.com')
    expect(
      container.querySelectorAll('button[aria-label="Leitor"]').length
    ).toBe(2)
    expect(
      container.querySelectorAll('button[aria-label="Editor"]').length
    ).toBe(2)
  })

  it('reports a users loading failure on its own', async () => {
    mockListUsers.mockRejectedValue(new Error('Falha ao carregar usuários'))

    await render()

    expect(container.textContent).toContain('Falha ao carregar usuários')
    expect(container.textContent).not.toContain(
      'Não foi possível carregar os cargos.'
    )
    expect(buttonWithText('Tentar novamente')).toBeDefined()
  })

  it('reports a roles loading failure on its own while keeping users listed', async () => {
    mockListRoles.mockRejectedValue(new Error('Falha ao carregar cargos'))

    await render()

    expect(container.textContent).toContain('Falha ao carregar cargos')
    expect(container.textContent).toContain('Ada Lovelace')
    expect(container.textContent).toContain('Grace Hopper')
  })

  it('retries both requests after a failure', async () => {
    mockListUsers.mockRejectedValueOnce(new Error('Falha ao carregar usuários'))

    await render()

    await act(async () => {
      buttonWithText('Tentar novamente')?.click()
    })
    await act(async () => undefined)

    expect(mockListUsers).toHaveBeenCalledTimes(2)
    expect(mockListRoles).toHaveBeenCalledTimes(2)
    expect(container.textContent).toContain('Ada Lovelace')
  })

  it('shows the empty state when there is no user yet', async () => {
    mockListUsers.mockResolvedValue([])

    await render()

    expect(container.textContent).toContain('Nenhum usuário encontrado')
  })

  it('filters users by name and by email', async () => {
    await render()

    await act(async () => {
      search('grace')
    })

    expect(container.textContent).toContain('Grace Hopper')
    expect(container.textContent).not.toContain('Ada Lovelace')

    await act(async () => {
      search('ada@example.com')
    })

    expect(container.textContent).toContain('Ada Lovelace')
    expect(container.textContent).not.toContain('Grace Hopper')
  })

  it('hides every save action without user.manage', async () => {
    await render({ canManageRoles: false })

    expect(buttonWithText('Salvar cargos')).toBeUndefined()
  })
})
