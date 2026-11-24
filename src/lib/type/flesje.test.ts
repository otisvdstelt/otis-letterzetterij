import { describe, expect, it } from 'vitest'
import { fromBase64Url, toBase64Url, Writer } from './bytes'
import { codeFromLink, decodeFlesje, decodePlank, inkAndPaper, readPasted } from './flesje'

// Bevroren uit de Kleurenalchemist (share.test.ts), zoals hij op 23 november 2026 gedeeld werd
const MOS_NA_REGEN = 'AQXv9NoAtuPIAQwmAAKmZi4DTXgaBAxNb3MgbmEgcmVnZW7WEwYF0yKz5AMAA21vcwAFa29wZXIACGNvbnRyYXN0'

describe('een flesje uit de Kleurenalchemist', () => {
  it('geeft de goede inkt en het goede papier', () => {
    const flesje = decodeFlesje(MOS_NA_REGEN)!
    expect(flesje.name).toBe('Mos na regen')
    expect(inkAndPaper(flesje)).toEqual({ inkt: '#0c2600', papier: '#eff4da', tweedeInkt: '#a6662e', naam: 'Mos na regen' })
  })

  it('leest een hele link van welke site ook', () => {
    const pasted = readPasted(`https://otis-kleurenalchemist.vercel.app/fles/${MOS_NA_REGEN}`)
    expect(pasted.ok && pasted.flesjes[0].inkt).toBe('#0c2600')
    expect(codeFromLink('  https://x.example/plank/AQ-_x/?a=1 ')).toEqual({ kind: 'plank', code: 'AQ-_x' })
    expect(codeFromLink('gewoon wat tekst')).toBeNull()
  })

  it('leest een plank als een rij flesjes', () => {
    const w = new Writer()
    w.byte(1)
    w.varint(2)
    w.raw(fromBase64Url(MOS_NA_REGEN))
    w.raw(fromBase64Url(MOS_NA_REGEN))
    const plank = toBase64Url(w.done())
    expect(decodePlank(plank)).toHaveLength(2)
    const pasted = readPasted(`/plank/${plank}`)
    expect(pasted.ok && pasted.flesjes).toHaveLength(2)
  })

  it('geeft null bij een versie die we niet kennen, en zegt dat netjes', () => {
    const bytes = fromBase64Url(MOS_NA_REGEN)
    bytes[0] = 2
    expect(decodeFlesje(toBase64Url(bytes))).toBeNull()
    expect(readPasted(`/fles/${toBase64Url(bytes)}`)).toEqual({ ok: false, reason: 'onleesbaar' })
  })

  it('struikelt niet over rommel', () => {
    expect(decodeFlesje('')).toBeNull()
    expect(decodeFlesje('!!!')).toBeNull()
    expect(decodeFlesje(MOS_NA_REGEN.slice(0, 30))).toBeNull()
    expect(decodePlank('zzzz')).toBeNull()
    expect(readPasted('hallo')).toEqual({ ok: false, reason: 'geen-link' })
  })

  it('valt terug op zwart op wit als een rol ontbreekt', () => {
    expect(inkAndPaper({ name: 'x', swatches: [{ hex: '#123456', role: 'accent' }] })).toEqual({ inkt: '#000000', papier: '#ffffff', tweedeInkt: '#123456', naam: 'x' })
  })
})
