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

/** Een regel uit het magazijn: id, naam, categorie, gewichten, cursief, variabel, licentie */
export type ArchiveItem = [id: string, family: string, category: string, weights: string, italic: 0 | 1, variable: 0 | 1, license: string]

const KIND_OF: Record<string, Kind> = { serif: 'schreef', 'sans-serif': 'schreefloos', display: 'display', handwriting: 'handschrift', monospace: 'mono' }

/** De latin-tekens, zoals Fontsource ze afbakent */
export const LATIN_RANGE =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'

/**
 * Een letter uit het magazijn als letter in de kast: gemeten uit zijn bestand, met de adressen erbij waar hij vandaan kwam.
 * Die adressen geeft het magazijn mee; hier staat er geen
 */
export function archiveEntry(font: FontLike, item: ArchiveItem, files: { woff2: string; woff: string; weight: number }): FontEntry {
  const [id, family, category, , , , license] = item
  const measured = measure([font])
  const axes = Object.keys(measured.axes).length ? measured.axes : null
  const kind = KIND_OF[category] ?? 'schreefloos'
  return {
    id: `magazijn:${id}`,
    family,
    drawer: kind,
    kind,
    moods: [],
    category,
    license,
    version: 'latest',
    // Alleen wat er echt geladen is. Een ander gewicht zou de browser verzinnen, en dat moet de drukker kunnen zeggen
    weights: axes?.wght ? [axes.wght.min, axes.wght.max] : [files.weight],
    // De cursief halen we niet op: één bestand per letter is genoeg om te proberen
    italic: false,
    axes,
    faces: [{ style: 'normal', subset: 'latin', weight: axes?.wght ? [axes.wght.min, axes.wght.max] : 400, file: files.woff2 }],
    unicodeRange: { latin: LATIN_RANGE },
    woff: { [String(files.weight)]: files.woff },
    metrics: measured.metrics,
    coverage: measured.coverage,
  }
}
