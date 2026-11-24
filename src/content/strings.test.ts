import { describe, expect, it } from 'vitest'
import { FIX_IDS, REMARK_IDS } from '../lib/type/printer'
import { opmerking, opmerkingVarianten, oplossing, strings } from './strings'

const params = { naam: 'Inter', procent: 20, tekens: 90, px: 14, waarde: 1.2, gewicht: 300, ratio: 2.1, hex: '#123456', rol: 'kop', partner: 'Lora', doel: 'boek', waarom: 'schreef-schreefloos' }

describe('de woorden van de drukker', () => {
  it('heeft voor elke opmerking twee tot vier varianten, zonder gaten', () => {
    for (const id of REMARK_IDS) {
      const variants = opmerkingVarianten(id, params)
      expect(variants.length, id).toBeGreaterThanOrEqual(2)
      expect(variants.length, id).toBeLessThanOrEqual(4)
      for (const v of variants) expect(v, id).not.toMatch(/undefined|NaN|\{|\}/)
    }
  })

  it('kiest steeds dezelfde variant voor hetzelfde getal', () => {
    expect(opmerking('twee-schreef', {}, 7)).toBe(opmerking('twee-schreef', {}, 7))
    expect(opmerking('twee-schreef', {}, 0)).toBe('Twee schreefletters? Gewaagd.')
  })

  it('zegt de zin uit de opdracht over een handschrift in een boek, en over IJ', () => {
    expect(opmerkingVarianten('doel-handschrift', { doel: 'boek' })).toContain('Een handschrift voor een boek? Dan leest niemand verder dan bladzijde twee.')
    expect(opmerkingVarianten('ij', {})).toContain('IJsselmeer met een losse I en J? Dat doen we hier niet.')
  })

  it('heeft voor elke oplossing een knop', () => {
    for (const id of FIX_IDS) expect(oplossing(id, params), id).not.toMatch(/undefined|NaN/)
    expect(oplossing('zet-maat', { px: 17 })).toBe('Zet de broodtekst op 17px')
    expect(oplossing('wissel-kop', { naam: 'Lora' })).toBe('Wissel de kop voor Lora')
    expect(oplossing('wissel-tekst', { naam: 'Lora' }, 'geen-cursief')).toBe('Pak de cursief erbij: Lora')
  })

  it('noemt Google alleen in de bronvermelding, nooit in de naam', () => {
    expect(strings.titel).not.toMatch(/google/i)
    expect(strings.meenemen.bron).toBe('Lettertypes van Google Fonts, via Fontsource, onder hun eigen open licenties (meestal OFL).')
  })
})
