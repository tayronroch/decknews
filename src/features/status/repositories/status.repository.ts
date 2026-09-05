import { prisma } from '@/infra/database'

/**
 * Executes a minimal query to verify PostgreSQL connectivity.
 * Throws if the database is unreachable.
 */
export async function checkDatabaseStatus(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`
}
