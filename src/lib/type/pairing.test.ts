import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseCatalogue } from './catalogue'
import { GOAL_SPECS, GOALS } from './goals'
import { distance, ENOUGH, parsePairings, rankPairs, scorePair, suggest, surprise } from './pairing'

const catalogue = parseCatalogue(JSON.parse(readFileSync(new URL('../../../public/data/fonts.json', import.meta.url), 'utf8')))
const pairings = parsePairings(JSON.parse(readFileSync(new URL('../../content/pairings.json', import.meta.url), 'utf8')))
const font = (id: string) => {
  const found = catalogue.fonts.find((f) => f.id === id)
  if (!found) throw new Error(`geen ${id} in de kast`)
  return found
}
const notes = (kop: string, tekst: string, goal = 'website' as const) => scorePair(font(kop), font(tekst), goal).results.map((r) => r.note)

describe('koppelregels: bekende goede paren', () => {
  it('schreef met schreefloos telt mee', () => {
    expect(notes('playfair-display', 'source-sans-3')).not.toContain('schreef-schreefloos')
    expect(notes('libre-baskerville', 'inter')).toContain('schreef-schreefloos')
    expect(notes('manrope', 'source-serif-4')).toContain('schreef-schreefloos')
  })

  it('dezelfde familie met genoeg gewichten is veilig', () => {
    expect(notes('inter', 'inter')).toContain('familie-veilig')
    expect(notes('eb-garamond', 'eb-garamond', 'boek' as never)).toContain('familie-veilig')
  })

  it('een familie met één gewicht is dun als paar', () => {
    expect(notes('young-serif', 'young-serif')).toContain('familie-dun')
  })

  it('zet de paren uit het zetboek boven een willekeurig paar', () => {
    const good = scorePair(font('fraunces'), font('inter'), 'website').total
    const meh = scorePair(font('inter'), font('montserrat'), 'website').total
    expect(good).toBeGreaterThan(meh)
  })
})

describe('koppelregels: bekende slechte paren', () => {
  it('geen twee display-letters', () => {
    const s = scorePair(font('monoton'), font('lobster'), 'affiche')
    expect(s.blocked).toBe(true)
    expect(s.results.map((r) => r.note)).toContain('twee-display')
  })

  it('geen display, handschrift of mono als broodtekst', () => {
    expect(scorePair(font('inter'), font('bebas-neue'), 'website').results.map((r) => r.note)).toContain('tekst-display')
    expect(scorePair(font('inter'), font('caveat'), 'website').results.map((r) => r.note)).toContain('tekst-handschrift')
    expect(scorePair(font('inter'), font('jetbrains-mono'), 'website').results.map((r) => r.note)).toContain('tekst-mono')
    expect(scorePair(font('inter'), font('caveat'), 'website').blocked).toBe(true)
  })

  it('twee schreefloze die te veel op elkaar lijken', () => {
    expect(distance(font('inter'), font('montserrat'))).toBeLessThan(ENOUGH)
    expect(notes('inter', 'montserrat')).toContain('te-gelijk')
  })

  it('een groot verschil in x-hoogte valt op', () => {
    expect(notes('eb-garamond', 'inter')).toContain('x-anders')
  })

  it('een boek zonder cursief in de broodtekst kan niet', () => {
    const s = scorePair(font('playfair-display'), font('domine'), 'boek')
    expect(s.blocked).toBe(true)
    expect(s.results.map((r) => r.note)).toContain('geen-cursief')
  })

  it('een app wil tekens die je niet verwart', () => {
    expect(scorePair(font('inter'), font('inter'), 'app').total).toBeLessThan(scorePair(font('atkinson-hyperlegible-next'), font('atkinson-hyperlegible-next'), 'app').total)
  })
})

describe('het voorstel van de drukker', () => {
  it('geeft per doel drie paren, en geen enkel paar breekt een harde regel', () => {
    for (const goal of GOALS) {
      for (const moods of [[], ['warm'], ['technisch', 'speels']] as const) {
        const list = suggest(catalogue.fonts, pairings, { goal, moods: [...moods] })
        expect(list, goal).toHaveLength(3)
        for (const s of list) {
          const score = scorePair(font(s.kop), font(s.tekst), goal)
          expect(score.blocked, `${goal}: ${s.kop}/${s.tekst}`).toBe(false)
          expect(['schreef', 'schreefloos']).toContain(font(s.tekst).kind)
          if (GOAL_SPECS[goal].needsItalic) expect(font(s.tekst).italic).toBe(true)
        }
      }
    }
  })

  it('geeft drie verschillende koppen en drie verschillende teksten', () => {
    const list = suggest(catalogue.fonts, pairings, { goal: 'website' })
    expect(new Set(list.map((s) => s.kop)).size).toBe(3)
    expect(new Set(list.map((s) => s.tekst)).size).toBe(3)
  })

  it('zoekt bij een geklemde Inter drie koppen, elk met een reden', () => {
    const list = suggest(catalogue.fonts, pairings, { goal: 'website', clamp: { role: 'tekst', id: 'inter' } })
    expect(list).toHaveLength(3)
    expect(list.every((s) => s.tekst === 'inter')).toBe(true)
    expect(new Set(list.map((s) => s.kop)).size).toBe(3)
    for (const s of list) expect(s.reason.kind === 'zetboek' ? s.reason.waarom.length : s.reason.notes.length).toBeGreaterThan(0)
  })

  it('zoekt bij een geklemde kop een tekst', () => {
    const list = suggest(catalogue.fonts, pairings, { goal: 'affiche', clamp: { role: 'kop', id: 'abril-fatface' } })
    expect(list.every((s) => s.kop === 'abril-fatface')).toBe(true)
  })

  it('laat de stemming ordenen', () => {
    const warm = suggest(catalogue.fonts, pairings, { goal: 'website', moods: ['warm'] })
    for (const s of warm) expect([...font(s.kop).moods, ...font(s.tekst).moods]).toContain('warm')
  })

  it('geeft voor hetzelfde zetsel altijd hetzelfde voorstel', () => {
    const a = suggest(catalogue.fonts, pairings, { goal: 'boek', moods: ['klassiek'] })
    const b = suggest(catalogue.fonts, pairings, { goal: 'boek', moods: ['klassiek'] })
    expect(a).toEqual(b)
  })

  it('verrast alleen op verzoek, en dezelfde seed geeft hetzelfde paar', () => {
    const one = surprise(catalogue.fonts, pairings, { goal: 'website' }, 1)
    expect(surprise(catalogue.fonts, pairings, { goal: 'website' }, 1)).toEqual(one)
    const many = new Set(Array.from({ length: 12 }, (_, i) => surprise(catalogue.fonts, pairings, { goal: 'website' }, i)?.kop))
    expect(many.size).toBeGreaterThan(3)
  })

  it('houdt rekening met een extra eis', () => {
    const list = rankPairs(catalogue.fonts, pairings, { goal: 'website', where: (k) => k.kind === 'mono' })
    expect(list.length).toBeGreaterThan(0)
    expect(list.every((s) => font(s.kop).kind === 'mono')).toBe(true)
  })

  it('kent elk paar uit het zetboek, en geen enkel breekt een harde regel voor zijn eigen doel', () => {
    expect(pairings.length).toBeGreaterThanOrEqual(35)
    for (const p of pairings) for (const goal of p.doel) expect(scorePair(font(p.kop), font(p.tekst), goal).blocked, `${p.kop}/${p.tekst} voor ${goal}`).toBe(false)
  })
})
