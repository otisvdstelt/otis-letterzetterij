import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findForeign, isMagazijn } from './netwerk'

describe('de netwerktest', () => {
  it('vindt een Google-adres', () => {
    expect(findForeign([{ path: 'assets/index-abc.js', text: 'url(https://fonts.gstatic.com/s/inter.woff2)' }])).toHaveLength(1)
    expect(findForeign([{ path: 'index.html', text: '<link href="https://fonts.googleapis.com/css2?family=Inter">' }])).toHaveLength(1)
  })

  it('vindt jsDelivr buiten het magazijn, en laat het in het magazijn staan', () => {
    const text = 'fetch("https://cdn.jsdelivr.net/fontsource/fonts/inter@5.3.0/latin-400-normal.woff2")'
    expect(findForeign([{ path: 'assets/index-abc.js', text }])).toHaveLength(1)
    expect(findForeign([{ path: 'assets/magazijn-abc.js', text }])).toHaveLength(0)
  })

  it('laat Google ook in het magazijn niet toe', () => {
    expect(findForeign([{ path: 'assets/magazijn-abc.js', text: 'https://fonts.gstatic.com/x' }])).toHaveLength(1)
  })

  it('vindt jsDelivr als woord niet erg, alleen als adres', () => {
    expect(findForeign([{ path: 'assets/index-abc.js', text: 'Dit haalt letters op bij jsDelivr. Doorgaan?' }])).toHaveLength(0)
  })

  it('kent het magazijn aan zijn naam', () => {
    expect(isMagazijn('assets/magazijn-B1x2.js')).toBe(true)
    expect(isMagazijn('assets/index-B1x2.js')).toBe(false)
  })

  it('vindt niets in de bronnen en in public/, buiten het magazijn', () => {
    const root = new URL('..', import.meta.url).pathname
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const path = join(dir, name)
        return statSync(path).isDirectory() ? walk(path) : [path]
      })
    const files = [...walk(join(root, 'src')), ...walk(join(root, 'public', 'data')), join(root, 'index.html')]
      .filter((p) => /\.(ts|tsx|css|html|json)$/.test(p) && !p.endsWith('.test.ts'))
      .map((p) => ({ path: relative(root, p).replace(/^src\/lib\//, ''), text: readFileSync(p, 'utf8') }))
    expect(findForeign(files)).toEqual([])
  })
})
