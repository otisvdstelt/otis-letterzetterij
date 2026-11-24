import bodyFace from '@fontsource/klee-one/files/klee-one-latin-400-normal.woff?url'
import displayFace from '@fontsource/zen-antique-soft/files/zen-antique-soft-latin-400-normal.woff?url'
import handFace from '@fontsource/yomogi/files/yomogi-latin-400-normal.woff?url'
import scriptFace from '@fontsource/homemade-apple/files/homemade-apple-latin-400-normal.woff?url'
import { Color } from 'three'

/** De kleuren van het uur, elk frame gemengd en gelezen door de lucht, het papier en de inkt */
export const look = {
  paper: new Color('#f7f4eb'),
  ink: new Color('#1c1917'),
}

/** De vier handschriften, voor alles wat in de drukkerij geschreven staat. drei Text leest .woff, geen .woff2 */
export const FACES = { body: bodyFace, display: displayFace, hand: handFace, script: scriptFace }
export type Face = keyof typeof FACES

/** Inkt op een kaartje of een bladzijde, op elk uur hetzelfde: het is papier */
export const PAGE_INK = '#2c2823'
