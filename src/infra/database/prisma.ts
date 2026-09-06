import { PrismaClient } from '@prisma/client'

import { env } from '@/lib/env/server'

/**
 * Appends connection pool params to the DATABASE_URL if not already set.
 * - connection_limit: caps the number of open connections to the DB.
 * - pool_timeout: seconds to wait for a free connection before failing (avoids
 *   indefinite queuing when the pool is exhausted).
 */
function buildDatabaseUrl(): string {
  const url = new URL(env.DATABASE_URL)

  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', String(env.DATABASE_POOL_SIZE))
  }

  if (!url.searchParams.has('pool_timeout')) {
    url.searchParams.set('pool_timeout', '10')
  }

  return url.toString()
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: buildDatabaseUrl(),
      },
    },
  })

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
