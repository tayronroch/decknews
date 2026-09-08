import { cn } from './utils'

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('px-2 py-1', 'bg-blue-500')).toBe('px-2 py-1 bg-blue-500')
  })

  it('handles conditional classes and falsy values', () => {
    expect(
      cn('base', false && 'hidden', true && 'block', undefined, null)
    ).toBe('base block')
  })

  it('resolves conflicting tailwind classes', () => {
    expect(cn('px-2 px-4', 'text-red-500 text-blue-500')).toBe(
      'px-4 text-blue-500'
    )
  })
})
