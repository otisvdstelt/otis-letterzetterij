import { describe, expect, it } from 'vitest'
import { begin, kies, klaar, type Afstand } from './oogarts'

/** Zestien letters op een lijn: de afstand is het verschil in nummer */
const ids = Array.from({ length: 16 }, (_, i) => `f${i}`)
const afstand: Afstand = (a, b) => Math.abs(Number(a.slice(1)) - Number(b.slice(1)))

/** Speel tot het eind, en kies steeds wat het dichtst bij `doel` ligt */
function speel(doel: string) {
  let s = begin(ids, afstand)
  let rondes = 0
  while (!klaar(s) && rondes < 30) {
    const [a, b] = s.paar!
    s = kies(s, afstand(a, doel) <= afstand(b, doel) ? a : b, afstand)
    rondes++
  }
  return { winnaar: klaar(s), rondes }
}

describe('de oogarts', () => {
  it('legt eerst de twee neer die het meest verschillen', () => {
    expect(begin(ids, afstand).paar).toEqual(['f0', 'f15'])
  })

  it('zakt van zestien naar één in zes tot acht rondes', () => {
    for (const doel of ids) {
      const { winnaar, rondes } = speel(doel)
      expect(winnaar, doel).not.toBeNull()
      expect(rondes, doel).toBeGreaterThanOrEqual(6)
      expect(rondes, doel).toBeLessThanOrEqual(8)
    }
  })

  it('komt uit bij wat je steeds koos, of er vlak naast', () => {
    for (const doel of ids) expect(afstand(speel(doel).winnaar!, doel), doel).toBeLessThanOrEqual(2)
  })

  it('negeert een keuze die niet op tafel ligt', () => {
    const s = begin(ids, afstand)
    expect(kies(s, 'f7', afstand)).toBe(s)
  })

  it('is met één kandidaat meteen klaar', () => {
    expect(klaar(begin(['f3'], afstand))).toBe('f3')
  })
})
