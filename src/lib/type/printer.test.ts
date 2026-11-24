import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseCatalogue } from './catalogue'
import { contrastRatio } from './contrast'
import { parsePairings } from './pairing'
import { remarks, type Facts, type RemarkId } from './printer'
import { startZetsel, withFont, withGoal, withStyle, type Zetsel } from './zetsel'

const catalogue = parseCatalogue(JSON.parse(readFileSync(new URL('../../../public/data/fonts.json', import.meta.url), 'utf8')))
const pairings = parsePairings(JSON.parse(readFileSync(new URL('../../content/pairings.json', import.meta.url), 'utf8')))
const font = (id: string) => catalogue.fonts.find((f) => f.id === id)!

const base = startZetsel('Het vel kwam warm uit de pers')
const facts = (zetsel: Zetsel, sheet?: Facts['sheet']): Facts => ({ zetsel, fonts: catalogue.fonts, pairings, sheet })
const ids = (f: Facts) => remarks(f).map((r) => r.id)
const pair = (kop: string, tekst: string, z: Zetsel = base) => withFont(withFont(z, 'kop', font(kop)), 'tekst', font(tekst))

/** Elke opmerking met een zetsel waarin hij hoort te vallen */
const situations: Record<RemarkId, Facts> = {
  'twee-schreef': facts(pair('bodoni-moda', 'source-serif-4')),
  'te-gelijk': facts(pair('inter', 'montserrat')),
  'twee-display': facts(pair('monoton', 'lobster')),
  'tekst-display': facts(pair('inter', 'bebas-neue')),
  'tekst-handschrift': facts(pair('inter', 'caveat')),
  'tekst-mono': facts(pair('inter', 'jetbrains-mono')),
  'x-hoogte': facts(pair('eb-garamond', 'inter')),
  'familie-dun': facts(pair('young-serif', 'young-serif')),
  'regel-lang': facts({ ...base, regel: 100 }),
  'regel-kort': facts({ ...base, regel: 30 }),
  'te-klein': facts({ ...base, maat: 14 }),
  'interlinie-krap': facts({ ...base, interlinie: 1.2 }),
  'interlinie-ruim': facts({ ...base, interlinie: 2.1 }),
  weduwe: facts(base, { weduwe: true }),
  uitvullen: facts({ ...base, uitlijning: 'uitvullen' }),
  'nep-vet': facts(withStyle(pair('pt-serif', 'inter'), 'kop', { weight: 600 })),
  'nep-cursief': facts(withStyle(pair('young-serif', 'inter'), 'kop', { italic: true })),
  'geen-vet': facts(pair('inter', 'young-serif')),
  'geen-cursief': facts(pair('inter', 'domine')),
  'doel-handschrift': facts(pair('caveat', 'eb-garamond', withGoal(base, 'boek'))),
  'doel-display': facts(pair('bebas-neue', 'atkinson-hyperlegible-next', withGoal(base, 'app'))),
  'doel-tekens': facts(pair('inter', 'inter', withGoal(base, 'app'))),
  'doel-cijfers': facts(pair('atkinson-hyperlegible-next', 'atkinson-hyperlegible-next', withGoal(base, 'app'))),
  'doel-schaal': facts({ ...pair('abril-fatface', 'lato', withGoal(base, 'affiche')), ratio: 1.3 }),
  'doel-haarlijnen': facts(pair('inter', 'bodoni-moda', withGoal(base, 'presentatie'))),
  'doel-dun': facts(withStyle(pair('fraunces', 'inter', withGoal(base, 'presentatie')), 'tekst', { weight: 300 })),
  ij: facts({ ...base, zin: 'Ijsselmeer bij nacht, en weer Ijzig' }),
  'inkt-zwak': facts({ ...base, inkt: '#aaaaaa', papier: '#ffffff' }),
  'tweede-inkt-zwak': facts({ ...base, tweedeInkt: '#dddddd' }),
  'inkt-presentatie': facts({ ...pair('fira-sans', 'fira-sans', withGoal(base, 'presentatie')), inkt: '#666666', papier: '#ffffff' }),
  'lof-paar': facts(base),
  'lof-klaar': facts(base),
}

describe('de drukker', () => {
  it('heeft voor elke opmerking een situatie', () => {
    expect(Object.keys(situations).sort()).toHaveLength(32)
  })

  it('zegt bij een goed zetsel alleen iets aardigs', () => {
    const said = remarks(facts(base))
    expect(said.every((r) => r.tone === 'lof')).toBe(true)
    expect(said.map((r) => r.id)).toEqual(['lof-paar', 'lof-klaar'])
  })

  for (const [id, situation] of Object.entries(situations) as [RemarkId, Facts][]) {
    it(`zegt ${id} waar het hoort`, () => {
      expect(ids(situation)).toContain(id)
    })

    if (id.startsWith('lof')) continue
    it(`lost ${id} op met één tik`, () => {
      const remark = remarks(situation).find((r) => r.id === id)!
      expect(remark.fix, `${id} heeft een oplossing`).not.toBeNull()
      const after = facts(remark.fix!.zetsel, id === 'weduwe' ? situation.sheet : undefined)
      expect(ids(after), `${id} na ${remark.fix!.id}`).not.toContain(id)
    })
  }

  it('lost een te zwakke inkt ook op na een eerdere oplossing en na bijstellen', () => {
    const first = remarks(situations['inkt-zwak']).find((r) => r.id === 'inkt-zwak')!.fix!.zetsel
    expect(contrastRatio(first.inkt, first.papier)).toBeGreaterThanOrEqual(4.5)
    const nudged = { ...first, inkt: '#b0b0b0' }
    const again = remarks(facts(nudged)).find((r) => r.id === 'inkt-zwak')
    expect(again?.fix).toBeTruthy()
    expect(contrastRatio(again!.fix!.zetsel.inkt, nudged.papier)).toBeGreaterThanOrEqual(4.5)
  })

  it('wisselt nooit de geklemde letter', () => {
    const clamped = { ...pair('eb-garamond', 'inter'), klem: 'kop' as const }
    const fix = remarks(facts(clamped)).find((r) => r.id === 'x-hoogte')!.fix!
    expect(fix.zetsel.kop).toBe('eb-garamond')
    expect(fix.zetsel.tekst).not.toBe('inter')
  })

  it('zet een geklemde handschrift die als tekst staat om naar de kop', () => {
    const clamped = { ...pair('inter', 'caveat'), klem: 'tekst' as const }
    const fix = remarks(facts(clamped)).find((r) => r.id === 'tekst-handschrift')!.fix!
    expect(fix.id).toBe('als-kop')
    expect(fix.zetsel.kop).toBe('caveat')
    expect(fix.zetsel.klem).toBe('kop')
    expect(['schreef', 'schreefloos']).toContain(font(fix.zetsel.tekst).kind)
  })

  it('zet kritiek voor tips, en tips voor lof', () => {
    const said = remarks(facts({ ...pair('bodoni-moda', 'source-serif-4'), maat: 14 }))
    const tones = said.map((r) => r.tone)
    expect(tones.indexOf('kritiek')).toBeLessThan(tones.indexOf('tip'))
  })

  it('kiest voor hetzelfde zetsel altijd dezelfde woorden', () => {
    expect(remarks(facts(base))).toEqual(remarks(facts(base)))
  })

  it('maakt van IJsselmeer met een losse I en j een echte IJ', () => {
    const fix = remarks(situations.ij).find((r) => r.id === 'ij')!.fix!
    expect(fix.zetsel.zin).toBe('IJsselmeer bij nacht, en weer IJzig')
  })

  it('zegt niets over Ij in een woord als bij of wijn', () => {
    expect(ids(facts({ ...base, zin: 'Bij de wijn, IJmuiden' }))).not.toContain('ij')
  })
})
