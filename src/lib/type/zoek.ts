// Zoeken op wat een letter is, niet alleen in welk laatje hij ligt.
// Alles komt uit de metingen van het bouwscript: x-hoogte, breedte, contrast, rondheid, bereik en schriften.
// Hier staan geen woorden: de knopjes en hun namen staan in strings.ts

import type { FontEntry, Kind } from './catalogue.ts'

type Font = Pick<FontEntry, 'id' | 'kind' | 'category' | 'weights' | 'axes' | 'italic' | 'metrics' | 'coverage' | 'scripts'>

/** Hoe de schreven eruitzien */
export type Schreef = 'geen' | 'slab' | 'wig' | 'haarlijn'
/** Hoe een schreefloze gebouwd is */
export type Bouw = 'geometrisch' | 'humanistisch' | 'grotesk'

const SERIF_KINDS: readonly Kind[] = ['schreef']

/**
 * De vorm van de schreven, uit het stokcontrast: weinig contrast is een slab (Roboto Slab, Arvo),
 * veel contrast een haarlijn (Bodoni, Didot), en daartussen de klassieke wig (Garamond, Caslon)
 */
export function schreefvorm(font: Font): Schreef {
  const serif = SERIF_KINDS.includes(font.kind) || (font.kind === 'display' && font.category === 'serif')
  if (!serif) return 'geen'
  if (font.metrics.contrast < 1.6) return 'slab'
  if (font.metrics.contrast >= 3.5) return 'haarlijn'
  return 'wig'
}

/**
 * Hoe een schreefloze gebouwd is. Een ronde o (bijna een cirkel) is geometrisch, zoals Futura of Jost.
 * Met wat contrast in de stokken is hij humanistisch, zoals Fira of Source Sans. De rest is grotesk, zoals Inter
 */
export function bouw(font: Font): Bouw | null {
  if (schreefvorm(font) !== 'geen' || font.kind === 'handschrift') return null
  if (font.metrics.roundness >= 0.96) return 'geometrisch'
  if (font.metrics.contrast >= 1.25) return 'humanistisch'
  return 'grotesk'
}

/** Wat een letter moet kunnen, voor je project */
export type Eis = 'euro' | 'ij' | 'accenten' | 'pools' | 'turks' | 'grieks' | 'cyrillisch' | 'tabelcijfers' | 'cursief' | 'gewichten'
export const EISEN: readonly Eis[] = ['euro', 'ij', 'accenten', 'pools', 'turks', 'grieks', 'cyrillisch', 'tabelcijfers', 'cursief', 'gewichten']

/** Een variabel font telt als alle gewichten tussen zijn uitersten */
const weightCount = (f: Font) => (f.axes?.wght ? Math.floor((f.axes.wght.max - f.axes.wght.min) / 100) + 1 : f.weights.length)

/** Kan deze letter dat? */
export function kan(font: Font, eis: Eis): boolean {
  const c = font.coverage
  switch (eis) {
    case 'euro':
      return c.euro
    case 'ij':
      return c.ij
    case 'accenten':
      return c.dutch
    case 'pools':
      return c.polish
    case 'turks':
      return c.turkish
    case 'grieks':
      return (font.scripts ?? []).includes('greek')
    case 'cyrillisch':
      return (font.scripts ?? []).includes('cyrillic')
    case 'tabelcijfers':
      return c.tabular
    case 'cursief':
      return font.italic
    case 'gewichten':
      return weightCount(font) >= 4
  }
}

/** Voldoet hij aan alles wat moet? */
export const voldoet = (font: Font, eisen: readonly Eis[]) => eisen.every((e) => kan(font, e))

/** De richtingen waarin je verder kunt zoeken, vanaf een letter die je al hebt */
export type Richting = 'groter-oog' | 'kleiner-oog' | 'smaller' | 'breder' | 'meer-contrast' | 'minder-contrast' | 'ronder' | 'strakker'
export const RICHTINGEN: readonly Richting[] = ['groter-oog', 'kleiner-oog', 'smaller', 'breder', 'meer-contrast', 'minder-contrast', 'ronder', 'strakker']

/** Elke letter als een punt in een kleine ruimte: contrast (logaritmisch), breedte, x-hoogte, rondheid en soort */
function features(f: Font): number[] {
  return [Math.log(f.metrics.contrast) / Math.log(2.5), f.metrics.avgWidth / 0.08, f.metrics.xHeight / 0.1, f.metrics.roundness / 0.08]
}

/** Hoe ver twee letters uit elkaar liggen. Een andere soort of schreefvorm telt als een flinke stap */
export function afstand(a: Font, b: Font): number {
  const fa = features(a)
  const fb = features(b)
  let d = 0
  for (let i = 0; i < fa.length; i++) d += (fa[i] - fb[i]) ** 2
  return Math.sqrt(d) + (a.kind === b.kind ? 0 : 1.2) + (schreefvorm(a) === schreefvorm(b) ? 0 : 0.8)
}

/** De letters die het meest op deze lijken, de dichtstbijzijnde eerst */
export function lijktOp<T extends Font>(fonts: readonly T[], from: Font, n = 6): T[] {
  return fonts
    .filter((f) => f.id !== from.id)
    .map((f) => ({ f, d: afstand(f, from) }))
    .sort((a, b) => a.d - b.d || a.f.id.localeCompare(b.f.id))
    .slice(0, n)
    .map((x) => x.f)
}

/** Welke meting een richting verschuift, welke kant op, en hoeveel minstens */
const AS: Record<Richting, { meet: (f: Font) => number; kant: 1 | -1; minstens: number }> = {
  'groter-oog': { meet: (f) => f.metrics.xHeight, kant: 1, minstens: 0.02 },
  'kleiner-oog': { meet: (f) => f.metrics.xHeight, kant: -1, minstens: 0.02 },
  breder: { meet: (f) => f.metrics.avgWidth, kant: 1, minstens: 0.015 },
  smaller: { meet: (f) => f.metrics.avgWidth, kant: -1, minstens: 0.015 },
  'meer-contrast': { meet: (f) => Math.log(f.metrics.contrast), kant: 1, minstens: 0.15 },
  'minder-contrast': { meet: (f) => Math.log(f.metrics.contrast), kant: -1, minstens: 0.15 },
  ronder: { meet: (f) => f.metrics.roundness, kant: 1, minstens: 0.025 },
  strakker: { meet: (f) => f.metrics.roundness, kant: -1, minstens: 0.025 },
}

/**
 * Een stapje een kant op: letters die op die ene meting duidelijk verschillen, en verder zoveel mogelijk lijken.
 * "Groter oog" vanaf Garamond geeft dus nog steeds schreefletters, maar met een hogere x
 */
export function richting<T extends Font>(fonts: readonly T[], from: Font, kant: Richting, n = 6): T[] {
  const as = AS[kant]
  const base = as.meet(from)
  return fonts
    .filter((f) => f.id !== from.id && (as.meet(f) - base) * as.kant >= as.minstens)
    .map((f) => ({ f, d: afstand(f, from) - 0.5 * Math.min(2, Math.abs(as.meet(f) - base) / as.minstens / 4) }))
    .sort((a, b) => a.d - b.d || a.f.id.localeCompare(b.f.id))
    .slice(0, n)
    .map((x) => x.f)
}

/** Een bekende (vaak betaalde) letter en zijn gratis broertjes in de kast */
export interface Alternatief {
  naam: string
  /** Andere namen waaronder je hem kent */
  ook?: string[]
  ids: string[]
}

const plain = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '')

/** "Ik zoek iets als Helvetica": welke bekende letter bedoel je, als die er is */
export function zoekAlternatief(query: string, lijst: readonly Alternatief[]): Alternatief | null {
  const q = plain(query)
  if (q.length < 3) return null
  return lijst.find((a) => [a.naam, ...(a.ook ?? [])].some((n) => plain(n).startsWith(q) || q.startsWith(plain(n)))) ?? null
}
