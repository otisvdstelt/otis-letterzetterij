import { describe, expect, it } from 'vitest'
import { clockPhase } from './air'

describe('het uur', () => {
  it('is nacht van acht uur tot zeven uur', () => {
    const at = (hour: number) => clockPhase(new Date(2026, 10, 24, hour, 30))
    expect(at(6)).toBe('night')
    expect(at(7)).toBe('day')
    expect(at(19)).toBe('day')
    expect(at(20)).toBe('night')
    expect(at(0)).toBe('night')
  })
})
