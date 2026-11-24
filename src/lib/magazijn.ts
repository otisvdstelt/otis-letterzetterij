// Het magazijn: het hele archief van Fontsource, via hun CDN bij jsDelivr. Alleen na een duidelijke vraag,
// want daarbij gaat het IP-adres van de bezoeker naar jsDelivr. Het antwoord geldt alleen voor deze sessie.
// Dit is de enige code die jsDelivr kent; hij zit in een eigen chunk (magazijn-*.js), en de netwerktest weet dat

import { archiveEntry, type ArchiveItem } from './type/eigen'
import type { FontEntry } from './type/catalogue'
import { parseFont } from './fontFile'

const CDN = 'https://cdn.jsdelivr.net/fontsource/fonts'

/** Haal een letter uit het magazijn: het bestand voor het vel, en een .woff voor de pers. Gemeten zoals de kast */
export async function fetchArchiveFont(item: ArchiveItem): Promise<FontEntry> {
  const [id, , , weights, , variable] = item
  const weight = weights.split(',').map(Number).includes(400) ? 400 : Number(weights.split(',')[0]) || 400
  const woff2 = variable ? `${CDN}/${id}:vf@latest/latin-wght-normal.woff2` : `${CDN}/${id}@latest/latin-${weight}-normal.woff2`
  const woff = `${CDN}/${id}@latest/latin-${weight}-normal.woff`
  const response = await fetch(woff2)
  if (!response.ok) throw new Error(`magazijn: ${id} kwam niet (${response.status})`)
  const font = parseFont(await response.arrayBuffer())
  return archiveEntry(font, item, { woff2, woff, weight })
}
