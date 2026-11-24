import { describe, expect, it } from 'vitest'
import { airMoving, clockPhase, stepNight, type Phase } from './air'

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

describe('de schemering', () => {
  /**
   * Speel de drukkerij na: een tik per 16 ms, maar een frame alleen als iets erom vraagt (frameloop demand).
   * Tien keer snel wisselen, dan twee tellen wachten: het moet helemaal dag of helemaal nacht zijn
   */
  function speel(wissels: number, tussen: number) {
    const a = { night: { value: 0 }, reveal: { value: 1 }, wipe: { value: 0 } }
    let phase: Phase = 'day'
    const tik = 16
    let t = 0
    const loop = (ms: number) => {
      for (const end = t + ms; t < end; t += tik) if (airMoving(phase, a)) a.night.value = stepNight(a.night.value, phase, tik / 1000)
    }
    for (let i = 0; i < wissels; i++) {
      phase = phase === 'day' ? 'night' : 'day'
      loop(tussen)
    }
    loop(2000)
    return { phase, night: a.night.value, moving: airMoving(phase, a) }
  }

  it('komt na tien keer snel wisselen helemaal uit, en staat dan stil', () => {
    for (const tussen of [30, 80, 150, 400]) {
      for (const wissels of [9, 10]) {
        const { phase, night, moving } = speel(wissels, tussen)
        expect(night, `${wissels}× om de ${tussen} ms`).toBe(phase === 'night' ? 1 : 0)
        expect(moving).toBe(false)
      }
    }
  })

  it('vraagt frames zolang het beeld nog verschijnt of verdwijnt', () => {
    expect(airMoving('day', { night: { value: 0 }, reveal: { value: 0.5 }, wipe: { value: 0 } })).toBe(true)
    expect(airMoving('day', { night: { value: 0 }, reveal: { value: 1 }, wipe: { value: 2 } })).toBe(true)
    expect(airMoving('night', { night: { value: 0.5 }, reveal: { value: 1 }, wipe: { value: 0 } })).toBe(true)
    expect(airMoving('night', { night: { value: 1 }, reveal: { value: 1 }, wipe: { value: 0 } })).toBe(false)
  })
})
