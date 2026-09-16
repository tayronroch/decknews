import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { RoleManager } from './role-manager'

const roles = [
  {
    id: '1',
    name: 'Administrador',
    description: 'Cargo administrativo',
    isSystem: true,
    permissions: [
      {
        id: '10',
        key: 'role.read',
        description: 'Visualizar cargos',
        module: 'Cargos',
      },
    ],
  },
]

const permissions = [
  ...roles[0].permissions,
  {
    id: '11',
    key: 'post.create',
    description: 'Criar postagens',
    module: 'Posts',
  },
]

function response(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as Response
}

describe('RoleManager', () => {
  let container: HTMLDivElement
  let root: Root
  let fetchMock: jest.Mock

  beforeEach(() => {
    ;(
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT: boolean
      }
    ).IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    fetchMock = jest.fn((url) => {
      if (url === '/api/v1/admin/roles')
        return Promise.resolve(response({ roles }))
      if (url === '/api/v1/admin/permissions')
        return Promise.resolve(response({ permissions }))
      return Promise.reject(new Error(`Unexpected request: ${url}`))
    })
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: fetchMock,
      writable: true,
    })
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    Reflect.deleteProperty(global, 'fetch')
    jest.restoreAllMocks()
  })

  it('loads roles and groups dynamically loaded permissions by module', async () => {
    await act(async () => {
      root.render(<RoleManager />)
    })
    await act(async () => undefined)

    expect(container.textContent).toContain('Administrador')
    expect(container.textContent).toContain('Cargos')
    expect(container.textContent).toContain('Posts')
    expect(container.textContent).toContain('Cargo do sistema')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/admin/roles',
      expect.anything()
    )
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/admin/permissions',
      expect.anything()
    )
  })

  it('disables deletion for system roles', async () => {
    await act(async () => {
      root.render(<RoleManager />)
    })
    await act(async () => undefined)

    expect(
      container.querySelector<HTMLButtonElement>(
        'button[aria-label="Excluir Administrador"]'
      )?.disabled
    ).toBe(true)
  })
})
