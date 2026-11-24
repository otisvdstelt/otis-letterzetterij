import { describe, expect, it } from 'vitest'
import { GOAL_SPECS } from './goals'
import { cleanZin, MAX_ZIN, normalize, startZetsel, toggleMood, withFont, withGoal, withStyle } from './zetsel'

const zin = 'Het vel kwam warm uit de pers'

describe('het zetsel', () => {
  it('begint met het doel website en zijn schaal', () => {
    const z = startZetsel(zin)
    expect(z.doel).toBe('website')
    expect(z.ratio).toBe(1.25)
    expect(z.maat).toBeGreaterThanOrEqual(16)
  })

  it('neemt bij een ander doel de schaal, maat, interlinie, regel en het sjabloon over', () => {
    const z = withGoal(startZetsel(zin), 'boek')
    expect(z).toMatchObject({ doel: 'boek', ratio: GOAL_SPECS.boek.ratio, maat: 18, sjabloon: 'boek', regel: GOAL_SPECS.boek.idealMeasure })
    expect(withGoal(z, 'affiche').ratio).toBeGreaterThanOrEqual(1.5)
  })

  it('schuift het gewicht naar wat een nieuwe letter heeft, en zet cursief uit als hij er geen heeft', () => {
    const z = withStyle(startZetsel(zin), 'kop', { weight: 900, italic: true })
    const next = withFont(z, 'kop', { id: 'pt-serif', weights: [400, 700], axes: null, italic: false })
    expect(next.kop).toBe('pt-serif')
    expect(next.kopStijl.weight).toBe(700)
    expect(next.kopStijl.italic).toBe(false)
  })

  it('houdt een gewicht dat de nieuwe letter wel heeft', () => {
    const z = withStyle(startZetsel(zin), 'tekst', { weight: 350 })
    expect(withFont(z, 'tekst', { id: 'inter', weights: [100, 900], axes: { wght: { min: 100, default: 400, max: 900 } }, italic: true }).tekstStijl.weight).toBe(350)
  })

  it('houdt hooguit twee stemmingen, de nieuwste', () => {
    let z = startZetsel(zin)
    z = toggleMood(toggleMood(toggleMood(z, 'warm'), 'modern'), 'speels')
    expect(z.stemming).toEqual(['modern', 'speels'])
    expect(toggleMood(z, 'modern').stemming).toEqual(['speels'])
  })

  it('maakt van rommel een geldig zetsel', () => {
    const z = normalize({ ...startZetsel(zin), maat: 4, interlinie: 9, ratio: 0.5, regel: 400, inkt: 'rood', tweedeInkt: 'x', stemming: ['warm', 'warm', 'gek' as never, 'modern', 'speels'], zin: 'a'.repeat(400) })
    expect(z.maat).toBe(12)
    expect(z.interlinie).toBe(2.4)
    expect(z.ratio).toBe(1.067)
    expect(z.regel).toBe(120)
    expect(z.inkt).toBe('#2c2823')
    expect(z.tweedeInkt).toBeNull()
    expect(z.stemming).toEqual(['warm', 'modern'])
    expect([...z.zin]).toHaveLength(MAX_ZIN)
  })

  it('zet een zin op één regel en knipt hem op 280 tekens, ook met emoji', () => {
    expect(cleanZin('  Twee\n\nregels   hier')).toBe('Twee regels hier')
    expect([...cleanZin('🖋'.repeat(300))]).toHaveLength(280)
  })
})
