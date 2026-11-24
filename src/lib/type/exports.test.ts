import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseCatalogue } from './catalogue'
import { cssExport, exportFamily, figmaExport, npmExport, selfHost, tailwindExport, type ExportInput } from './exports'
import { familyName, fontFaceCss, fontStack } from './fontface'
import { buildScale } from './scale'
import { startZetsel, withFont, withStyle, type Zetsel } from './zetsel'

const catalogue = parseCatalogue(JSON.parse(readFileSync(new URL('../../../public/data/fonts.json', import.meta.url), 'utf8')))
const font = (id: string) => catalogue.fonts.find((f) => f.id === id)!

function input(z: Zetsel): ExportInput {
  const kop = font(z.kop)
  const tekst = font(z.tekst)
  return { zetsel: z, kop, tekst, scale: buildScale(z, kop, tekst) }
}

const base = startZetsel('Het vel kwam warm uit de pers')

describe('Tailwind v4', () => {
  it('zet de letters als --font-display en --font-sans, met de Fontsource-naam', () => {
    const css = tailwindExport(input(base))
    expect(css).toContain('@theme {')
    expect(css).toContain('--font-display: "Fraunces Variable", serif;')
    expect(css).toContain('--font-sans: "Inter Variable", sans-serif;')
  })

  it('zet de hele schaal als --text-* met interlinie', () => {
    const css = tailwindExport(input(base))
    for (const t of ['sm', 'base', 'lg', 'xl', '2xl', '3xl', '5xl']) {
      expect(css).toMatch(new RegExp(`--text-${t}: clamp\\(`))
      expect(css).toContain(`--text-${t}--line-height:`)
    }
    expect(css).toContain('--tracking-caps: 0.06em;')
  })

  it('geeft een schreefletter als tekst ook --font-serif', () => {
    expect(tailwindExport(input(withFont(base, 'tekst', font('literata'))))).toContain('--font-serif: "Literata Variable", serif;')
  })

  it('zet tabelcijfers en mooi afbreken erbij als ze aan staan', () => {
    const css = tailwindExport(input({ ...base, tabelcijfers: true, mooiAfbreken: true }))
    expect(css).toContain('font-variant-numeric: tabular-nums;')
    expect(css).toContain('text-wrap: pretty;')
  })
})

describe('CSS', () => {
  it('geeft custom properties met clamp() en regels voor koppen en tekst', () => {
    const css = cssExport(input(base))
    expect(css).toMatch(/--maat-h1: clamp\(/)
    expect(css).toContain('font-family: var(--letter-kop);')
    expect(css).toContain('max-width: var(--regel);')
    expect(css).toContain('.kapitalen {')
  })

  it('zet assen als font-variation-settings', () => {
    const css = cssExport(input(withStyle(base, 'kop', { axes: { opsz: 72 } })))
    expect(css).toContain("font-variation-settings: 'opsz' 72;")
  })
})

describe('npm', () => {
  it('installeert de variabele pakketten, met de cursief voor de tekst', () => {
    const { install, imports } = npmExport(input(base))
    expect(install).toBe('npm install @fontsource-variable/fraunces @fontsource-variable/inter')
    expect(imports).toContain("import '@fontsource-variable/fraunces'")
    expect(imports).toContain("import '@fontsource-variable/inter/wght-italic.css'")
  })

  it('neemt het standard-bestand als er een as buiten wght gebruikt wordt', () => {
    const { imports } = npmExport(input(withStyle(base, 'kop', { axes: { opsz: 72 } })))
    expect(imports).toContain("import '@fontsource-variable/fraunces/standard.css'")
  })

  it('importeert bij een statische letter per gewicht, met een vet en een cursief voor de tekst', () => {
    const z = withFont(withFont(base, 'kop', font('abril-fatface')), 'tekst', font('pt-serif'))
    const { install, imports } = npmExport(input(z))
    expect(install).toBe('npm install @fontsource/abril-fatface @fontsource/pt-serif')
    expect(imports.split('\n')).toEqual(["import '@fontsource/abril-fatface/400.css'", "import '@fontsource/pt-serif/400.css'", "import '@fontsource/pt-serif/400-italic.css'", "import '@fontsource/pt-serif/700.css'", "import '@fontsource/pt-serif/700-italic.css'"])
  })

  it('noemt één pakket bij dezelfde familie in twee rollen', () => {
    const z = withFont(withFont(base, 'kop', font('inter')), 'tekst', font('inter'))
    expect(npmExport(input(z)).install).toBe('npm install @fontsource-variable/inter')
  })
})

describe('Figma', () => {
  it('geeft tekststijlen als design tokens', () => {
    const json = JSON.parse(figmaExport(input(base)))
    expect(json.letterzetterij.kop.h1.$type).toBe('typography')
    expect(json.letterzetterij.kop.h1.$value.fontFamily).toBe('Fraunces')
    expect(json.letterzetterij.tekst.tekst.$value.fontSize).toBe('17px')
  })
})

describe('@font-face', () => {
  it('laadt lokaal, met unicode-range per subset', () => {
    const css = fontFaceCss(font('inter'))
    expect(css).toContain("font-family: 'lz-inter';")
    expect(css).toContain("src: url('/fonts/inter/")
    expect(css).toContain('unicode-range: U+0000-00FF')
    expect(css).toContain('font-weight: 100 900;')
    expect(css).not.toMatch(/googleapis|gstatic|jsdelivr/)
  })

  it('geeft een eigen naam en een terugval', () => {
    expect(familyName('inter')).toBe('lz-inter')
    expect(fontStack(font('eb-garamond'))).toBe("'lz-eb-garamond', serif")
    expect(exportFamily(font('pt-serif'))).toBe('PT Serif')
  })
})

describe('zelf hosten', () => {
  it('neemt bij een variabele letter één bestand per subset, en de cursief alleen voor de tekst', () => {
    const host = selfHost({ zetsel: base, kop: font('fraunces'), tekst: font('inter') })
    const names = host.files.map((f) => f.name)
    expect(names.filter((n) => n.startsWith('fraunces-')).every((n) => n.includes('normal'))).toBe(true)
    expect(names.some((n) => n.startsWith('inter-') && n.includes('italic'))).toBe(true)
    expect(host.css).toMatch(/src: url("./fonts/inter-latin-(wght|standard)-normal.woff2") format("woff2");/)
    expect(host.bytes).toBeGreaterThan(50_000)
  })

  it('neemt bij een statische letter alleen de gewichten die je gebruikt', () => {
    const z = withFont(withFont(base, 'kop', font('abril-fatface')), 'tekst', font('pt-serif'))
    const names = selfHost({ zetsel: z, kop: font('abril-fatface'), tekst: font('pt-serif') }).files.map((f) => f.name)
    expect(names.some((n) => n.includes('pt-serif-latin-400-normal'))).toBe(true)
    expect(names.some((n) => n.includes('pt-serif-latin-700-normal'))).toBe(true)
    expect(names.every((n) => !n.includes('-300-'))).toBe(true)
  })

  it('zet elk bestand één keer, ook als kop en tekst dezelfde letter zijn', () => {
    const z = withFont(withFont(base, 'kop', font('inter')), 'tekst', font('inter'))
    const files = selfHost({ zetsel: z, kop: font('inter'), tekst: font('inter') }).files
    expect(new Set(files.map((f) => f.name)).size).toBe(files.length)
  })
})
