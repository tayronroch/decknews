import { formatDate, slugify } from './index'

describe('Utils', () => {
  describe('slugify', () => {
    it('should correctly convert a string to a url slug', () => {
      expect(slugify('Olá Mundo! Isto é um Teste')).toBe(
        'ola-mundo-isto-e-um-teste'
      )
    })

    it('should trim leading and trailing spaces', () => {
      expect(slugify('  espaços extras  ')).toBe('espacos-extras')
    })
  })

  describe('formatDate', () => {
    it('should format a date to pt-BR string format', () => {
      const date = new Date(2026, 8, 2)
      const formatted = formatDate(date)
      expect(formatted).toBeDefined()
      expect(typeof formatted).toBe('string')
    })
  })
})
