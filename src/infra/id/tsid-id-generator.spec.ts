/**
 * @jest-environment node
 */
import {
  ClockRollbackError,
  DECKNEWS_EPOCH,
  InvalidIdGeneratorConfigError,
  TsidIdGenerator,
} from './index'

describe('TsidIdGenerator', () => {
  const baseTimestamp = new Date('2026-06-01T12:00:00.000Z').getTime()

  it('generates IDs of type bigint', () => {
    const generator = new TsidIdGenerator()
    const id = generator.next()

    expect(typeof id).toBe('bigint')
  })

  it('generates different consecutive IDs', () => {
    const generator = new TsidIdGenerator()
    const id1 = generator.next()
    const id2 = generator.next()

    expect(id1).not.toBe(id2)
  })

  it('generates IDs that fit within PostgreSQL signed 64-bit BIGINT range', () => {
    const generator = new TsidIdGenerator()
    const maxPostgresBigInt = 9223372036854775807n // 2^63 - 1

    for (let i = 0; i < 100; i++) {
      const id = generator.next()
      expect(id).toBeGreaterThan(0n)
      expect(id).toBeLessThanOrEqual(maxPostgresBigInt)
    }
  })

  it('does not produce collisions in batch generation', () => {
    const generator = new TsidIdGenerator()
    const count = 10_000
    const set = new Set<bigint>()

    for (let i = 0; i < count; i++) {
      set.add(generator.next())
    }

    expect(set.size).toBe(count)
  })

  it('preserves approximate temporal ordering when time advances', () => {
    let mockTime = baseTimestamp
    const generator = new TsidIdGenerator({
      now: () => mockTime,
    })

    const id1 = generator.next()
    mockTime += 100 // Advance 100ms
    const id2 = generator.next()
    mockTime += 100 // Advance 100ms
    const id3 = generator.next()

    expect(id1).toBeLessThan(id2)
    expect(id2).toBeLessThan(id3)
  })

  it('increments sequence when generated in the exact same millisecond', () => {
    const mockTime = baseTimestamp
    const generator = new TsidIdGenerator({
      now: () => mockTime,
    })

    const id1 = generator.next()
    const id2 = generator.next()
    const id3 = generator.next()

    expect(id2 - id1).toBe(1n)
    expect(id3 - id2).toBe(1n)
  })

  it('handles sequence overflow (> 4095 in same ms) by waiting for the next millisecond without collisions', () => {
    let mockTime = baseTimestamp
    let callCount = 0

    // Provide a time source that advances after 4096 calls to simulate time tick
    const generator = new TsidIdGenerator({
      now: () => {
        callCount++
        if (callCount > 4096) {
          mockTime += 1
        }
        return mockTime
      },
    })

    const set = new Set<bigint>()
    for (let i = 0; i < 4100; i++) {
      set.add(generator.next())
    }

    expect(set.size).toBe(4100)
  })

  describe('configuration validation', () => {
    it('throws InvalidIdGeneratorConfigError if workerId is negative', () => {
      expect(
        () =>
          new TsidIdGenerator({
            workerId: -1,
          })
      ).toThrow(InvalidIdGeneratorConfigError)
    })

    it('throws InvalidIdGeneratorConfigError if workerId exceeds 31', () => {
      expect(
        () =>
          new TsidIdGenerator({
            workerId: 32,
          })
      ).toThrow(InvalidIdGeneratorConfigError)
    })

    it('throws InvalidIdGeneratorConfigError if processId is negative', () => {
      expect(
        () =>
          new TsidIdGenerator({
            processId: -1,
          })
      ).toThrow(InvalidIdGeneratorConfigError)
    })

    it('throws InvalidIdGeneratorConfigError if processId exceeds 31', () => {
      expect(
        () =>
          new TsidIdGenerator({
            processId: 32,
          })
      ).toThrow(InvalidIdGeneratorConfigError)
    })

    it('throws InvalidIdGeneratorConfigError if epoch is in the future', () => {
      const futureDate = new Date(Date.now() + 100_000_000)
      expect(
        () =>
          new TsidIdGenerator({
            epoch: futureDate,
          })
      ).toThrow(InvalidIdGeneratorConfigError)
    })

    it('accepts valid configuration boundaries (workerId 0-31, processId 0-31)', () => {
      expect(
        () =>
          new TsidIdGenerator({
            workerId: 0,
            processId: 0,
            epoch: DECKNEWS_EPOCH,
          })
      ).not.toThrow()

      expect(
        () =>
          new TsidIdGenerator({
            workerId: 31,
            processId: 31,
            epoch: DECKNEWS_EPOCH,
          })
      ).not.toThrow()
    })
  })

  describe('clock rollback behavior', () => {
    it('throws ClockRollbackError when system clock moves backwards', () => {
      let mockTime = baseTimestamp
      const generator = new TsidIdGenerator({
        now: () => mockTime,
      })

      generator.next()

      // Simulate NTP clock regression (e.g. 50ms backwards)
      mockTime -= 50

      expect(() => generator.next()).toThrow(ClockRollbackError)
    })
  })
})
