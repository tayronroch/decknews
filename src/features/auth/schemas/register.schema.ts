import { z } from 'zod'

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(12).max(256),
  })
  .strict()

export type RegisterInput = z.infer<typeof registerSchema>
