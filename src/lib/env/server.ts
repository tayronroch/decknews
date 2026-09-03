import { z } from 'zod'

const serverSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(3000),
})

export type ServerEnv = z.infer<typeof serverSchema>

function loadServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error(
      '"@/lib/env/server" is server-only and must not be imported from client code.'
    )
  }

  const parsed = serverSchema.safeParse(process.env)

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')

    throw new Error(
      `Invalid environment variables:\n${issues}\n\nCheck your .env file against .env.example.`
    )
  }

  return parsed.data
}

export const env = loadServerEnv()
