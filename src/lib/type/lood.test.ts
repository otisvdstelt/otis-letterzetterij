import { describe, expect, it } from 'vitest'
import { LEAD_MAX, leadLine, leadText } from './lood'
import type { FontLike } from './metrics'
import { boxOf, flatten } from './outline'

/** Een nepfont: elk teken een rechthoek van 500 breed, behalve een smalle i */
const font: FontLike = {
  familyName: 'Nep',
  unitsPerEm: 1000,
  ascent: 800,
  descent: -200,
  lineGap: 0,
  xHeight: 500,
  capHeight: 700,
  availableFeatures: [],
  variationAxes: {},
  hasGlyphForCodePoint: (cp) => cp !== 0x2603,
  glyphForCodePoint: (cp) => {
    const w = String.fromCodePoint(cp) === 'i' ? 200 : 500
    return {
      advanceWidth: cp === 32 ? 250 : w,
      path: {
        commands:
          cp === 32
            ? []
            : [
                { command: 'moveTo', args: [50, 0] },
                { command: 'lineTo', args: [w - 50, 0] },
                { command: 'lineTo', args: [w - 50, 700] },
                { command: 'closePath', args: [] },
              ],
      },
    }
  },
}

describe('loden letters', () => {
  it('neemt hooguit 40 tekens, afgebroken op een spatie', () => {
    const long = 'Het vel kwam warm uit de pers en ging meteen naar de waslijn'
    const cut = leadText(long)
    expect([...cut].length).toBeLessThanOrEqual(LEAD_MAX)
    expect(long.startsWith(cut)).toBe(true)
    expect(cut.endsWith(' ')).toBe(false)
    expect(leadText('Kort')).toBe('Kort')
  })

  it('zet elk teken naast het vorige, met zijn eigen breedte', () => {
    const line = leadLine(font, 'ai a', false)
    expect(line.glyphs.map((g) => g.x)).toEqual([0, 500, 700, 950])
    expect(line.width).toBe(1450)
  })

  it('legt de regel in spiegelbeeld: het eerste teken rechts', () => {
    const line = leadLine(font, 'ai')
    expect(line.mirrored).toBe(true)
    expect(line.glyphs[0].char).toBe('a')
    expect(line.glyphs[0].x).toBe(200)
    expect(line.glyphs[1].x).toBe(0)
    // De vorm van de a staat nu rechts, tussen 250 en 650
    const box = boxOf(flatten(line.glyphs[0].commands))
    expect(box.minX).toBe(250)
    expect(box.maxX).toBe(650)
  })

  it('laat tekens weg die het font niet kent', () => {
    expect(leadLine(font, 'a☃a').glyphs).toHaveLength(2)
  })
})
