import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { toast } from 'sonner'

import { rbacClient } from '../client'
import type { PermissionDto, RoleDto } from '../types'
import { RoleForm } from './role-form'

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
    createRole: jest.fn(),
    updateRole: jest.fn(),
    replaceRolePermissions: jest.fn(),
  },
}))

const mockCreateRole = jest.mocked(rbacClient.createRole)
const mockUpdateRole = jest.mocked(rbacClient.updateRole)
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

function dialog() {
  const element = document.querySelector<HTMLElement>(
    '[data-slot="dialog-content"]'
  )
  if (!element) throw new Error('Dialog content was not found')
  return element
}

function changeInput(
  input: HTMLInputElement | HTMLTextAreaElement,
  value: string
) {
  const prototype =
    input instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function field<T extends HTMLElement>(selector: string) {
  const element = dialog().querySelector<T>(selector)
  if (!element) throw new Error(`Field ${selector} was not found`)
  return element
}

function checkbox(label: string) {
  const element = dialog().querySelector<HTMLButtonElement>(
    `button[aria-label="${label}"]`
  )
  if (!element) throw new Error(`Checkbox ${label} was not found`)
  return element
}

async function submit() {
  await act(async () => {
    field<HTMLFormElement>('form').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    )
  })
}

describe('RoleForm', () => {
  let container: HTMLDivElement
  let root: Root
  const onClose = jest.fn()
  const onSaved = jest.fn()

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

  async function render(props: Partial<Parameters<typeof RoleForm>[0]> = {}) {
    await act(async () => {
      root.render(
        <RoleForm
          role={null}
          permissions={permissions}
          canManagePermissions
          onClose={onClose}
          onSaved={onSaved}
          {...props}
        />
      )
    })
  }

  it('creates a role with name, description and selected permissions', async () => {
    mockCreateRole.mockResolvedValue({
      id: '9',
      name: 'Editor de Conteúdo',
      description: 'Responsável pelas publicações.',
      isSystem: false,
      permissions: [],
    })
    mockReplacePermissions.mockResolvedValue(undefined)

    await render()

    await act(async () => {
      changeInput(field<HTMLInputElement>('#role-name'), 'Editor de Conteúdo')
      changeInput(
        field<HTMLTextAreaElement>('#role-description'),
        'Responsável pelas publicações.'
      )
    })
    await act(async () => {
      checkbox('Criar postagens').click()
    })
    await submit()

    expect(mockCreateRole).toHaveBeenCalledWith({
      name: 'Editor de Conteúdo',
      description: 'Responsável pelas publicações.',
    })
    expect(mockReplacePermissions).toHaveBeenCalledWith('9', ['post.create'])
    expect(onSaved).toHaveBeenCalledWith({
      id: '9',
      name: 'Editor de Conteúdo',
      description: 'Responsável pelas publicações.',
      isSystem: false,
      permissions: [createPosts],
    })
    expect(toast.success).toHaveBeenCalledWith('Cargo criado.')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('updates name, description and permissions of an existing role', async () => {
    mockUpdateRole.mockResolvedValue({
      id: '1',
      name: 'Editor sênior',
      description: 'Cargo editorial',
      isSystem: false,
    })
    mockReplacePermissions.mockResolvedValue(undefined)

    await render({ role: editor })

    expect(checkbox('Visualizar postagens').getAttribute('aria-checked')).toBe(
      'true'
    )

    await act(async () => {
      changeInput(field<HTMLInputElement>('#role-name'), 'Editor sênior')
    })
    await act(async () => {
      checkbox('Criar postagens').click()
    })
    await submit()

    expect(mockUpdateRole).toHaveBeenCalledWith('1', {
      name: 'Editor sênior',
      description: 'Cargo editorial',
    })
    expect(mockReplacePermissions).toHaveBeenCalledWith('1', [
      'post.read',
      'post.create',
    ])
    expect(onSaved).toHaveBeenCalledWith({
      id: '1',
      name: 'Editor sênior',
      description: 'Cargo editorial',
      isSystem: false,
      permissions: [readPosts, createPosts],
    })
  })

  it('clears the description with an explicit null', async () => {
    mockUpdateRole.mockResolvedValue({
      id: '1',
      name: 'Editor',
      description: null,
      isSystem: false,
    })

    await render({ role: editor })

    await act(async () => {
      changeInput(field<HTMLTextAreaElement>('#role-description'), '   ')
    })
    await submit()

    expect(mockUpdateRole).toHaveBeenCalledWith('1', {
      name: 'Editor',
      description: null,
    })
    expect(mockReplacePermissions).not.toHaveBeenCalled()
  })

  it('does not let a viewer without role.permissions.manage change permissions', async () => {
    mockCreateRole.mockResolvedValue({
      id: '9',
      name: 'Editor',
      description: null,
      isSystem: false,
      permissions: [],
    })

    await render({ canManagePermissions: false })

    expect(checkbox('Criar postagens').disabled).toBe(true)

    await act(async () => {
      changeInput(field<HTMLInputElement>('#role-name'), 'Editor')
    })
    await act(async () => {
      checkbox('Criar postagens').click()
    })
    await submit()

    expect(mockCreateRole).toHaveBeenCalledTimes(1)
    expect(mockReplacePermissions).not.toHaveBeenCalled()
  })

  it('keeps the dialog open and reports the API error', async () => {
    mockCreateRole.mockRejectedValue(
      new Error('Já existe um cargo com esse nome')
    )

    await render()

    await act(async () => {
      changeInput(field<HTMLInputElement>('#role-name'), 'Editor')
    })
    await submit()

    expect(toast.error).toHaveBeenCalledWith('Já existe um cargo com esse nome')
    expect(onSaved).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('still adds the role to the grid when only the permissions write fails on create', async () => {
    mockCreateRole.mockResolvedValue({
      id: '9',
      name: 'Editor de Conteúdo',
      description: null,
      isSystem: false,
      permissions: [],
    })
    mockReplacePermissions.mockRejectedValue(
      new Error('Você não tem permissão para realizar esta ação.')
    )

    await render()

    await act(async () => {
      changeInput(field<HTMLInputElement>('#role-name'), 'Editor de Conteúdo')
    })
    await act(async () => {
      checkbox('Criar postagens').click()
    })
    await submit()

    expect(mockCreateRole).toHaveBeenCalledTimes(1)
    expect(mockReplacePermissions).toHaveBeenCalledWith('9', ['post.create'])
    expect(onSaved).toHaveBeenCalledWith({
      id: '9',
      name: 'Editor de Conteúdo',
      description: null,
      isSystem: false,
      permissions: [],
    })
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(toast.error).toHaveBeenCalledWith(
      'Cargo criado, mas não foi possível salvar as permissões: Você não tem permissão para realizar esta ação.'
    )
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('still updates the grid when only the permissions write fails on edit', async () => {
    mockUpdateRole.mockResolvedValue({
      id: '1',
      name: 'Editor sênior',
      description: 'Cargo editorial',
      isSystem: false,
    })
    mockReplacePermissions.mockRejectedValue(
      new Error('Não é possível remover o último gerente de cargos.')
    )

    await render({ role: editor })

    await act(async () => {
      changeInput(field<HTMLInputElement>('#role-name'), 'Editor sênior')
    })
    await act(async () => {
      checkbox('Criar postagens').click()
    })
    await submit()

    expect(mockUpdateRole).toHaveBeenCalledWith('1', {
      name: 'Editor sênior',
      description: 'Cargo editorial',
    })
    expect(mockReplacePermissions).toHaveBeenCalledWith('1', [
      'post.read',
      'post.create',
    ])
    expect(onSaved).toHaveBeenCalledWith({
      id: '1',
      name: 'Editor sênior',
      description: 'Cargo editorial',
      isSystem: false,
      permissions: [readPosts],
    })
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(toast.error).toHaveBeenCalledWith(
      'Cargo atualizado, mas não foi possível salvar as permissões: Não é possível remover o último gerente de cargos.'
    )
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('filters the permissions shown in the dialog', async () => {
    await render()

    await act(async () => {
      changeInput(field<HTMLInputElement>('#permission-search'), 'criar')
    })

    expect(dialog().textContent).toContain('Criar postagens')
    expect(dialog().textContent).not.toContain('Visualizar postagens')
  })
})
