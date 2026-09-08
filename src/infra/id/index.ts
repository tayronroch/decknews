import { TsidIdGenerator } from './tsid-id-generator'

export * from './errors'
export * from './id-generator'
export * from './tsid-id-generator'

/**
 * Default application-wide IdGenerator singleton instance.
 */
export const idGenerator = new TsidIdGenerator()
