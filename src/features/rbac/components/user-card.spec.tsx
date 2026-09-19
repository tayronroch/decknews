import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { toast } from 'sonner'

import { rbacClient } from '../client'
import type { AdminUserDto, RoleSummaryDto } from '../types'
import { UserCard } from './user-card'

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))
jest.mock('../client', () => ({
  rbacClient: { replaceUserRoles: jest.fn() },
}))

const mockReplaceUserRoles = jest.mocked(rbacClient.replaceUserRoles)

const viewer: RoleSummaryDto = {
  id: '10',
  name: 'Leitor',
  description: null,
  isSystem: false,
}
const editor: RoleSummaryDto = {
  id: '11',
  name: 'Editor',
  description: null,
  isSystem: false,
}
const administrator: RoleSummaryDto = {
  id: '12',
  name: 'Administrador',
  description: 'Cargo administrativo',
  isSystem: true,
}
const roles = [viewer, editor, administrator]

const ada: AdminUserDto = {
  id: '1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  createdAt: '2024-01-01T00:00:00.000Z',
  roles: [viewer],
}

describe('UserCard', () => {
  let container: HTMLDivElement
  let root: Root
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

  async function render(user: AdminUserDto, canManageRoles = true) {
    await act(async () => {
      root.render(
        <UserCard
          user={user}
          roles={roles}
          canManageRoles={canManageRoles}
          onUpdated={onUpdated}
        />
      )
    })
  }

  function checkbox(label: string) {
    const element = container.querySelector<HTMLButtonElement>(
      `button[aria-label="${label}"]`
    )
    if (!element) throw new Error(`Checkbox ${label} was not found`)
    return element
  }

  function buttonWithText(text: string) {
    return [...container.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === text
    )
  }

  it('renders the user identity and marks only the roles already assigned', async () => {
    await render(ada)

    expect(container.textContent).toContain('Ada Lovelace')
    expect(container.textContent).toContain('ada@example.com')
    expect(checkbox('Leitor').getAttribute('aria-checked')).toBe('true')
    expect(checkbox('Editor').getAttribute('aria-checked')).toBe('false')
    expect(checkbox('Administrador').getAttribute('aria-checked')).toBe('false')
  })

  it('disables every checkbox and hides the save action without user.manage', async () => {
    await render(ada, false)

    expect(checkbox('Leitor').disabled).toBe(true)
    expect(checkbox('Editor').disabled).toBe(true)
    expect(buttonWithText('Salvar cargos')).toBeUndefined()
  })

  it('only enables saving after a change, and warns about it', async () => {
    await render(ada)

    expect(buttonWithText('Salvar cargos')?.disabled).toBe(true)
    expect(container.textContent).not.toContain(
      'Existem alterações de cargos ainda não salvas'
    )

    await act(async () => {
      checkbox('Editor').click()
    })

    expect(buttonWithText('Salvar cargos')?.disabled).toBe(false)
    expect(container.textContent).toContain(
      'Existem alterações de cargos ainda não salvas'
    )
  })

  it('saves the selected role ids and reconciles the user through onUpdated', async () => {
    mockReplaceUserRoles.mockResolvedValue(undefined)

    await render(ada)

    await act(async () => {
      checkbox('Editor').click()
    })
    await act(async () => {
      checkbox('Leitor').click()
    })
    await act(async () => {
      buttonWithText('Salvar cargos')?.click()
    })

    expect(mockReplaceUserRoles).toHaveBeenCalledWith('1', ['11'])
    expect(onUpdated).toHaveBeenCalledWith({ ...ada, roles: [editor] })
    expect(toast.success).toHaveBeenCalledWith('Cargos salvos.')
  })

  it('reports an API failure while saving and keeps onUpdated untouched', async () => {
    mockReplaceUserRoles.mockRejectedValue(
      new Error('Você não tem permissão para realizar esta ação.')
    )

    await render(ada)

    await act(async () => {
      checkbox('Editor').click()
    })
    await act(async () => {
      buttonWithText('Salvar cargos')?.click()
    })

    expect(toast.error).toHaveBeenCalledWith(
      'Você não tem permissão para realizar esta ação.'
    )
    expect(onUpdated).not.toHaveBeenCalled()
  })

  it('marks a system role with the "Sistema" badge', async () => {
    await render(ada)

    const administratorLabel = checkbox('Administrador').closest('label')
    expect(administratorLabel?.textContent).toContain('Sistema')
  })
})
