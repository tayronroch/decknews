import { z } from 'zod'

const clientSchema = z.object({})

export type ClientEnv = z.infer<typeof clientSchema>

function loadClientEnv(): ClientEnv {
  const parsed = clientSchema.safeParse({})

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')

    throw new Error(`Invalid public environment variables:\n${issues}`)
  }

  return parsed.data
}

export const clientEnv = loadClientEnv()
