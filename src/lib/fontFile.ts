// Een fontbestand lezen: een .woff uit de kast voor de loden letters, of een eigen bestand dat iemand op de werkbank legt.
// fontkit leest het; alleen de formaten die we nodig hebben worden aangemeld. Wat er gelezen is, wordt bewaard per adres

import { create, registerFormat } from 'fontkit/core'
import { TTFFont } from 'fontkit/formats/TTFFont'
import { WOFF2Font } from 'fontkit/formats/WOFF2Font'
import { WOFFFont } from 'fontkit/formats/WOFFFont'
import type { FontLike } from './type/metrics'

registerFormat(TTFFont)
registerFormat(WOFFFont)
registerFormat(WOFF2Font)

/** Lees een font uit bytes. Gooit als het geen font is */
export function parseFont(bytes: ArrayBuffer | Uint8Array): FontLike {
  const font = create(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)) as FontLike & { fonts?: unknown }
  // Een collectie (.ttc) of iets dat geen glyphs heeft, is niet wat we zoeken
  if (typeof font.glyphForCodePoint !== 'function') throw new TypeError('geen los font')
  return font
}

const cache = new Map<string, Promise<FontLike>>()

/** Een font van deze site, één keer gelezen */
export function loadFont(url: string): Promise<FontLike> {
  let pending = cache.get(url)
  if (!pending) {
    pending = fetch(url).then(async (response) => {
      if (!response.ok) throw new Error(`font ${url}: ${response.status}`)
      return parseFont(await response.arrayBuffer())
    })
    cache.set(url, pending)
  }
  return pending
}

/** Eigen fonts blijven op dit apparaat: hun bytes staan alleen hier, in het geheugen van de pagina */
const own = new Map<string, FontLike>()
export const ownFonts = {
  set: (id: string, font: FontLike) => own.set(id, font),
  get: (id: string) => own.get(id) ?? null,
}
