import type { CSSProperties } from 'react'
import type { FontEntry } from '../../lib/type/catalogue'
import { fontStack, variationSettings } from '../../lib/type/fontface'
import { LEVELS, type Scale } from '../../lib/type/scale'
import type { Zetsel } from '../../lib/type/zetsel'

/**
 * Het zetsel als CSS-variabelen op het vel. De schaal rekent in cqi in plaats van vw:
 * het vel gedraagt zich als een pagina die zo breed is als het vel zelf
 */
export function velStijl(z: Zetsel, kop: FontEntry, tekst: FontEntry, scale: Scale): CSSProperties {
  const vars: Record<string, string | number> = {
    '--kop-letter': fontStack(kop),
    '--tekst-letter': fontStack(tekst),
    '--kop-gewicht': z.kopStijl.weight,
    '--kop-stijl': z.kopStijl.italic ? 'italic' : 'normal',
    '--kop-assen': variationSettings(z.kopStijl.axes),
    '--tekst-gewicht': z.tekstStijl.weight,
    '--tekst-assen': variationSettings(z.tekstStijl.axes),
    '--tekst-spatie': `${z.tekstStijl.tracking}em`,
    '--regel': `${scale.measure.rem}rem`,
    '--kapitalen': `${scale.capsTracking}em`,
    '--inkt': z.inkt,
    '--papier': z.papier,
    '--tweede': z.tweedeInkt ?? z.inkt,
    '--uitlijning': z.uitlijning === 'midden' ? 'center' : z.uitlijning === 'uitvullen' ? 'justify' : 'start',
    '--afbreken': z.uitlijning === 'uitvullen' ? 'auto' : 'manual',
    '--cijfers': z.tabelcijfers ? 'tabular-nums' : 'normal',
    '--wrap': z.mooiAfbreken ? 'pretty' : 'wrap',
  }
  for (const name of LEVELS) {
    const level = scale.levels[name]
    vars[`--maat-${name}`] = level.size.replace('vw', 'cqi')
    vars[`--lh-${name}`] = level.leading
    vars[`--sp-${name}`] = `${level.tracking}em`
  }
  return vars as CSSProperties
}
