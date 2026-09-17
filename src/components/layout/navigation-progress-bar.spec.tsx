import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { NavigationProgressBar } from './navigation-progress-bar'

const mockUsePathname = jest.fn()
const mockUseSearchParams = jest.fn()

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useSearchParams: () => mockUseSearchParams(),
}))

describe('NavigationProgressBar', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    jest.useFakeTimers()
    ;(
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT: boolean
      }
    ).IS_REACT_ACT_ENVIRONMENT = true

    mockUsePathname.mockReturnValue('/')
    mockUseSearchParams.mockReturnValue(new URLSearchParams())

    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('renders progress bar element in the document', async () => {
    await act(async () => {
      root.render(<NavigationProgressBar />)
    })

    const progressBar = container.querySelector('[role="progressbar"]')
    expect(progressBar).not.toBeNull()
    expect(progressBar?.getAttribute('aria-hidden')).toBe('true')
  })

  it('starts loading when an internal link is clicked', async () => {
    await act(async () => {
      root.render(
        <div>
          <NavigationProgressBar />
          <a href="/posts" id="test-link" onClick={(e) => e.preventDefault()}>
            Ir para posts
          </a>
        </div>
      )
    })

    const link = container.querySelector('#test-link') as HTMLAnchorElement
    expect(link).not.toBeNull()

    await act(async () => {
      link.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true })
      )
    })

    const barInner = container.querySelector(
      '[role="progressbar"] > div'
    ) as HTMLElement
    expect(barInner).not.toBeNull()
    // Width should be > 0% after click
    expect(barInner.style.width).not.toBe('0%')
  })

  it('does not start loading for external links or target blank', async () => {
    await act(async () => {
      root.render(
        <div>
          <NavigationProgressBar />
          <a
            href="https://google.com"
            id="external-link"
            onClick={(e) => e.preventDefault()}
          >
            Externo
          </a>
          <a
            href="/posts"
            target="_blank"
            id="blank-link"
            onClick={(e) => e.preventDefault()}
          >
            Nova Aba
          </a>
        </div>
      )
    })

    const externalLink = container.querySelector(
      '#external-link'
    ) as HTMLAnchorElement
    await act(async () => {
      externalLink.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true })
      )
    })

    const barInner = container.querySelector(
      '[role="progressbar"] > div'
    ) as HTMLElement
    expect(barInner.style.width).toBe('0%')

    const blankLink = container.querySelector(
      '#blank-link'
    ) as HTMLAnchorElement
    await act(async () => {
      blankLink.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true })
      )
    })

    expect(barInner.style.width).toBe('0%')
  })

  it('completes and resets when pathname changes', async () => {
    await act(async () => {
      root.render(
        <div>
          <NavigationProgressBar />
          <a href="/about" id="about-link" onClick={(e) => e.preventDefault()}>
            Sobre
          </a>
        </div>
      )
    })

    const link = container.querySelector('#about-link') as HTMLAnchorElement
    await act(async () => {
      link.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true })
      )
    })

    // Pathname change simulation
    mockUsePathname.mockReturnValue('/about')

    await act(async () => {
      root.render(
        <div>
          <NavigationProgressBar />
          <a href="/about" id="about-link" onClick={(e) => e.preventDefault()}>
            Sobre
          </a>
        </div>
      )
    })

    // Advance timers for completion animation and fade out
    await act(async () => {
      jest.advanceTimersByTime(500)
    })

    const barInner = container.querySelector(
      '[role="progressbar"] > div'
    ) as HTMLElement
    expect(barInner.style.width).toBe('0%')
  })
})
