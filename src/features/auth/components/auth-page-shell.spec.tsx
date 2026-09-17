import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { AuthPageShell } from './auth-page-shell'

describe('AuthPageShell', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    ;(
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT: boolean
      }
    ).IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  it('renders title, description and children', async () => {
    await act(async () => {
      root.render(
        <AuthPageShell title="Entrar" description="Acesse sua conta">
          <div id="form-content">Formulário de login</div>
        </AuthPageShell>
      )
    })

    expect(container.querySelector('h1')?.textContent).toBe('Entrar')
    expect(container.textContent).toContain('Acesse sua conta')
    expect(container.querySelector('#form-content')?.textContent).toBe(
      'Formulário de login'
    )
  })

  it('renders top navigation with link back to home', async () => {
    await act(async () => {
      root.render(
        <AuthPageShell title="Entrar" description="Acesse sua conta">
          <div>Conteúdo</div>
        </AuthPageShell>
      )
    })

    const homeLinks = Array.from(container.querySelectorAll('a')).filter(
      (a) => a.getAttribute('href') === '/'
    )
    expect(homeLinks.length).toBeGreaterThanOrEqual(1)

    const backButton = Array.from(container.querySelectorAll('a')).find((a) =>
      a.textContent?.includes('Voltar ao início')
    )
    expect(backButton).toBeDefined()
    expect(backButton?.getAttribute('href')).toBe('/')
  })

  it('renders footer when provided', async () => {
    await act(async () => {
      root.render(
        <AuthPageShell
          title="Entrar"
          description="Acesse sua conta"
          footer={<span id="footer-content">Criar conta</span>}
        >
          <div>Conteúdo</div>
        </AuthPageShell>
      )
    })

    expect(container.querySelector('#footer-content')?.textContent).toBe(
      'Criar conta'
    )
    expect(container.querySelector('footer')).not.toBeNull()
  })

  it('omits card footer element when footer prop is not provided', async () => {
    await act(async () => {
      root.render(
        <AuthPageShell title="Entrar" description="Acesse sua conta">
          <div>Conteúdo</div>
        </AuthPageShell>
      )
    })

    // The card footer should not be present when footer prop is omitted
    const cardFooter = container.querySelector('section footer')
    expect(cardFooter).toBeNull()
  })
})
