/**
 * Jest env setup — runs before any test module is imported.
 *
 * Sets fallback environment variables so that server-side modules that call
 * loadServerEnv() at import time (fail-fast pattern) don't throw in CI
 * environments where no .env file is present.
 *
 * Values here are safe placeholders — all database access is mocked in unit
 * tests. If the environment already has these variables set (e.g. integration
 * tests in CI), they are NOT overridden (??= semantics).
 *
 * NODE_ENV is intentionally omitted — Jest sets it to 'test' automatically.
 */

process.env.DATABASE_URL ??= 'postgresql://localhost:5432/decknews_test'
process.env.PORT ??= '3000'
process.env.DATABASE_POOL_SIZE ??= '5'
process.env.PASSWORD_PEPPER ??= 'jest-setup-test-pepper-token-123456'
