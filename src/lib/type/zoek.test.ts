import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { alternatieven } from '../../content/alternatieven'
import { parseCatalogue } from './catalogue'
import { bouw, kan, lijktOp, richting, schreefvorm, voldoet, zoekAlternatief, meetBouw, mist, voldoetEerst, leesWoorden, zoekOpEigenschappen } from './zoek'
import { woorden } from '../../content/woorden'
import { BOUWLIJST } from './bouwlijst'

const catalogue = parseCatalogue(JSON.parse(readFileSync(new URL('../../../public/data/fonts.json', import.meta.url), 'utf8')))
const fonts = catalogue.fonts
const font = (id: string) => fonts.find((f) => f.id === id)!

describe('schreefvorm en bouw', () => {
  it('kent een slab, een wig en een haarlijn', () => {
    expect(schreefvorm(font('roboto-slab'))).toBe('slab')
    expect(schreefvorm(font('eb-garamond'))).toBe('wig')
    expect(schreefvorm(font('bodoni-moda'))).toBe('haarlijn')
    expect(schreefvorm(font('inter'))).toBe('geen')
  })

  it('ziet Jost als geometrisch, Fira als humanistisch en Inter als grotesk', () => {
    expect(bouw(font('jost'))).toBe('geometrisch')
    expect(bouw(font('fira-sans'))).toBe('humanistisch')
    expect(bouw(font('inter'))).toBe('grotesk')
    expect(bouw(font('eb-garamond'))).toBeNull()
  })
})

describe('eisen', () => {
  it('weet wat een letter kan', () => {
    expect(kan(font('inter'), 'grieks')).toBe(true)
    expect(kan(font('dm-sans'), 'cyrillisch')).toBe(false)
    expect(kan(font('lato'), 'turks')).toBe(false)
    expect(kan(font('inter'), 'gewichten')).toBe(true)
    expect(kan(font('young-serif'), 'gewichten')).toBe(false)
    expect(voldoet(font('inter'), ['euro', 'ij', 'cursief', 'tabelcijfers'])).toBe(true)
  })
})

describe('verder zoeken', () => {
  it('vindt bij Inter letters die er echt op lijken', () => {
    const near = lijktOp(fonts, font('inter'), 6)
    expect(near).toHaveLength(6)
    expect(near.every((f) => f.kind === 'schreefloos')).toBe(true)
  })

  it('geeft bij "groter oog" alleen letters met een hogere x, en zo veel mogelijk dezelfde soort', () => {
    const from = font('eb-garamond')
    const up = richting(fonts, from, 'groter-oog', 6)
    expect(up.length).toBeGreaterThan(0)
    expect(up.every((f) => f.metrics.xHeight >= from.metrics.xHeight + 0.02)).toBe(true)
    expect(up.filter((f) => f.kind === 'schreef').length).toBeGreaterThanOrEqual(4)
  })

  it('maakt "ronder" ronder en "smaller" smaller', () => {
    const from = font('inter')
    expect(richting(fonts, from, 'ronder').every((f) => f.metrics.roundness > from.metrics.roundness)).toBe(true)
    expect(richting(fonts, from, 'smaller').every((f) => f.metrics.avgWidth < from.metrics.avgWidth)).toBe(true)
  })
})

describe('iets als', () => {
  it('kent Helvetica, Futura en Didot', () => {
    expect(zoekAlternatief('helvetica', alternatieven)?.ids[0]).toBe('inter')
    expect(zoekAlternatief('Futura PT', alternatieven)?.ids[0]).toBe('jost')
    expect(zoekAlternatief('didot', alternatieven)?.ids[0]).toBe('bodoni-moda')
    expect(zoekAlternatief('ab', alternatieven)).toBeNull()
  })

  it('wijst alleen naar letters die in de kast staan', () => {
    for (const a of alternatieven) for (const id of a.ids) expect(fonts.some((f) => f.id === id), `${a.naam}: ${id}`).toBe(true)
  })
})

describe('de bouw naast de handgemaakte lijst', () => {
  const sans = catalogue.fonts.filter((f) => BOUWLIJST[f.id])

  it('heeft elke schreefloze uit de kast in de lijst', () => {
    const missing = catalogue.fonts.filter((f) => f.kind === 'schreefloos' && !BOUWLIJST[f.id]).map((f) => f.id)
    expect(missing).toEqual([])
  })

  it('meet zonder de lijst minstens vier op de vijf goed', () => {
    const wrong = sans.filter((f) => meetBouw(f) !== BOUWLIJST[f.id])
    expect(1 - wrong.length / sans.length, wrong.map((f) => `${f.id}: ${meetBouw(f)}`).join(', ')).toBeGreaterThanOrEqual(0.8)
  })

  it('noemt Raleway geometrisch en Libre Franklin grotesk, ook gemeten', () => {
    expect(meetBouw(font('raleway'))).toBe('geometrisch')
    expect(meetBouw(font('libre-franklin'))).toBe('grotesk')
    expect(bouw(font('raleway'))).toBe('geometrisch')
  })

  it('geeft een mono geen bouw', () => {
    expect(bouw(font('jetbrains-mono'))).toBeNull()
  })
})

describe('wat een letter mist', () => {
  it('noemt de eisen die hij niet haalt, en hoeveel gewichten hij heeft', () => {
    const abril = font('abril-fatface')
    const m = mist(abril, ['gewichten', 'euro'])
    expect(m.eisen).toContain('gewichten')
    expect(m.gewichten).toBe(1)
  })

  it('zet wat voldoet bovenaan, in zijn eigen volgorde', () => {
    const list = [font('abril-fatface'), font('inter'), font('pt-serif'), font('fraunces')]
    const sorted = voldoetEerst(list, ['gewichten'])
    expect(sorted.map((f) => f.id)).toEqual(['inter', 'fraunces', 'abril-fatface', 'pt-serif'])
  })
})

describe('zoeken met gewone woorden', () => {
  it('leest "ronde letter voor kinderen" als rond, speels en warm', () => {
    const { herkend, eigenschappen } = leesWoorden('ronde letter voor kinderen', woorden)
    expect(herkend).toEqual(['rond', 'voor kinderen'])
    expect(eigenschappen).toContainEqual({ soort: 'gevoel', gevoel: 'speels' })
    expect(eigenschappen).toContainEqual({ soort: 'maat', maat: 'rond' })
  })

  it('neemt het langste woord: modern is niet mode', () => {
    expect(leesWoorden('modern', woorden).herkend).toEqual(['modern'])
  })

  it('vindt bij rond en speels ronde, speelse letters', () => {
    const found = zoekOpEigenschappen(fonts, leesWoorden('ronde letter voor kinderen', woorden).eigenschappen, 8)
    expect(found.length).toBeGreaterThan(3)
    expect(found.slice(0, 4).filter((f) => f.moods.includes('speels') || f.moods.includes('warm')).length).toBeGreaterThanOrEqual(2)
    const rond = (list: readonly { metrics: { roundness: number } }[]) => list.reduce((t, f) => t + f.metrics.roundness, 0) / list.length
    expect(rond(found.slice(0, 4)), found.map((f) => f.id).join(' ')).toBeGreaterThan(rond(fonts.filter((f) => f.kind === 'schreefloos')))
  })

  it('vindt bij chic een letter met contrast, bij stoer een grove displayletter', () => {
    const chic = zoekOpEigenschappen(fonts, leesWoorden('chic', woorden).eigenschappen, 3)
    expect(chic.every((f) => f.metrics.contrast > 2), chic.map((f) => f.id).join(' ')).toBe(true)
    const stoer = zoekOpEigenschappen(fonts, leesWoorden('stoer', woorden).eigenschappen, 3)
    expect(stoer.every((f) => f.kind === 'display' && bouw(f) === 'grotesk'), stoer.map((f) => f.id).join(' ')).toBe(true)
  })

  it('geeft niets bij woorden die het niet kent', () => {
    expect(leesWoorden('blauwe banaan', woorden).eigenschappen).toEqual([])
    expect(zoekOpEigenschappen(fonts, [])).toEqual([])
  })
})
