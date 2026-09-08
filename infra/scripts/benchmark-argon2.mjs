import { createHmac } from 'node:crypto'
import os from 'node:os'
import { performance } from 'node:perf_hooks'

import * as argon2 from '@node-rs/argon2'

const ARGON2ID_ALGORITHM = 2
const BENCHMARK_PEPPER = 'benchmark-test-pepper-1234567890'
const SAMPLE_PASSWORD = 'CorrectHorseBatteryStaple#2026!'
const WARMUP_RUNS = 1
const BENCHMARK_ITERATIONS = 5

const PROFILES = [
  {
    name: 'RFC 9106 Minimum',
    memoryCost: 19456,
    memoryLabel: '19 MiB',
    timeCost: 2,
    parallelism: 1,
  },
  {
    name: 'OWASP Recommended (Decknews Default)',
    memoryCost: 65536,
    memoryLabel: '64 MiB',
    timeCost: 3,
    parallelism: 1,
  },
  {
    name: 'High Security',
    memoryCost: 131072,
    memoryLabel: '128 MiB',
    timeCost: 4,
    parallelism: 1,
  },
]

function preparePassword(password, pepper) {
  return createHmac('sha256', pepper).update(password).digest('hex')
}

async function benchmarkProfile(profile) {
  const prepared = preparePassword(SAMPLE_PASSWORD, BENCHMARK_PEPPER)

  // Warmup run (unmeasured)
  for (let i = 0; i < WARMUP_RUNS; i++) {
    const warmupHash = await argon2.hash(prepared, {
      algorithm: ARGON2ID_ALGORITHM,
      memoryCost: profile.memoryCost,
      timeCost: profile.timeCost,
      parallelism: profile.parallelism,
    })
    await argon2.verify(warmupHash, prepared)
  }

  const hashTimes = []
  const verifyTimes = []

  for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
    const startHash = performance.now()
    const hash = await argon2.hash(prepared, {
      algorithm: ARGON2ID_ALGORITHM,
      memoryCost: profile.memoryCost,
      timeCost: profile.timeCost,
      parallelism: profile.parallelism,
    })
    const endHash = performance.now()
    hashTimes.push(endHash - startHash)

    const startVerify = performance.now()
    const isValid = await argon2.verify(hash, prepared)
    const endVerify = performance.now()
    verifyTimes.push(endVerify - startVerify)

    if (!isValid) {
      throw new Error(`Argon2 verification failed for profile: ${profile.name}`)
    }
  }

  const avgHash = hashTimes.reduce((a, b) => a + b, 0) / BENCHMARK_ITERATIONS
  const avgVerify =
    verifyTimes.reduce((a, b) => a + b, 0) / BENCHMARK_ITERATIONS

  return {
    ...profile,
    avgHash,
    avgVerify,
    avgTotal: avgHash + avgVerify,
  }
}

async function run() {
  const cpuModel = os.cpus()[0]?.model || 'Unknown CPU'
  const osPlatform = `${os.platform()} (${os.arch()})`

  console.log('='.repeat(78))
  console.log('Decknews Argon2id + HMAC-SHA-256 Benchmark')
  console.log('='.repeat(78))
  console.log(
    `Environment: Node ${process.version} | ${osPlatform} | ${cpuModel}`
  )
  console.log(
    `Benchmark Setup: ${BENCHMARK_ITERATIONS} measured iterations per profile (${WARMUP_RUNS} warmup)`
  )
  console.log('Running benchmarks...\n')

  const results = []

  for (const profile of PROFILES) {
    process.stdout.write(`  Benchmarking ${profile.name}... `)
    const result = await benchmarkProfile(profile)
    results.push(result)
    process.stdout.write('Done\n')
  }

  console.log('\nBenchmark Results:')
  const tableData = results.map((r) => ({
    Profile: r.name,
    Memory: `${r.memoryCost} (${r.memoryLabel})`,
    't (iters)': r.timeCost,
    'p (threads)': r.parallelism,
    'Hash Avg (ms)': `${r.avgHash.toFixed(2)} ms`,
    'Verify Avg (ms)': `${r.avgVerify.toFixed(2)} ms`,
    'Total Avg (ms)': `${r.avgTotal.toFixed(2)} ms`,
  }))

  console.table(tableData)
  console.log('='.repeat(78))
}

run().catch((err) => {
  console.error('Benchmark failed:', err)
  process.exit(1)
})
