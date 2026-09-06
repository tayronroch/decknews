import { prisma } from '@/infra/database'

export type DatabaseStatus = {
  connections: number
}

/**
 * Verifies PostgreSQL connectivity and returns current connection count.
 * Uses pg_stat_activity to report how many connections are open to this database.
 * Throws if the database is unreachable.
 */
export async function checkDatabaseStatus(): Promise<DatabaseStatus> {
  const result = await prisma.$queryRaw<[{ connections: number }]>`
    SELECT count(*)::int AS connections
    FROM pg_stat_activity
    WHERE datname = current_database()
  `

  return { connections: result[0].connections }
}
