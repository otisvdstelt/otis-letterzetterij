// Een letter opmeten. Dezelfde code meet bij het bouwen de kast (npm run case) en in de browser een eigen fontbestand.
// Hij kent fontkit niet: alles wat lijkt op een font met deze paar eigenschappen is goed

import { boxOf, firstRunInColumn, firstRunInRow, flatten, overlap, rasterize, toSvgPath, type Box, type PathCommand } from './outline.ts'

export interface GlyphLike {
  advanceWidth: number
  path: { commands: PathCommand[] }
}

export interface AxisLike {
  name?: string
  min: number
  default: number
  max: number
}

/** Wat we van een font nodig hebben. fontkit voldoet eraan, in Node en in de browser */
export interface FontLike {
  familyName: string
  unitsPerEm: number
  ascent: number
  descent: number
  lineGap: number
  xHeight: number
  capHeight: number
  availableFeatures: string[]
  variationAxes: Record<string, AxisLike>
  hasGlyphForCodePoint(codePoint: number): boolean
  glyphForCodePoint(codePoint: number): GlyphLike
}

export interface Metrics {
  /** Hoogte van de x, per em */
  xHeight: number
  /** Hoogte van de H, per em */
  capHeight: number
  ascent: number
  /** Positief: hoe ver het onder de basislijn gaat */
  descent: number
  lineGap: number
  /** Gemiddelde breedte van een teken in gewone Nederlandse tekst, per em. Daaruit volgt de regellengte */
  avgWidth: number
  /** Dikke stok gedeeld door dunne, gemeten in de o. Rond 1 bij een schreefloze, 3 of meer bij een Bodoni */
  contrast: number
}

export interface Coverage {
  /** De OpenType-features die het bestand echt heeft */
  features: string[]
  tabular: boolean
  oldstyle: boolean
  smallCaps: boolean
  ligatures: boolean
  /** De IJ en ij als één teken (U+0132, U+0133) */
  ij: boolean
  /** Alle accenten die in het Nederlands voorkomen */
  dutch: boolean
  /** I, l en 1 lijken niet op elkaar */
  distinctIl1: boolean
  /** O en 0 lijken niet op elkaar */
  distinctO0: boolean
}

/** "Aa" als pad, op een em van 1000, met de basislijn op y = 0 */
export interface Specimen {
  d: string
  width: number
  ascent: number
  descent: number
}

export interface Measured {
  metrics: Metrics
  coverage: Coverage
  specimen: Specimen
  axes: Record<string, { min: number; default: number; max: number }>
}

/** Gewone Nederlandse tekst, om de gemiddelde tekenbreedte te bepalen. Met spaties en leestekens, zoals op een vel */
const SAMPLE =
  'Het vel kwam uit de pers en de drukker hield het tegen het licht. De letters stonden scherp, de inkt lag gelijk, en de regels liepen rustig door tot aan de rand van het papier. Zo hoort het.'

/** De accenten die in het Nederlands voorkomen */
const DUTCH = 'áéíóúàèëïöüâêîôûçñÉËÏÖÜ'

const IL1 = ['I', 'l', '1']
const O0 = ['O', '0']

/** Boven deze overlap lijken twee tekens te veel op elkaar */
export const LOOKALIKE = 0.8

const code = (ch: string) => ch.codePointAt(0) ?? 0

function glyphOf(fonts: readonly FontLike[], ch: string): GlyphLike | null {
  const cp = code(ch)
  const font = fonts.find((f) => f.hasGlyphForCodePoint(cp))
  return font ? font.glyphForCodePoint(cp) : null
}

function boxOfGlyph(glyph: GlyphLike | null): Box | null {
  if (!glyph) return null
  const polygons = flatten(glyph.path.commands)
  return polygons.length ? boxOf(polygons) : null
}

/** Dikke en dunne stok in de o: de linkerkant halverwege, en de bovenkant in het midden */
export function strokeContrast(glyph: GlyphLike | null): number {
  const box = boxOfGlyph(glyph)
  if (!glyph || !box) return 1
  const w = box.maxX - box.minX
  const h = box.maxY - box.minY
  if (w <= 0 || h <= 0) return 1
  const rows = 160
  const cols = Math.max(20, Math.round((rows * w) / h))
  const raster = rasterize(flatten(glyph.path.commands, 12), box, cols, rows)
  // Een paar rijen rond het midden: de dikste telt. Een paar kolommen rond het midden: de dunste telt
  let thick = 0
  for (let r = Math.round(rows * 0.4); r <= Math.round(rows * 0.6); r++) thick = Math.max(thick, firstRunInRow(raster, r))
  let thin = Infinity
  for (let c = Math.round(cols * 0.45); c <= Math.round(cols * 0.55); c++) {
    const run = firstRunInColumn(raster, c)
    if (run > 0) thin = Math.min(thin, run)
  }
  if (!Number.isFinite(thin) || thick === 0) return 1
  // Terug naar dezelfde maat in beide richtingen
  const thickUnits = (thick / cols) * w
  const thinUnits = (thin / rows) * h
  return Math.round((thickUnits / thinUnits) * 100) / 100
}

/** Lijken deze tekens op elkaar? Elk teken op zijn eigen midden gezet, in hetzelfde vak van basislijn tot kop */
export function lookalike(fonts: readonly FontLike[], chars: readonly string[]): number {
  const main = fonts[0]
  const glyphs = chars.map((ch) => glyphOf(fonts, ch))
  if (glyphs.some((g) => !g)) return 0
  const rasters = glyphs.map((glyph) => {
    const box = boxOfGlyph(glyph) ?? { minX: 0, maxX: 0, minY: 0, maxY: 0 }
    const centre = (box.minX + box.maxX) / 2
    const half = main.unitsPerEm * 0.35
    return rasterize(flatten(glyph!.path.commands), { minX: centre - half, maxX: centre + half, minY: main.descent, maxY: main.ascent }, 28, 56)
  })
  let most = 0
  for (let i = 0; i < rasters.length; i++) for (let j = i + 1; j < rasters.length; j++) most = Math.max(most, overlap(rasters[i], rasters[j]))
  return Math.round(most * 1000) / 1000
}

/** "Aa" als SVG-pad, op een em van 1000 */
export function specimenOf(fonts: readonly FontLike[], text = 'Aa'): Specimen {
  const main = fonts[0]
  const scale = 1000 / main.unitsPerEm
  let x = 0
  let d = ''
  for (const ch of text) {
    const glyph = glyphOf(fonts, ch)
    if (!glyph) continue
    d += toSvgPath(glyph.path.commands, scale, x)
    x += glyph.advanceWidth
  }
  return { d, width: Math.round(x * scale), ascent: Math.round(main.ascent * scale), descent: Math.round(-main.descent * scale) }
}

const perEm = (value: number, em: number) => Math.round((value / em) * 1000) / 1000

/**
 * Meet een font. Het eerste is het hoofdbestand; de rest (zoals latin-ext) telt mee voor welke tekens en features er zijn
 */
export function measure(fonts: readonly FontLike[]): Measured {
  const main = fonts[0]
  const em = main.unitsPerEm
  const height = (ch: string, fallback: number) => {
    const box = boxOfGlyph(glyphOf(fonts, ch))
    return box && box.maxY > 0 ? box.maxY : fallback
  }

  let total = 0
  let count = 0
  for (const ch of SAMPLE) {
    const glyph = glyphOf(fonts, ch)
    if (!glyph) continue
    total += glyph.advanceWidth
    count++
  }

  const features = [...new Set(fonts.flatMap((f) => f.availableFeatures))].sort()
  const has = (cp: number) => fonts.some((f) => f.hasGlyphForCodePoint(cp))

  const axes = Object.fromEntries(Object.entries(main.variationAxes).map(([tag, a]) => [tag, { min: a.min, default: a.default, max: a.max }]))

  return {
    metrics: {
      xHeight: perEm(height('x', main.xHeight), em),
      capHeight: perEm(height('H', main.capHeight), em),
      ascent: perEm(main.ascent, em),
      descent: perEm(Math.abs(main.descent), em),
      lineGap: perEm(main.lineGap, em),
      avgWidth: count ? perEm(total / count, em) : 0.5,
      contrast: strokeContrast(glyphOf(fonts, 'o')),
    },
    coverage: {
      features,
      tabular: features.includes('tnum'),
      oldstyle: features.includes('onum'),
      smallCaps: features.includes('smcp'),
      ligatures: features.includes('liga'),
      ij: has(0x132) && has(0x133),
      dutch: [...DUTCH].every((ch) => has(code(ch))),
      distinctIl1: lookalike(fonts, IL1) < LOOKALIKE,
      distinctO0: lookalike(fonts, O0) < LOOKALIKE,
    },
    specimen: specimenOf(fonts),
    axes,
  }
}
