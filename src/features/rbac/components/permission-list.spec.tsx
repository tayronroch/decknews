import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import type { PermissionDto } from '../types'
import { groupPermissionsByModule, PermissionList } from './permission-list'

const permissions: PermissionDto[] = [
  {
    id: '10',
    key: 'post.read',
    description: 'Visualizar postagens',
    module: 'Posts',
  },
  {
    id: '11',
    key: 'post.create',
    description: 'Criar postagens',
    module: 'Posts',
  },
  {
    id: '12',
    key: 'role.read',
    description: 'Visualizar cargos',
    module: 'Cargos',
  },
  { id: '13', key: 'legacy.flag', description: null, module: null },
]

function checkbox(container: HTMLElement, label: string) {
  const element = container.querySelector<HTMLButtonElement>(
    `button[aria-label="${label}"]`
  )
  if (!element) throw new Error(`Checkbox ${label} was not found`)
  return element
}

describe('groupPermissionsByModule', () => {
  it('groups permissions by module and keeps API ordering', () => {
    expect(
      groupPermissionsByModule(permissions, '').map(([module, items]) => [
        module,
        items.map((item) => item.key),
      ])
    ).toEqual([
      ['Posts', ['post.read', 'post.create']],
      ['Cargos', ['role.read']],
      ['Outras permissões', ['legacy.flag']],
    ])
  })

  it('filters by key, description and module', () => {
    expect(
      groupPermissionsByModule(permissions, 'post').map(([module]) => module)
    ).toEqual(['Posts'])
    expect(
      groupPermissionsByModule(permissions, 'Criar')[0][1].map(
        (item) => item.key
      )
    ).toEqual(['post.create'])
    expect(groupPermissionsByModule(permissions, 'inexistente')).toEqual([])
  })
})

describe('PermissionList', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  it('renders friendly descriptions next to the technical key', async () => {
    await act(async () => {
      root.render(
        <PermissionList
          permissions={permissions}
          selected={new Set(['post.read'])}
          search=""
          disabled={false}
          onToggle={jest.fn()}
        />
      )
    })

    expect(container.textContent).toContain('Posts')
    expect(container.textContent).toContain('Criar postagens')
    expect(container.textContent).toContain('post.create')
    expect(checkbox(container, 'Visualizar postagens').getAttribute('aria-checked')).toBe('true')
    expect(checkbox(container, 'Criar postagens').getAttribute('aria-checked')).toBe('false')
  })

  it('reports the toggled permission key', async () => {
    const onToggle = jest.fn()

    await act(async () => {
      root.render(
        <PermissionList
          permissions={permissions}
          selected={new Set()}
          search=""
          disabled={false}
          onToggle={onToggle}
        />
      )
    })

    await act(async () => {
      checkbox(container, 'Criar postagens').click()
    })

    expect(onToggle).toHaveBeenCalledWith('post.create')
  })

  it('does not toggle permissions when disabled', async () => {
    const onToggle = jest.fn()

    await act(async () => {
      root.render(
        <PermissionList
          permissions={permissions}
          selected={new Set()}
          search=""
          disabled
          onToggle={onToggle}
        />
      )
    })

    expect(checkbox(container, 'Criar postagens').disabled).toBe(true)

    await act(async () => {
      checkbox(container, 'Criar postagens').click()
    })

    expect(onToggle).not.toHaveBeenCalled()
  })

  it('shows an empty message when the search matches nothing', async () => {
    await act(async () => {
      root.render(
        <PermissionList
          permissions={permissions}
          selected={new Set()}
          search="inexistente"
          disabled={false}
          onToggle={jest.fn()}
        />
      )
    })

    expect(container.textContent).toContain('Nenhuma permissão encontrada')
  })
})
