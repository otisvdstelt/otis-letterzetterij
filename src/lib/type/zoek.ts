// Zoeken op wat een letter is, niet alleen in welk laatje hij ligt.
// Alles komt uit de metingen van het bouwscript: x-hoogte, breedte, contrast, rondheid, bereik en schriften.
// Hier staan geen woorden: de knopjes en hun namen staan in strings.ts

import { BOUWLIJST } from './bouwlijst.ts'
import type { FontEntry, Kind, Mood } from './catalogue.ts'

type Font = Pick<FontEntry, 'id' | 'kind' | 'category' | 'weights' | 'axes' | 'italic' | 'metrics' | 'coverage' | 'scripts' | 'moods'>

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
 * Hoe een schreefloze gebouwd is, gemeten. Een ronde o (bijna een cirkel) is geometrisch, zoals Futura of Jost.
 * Een smalle o met wat contrast in de stokken is humanistisch, zoals Fira of Source Sans. De rest is grotesk, zoals Inter.
 * Bijgesteld op de handgemaakte lijst: de grens voor rond lag eerst op 0,96 (Raleway viel erbuiten), contrast alleen
 * maakte van Libre Franklin en Schibsted een humanist, en smalle en brede displayletters vielen er vanzelf naast.
 * Zo meet hij 46 van de 56 goed; open of dichte vormen ziet hij niet, daarom gaat de lijst voor
 */
export function meetBouw(font: Font): Bouw {
  const { roundness, contrast, avgWidth } = font.metrics
  if (font.category === 'handwriting') return 'humanistisch'
  // Een brede, zware letter heeft vanzelf een brede o; dat maakt hem nog niet geometrisch (Archivo Black, Dela Gothic)
  if (avgWidth > 0.5 && roundness > 1.02) return 'grotesk'
  if (roundness >= 0.945) return 'geometrisch'
  // Een smalle letter (Oswald, Anton) heeft vanzelf een smalle o; dat maakt hem nog niet humanistisch
  if (roundness >= 0.8 && roundness < 0.9 && contrast >= 1.28) return 'humanistisch'
  return 'grotesk'
}

/** Hoe een schreefloze gebouwd is: uit de handgemaakte lijst als hij in de kast staat, anders gemeten */
export function bouw(font: Font): Bouw | null {
  if (schreefvorm(font) !== 'geen' || font.kind === 'handschrift' || font.kind === 'mono') return null
  return BOUWLIJST[font.id.replace(/^magazijn:/, '')] ?? meetBouw(font)
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

/** Wat hij mist van je eisen, met het aantal gewichten erbij, zodat er staat "maar 2 gewichten" in plaats van alleen "nee" */
export function mist(font: Font, eisen: readonly Eis[]): { eisen: Eis[]; gewichten: number } {
  return { eisen: eisen.filter((e) => !kan(font, e)), gewichten: weightCount(font) }
}

/** Eerst wat voldoet, dan wat niet, elk in zijn eigen volgorde */
export const voldoetEerst = <T extends Font>(fonts: readonly T[], eisen: readonly Eis[]): T[] => (eisen.length ? [...fonts.filter((f) => voldoet(f, eisen)), ...fonts.filter((f) => !voldoet(f, eisen))] : [...fonts])

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

/** Waar een gewoon woord naar wijst: een gevoel, een laatje, een bouw, een schreef, of een kant van een meting */
export type Eigenschap =
  | { soort: 'gevoel'; gevoel: Mood }
  | { soort: 'laatje'; kind: Kind }
  | { soort: 'bouw'; bouw: Bouw }
  | { soort: 'schreef'; schreef: Schreef }
  | { soort: 'maat'; maat: 'rond' | 'strak' | 'smal' | 'breed' | 'contrast' | 'groot-oog' | 'zwaar' }

/** Een rijtje woorden ("rond", "ronde", "rondjes") en waar ze naar wijzen */
export interface Woord {
  woorden: string[]
  eigenschappen: Eigenschap[]
}

/**
 * Lees gewone woorden: "ronde letter voor kinderen" wordt rond, speels en warm. Een woord telt als het met een
 * bekend woord begint, zodat "ronde" en "rondjes" ook "rond" zijn; het langste passende woord wint. Wat niet herkend wordt, wordt overgeslagen
 */
export function leesWoorden(query: string, lijst: readonly Woord[]): { herkend: string[]; eigenschappen: Eigenschap[] } {
  const tokens = query.split(/[\s,.;!?]+/).map(plain).filter((t) => t.length >= 3)
  const herkend: string[] = []
  const eigenschappen: Eigenschap[] = []
  for (const t of tokens) {
    // Het langste woord dat past, wint: "modern" is modern, niet "mode"
    let woord: Woord | null = null
    let best = 0
    for (const w of lijst)
      for (const x of w.woorden) {
        const p = plain(x)
        if (t.startsWith(p) && p.length > best) {
          best = p.length
          woord = w
        }
      }
    if (!woord) continue
    herkend.push(woord.woorden[0])
    for (const e of woord.eigenschappen) if (!eigenschappen.some((x) => JSON.stringify(x) === JSON.stringify(e))) eigenschappen.push(e)
  }
  return { herkend: [...new Set(herkend)], eigenschappen }
}

const zwaarste = (f: Font) => f.axes?.wght?.max ?? Math.max(...f.weights)

/** Hoe ver een letter boven of onder het gemiddelde van de kast zit, in standaardafwijkingen, afgekapt op 2 */
function zscore(fonts: readonly Font[], meet: (f: Font) => number) {
  const values = fonts.map(meet)
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const sd = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length) || 1
  return (f: Font) => Math.max(-2, Math.min(2, (meet(f) - mean) / sd))
}

/** De letters die het best bij de eigenschappen passen, de beste eerst. Alleen wat er echt bij past (score boven nul) */
export function zoekOpEigenschappen<T extends Font>(fonts: readonly T[], eigenschappen: readonly Eigenschap[], n = 12): T[] {
  if (eigenschappen.length === 0) return []
  const maat = {
    rond: zscore(fonts, (f) => f.metrics.roundness),
    strak: zscore(fonts, (f) => -f.metrics.roundness),
    smal: zscore(fonts, (f) => -f.metrics.avgWidth),
    breed: zscore(fonts, (f) => f.metrics.avgWidth),
    contrast: zscore(fonts, (f) => Math.log(f.metrics.contrast)),
    'groot-oog': zscore(fonts, (f) => f.metrics.xHeight / f.metrics.capHeight),
    zwaar: zscore(fonts, zwaarste),
  }
  // Handschrift en displayletters meten vreemd (een krul is ook rond); ze doen alleen mee als je om dat laatje vraagt
  const laatjes = eigenschappen.flatMap((e) => (e.soort === 'laatje' ? [e.kind] : []))
  // Twee gevoelens in één zoekopdracht wegen samen even zwaar als één, anders verdringt het gevoel de vorm
  const gevoelGewicht = 1.5 / Math.max(1, eigenschappen.filter((e) => e.soort === 'gevoel').length)
  const score = (f: Font) =>
    (f.kind === 'display' && !laatjes.includes('display') ? -0.75 : 0) +
    eigenschappen.reduce((s, e) => {
      switch (e.soort) {
        case 'gevoel':
          return s + (f.moods.includes(e.gevoel) ? gevoelGewicht : 0)
        case 'laatje':
          return s + (f.kind === e.kind ? 1.5 : -0.5)
        case 'bouw':
          return s + (bouw(f) === e.bouw ? 1 : 0)
        case 'schreef':
          return s + (schreefvorm(f) === e.schreef ? 1 : 0)
        case 'maat':
          return s + maat[e.maat](f) * 0.9
      }
    }, 0)
  return fonts
    .filter((f) => f.kind !== 'handschrift' || laatjes.includes('handschrift'))
    .map((f) => ({ f, s: score(f) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.f.id.localeCompare(b.f.id))
    .slice(0, n)
    .map((x) => x.f)
}
