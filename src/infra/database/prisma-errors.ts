import { Prisma } from '@prisma/client'

export function getUniqueConstraintFields(
  error: unknown
): readonly string[] | null {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== 'P2002'
  ) {
    return null
  }

  const target = error.meta?.target

  if (Array.isArray(target)) {
    return target.map(String)
  }

  if (typeof target === 'string') {
    return [target]
  }

  return []
}
