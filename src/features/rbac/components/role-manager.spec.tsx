import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { rbacClient } from '../client'
import type { PermissionDto, RoleDto, RolePanelCapabilities } from '../types'
import { RoleManager } from './role-manager'

// jsdom has no ResizeObserver. Radix's Checkbox renders a hidden bubble
// <input> (for native form submission/autofill) whenever it detects an
// ancestor <form> — which RoleForm has — and that bubble input measures
// itself via ResizeObserver. This stub only supplies the missing browser
// API; it does not change any Checkbox/Dialog behavior under test.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(
  globalThis as typeof globalThis & { ResizeObserver: unknown }
).ResizeObserver ??= ResizeObserverStub

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))
jest.mock('../client', () => ({
  rbacClient: {
    listRoles: jest.fn(),
    listPermissions: jest.fn(),
    deleteRole: jest.fn(),
    replaceRolePermissions: jest.fn(),
  },
}))

const mockListRoles = jest.mocked(rbacClient.listRoles)
const mockListPermissions = jest.mocked(rbacClient.listPermissions)
const mockDeleteRole = jest.mocked(rbacClient.deleteRole)

const readPosts: PermissionDto = {
  id: '10',
  key: 'post.read',
  description: 'Visualizar postagens',
  module: 'Posts',
}
const readRoles: PermissionDto = {
  id: '11',
  key: 'role.read',
  description: 'Visualizar cargos',
  module: 'Cargos',
}

const administrator: RoleDto = {
  id: '1',
  name: 'Administrador',
  description: 'Cargo administrativo',
  isSystem: true,
  permissions: [readPosts, readRoles],
}
const editor: RoleDto = {
  id: '2',
  name: 'Editor',
  description: 'Cargo editorial',
  isSystem: false,
  permissions: [readPosts],
}

const fullCapabilities: RolePanelCapabilities = {
  canCreate: true,
  canUpdate: true,
  canDelete: true,
  canManagePermissions: true,
}

describe('RoleManager', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    mockListRoles.mockResolvedValue([administrator, editor])
    mockListPermissions.mockResolvedValue([readPosts, readRoles])
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  async function render(capabilities: Partial<RolePanelCapabilities> = {}) {
    await act(async () => {
      root.render(
        <RoleManager capabilities={{ ...fullCapabilities, ...capabilities }} />
      )
    })
    await act(async () => undefined)
  }

  function buttonWithText(text: string) {
    return [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === text
    )
  }

  it('loads roles and permissions from the API and groups them by module', async () => {
    await render()

    expect(mockListRoles).toHaveBeenCalledTimes(1)
    expect(mockListPermissions).toHaveBeenCalledTimes(1)
    expect(container.textContent).toContain('Administrador')
    expect(container.textContent).toContain('Editor')
    expect(container.textContent).toContain('Cargo do sistema')
    expect(container.textContent).toContain('Posts')
    expect(container.textContent).toContain('Cargos')
    expect(container.textContent).toContain('Visualizar postagens')
  })

  it('hides the creation action without role.create', async () => {
    await render({ canCreate: false })

    expect(buttonWithText('Novo cargo')).toBeUndefined()
  })

  it('opens the creation dialog with role.create', async () => {
    await render()

    await act(async () => {
      buttonWithText('Novo cargo')?.click()
    })

    expect(
      document.querySelector('[data-slot="dialog-content"]')?.textContent
    ).toContain('Novo cargo')
  })

  it('reports a roles loading failure on its own', async () => {
    mockListRoles.mockRejectedValue(new Error('Falha ao carregar cargos'))

    await render()

    expect(container.textContent).toContain('Falha ao carregar cargos')
    expect(container.textContent).not.toContain(
      'Não foi possível carregar as permissões.'
    )
    expect(buttonWithText('Tentar novamente')).toBeDefined()
  })

  it('reports a permissions loading failure on its own', async () => {
    mockListPermissions.mockRejectedValue(
      new Error('Falha ao carregar permissões')
    )

    await render()

    expect(container.textContent).toContain('Falha ao carregar permissões')
    expect(container.textContent).toContain('Administrador')
  })

  it('retries loading after a failure', async () => {
    mockListRoles.mockRejectedValueOnce(new Error('Falha ao carregar cargos'))

    await render()

    await act(async () => {
      buttonWithText('Tentar novamente')?.click()
    })
    await act(async () => undefined)

    expect(mockListRoles).toHaveBeenCalledTimes(2)
    expect(container.textContent).toContain('Editor')
  })

  it('shows the empty state when there is no role yet', async () => {
    mockListRoles.mockResolvedValue([])

    await render()

    expect(container.textContent).toContain('Nenhum cargo encontrado')
  })

  it('deletes a role after confirmation and removes it from the grid', async () => {
    mockDeleteRole.mockResolvedValue(undefined)

    await render()

    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('button[aria-label="Excluir Editor"]')
        ?.click()
    })

    const confirmation = document.querySelector<HTMLElement>(
      '[data-slot="alert-dialog-content"]'
    )
    await act(async () => {
      ;[...(confirmation?.querySelectorAll('button') ?? [])]
        .find((button) => button.textContent?.trim() === 'Excluir cargo')
        ?.click()
    })
    await act(async () => undefined)

    expect(mockDeleteRole).toHaveBeenCalledWith('2')
    expect(container.textContent).not.toContain('Cargo editorial')
    expect(container.textContent).toContain('Administrador')
  })

  it('keeps the role listed when the deletion fails', async () => {
    mockDeleteRole.mockRejectedValue(
      new Error('Cargo de sistema não pode ser removido')
    )

    await render()

    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('button[aria-label="Excluir Editor"]')
        ?.click()
    })
    await act(async () => {
      ;[
        ...(document
          .querySelector('[data-slot="alert-dialog-content"]')
          ?.querySelectorAll('button') ?? []),
      ]
        .find((button) => button.textContent?.trim() === 'Excluir cargo')
        ?.click()
    })
    await act(async () => undefined)

    expect(container.textContent).toContain('Editor')
  })
})
