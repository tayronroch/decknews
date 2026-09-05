import { z } from 'zod'

import { paginationSchema } from './index'

describe('Validation primitives', () => {
  describe('paginationSchema', () => {
    it('applies default pagination values when inputs are omitted', () => {
      const result = paginationSchema.parse({})

      expect(result).toEqual({
        page: 1,
        limit: 20,
      })
    })

    it('coerces string query parameters to integers', () => {
      const result = paginationSchema.parse({
        page: '4',
        limit: '50',
      })

      expect(result).toEqual({
        page: 4,
        limit: 50,
      })
    })

    it('rejects page less than 1', () => {
      expect(() => paginationSchema.parse({ page: '0' })).toThrow()
      expect(() => paginationSchema.parse({ page: '-5' })).toThrow()
    })

    it('rejects limit less than 1 or greater than 100', () => {
      expect(() => paginationSchema.parse({ limit: '0' })).toThrow()
      expect(() => paginationSchema.parse({ limit: '101' })).toThrow()
    })

    it('accepts valid upper bound limit of 100', () => {
      const result = paginationSchema.parse({ limit: '100' })
      expect(result.limit).toBe(100)
    })

    it('rejects non-integer float values', () => {
      expect(() => paginationSchema.parse({ page: '1.5' })).toThrow()
      expect(() => paginationSchema.parse({ limit: '20.9' })).toThrow()
    })
  })

  describe('strict payload contract validation', () => {
    const strictExampleSchema = z
      .object({
        title: z.string().min(3),
      })
      .strict()

    it('accepts payloads matching the exact contract', () => {
      const result = strictExampleSchema.parse({ title: 'Meu Post' })
      expect(result).toEqual({ title: 'Meu Post' })
    })

    it('rejects payloads containing unexpected properties (e.g. mass assignment)', () => {
      const invalidPayload = {
        title: 'Meu Post',
        isAdmin: true,
        role: 'admin',
      }

      const result = strictExampleSchema.safeParse(invalidPayload)
      expect(result.success).toBe(false)
    })
  })
})
