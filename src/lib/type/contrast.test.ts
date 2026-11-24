import { describe, expect, it } from 'vitest'
import { normalizeHex } from './color'
import { apca, checkInk, contrastRatio, fixInk, formatRatio, isLarge, luminance, THRESHOLDS } from './contrast'
import { mulberry32 } from './prng'

describe('WCAG 2.2', () => {
  it('zwart op wit is 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 6)
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 6)
  })

  it('een kleur op zichzelf is 1:1', () => {
    expect(contrastRatio('#3b533e', '#3b533e')).toBe(1)
  })

  it('kent de bekende voorbeelden', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2)
    expect(contrastRatio('#777777', '#ffffff')).toBeLessThan(4.5)
    expect(contrastRatio('#595959', '#ffffff')).toBeCloseTo(7, 1)
    expect(contrastRatio('#0000ff', '#ffffff')).toBeCloseTo(8.59, 2)
  })

  it('luminantie van wit, zwart en middengrijs', () => {
    expect(luminance('#ffffff')).toBeCloseTo(1, 6)
    expect(luminance('#000000')).toBe(0)
    expect(luminance('#808080')).toBeCloseTo(0.2159, 4)
  })

  it('schrijft een verhouding naar beneden afgerond, met een komma', () => {
    expect(formatRatio(4.4999)).toBe('4,4:1')
    expect(formatRatio(21)).toBe('21,0:1')
  })
})

describe('inkt op papier', () => {
  it('vraagt 4,5 voor broodtekst en 3 voor een kop vanaf 24px', () => {
    expect(checkInk('#767676', '#ffffff', 17).required).toBe(4.5)
    expect(checkInk('#949494', '#ffffff', 32).required).toBe(3)
    expect(checkInk('#949494', '#ffffff', 32).passes).toBe(true)
    expect(checkInk('#949494', '#ffffff', 17).passes).toBe(false)
  })

  it('telt 18,66px vet ook als groot', () => {
    expect(isLarge(19, 700)).toBe(true)
    expect(isLarge(19, 400)).toBe(false)
    expect(isLarge(24)).toBe(true)
  })

  it('geeft AAA pas vanaf 7:1, ook bij een grote kop', () => {
    expect(checkInk('#767676', '#ffffff', 17).level).toBe('aa')
    expect(checkInk('#767676', '#ffffff', 40).level).toBe('aa')
    expect(checkInk('#595959', '#ffffff', 17).level).toBe('aaa')
    expect(checkInk('#949494', '#ffffff', 17).level).toBe('groot')
    expect(checkInk('#cccccc', '#ffffff', 40).level).toBe('nee')
  })

  it('zet APCA erbij', () => {
    expect(apca('#000000', '#ffffff')).toBeCloseTo(106.04, 1)
    expect(apca('#ffffff', '#000000')).toBeCloseTo(-107.88, 1)
    expect(checkInk('#000000', '#ffffff').lc).toBeCloseTo(106.04, 1)
  })
})

describe('een betere inkt', () => {
  it('laat een goede inkt staan', () => {
    expect(fixInk('#2c2823', '#f7f4eb')).toBe('#2c2823')
  })

  it('maakt grijs op wit donker genoeg, en net niet donkerder dan nodig', () => {
    const fixed = fixInk('#aaaaaa', '#ffffff')
    expect(contrastRatio(fixed, '#ffffff')).toBeGreaterThanOrEqual(THRESHOLDS.text)
    expect(contrastRatio(fixed, '#ffffff')).toBeLessThan(5)
  })

  it('maakt lichte inkt op donker papier lichter', () => {
    const fixed = fixInk('#555577', '#171b2e')
    expect(contrastRatio(fixed, '#171b2e')).toBeGreaterThanOrEqual(4.5)
    expect(luminance(fixed)).toBeGreaterThan(luminance('#555577'))
  })

  it('lost het altijd op, ook bij papier in het midden en ook voor een kop', () => {
    const random = mulberry32(7)
    const hex = () =>
      `#${Math.floor(random() * 0xffffff)
        .toString(16)
        .padStart(6, '0')}`
    for (let i = 0; i < 300; i++) {
      const ink = hex()
      const paper = hex()
      expect(contrastRatio(fixInk(ink, paper), paper), `${ink} op ${paper}`).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(fixInk(ink, paper, 3), paper), `${ink} op ${paper}`).toBeGreaterThanOrEqual(3)
    }
  })

  it('lost het ook op na een eerdere oplossing en na bijstellen', () => {
    const first = fixInk('#999999', '#ffffff')
    const nudged = normalizeHex(first.replace(/^#(..)/, '#aa'))!
    expect(contrastRatio(fixInk(nudged, '#ffffff'), '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })
})

describe('hexwaarden', () => {
  it('maakt van wat je typt een nette hex', () => {
    expect(normalizeHex('ABC')).toBe('#aabbcc')
    expect(normalizeHex(' #2C2823 ')).toBe('#2c2823')
    expect(normalizeHex('rood')).toBeNull()
  })
})
