// Leest de inkt op dit papier? Volgens WCAG 2.2, met APCA ernaast als extra informatie.
// De meetcode is die van de Kleurenalchemist; hier komt er bij wat een vel nodig heeft: tekst, grote koppen, en een oplossing

import { fromHex, hexToRgb, linearize, toHex, type Hex } from './color.ts'

/** Relatieve luminantie volgens WCAG 2.2 */
export function luminance(hex: Hex): number {
  const [r, g, b] = hexToRgb(hex).map(linearize)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** De contrastverhouding, van 1 (niks) tot 21 (zwart op wit) */
export function contrastRatio(a: Hex, b: Hex): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Drempels uit WCAG 2.2 */
export const THRESHOLDS = {
  /** Gewone tekst, AA (1.4.3) */
  text: 4.5,
  /** Grote tekst, AA (1.4.3): vanaf 24px, of vanaf 18,66px vet */
  large: 3,
  /** Gewone tekst, AAA (1.4.6) */
  enhanced: 7,
} as const

/** Groot genoeg voor de lagere drempel: 24px, of 18,66px (14pt) vanaf gewicht 700 */
export const isLarge = (px: number, weight = 400) => px >= 24 || (px >= 18.66 && weight >= 700)

/**
 * APCA-W3 0.0.98G-4g, de Lc-waarde van tekst op een achtergrond.
 * Dit is een concept voor WCAG 3 en nog geen standaard. Positief is donker op licht, negatief licht op donker
 */
export function apca(text: Hex, background: Hex): number {
  const screen = (hex: Hex) => {
    const [r, g, b] = hexToRgb(hex)
    const y = 0.2126729 * r ** 2.4 + 0.7151522 * g ** 2.4 + 0.072175 * b ** 2.4
    // Zachte klem bij heel donker
    return y < 0.022 ? y + (0.022 - y) ** 1.414 : y
  }
  const yt = screen(text)
  const yb = screen(background)
  if (Math.abs(yb - yt) < 0.0005) return 0
  if (yb > yt) {
    const sapc = (yb ** 0.56 - yt ** 0.57) * 1.14
    return sapc < 0.1 ? 0 : (sapc - 0.027) * 100
  }
  const sapc = (yb ** 0.65 - yt ** 0.62) * 1.14
  return sapc > -0.1 ? 0 : (sapc + 0.027) * 100
}

/** AAA, AA, alleen groot genoeg, of niet */
export type Level = 'aaa' | 'aa' | 'groot' | 'nee'

export interface InkCheck {
  ratio: number
  /** Wat deze tekst nodig heeft: 4,5 voor gewone tekst, 3 voor groot */
  required: number
  passes: boolean
  level: Level
  /** APCA Lc, als extra informatie */
  lc: number
}

/** AAA pas vanaf 7:1, ook bij groot. Wie AAA wil, wil het zeker weten */
function levelOf(ratio: number, large: boolean): Level {
  if (ratio >= THRESHOLDS.enhanced) return 'aaa'
  if (ratio >= THRESHOLDS.text) return 'aa'
  if (ratio >= THRESHOLDS.large) return large ? 'aa' : 'groot'
  return 'nee'
}

/** Meet inkt op papier voor tekst van deze maat */
export function checkInk(ink: Hex, paper: Hex, px = 16, weight = 400): InkCheck {
  const ratio = contrastRatio(ink, paper)
  const large = isLarge(px, weight)
  const required = large ? THRESHOLDS.large : THRESHOLDS.text
  return { ratio, required, passes: ratio >= required, level: levelOf(ratio, large), lc: apca(ink, paper) }
}

/**
 * Een inkt die op dit papier wel leest, zo dicht mogelijk bij de oude.
 * Eerst van het papier af in lichtheid (tint en chroma blijven), en lukt dat niet aan die kant, dan de andere kant op.
 * Mikt op iets boven de drempel (`aim`), zodat afronden het niet weer onder de streep duwt. Lukt het helemaal niet, dan zwart of wit
 */
export function fixInk(ink: Hex, paper: Hex, required: number = THRESHOLDS.text, aim = 0.1): Hex {
  const goal = required + aim
  if (contrastRatio(ink, paper) >= goal) return ink
  const own = fromHex(ink)
  const paperL = fromHex(paper).l
  const try_ = (towards: 0 | 1): Hex | null => {
    const at = (t: number) => toHex({ ...own, l: own.l + (towards - own.l) * t })
    if (contrastRatio(at(1), paper) < goal) return null
    let lo = 0
    let hi = 1
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2
      if (contrastRatio(at(mid), paper) >= goal) hi = mid
      else lo = mid
    }
    return at(hi)
  }
  const away: 0 | 1 = own.l <= paperL ? 0 : 1
  const found = try_(away) ?? try_(away === 0 ? 1 : 0)
  if (found) return found
  return contrastRatio('#000000', paper) >= contrastRatio('#ffffff', paper) ? '#000000' : '#ffffff'
}

/** Een verhouding zoals je hem opschrijft: 4,5:1. Naar beneden afgerond, zodat 4,49 nooit 4,5 lijkt */
export const formatRatio = (ratio: number) => `${(Math.floor(ratio * 10) / 10).toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}:1`
