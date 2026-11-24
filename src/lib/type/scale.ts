// De typografische schaal: van klein bijschrift tot de grote kop, vloeiend tussen een telefoon en een breed scherm.
// De verhouding komt van het doel (of de winkelhaak), de basismaat ook. Plus interlinie per niveau,
// spatiëring voor kapitalen en kleine maten, en de regellengte

import type { FontEntry } from './catalogue.ts'
import { GOAL_SPECS } from './goals.ts'
import type { Zetsel } from './zetsel.ts'

/** Tussen deze twee breedtes groeit alles mee, daarbuiten staat het stil */
export const VIEWPORT = { min: 375, max: 1440 } as const

export type LevelName = 'klein' | 'tekst' | 'h4' | 'h3' | 'h2' | 'h1' | 'groot'
export const LEVELS: readonly LevelName[] = ['klein', 'tekst', 'h4', 'h3', 'h2', 'h1', 'groot']

/** Hoeveel stappen op de schaal, vanaf de broodtekst */
const STEPS: Record<LevelName, number> = { klein: -1, tekst: 0, h4: 1, h3: 2, h2: 3, h1: 4, groot: 6 }

export interface Level {
  name: LevelName
  step: number
  role: 'kop' | 'tekst'
  /** Maat in px op 375 en op 1440 breed */
  min: number
  max: number
  /** De CSS-maat, vloeiend */
  size: string
  leading: number
  /** Letterspatiëring in em */
  tracking: number
}

export interface Scale {
  ratio: number
  levels: Record<LevelName, Level>
  /** Extra spatiëring voor tekst in kapitalen, in em */
  capsTracking: number
  /** De beste regellengte: in tekens, en als breedte in rem */
  measure: { chars: number; rem: number }
  /** Hoeveel groter de koppen zijn gezet omdat hun x-hoogte klein is (1 = niet) */
  optical: number
  /** De stap tussen h1 en groot (stap 5). Het vel gebruikt hem niet, Tailwind wel: daar is hij text-4xl */
  tussen: Omit<Level, 'name'>
}

type Metrics = Pick<FontEntry, 'metrics'>

const round = (v: number, digits = 4) => Math.round(v * 10 ** digits) / 10 ** digits
const rem = (px: number) => `${round(px / 16)}rem`

/**
 * Een maat die meegroeit tussen 375 en 1440 breed: clamp(min, intercept + slope·vw, max).
 * Is min gelijk aan max, dan gewoon die maat
 */
export function fluid(minPx: number, maxPx: number, minVw: number = VIEWPORT.min, maxVw: number = VIEWPORT.max): string {
  if (Math.abs(maxPx - minPx) < 0.01) return rem(maxPx)
  const slope = (maxPx - minPx) / (maxVw - minVw)
  const intercept = minPx - slope * minVw
  const lo = Math.min(minPx, maxPx)
  const hi = Math.max(minPx, maxPx)
  return `clamp(${rem(lo)}, ${rem(intercept)} + ${round(slope * 100)}vw, ${rem(hi)})`
}

/** Wat een clamp() op een bepaalde breedte oplevert, in px. Voor tests en voor het vel */
export function sizeAt(level: Pick<Level, 'min' | 'max'>, viewport: number): number {
  const t = Math.min(1, Math.max(0, (viewport - VIEWPORT.min) / (VIEWPORT.max - VIEWPORT.min)))
  return level.min + (level.max - level.min) * t
}

/** Koppen strakker naarmate ze groter zijn: 1,25 bij een kleine kop, 1,1 vanaf ongeveer 45px */
export function headingLeading(px: number): number {
  return round(Math.min(1.25, Math.max(1.1, 1.25 - (px - 20) * 0.006)), 3)
}

/** Grote koppen iets dichter op elkaar, kleine tekst iets ruimer */
export function trackingFor(px: number): number {
  if (px >= 40) return -0.015
  if (px >= 28) return -0.01
  if (px <= 14) return 0.01
  return 0
}

/**
 * Een kop met een kleinere x-hoogte dan de tekst oogt kleiner dan hij is. Hij krijgt een iets grotere maat,
 * hooguit 12% erbij
 */
export function opticalBoost(kop: Metrics, tekst: Metrics): number {
  const ratio = tekst.metrics.xHeight / kop.metrics.xHeight
  return round(Math.min(1.12, Math.max(1, ratio)), 3)
}

/** De breedte van een regel met zoveel tekens, in px, voor deze letter op deze maat */
export const measurePx = (chars: number, tekst: Metrics, sizePx: number) => chars * tekst.metrics.avgWidth * sizePx

/** Hoeveel tekens er op een regel van deze breedte passen */
export const charsPerLine = (widthPx: number, tekst: Metrics, sizePx: number) => widthPx / (tekst.metrics.avgWidth * sizePx)

/** De hele schaal voor dit zetsel */
export function buildScale(z: Pick<Zetsel, 'doel' | 'maat' | 'interlinie' | 'ratio' | 'regel' | 'kopStijl'>, kop: Metrics, tekst: Metrics): Scale {
  const spec = GOAL_SPECS[z.doel]
  const ratio = z.ratio
  // Op een telefoon is alles een stap kleiner: de basis een pixel of wat, en de verhouding wat vlakker
  const baseMax = z.maat
  const baseMin = Math.max(spec.minBase, Math.min(baseMax, z.doel === 'presentatie' ? baseMax * 0.72 : baseMax - 1))
  const ratioMin = 1 + (ratio - 1) * 0.8
  const optical = opticalBoost(kop, tekst)

  const levelAt = (step: number): Omit<Level, 'name'> => {
    const isHeading = step > 0
    const boost = isHeading ? optical : 1
    const max = round(baseMax * ratio ** step * boost, 2)
    const min = round(Math.min(max, baseMin * ratioMin ** step * boost), 2)
    const leading = isHeading ? headingLeading(max) : step < 0 ? round(Math.max(1.35, z.interlinie - 0.1), 2) : z.interlinie
    const tracking = round(trackingFor(max) + (isHeading ? z.kopStijl.tracking : 0), 3)
    return { step, role: isHeading ? 'kop' : 'tekst', min, max, size: fluid(min, max), leading, tracking }
  }
  const levels = Object.fromEntries(LEVELS.map((name) => [name, { name, ...levelAt(STEPS[name]) }])) as Record<LevelName, Level>

  const width = measurePx(z.regel, tekst, baseMax)
  return { ratio, levels, capsTracking: 0.06, measure: { chars: z.regel, rem: round(width / 16, 2) }, optical, tussen: levelAt(5) }
}
