// Kleur, net genoeg om inkt op papier te meten en bij te stellen. Uit de Kleurenalchemist overgenomen:
// lichtheid schuift in OKLCH, en aan de rand gaat een kleur met de gamut mapping van CSS Color 4 naar sRGB

import { converter, formatHex, modeLrgb, modeOklch, modeRgb, parseHex, toGamut, useMode as register, type Oklch as CuloriOklch } from 'culori/fn'

// culori noemt dit useMode, maar het is geen React-hook: het meldt alleen de kleurruimtes aan
register(modeRgb)
register(modeLrgb)
register(modeOklch)

/** Lichtheid 0 tot 1, chroma 0 tot ongeveer 0,37, tint in graden */
export interface Oklch {
  l: number
  c: number
  h: number
}

/** Altijd #rrggbb in kleine letters */
export type Hex = string

const toOklchMode = converter('oklch')
const toRgbMode = converter('rgb')
/** Het algoritme uit CSS Color 4: hou lichtheid en tint vast, laat de chroma zakken tot de kleur in sRGB past */
const mapToSrgb = toGamut('rgb', 'oklch')

const HEX = /^#[0-9a-f]{6}$/

export const isHex = (value: unknown): value is Hex => typeof value === 'string' && HEX.test(value)

/** Maak van #ABC, abc of #AABBCC een nette #aabbcc, of null als het geen kleur is */
export function normalizeHex(value: string): Hex | null {
  const v = value.trim().toLowerCase().replace(/^#?/, '#')
  if (/^#[0-9a-f]{3}$/.test(v)) return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`
  return isHex(v) ? v : null
}

/** Een tint tussen 0 en 360 */
export const wrapHue = (h: number) => ((h % 360) + 360) % 360

export const clamp = (x: number, min = 0, max = 1) => Math.min(max, Math.max(min, x))

const culori = ({ l, c, h }: Oklch): CuloriOklch => ({ mode: 'oklch', l, c, h })

/** De hexwaarde van een kleur, eerst in sRGB passend gemaakt */
export function toHex(color: Oklch): Hex {
  return formatHex(mapToSrgb(culori({ l: clamp(color.l), c: Math.max(0, color.c), h: wrapHue(color.h) })))
}

export function fromHex(hex: Hex): Oklch {
  const color = toOklchMode(parseHex(hex))
  // Grijs heeft geen tint, die wordt dan 0
  return { l: color?.l ?? 0, c: color?.c ?? 0, h: wrapHue(color?.h ?? 0) }
}

/** sRGB-kanalen van 0 tot 1 */
export function hexToRgb(hex: Hex): [number, number, number] {
  const rgb = toRgbMode(parseHex(hex))
  return [rgb?.r ?? 0, rgb?.g ?? 0, rgb?.b ?? 0]
}

/** sRGB-kanaal (0 tot 1) naar lineair licht */
export const linearize = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
