// De kast: welke letters er zijn, wat ze kunnen en waar hun bestanden staan.
// npm run case schrijft dit weg als public/data/fonts.json; de app leest het en controleert het hier

import type { Coverage, Metrics } from './metrics.ts'

/** Wat voor letter het is. Bepaalt de koppelregels */
export type Kind = 'schreef' | 'schreefloos' | 'display' | 'handschrift' | 'mono'

/** Het laatje waar hij in ligt. Huis zijn de vier handschriften van mijn portfolio */
export type Drawer = Kind | 'huis'

export const KINDS: readonly Kind[] = ['schreef', 'schreefloos', 'display', 'handschrift', 'mono']
export const DRAWERS: readonly Drawer[] = ['schreef', 'schreefloos', 'display', 'handschrift', 'mono', 'huis']

/** Hoe het moet voelen */
export type Mood = 'klassiek' | 'modern' | 'speels' | 'technisch' | 'warm' | 'statig'
export const MOODS: readonly Mood[] = ['klassiek', 'modern', 'speels', 'technisch', 'warm', 'statig']

export type Style = 'normal' | 'italic'
export type Subset = 'latin' | 'latin-ext'

/** Eén bestand voor de browser: een stijl, een gewicht (of een bereik bij een variabel font) en een subset */
export interface Face {
  style: Style
  weight: number | [number, number]
  subset: Subset
  /** Pad vanaf de root van de site, bijvoorbeeld fonts/inter/5.3.0/latin-wght-normal.woff2 */
  file: string
}

export interface Axis {
  min: number
  default: number
  max: number
}

export interface FontEntry {
  id: string
  family: string
  drawer: Drawer
  kind: Kind
  moods: Mood[]
  /** De categorie volgens Fontsource, ter informatie */
  category: string
  license: string
  /** De versie van het npm-pakket bij Fontsource, voor de export */
  version: string
  /** Alle gewichten die Fontsource heeft (voor de export), en of er een cursief is */
  weights: number[]
  italic: boolean
  /** De assen als het een variabel font is, anders null */
  axes: Record<string, Axis> | null
  /** Wat hier lokaal staat */
  faces: Face[]
  unicodeRange: Partial<Record<Subset, string>>
  /** Een .woff per gewicht voor de letters in 3D (drei Text leest geen woff2) */
  woff: Record<string, string>
  metrics: Metrics
  coverage: Coverage
}

export interface Catalogue {
  /** Wanneer de kast gevuld is (YYYY-MM-DD) */
  built: string
  fonts: FontEntry[]
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

/** Controleer wat er van de server komt. Een font dat niet klopt, valt weg; een kast zonder fonts is een fout */
export function parseCatalogue(data: unknown): Catalogue {
  if (!isObject(data) || !Array.isArray(data.fonts)) throw new TypeError('kast: geen lijst met fonts')
  const fonts = data.fonts.filter(
    (f): f is FontEntry =>
      isObject(f) &&
      typeof f.id === 'string' &&
      typeof f.family === 'string' &&
      DRAWERS.includes(f.drawer as Drawer) &&
      KINDS.includes(f.kind as Kind) &&
      Array.isArray(f.faces) &&
      f.faces.length > 0 &&
      isObject(f.metrics) &&
      isObject(f.coverage),
  )
  if (fonts.length === 0) throw new TypeError('kast: leeg')
  return { built: typeof data.built === 'string' ? data.built : '', fonts }
}

/** Het gewicht dat het dichtst bij het gevraagde ligt, binnen wat er is */
export function nearestWeight(font: Pick<FontEntry, 'weights' | 'axes'>, wanted: number): number {
  const wght = font.axes?.wght
  if (wght) return Math.min(wght.max, Math.max(wght.min, wanted))
  return font.weights.reduce((best, w) => (Math.abs(w - wanted) < Math.abs(best - wanted) ? w : best), font.weights[0] ?? 400)
}

/** Het lichtste en zwaarste gewicht */
export function weightRange(font: Pick<FontEntry, 'weights' | 'axes'>): [number, number] {
  const wght = font.axes?.wght
  if (wght) return [wght.min, wght.max]
  return [Math.min(...font.weights), Math.max(...font.weights)]
}

/** Heeft hij dit gewicht echt, of moet de browser het verzinnen? */
export function hasWeight(font: Pick<FontEntry, 'weights' | 'axes'>, weight: number): boolean {
  const [min, max] = weightRange(font)
  if (font.axes?.wght) return weight >= min && weight <= max
  return font.weights.includes(weight)
}
