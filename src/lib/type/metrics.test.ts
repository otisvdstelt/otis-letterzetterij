import { describe, expect, it } from 'vitest'
import { lookalike, measure, specimenOf, strokeContrast, type FontLike, type GlyphLike } from './metrics'
import type { PathCommand } from './outline'

/** Een rechthoek als glyph, met een gat erin als dat gevraagd is (tegen de klok in) */
function rect(x0: number, y0: number, x1: number, y1: number, hole?: [number, number, number, number]): PathCommand[] {
  const ring = (a: number, b: number, c: number, d: number, reverse: boolean): PathCommand[] => {
    const pts = [
      [a, b],
      [c, b],
      [c, d],
      [a, d],
    ]
    if (reverse) pts.reverse()
    return [{ command: 'moveTo', args: pts[0] }, ...pts.slice(1).map((args) => ({ command: 'lineTo' as const, args })), { command: 'closePath', args: [] }]
  }
  return [...ring(x0, y0, x1, y1, false), ...(hole ? ring(...hole, true) : [])]
}

const glyph = (commands: PathCommand[], advanceWidth = 600): GlyphLike => ({ advanceWidth, path: { commands } })

/** Een nepfont van 1000 per em. Een I, l en 1 als dezelfde stok, een O met een dikke zijkant en een dunne bovenkant */
function fakeFont(overrides: Record<string, GlyphLike> = {}, features: string[] = ['kern', 'tnum']): FontLike {
  const bar = glyph(rect(250, 0, 350, 700))
  const glyphs: Record<string, GlyphLike> = {
    x: glyph(rect(0, 0, 500, 500)),
    H: glyph(rect(0, 0, 600, 700)),
    I: bar,
    l: bar,
    '1': bar,
    // Zijkanten 120 dik, boven en onder 40: contrast 3
    o: glyph(rect(0, 0, 500, 500, [120, 40, 380, 460])),
    O: glyph(rect(0, 0, 700, 700, [100, 100, 600, 600])),
    '0': glyph(rect(150, 0, 450, 700, [200, 50, 400, 650])),
    A: glyph(rect(0, 0, 600, 700)),
    a: glyph(rect(0, 0, 500, 500), 500),
    ' ': glyph([], 250),
    ...overrides,
  }
  return {
    familyName: 'Nep',
    unitsPerEm: 1000,
    ascent: 900,
    descent: -250,
    lineGap: 0,
    xHeight: 480,
    capHeight: 690,
    availableFeatures: features,
    variationAxes: {},
    hasGlyphForCodePoint: (cp) => String.fromCodePoint(cp) in glyphs,
    glyphForCodePoint: (cp) => glyphs[String.fromCodePoint(cp)],
  }
}

describe('opmeten', () => {
  it('neemt de x-hoogte en de kapitaalhoogte uit de x en de H zelf', () => {
    const { metrics } = measure([fakeFont()])
    expect(metrics.xHeight).toBe(0.5)
    expect(metrics.capHeight).toBe(0.7)
    expect(metrics.descent).toBe(0.25)
  })

  it('meet het contrast tussen dikke en dunne stok in de o', () => {
    expect(strokeContrast(fakeFont().glyphForCodePoint(code('o')))).toBeCloseTo(3, 0)
    expect(strokeContrast(glyph(rect(0, 0, 500, 500, [100, 100, 400, 400])))).toBeCloseTo(1, 0)
  })

  it('ziet dat een I, l en 1 als dezelfde stok niet te onderscheiden zijn', () => {
    expect(lookalike([fakeFont()], ['I', 'l', '1'])).toBe(1)
    expect(measure([fakeFont()]).coverage.distinctIl1).toBe(false)
  })

  it('ziet een I met schreven als iets anders dan een kale l', () => {
    const serifI = glyph([...rect(250, 0, 350, 700), ...rect(150, 0, 450, 60), ...rect(150, 640, 450, 700)])
    const font = fakeFont({ I: serifI, '1': glyph(rect(250, 0, 350, 700, [270, 300, 330, 400])), l: glyph(rect(250, 0, 350, 860)) })
    expect(measure([font]).coverage.distinctIl1).toBe(true)
  })

  it('ziet een smalle 0 als iets anders dan een ronde O', () => {
    expect(measure([fakeFont()]).coverage.distinctO0).toBe(true)
  })

  it('telt tekens en features uit een tweede bestand mee', () => {
    const ext = { ...fakeFont({}, ['liga']), hasGlyphForCodePoint: (cp: number) => cp === 0x132 || cp === 0x133 }
    const { coverage } = measure([fakeFont(), ext])
    expect(coverage.ij).toBe(true)
    expect(coverage.ligatures).toBe(true)
    expect(coverage.tabular).toBe(true)
    expect(coverage.features).toEqual(['kern', 'liga', 'tnum'])
  })

  it('kent een font zonder Nederlandse accenten', () => {
    expect(measure([fakeFont()]).coverage.dutch).toBe(false)
  })

  it('geeft de gemiddelde breedte van een teken per em', () => {
    // Alleen a (500) en spatie (250) kent dit font uit de voorbeeldtekst, plus H, I, l en o
    const { metrics } = measure([fakeFont()])
    expect(metrics.avgWidth).toBeGreaterThan(0.25)
    expect(metrics.avgWidth).toBeLessThan(0.6)
  })
})

describe('specimen', () => {
  it('zet Aa naast elkaar op een em van 1000, met y omgedraaid', () => {
    const s = specimenOf([fakeFont()])
    expect(s.width).toBe(1100)
    expect(s.ascent).toBe(900)
    expect(s.descent).toBe(250)
    expect(s.d.startsWith('M0 0L600 0L600 -700')).toBe(true)
    expect(s.d).toContain('M600 0')
  })
})

function code(ch: string) {
  return ch.codePointAt(0) ?? 0
}
