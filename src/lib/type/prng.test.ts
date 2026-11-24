import { describe, expect, it } from 'vitest'
import { hash, mulberry32, pick, weighted } from './prng.ts'

describe('hash', () => {
  it('is vast en spreidt', () => {
    expect(hash('mos')).toBe(hash('mos'))
    expect(hash('mos')).not.toBe(hash('mos '))
    expect(hash('')).toBeGreaterThanOrEqual(0)
    expect(Number.isInteger(hash('neon|diepzee|12'))).toBe(true)
  })
})

describe('mulberry32', () => {
  it('geeft dezelfde reeks voor dezelfde seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    const first = Array.from({ length: 20 }, a)
    expect(Array.from({ length: 20 }, b)).toEqual(first)
    expect(first.every((x) => x >= 0 && x < 1)).toBe(true)
  })

  it('geeft een andere reeks voor een andere seed', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)())
  })

  it('is ongeveer gelijk verdeeld', () => {
    const random = mulberry32(7)
    const buckets = [0, 0, 0, 0]
    for (let i = 0; i < 8000; i++) buckets[pick(random, 4)]++
    for (const count of buckets) expect(count).toBeGreaterThan(1800)
  })
})

describe('weighted', () => {
  it('kiest nooit iets met gewicht nul', () => {
    const random = mulberry32(3)
    for (let i = 0; i < 500; i++) expect(weighted(random, [0, 1, 0, 2])).not.toBe(0)
  })
})
