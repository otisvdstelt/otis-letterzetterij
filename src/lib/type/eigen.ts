// Een eigen fontbestand als letter in de kast. Het bestand blijft op het apparaat; hier wordt alleen beschreven
// wat het is, uit wat we gemeten hebben. Zo doet een eigen font overal mee: in het vel, bij de drukker en in het voorstel

import type { FontEntry, Kind } from './catalogue.ts'
import { measure, type FontLike } from './metrics.ts'

/** Hooguit zo groot mag een fontbestand zijn. Groter is geen font maar een familie, of een vergissing */
export const MAX_FONT_BYTES = 12 * 1024 * 1024

/** De bestanden die we lezen */
export const FONT_FILE = /\.(woff2?|ttf|otf)$/i

/** Wat fontkit nog meer weet dan FontLike: de naam, het gewicht en of het cursief is */
export interface FontInfo extends FontLike {
  postscriptName?: string
  fullName?: string
  'OS/2'?: { usWeightClass?: number; fsSelection?: { italic?: boolean } }
  italicAngle?: number
}

/** Een monoletter heeft elk teken even breed */
export function isMonospaced(font: FontLike): boolean {
  const width = (ch: string) => {
    const cp = ch.codePointAt(0) ?? 0
    return font.hasGlyphForCodePoint(cp) ? font.glyphForCodePoint(cp).advanceWidth : null
  }
  const widths = ['i', 'm', 'l', 'W', '1'].map(width).filter((w): w is number => w !== null)
  return widths.length >= 3 && widths.every((w) => Math.abs(w - widths[0]) < 1)
}

/**
 * Wat voor letter het is, geraden uit de metingen. Mono als alles even breed is,
 * schreef als de stokken duidelijk dik en dun zijn, anders schreefloos. Je kunt het daarna zelf zetten
 */
export function guessKind(font: FontLike, contrast: number): Kind {
  if (isMonospaced(font)) return 'mono'
  return contrast >= 1.75 ? 'schreef' : 'schreefloos'
}

/** Een id voor een eigen font, uit zijn naam. Steeds dezelfde id voor dezelfde naam */
export function ownId(name: string): string {
  return `eigen:${name.replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 60) || 'letter'}`
}

/** Beschrijf een eigen font als een letter in de kast */
export function ownEntry(font: FontInfo, fileName: string): FontEntry {
  const measured = measure([font])
  const name = (font.familyName || font.fullName || fileName.replace(FONT_FILE, '')).trim() || 'Eigen letter'
  const weight = font['OS/2']?.usWeightClass ?? 400
  const italic = Boolean(font['OS/2']?.fsSelection?.italic) || Math.abs(font.italicAngle ?? 0) > 0.5
  const axes = Object.keys(measured.axes).length ? measured.axes : null
  const kind = guessKind(font, measured.metrics.contrast)
  const wght = axes?.wght
  return {
    id: ownId(name),
    family: name,
    drawer: kind,
    kind,
    moods: [],
    category: 'eigen',
    license: 'eigen bestand',
    version: '',
    weights: wght ? [wght.min, wght.max] : [weight],
    italic,
    axes,
    faces: [],
    unicodeRange: {},
    woff: {},
    metrics: measured.metrics,
    coverage: measured.coverage,
  }
}
