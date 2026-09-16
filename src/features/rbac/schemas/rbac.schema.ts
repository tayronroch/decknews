import { z } from 'zod'

import { ValidationError } from '@/infra/errors'

export const roleSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500).optional(),
  })
  .strict()
export const roleUpdateSchema = roleSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0)
export const permissionKeysSchema = z
  .object({ permissions: z.array(z.string().trim().min(1).max(100)).min(0) })
  .strict()
export const roleIdsSchema = z
  .object({ roleIds: z.array(z.string().regex(/^\d+$/)).min(0) })
  .strict()

export function parseBigIntId(value: string): bigint {
  if (!/^\d+$/.test(value)) throw new ValidationError('Dados inválidos')
  return BigInt(value)
}
