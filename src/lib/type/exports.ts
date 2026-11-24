// Meenemen. Alles wat je nodig hebt om het vel in je eigen project te zetten:
// Tailwind v4 @theme, gewone CSS met clamp(), de npm-regels voor Fontsource, en tekststijlen voor Figma.
// Alleen code; de woorden eromheen (het briefje van de drukker) staan in strings.ts

import { nearestWeight, type FontEntry } from './catalogue.ts'
import { GENERIC, variationSettings } from './fontface.ts'
import type { Scale, LevelName } from './scale.ts'
import { isOwn, type Role, type Zetsel } from './zetsel.ts'

type Font = Pick<FontEntry, 'id' | 'family' | 'kind' | 'weights' | 'axes' | 'italic'>

export interface ExportInput {
  zetsel: Zetsel
  kop: Font
  tekst: Font
  scale: Scale
}

/** Tailwind-namen voor de niveaus van de schaal */
const TAILWIND: Record<LevelName, string> = { klein: 'sm', tekst: 'base', h4: 'lg', h3: 'xl', h2: '2xl', h1: '3xl', groot: '5xl' }
/** CSS-namen, in het Nederlands zoals de rest van de drukkerij */
const CSS_NAMES: Record<LevelName, string> = { klein: 'klein', tekst: 'tekst', h4: 'h4', h3: 'h3', h2: 'h2', h1: 'h1', groot: 'groot' }
const ORDER: LevelName[] = ['klein', 'tekst', 'h4', 'h3', 'h2', 'h1', 'groot']

/** Gebruikt het zetsel assen buiten wght? Dan is het standard-bestand van Fontsource nodig in plaats van wght */
const usesExtraAxes = (style: Zetsel['kopStijl']) => Object.keys(style.axes).some((tag) => tag !== 'wght')
const styleOf = (z: Zetsel, role: Role) => (role === 'kop' ? z.kopStijl : z.tekstStijl)

/** De familienaam zoals Fontsource hem registreert: variabel met "Variable" erachter */
export function exportFamily(font: Font): string {
  if (isOwn(font.id)) return font.family
  return font.axes?.wght ? `${font.family} Variable` : font.family
}

export const exportStack = (font: Font) => `"${exportFamily(font)}", ${GENERIC[font.kind]}`

/** Het npm-pakket bij Fontsource */
export function packageName(font: Font): string | null {
  if (isOwn(font.id)) return null
  return font.axes?.wght ? `@fontsource-variable/${font.id}` : `@fontsource/${font.id}`
}

/** Welke gewichten een rol echt gebruikt: zijn eigen gewicht, en voor de tekst ook een vet voor <strong> */
export function weightsFor(font: Font, z: Zetsel, role: Role): number[] {
  const own = nearestWeight(font, styleOf(z, role).weight)
  const set = new Set([own])
  if (role === 'tekst') set.add(nearestWeight(font, 700))
  return [...set].sort((a, b) => a - b)
}

/** De import-regels voor één letter. Variabel: één bestand per stijl. Statisch: per gewicht, met cursief voor de tekst */
export function importsFor(font: Font, z: Zetsel, role: Role): string[] {
  const pkg = packageName(font)
  if (!pkg) return []
  const style = styleOf(z, role)
  const wantsItalic = font.italic && (role === 'tekst' || style.italic)
  if (font.axes?.wght) {
    const axisFile = usesExtraAxes(style) ? 'standard' : 'wght'
    const lines = [axisFile === 'wght' ? `import '${pkg}'` : `import '${pkg}/standard.css'`]
    if (wantsItalic) lines.push(`import '${pkg}/${axisFile}-italic.css'`)
    return lines
  }
  return weightsFor(font, z, role).flatMap((w) => [`import '${pkg}/${w}.css'`, ...(wantsItalic ? [`import '${pkg}/${w}-italic.css'`] : [])])
}

/** npm install en de imports, één keer per pakket */
export function npmExport({ zetsel, kop, tekst }: ExportInput): { install: string; imports: string } {
  const fonts: [Font, Role][] = kop.id === tekst.id ? [[tekst, 'tekst']] : [[kop, 'kop'], [tekst, 'tekst']]
  const packages = [...new Set(fonts.map(([f]) => packageName(f)).filter((p): p is string => p !== null))]
  const imports = [...new Set(fonts.flatMap(([f, role]) => importsFor(f, zetsel, role)))]
  // Dezelfde familie in twee rollen: de kop mag zijn eigen gewicht ook meenemen
  if (kop.id === tekst.id && !kop.axes?.wght) {
    for (const line of importsFor(kop, zetsel, 'kop')) if (!imports.includes(line)) imports.push(line)
  }
  return { install: packages.length ? `npm install ${packages.join(' ')}` : '', imports: imports.join('\n') }
}

const em = (v: number) => `${Math.round(v * 1000) / 1000}em`

/** Tailwind v4: @theme met --font-display (kop), --font-sans (tekst) en de schaal als --text-* met interlinie en spatiëring */
export function tailwindExport({ zetsel, kop, tekst, scale }: ExportInput): string {
  const lines = ['@import "tailwindcss";', '', '@theme {', `  --font-display: ${exportStack(kop)};`, `  --font-sans: ${exportStack(tekst)};`]
  if (tekst.kind === 'schreef') lines.push(`  --font-serif: ${exportStack(tekst)};`)
  lines.push('')
  for (const name of ORDER) {
    const level = scale.levels[name]
    const t = TAILWIND[name]
    lines.push(`  --text-${t}: ${level.size};`, `  --text-${t}--line-height: ${level.leading};`)
    if (level.tracking !== 0) lines.push(`  --text-${t}--letter-spacing: ${em(level.tracking)};`)
  }
  lines.push('', `  --tracking-caps: ${em(scale.capsTracking)};`, `  --container-regel: ${scale.measure.rem}rem;`, '}')
  const body = [`  font-weight: ${zetsel.tekstStijl.weight};`]
  if (zetsel.tabelcijfers) body.push('  font-variant-numeric: tabular-nums;')
  if (Object.keys(zetsel.tekstStijl.axes).length) body.push(`  font-variation-settings: ${variationSettings(zetsel.tekstStijl.axes)};`)
  const heading = [`  font-family: var(--font-display);`, `  font-weight: ${zetsel.kopStijl.weight};`]
  if (zetsel.kopStijl.italic) heading.push('  font-style: italic;')
  if (Object.keys(zetsel.kopStijl.axes).length) heading.push(`  font-variation-settings: ${variationSettings(zetsel.kopStijl.axes)};`)
  lines.push('', '@layer base {', '  body {', ...body.map((l) => `  ${l}`), '  }', '', '  h1, h2, h3, h4 {', ...heading.map((l) => `  ${l}`), '  }')
  if (zetsel.mooiAfbreken) lines.push('', '  p {', '    text-wrap: pretty;', '  }')
  lines.push('}')
  return lines.join('\n')
}

/** Gewone CSS: custom properties met clamp(), en regels voor body, koppen, klein en kapitalen */
export function cssExport({ zetsel, kop, tekst, scale }: ExportInput): string {
  const l = scale.levels
  const root = [`  --letter-kop: ${exportStack(kop)};`, `  --letter-tekst: ${exportStack(tekst)};`, ...ORDER.map((n) => `  --maat-${CSS_NAMES[n]}: ${l[n].size};`), `  --regel: ${scale.measure.rem}rem;`]
  const rule = (selector: string, props: (string | false)[]) => [`${selector} {`, ...props.filter(Boolean).map((p) => `  ${p}`), '}'].join('\n')
  const kopProps = (name: LevelName) =>
    [
      'font-family: var(--letter-kop);',
      `font-size: var(--maat-${CSS_NAMES[name]});`,
      `font-weight: ${zetsel.kopStijl.weight};`,
      zetsel.kopStijl.italic && 'font-style: italic;',
      `line-height: ${l[name].leading};`,
      l[name].tracking !== 0 && `letter-spacing: ${em(l[name].tracking)};`,
      Object.keys(zetsel.kopStijl.axes).length > 0 && `font-variation-settings: ${variationSettings(zetsel.kopStijl.axes)};`,
      'text-wrap: balance;',
    ] as (string | false)[]
  const align = zetsel.uitlijning === 'midden' ? 'center' : zetsel.uitlijning === 'uitvullen' ? 'justify' : 'start'
  return [
    `:root {\n${root.join('\n')}\n}`,
    rule('body', [
      'font-family: var(--letter-tekst);',
      'font-size: var(--maat-tekst);',
      `font-weight: ${zetsel.tekstStijl.weight};`,
      `line-height: ${l.tekst.leading};`,
      zetsel.tabelcijfers && 'font-variant-numeric: tabular-nums;',
      Object.keys(zetsel.tekstStijl.axes).length > 0 && `font-variation-settings: ${variationSettings(zetsel.tekstStijl.axes)};`,
    ]),
    rule('p', ['max-width: var(--regel);', `text-align: ${align};`, zetsel.uitlijning === 'uitvullen' && 'hyphens: auto;', zetsel.mooiAfbreken && 'text-wrap: pretty;']),
    rule('h1', kopProps('h1')),
    rule('h2', kopProps('h2')),
    rule('h3', kopProps('h3')),
    rule('h4', kopProps('h4')),
    rule('small, figcaption', ['font-size: var(--maat-klein);', `line-height: ${l.klein.leading};`, l.klein.tracking !== 0 && `letter-spacing: ${em(l.klein.tracking)};`]),
    rule('.kapitalen', ['text-transform: uppercase;', `letter-spacing: ${em(scale.capsTracking)};`]),
  ].join('\n\n')
}

/** Tekststijlen als design tokens (W3C-formaat), om met een plugin als Tokens Studio in Figma te zetten. Maten op 1440 breed */
export function figmaExport({ zetsel, kop, tekst, scale }: ExportInput): string {
  const token = (font: Font, role: Role, name: LevelName) => {
    const level = scale.levels[name]
    const style = styleOf(zetsel, role)
    return {
      $type: 'typography',
      $value: {
        fontFamily: font.family,
        fontWeight: style.weight,
        fontStyle: style.italic ? 'italic' : 'normal',
        fontSize: `${Math.round(level.max * 10) / 10}px`,
        lineHeight: level.leading,
        letterSpacing: em(level.tracking),
      },
    }
  }
  const tokens = {
    kop: Object.fromEntries((['groot', 'h1', 'h2', 'h3', 'h4'] as LevelName[]).map((n) => [n, token(kop, 'kop', n)])),
    tekst: Object.fromEntries((['tekst', 'klein'] as LevelName[]).map((n) => [n, token(tekst, 'tekst', n)])),
  }
  return JSON.stringify({ letterzetterij: tokens }, null, 2)
}
