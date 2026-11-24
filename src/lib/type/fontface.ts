// Van een letter uit de kast naar CSS: de @font-face-regels die hem laden (lokaal, nooit van Google),
// en de naam en terugval waarmee je hem gebruikt. Alles krijgt een eigen naam (lz-<id>), zodat het nooit botst
// met de handschriften van de drukkerij zelf

import type { Face, FontEntry, Kind } from './catalogue.ts'

/** De naam waaronder de app een letter laadt */
export const familyName = (id: string) => `lz-${id.replace(/[^a-z0-9-]/gi, '-')}`

/** De terugval als de letter (nog) niet geladen is */
export const GENERIC: Record<Kind, string> = {
  schreef: 'serif',
  schreefloos: 'sans-serif',
  display: 'sans-serif',
  handschrift: 'cursive',
  mono: 'monospace',
}

/** Wat je in font-family zet */
export const fontStack = (font: Pick<FontEntry, 'id' | 'kind'>) => `'${familyName(font.id)}', ${GENERIC[font.kind]}`

const weightOf = (face: Face) => (Array.isArray(face.weight) ? `${face.weight[0]} ${face.weight[1]}` : String(face.weight))

/** Alle @font-face-regels voor een letter. `base` is waar de site staat ('/' of import.meta.env.BASE_URL) */
export function fontFaceCss(font: Pick<FontEntry, 'id' | 'faces' | 'unicodeRange'>, base = '/'): string {
  return font.faces
    .map((face) => {
      const range = font.unicodeRange[face.subset]
      return [
        '@font-face {',
        `  font-family: '${familyName(font.id)}';`,
        `  font-style: ${face.style};`,
        `  font-weight: ${weightOf(face)};`,
        '  font-display: swap;',
        `  src: url('${base}${face.file}') format('woff2');`,
        range ? `  unicode-range: ${range};` : '',
        '}',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')
}

/** De standen voor font-variation-settings, of normal als er niks te zetten valt */
export function variationSettings(axes: Record<string, number>): string {
  const entries = Object.entries(axes)
  return entries.length ? entries.map(([tag, value]) => `'${tag}' ${value}`).join(', ') : 'normal'
}
