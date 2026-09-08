import { z } from 'zod'

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type PaginationParams = z.infer<typeof paginationSchema>

/**
 * Validates a 64-bit ID parameter received as a decimal string in API routes/queries.
 * Ensures the string contains only digits and fits within PostgreSQL positive signed BIGINT range.
 */
export const idParamSchema = z
  .string()
  .regex(/^\d+$/, 'ID deve ser uma representação numérica decimal')
  .refine(
    (val) => {
      try {
        const big = BigInt(val)
        return big > 0n && big <= 9223372036854775807n
      } catch {
        return false
      }
    },
    { message: 'ID fora do intervalo válido de 64 bits' }
  )
