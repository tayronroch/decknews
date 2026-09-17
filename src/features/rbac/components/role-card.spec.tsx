import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { toast } from 'sonner'

import { rbacClient } from '../client'
import type { PermissionDto, RoleDto, RolePanelCapabilities } from '../types'
import { RoleCard } from './role-card'

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))
jest.mock('../client', () => ({
  rbacClient: { replaceRolePermissions: jest.fn() },
}))

const mockReplacePermissions = jest.mocked(rbacClient.replaceRolePermissions)

const readPosts: PermissionDto = {
  id: '10',
  key: 'post.read',
  description: 'Visualizar postagens',
  module: 'Posts',
}
const createPosts: PermissionDto = {
  id: '11',
  key: 'post.create',
  description: 'Criar postagens',
  module: 'Posts',
}
const permissions = [readPosts, createPosts]

const editor: RoleDto = {
  id: '1',
  name: 'Editor',
  description: 'Cargo editorial',
  isSystem: false,
  permissions: [readPosts],
}

const administrator: RoleDto = {
  id: '2',
  name: 'Administrador',
  description: 'Cargo administrativo',
  isSystem: true,
  permissions: permissions,
}

const fullCapabilities: RolePanelCapabilities = {
  canCreate: true,
  canUpdate: true,
  canDelete: true,
  canManagePermissions: true,
}

describe('RoleCard', () => {
  let container: HTMLDivElement
  let root: Root
  const onEdit = jest.fn()
  const onDelete = jest.fn()
  const onUpdated = jest.fn()

  beforeEach(() => {
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
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

  async function render(
    role: RoleDto,
    capabilities: Partial<RolePanelCapabilities> = {},
    deleting = false
  ) {
    await act(async () => {
      root.render(
        <RoleCard
          role={role}
          permissions={permissions}
          capabilities={{ ...fullCapabilities, ...capabilities }}
          deleting={deleting}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdated={onUpdated}
        />
      )
    })
  }

  function action(label: string) {
    return container.querySelector<HTMLButtonElement>(
      `button[aria-label="${label}"]`
    )
  }

  function checkbox(label: string) {
    const element = container.querySelector<HTMLButtonElement>(
      `button[aria-label="${label}"]`
    )
    if (!element) throw new Error(`Checkbox ${label} was not found`)
    return element
  }

  function buttonWithText(scope: ParentNode, text: string) {
    return [...scope.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === text
    )
  }

  it('marks system roles and never enables their deletion', async () => {
    await render(administrator)

    expect(container.textContent).toContain('Cargo do sistema')
    expect(action('Excluir Administrador')?.disabled).toBe(true)
  })

  it('hides the edit action without role.update', async () => {
    await render(editor, { canUpdate: false })

    expect(action('Editar Editor')).toBeNull()
    expect(action('Excluir Editor')).not.toBeNull()
  })

  it('hides the delete action without role.delete', async () => {
    await render(editor, { canDelete: false })

    expect(action('Excluir Editor')).toBeNull()
    expect(action('Editar Editor')).not.toBeNull()
  })

  it('blocks permission editing without role.permissions.manage', async () => {
    await render(editor, { canManagePermissions: false })

    expect(checkbox('Criar postagens').disabled).toBe(true)
    expect(buttonWithText(container, 'Salvar permissões')).toBeUndefined()
  })

  it('saves added and removed permission keys after an explicit action', async () => {
    mockReplacePermissions.mockResolvedValue(undefined)

    await render(editor)

    expect(buttonWithText(container, 'Salvar permissões')?.disabled).toBe(true)

    await act(async () => {
      checkbox('Criar postagens').click()
    })
    await act(async () => {
      checkbox('Visualizar postagens').click()
    })

    expect(container.textContent).toContain(
      'Existem alterações de permissões ainda não salvas'
    )

    await act(async () => {
      buttonWithText(container, 'Salvar permissões')?.click()
    })

    expect(mockReplacePermissions).toHaveBeenCalledWith('1', ['post.create'])
    expect(onUpdated).toHaveBeenCalledWith({
      ...editor,
      permissions: [createPosts],
    })
    expect(toast.success).toHaveBeenCalledWith('Permissões salvas.')
  })

  it('reports an API failure while saving permissions', async () => {
    mockReplacePermissions.mockRejectedValue(
      new Error('Você não tem permissão para realizar esta ação.')
    )

    await render(editor)

    await act(async () => {
      checkbox('Criar postagens').click()
    })
    await act(async () => {
      buttonWithText(container, 'Salvar permissões')?.click()
    })

    expect(toast.error).toHaveBeenCalledWith(
      'Você não tem permissão para realizar esta ação.'
    )
    expect(onUpdated).not.toHaveBeenCalled()
  })

  it('confirms before delegating the deletion', async () => {
    await render(editor)

    await act(async () => {
      action('Excluir Editor')?.click()
    })

    const confirmation = document.querySelector<HTMLElement>(
      '[data-slot="alert-dialog-content"]'
    )
    expect(confirmation?.textContent).toContain(
      'Tem certeza que deseja excluir este cargo?'
    )
    expect(onDelete).not.toHaveBeenCalled()

    await act(async () => {
      buttonWithText(confirmation as ParentNode, 'Excluir cargo')?.click()
    })

    expect(onDelete).toHaveBeenCalledWith(editor)
  })

  it('shows the deletion in progress', async () => {
    await render(editor, {}, true)

    expect(action('Excluir Editor')?.disabled).toBe(true)
    expect(container.textContent).toContain('Excluindo...')
  })

  it('opens the edit dialog through the parent', async () => {
    await render(editor)

    await act(async () => {
      action('Editar Editor')?.click()
    })

    expect(onEdit).toHaveBeenCalledWith(editor)
  })
})
