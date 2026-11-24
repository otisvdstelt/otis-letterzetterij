// Loden letters: je kop als een regel zetsel. Elk teken een glyph uit het font, op zijn eigen loden blokje,
// en de hele regel in spiegelbeeld, zoals letters in de pers liggen. Hier alleen de vormen en de maten;
// de drukkerij maakt er in 3D blokjes van

import type { FontLike } from './metrics.ts'
import type { PathCommand } from './outline.ts'

/** Hooguit zoveel tekens gaan in de pers. Meer past niet op het bed, en dan wordt het ook te zwaar */
export const LEAD_MAX = 40

export interface LeadGlyph {
  char: string
  /** De omtrek, in font-eenheden, al op zijn plek in de regel (en gespiegeld als de regel dat is) */
  commands: PathCommand[]
  /** Waar het blokje begint en hoe breed het is, in font-eenheden */
  x: number
  advance: number
}

export interface LeadLine {
  glyphs: LeadGlyph[]
  width: number
  unitsPerEm: number
  ascent: number
  descent: number
  mirrored: boolean
}

/** Het stuk van je zin dat in de pers gaat: de eerste 40 tekens, afgebroken op een spatie als dat kan */
export function leadText(zin: string, max = LEAD_MAX): string {
  const chars = [...zin.trim()]
  if (chars.length <= max) return chars.join('')
  const cut = chars.slice(0, max).join('')
  const space = cut.lastIndexOf(' ')
  return (space > max * 0.5 ? cut.slice(0, space) : cut).trimEnd()
}

const shift = (commands: readonly PathCommand[], dx: number): PathCommand[] =>
  commands.map(({ command, args }) => ({ command, args: args.map((v, i) => (i % 2 === 0 ? v + dx : v)) }))

/** Spiegel om de verticale as x = mid. Een bocht blijft een bocht, de richting draait om, en dat mag: de vulregel kijkt alleen naar of het rond gaat */
const flip = (commands: readonly PathCommand[], mid: number): PathCommand[] =>
  commands.map(({ command, args }) => ({ command, args: args.map((v, i) => (i % 2 === 0 ? 2 * mid - v : v)) }))

/**
 * Zet een regel: elk teken met zijn eigen breedte naast het vorige (zonder kerning, zoals los lood).
 * Tekens die het font niet kent, vallen weg. Gespiegeld staat het eerste teken rechts
 */
export function leadLine(font: FontLike, text: string, mirrored = true): LeadLine {
  const placed: LeadGlyph[] = []
  let x = 0
  for (const char of leadText(text)) {
    const cp = char.codePointAt(0) ?? 0
    if (!font.hasGlyphForCodePoint(cp)) continue
    const glyph = font.glyphForCodePoint(cp)
    const advance = glyph.advanceWidth
    placed.push({ char, commands: shift(glyph.path.commands, x), x, advance })
    x += advance
  }
  const width = x
  const glyphs = mirrored ? placed.map((g) => ({ ...g, commands: flip(g.commands, width / 2), x: width - g.x - g.advance })) : placed
  return { glyphs, width, unitsPerEm: font.unitsPerEm, ascent: font.ascent, descent: Math.abs(font.descent), mirrored }
}
