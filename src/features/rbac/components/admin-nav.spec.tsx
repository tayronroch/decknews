import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { AdminNav, type AdminNavItem } from './admin-nav'

describe('AdminNav', () => {
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

  async function render(items: AdminNavItem[]) {
    await act(async () => {
      root.render(<AdminNav items={items} />)
    })
  }

  it('renders a link per item, with the received href and title', async () => {
    const items: AdminNavItem[] = [
      {
        href: '/admin/roles',
        title: 'Cargos e permissões',
        description: 'Crie cargos e defina as permissões concedidas.',
      },
      {
        href: '/admin/users',
        title: 'Usuários',
        description: 'Defina quais cargos cada pessoa possui.',
      },
    ]

    await render(items)

    const links = container.querySelectorAll('a')
    expect(links).toHaveLength(2)
    expect(links[0]?.getAttribute('href')).toBe('/admin/roles')
    expect(links[0]?.textContent).toContain('Cargos e permissões')
    expect(links[1]?.getAttribute('href')).toBe('/admin/users')
    expect(links[1]?.textContent).toContain('Usuários')
  })

  it('does not render any link that is not in items', async () => {
    await render([
      {
        href: '/admin/roles',
        title: 'Cargos e permissões',
        description: 'Crie cargos e defina as permissões concedidas.',
      },
    ])

    const links = container.querySelectorAll('a')
    expect(links).toHaveLength(1)
    expect(container.textContent).not.toContain('Usuários')
  })

  it('shows a message and no links when items is empty', async () => {
    await render([])

    expect(container.querySelectorAll('a')).toHaveLength(0)
    expect(container.textContent).toContain(
      'Nenhuma área administrativa disponível para o seu acesso.'
    )
  })
})
