import { Snowflake } from '@sapphire/snowflake'

import { ClockRollbackError, InvalidIdGeneratorConfigError } from './errors'
import type { IdGenerator } from './id-generator'

/**
 * Decknews custom epoch: 2026-01-01T00:00:00.000Z (timestamp 1767225600000).
 * With a 42-bit timestamp field, this allows generating IDs for ~139 years from 2026,
 * while fitting safely within PostgreSQL's positive signed 64-bit BIGINT range.
 */
export const DECKNEWS_EPOCH = new Date('2026-01-01T00:00:00.000Z')

export const MAX_WORKER_ID = 31n
export const MAX_PROCESS_ID = 31n
export const MAX_SEQUENCE = 4095n

export interface TsidGeneratorOptions {
  /**
   * Epoch timestamp in ms or Date object.
   * Defaults to DECKNEWS_EPOCH (2026-01-01T00:00:00.000Z).
   */
  epoch?: Date | number | bigint

  /**
   * Worker/node identifier (0 to 31, 5 bits).
   * Defaults to 0.
   */
  workerId?: number | bigint

  /**
   * Process/datacenter identifier (0 to 31, 5 bits).
   * Defaults to 0.
   */
  processId?: number | bigint

  /**
   * Time source function returning current timestamp in milliseconds.
   * Defaults to Date.now.
   */
  now?: () => number
}

/**
 * TSID / Snowflake-style 64-bit identifier generator.
 *
 * Bit structure:
 *  - 1 bit  : unused / sign bit (always 0, ensuring positive signed BIGINT in PostgreSQL)
 *  - 41 bits: timestamp offset from epoch in milliseconds (~69 years to overflow signed range, 42 bits unsigned ~139 years)
 *  - 5 bits : workerId (0 - 31)
 *  - 5 bits : processId (0 - 31)
 *  - 12 bits: sequence / increment per millisecond (0 - 4095)
 */
export class TsidIdGenerator implements IdGenerator {
  private readonly snowflake: Snowflake
  private readonly workerId: bigint
  private readonly processId: bigint
  private readonly now: () => number

  private lastTimestamp = -1n
  private sequence = 0n

  constructor(options: TsidGeneratorOptions = {}) {
    const epochInput = options.epoch ?? DECKNEWS_EPOCH
    this.now = options.now ?? Date.now

    this.validateEpoch(epochInput)
    this.workerId = this.parseAndValidateId(
      options.workerId,
      MAX_WORKER_ID,
      'workerId'
    )
    this.processId = this.parseAndValidateId(
      options.processId,
      MAX_PROCESS_ID,
      'processId'
    )

    this.snowflake = new Snowflake(epochInput)
  }

  private validateEpoch(epochInput: Date | number | bigint): void {
    const epochMs =
      epochInput instanceof Date
        ? BigInt(epochInput.getTime())
        : BigInt(epochInput)
    const currentNow = BigInt(this.now())

    if (epochMs > currentNow) {
      throw new InvalidIdGeneratorConfigError(
        `Epoch cannot be in the future (epoch: ${epochMs}, now: ${currentNow})`
      )
    }
  }

  private parseAndValidateId(
    id: number | bigint | undefined,
    max: bigint,
    label: string
  ): bigint {
    const parsed = BigInt(id ?? 0)
    if (parsed < 0n || parsed > max) {
      throw new InvalidIdGeneratorConfigError(
        `${label} must be between 0 and ${max} (received ${parsed})`
      )
    }
    return parsed
  }

  /**
   * Generates the next 64-bit unique BigInt identifier.
   */
  next(): bigint {
    let currentTimestamp = BigInt(this.now())

    if (currentTimestamp < this.lastTimestamp) {
      const rollbackMs = this.lastTimestamp - currentTimestamp
      throw new ClockRollbackError(
        `Clock moved backwards by ${rollbackMs}ms. Refusing to generate id.`
      )
    }

    if (currentTimestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & MAX_SEQUENCE

      if (this.sequence === 0n) {
        // Sequence exhausted for this millisecond. Wait until next millisecond.
        while (currentTimestamp <= this.lastTimestamp) {
          currentTimestamp = BigInt(this.now())
        }
      }
    } else {
      this.sequence = 0n
    }

    this.lastTimestamp = currentTimestamp

    return this.snowflake.generate({
      timestamp: currentTimestamp,
      workerId: this.workerId,
      processId: this.processId,
      increment: this.sequence,
    })
  }
}
