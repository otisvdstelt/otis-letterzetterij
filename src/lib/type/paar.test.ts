import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseCatalogue } from './catalogue'
import { waaromPaar } from './paar'

const fonts = parseCatalogue(JSON.parse(readFileSync(new URL('../../../public/data/fonts.json', import.meta.url), 'utf8'))).fonts
const font = (id: string) => fonts.find((f) => f.id === id)!

describe('waarom dit paar', () => {
  it('ziet dat Libre Baskerville en Inter verschillen in schreven, en iets delen', () => {
    const u = waaromPaar(font('libre-baskerville'), font('inter'))
    expect(u.verschil).toContain('schreef')
    expect(u.gemeen.length + u.verschil.length).toBeGreaterThan(1)
  })

  it('noemt bij één familie de familie, en het gewicht als verschil', () => {
    expect(waaromPaar(font('inter'), font('inter'))).toMatchObject({ gemeen: ['familie'], verschil: ['gewicht'] })
  })

  it('geeft voor elk paar uit het zetboek iets gemeen of iets anders', () => {
    const pairings = JSON.parse(readFileSync(new URL('../../content/pairings.json', import.meta.url), 'utf8')) as { kop: string; tekst: string }[]
    for (const p of pairings) {
      const u = waaromPaar(font(p.kop), font(p.tekst))
      expect(u.gemeen.length + u.verschil.length, `${p.kop}/${p.tekst}`).toBeGreaterThan(0)
    }
  })
})
