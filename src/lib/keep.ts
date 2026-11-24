// Wat op dit apparaat bewaard blijft: de waslijn, en of de hint bij de hendel al gezien is.
// Alleen in localStorage, met try/catch eromheen: opslag kan geweigerd of leeg zijn

import { decodeWaslijn, encodeWaslijn, type FallbackFor } from './type/share'
import type { Zetsel } from './type/zetsel'

const WASLIJN_KEY = 'letterzetterij-waslijn'
const HINT_KEY = 'letterzetterij-hendel'
const DRUKKER_KEY = 'letterzetterij-drukker'

/** De waslijn zoals hij hier bewaard is, of leeg */
export function readWaslijn(): Zetsel[] {
  try {
    const kept = window.localStorage.getItem(WASLIJN_KEY)
    return kept ? (decodeWaslijn(kept) ?? []).map((s) => s.zetsel) : []
  } catch {
    return []
  }
}

/** Bewaar de waslijn. Lukt dat niet, dan blijft hij hangen zolang de pagina open is */
export function keepWaslijn(sheets: readonly Zetsel[], fallbackFor: FallbackFor): boolean {
  try {
    if (sheets.length === 0) window.localStorage.removeItem(WASLIJN_KEY)
    else window.localStorage.setItem(WASLIJN_KEY, encodeWaslijn(sheets, fallbackFor))
    return true
  } catch {
    return false
  }
}

/** Heeft deze bezoeker de pers al eens overgetrokken? Dan hoeft de hint niet meer */
export function hintSeen(): boolean {
  try {
    return window.localStorage.getItem(HINT_KEY) === 'ja'
  } catch {
    return false
  }
}

export function keepHintSeen() {
  try {
    window.localStorage.setItem(HINT_KEY, 'ja')
  } catch {
    // Dan komt de hint de volgende keer nog een keer
  }
}

/** Staat de drukker stil? Dat onthouden we, want wie hem stil zet, wil hem niet elke keer weer horen */
export function readQuiet(): boolean {
  try {
    return window.localStorage.getItem(DRUKKER_KEY) === 'stil'
  } catch {
    return false
  }
}

export function keepQuiet(quiet: boolean) {
  try {
    if (quiet) window.localStorage.setItem(DRUKKER_KEY, 'stil')
    else window.localStorage.removeItem(DRUKKER_KEY)
  } catch {
    // Dan geldt het zolang de pagina open is
  }
}
