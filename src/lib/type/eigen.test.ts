import { readFileSync } from 'node:fs'
import { create, registerFormat } from 'fontkit/core'
import { WOFF2Font } from 'fontkit/formats/WOFF2Font'
import { describe, expect, it } from 'vitest'
import { guessKind, isMonospaced, ownEntry, ownId, type FontInfo } from './eigen'

registerFormat(WOFF2Font)
const local = (path: string) => create(new Uint8Array(readFileSync(new URL(`../../../public/${path}`, import.meta.url)))) as FontInfo
const catalogue = JSON.parse(readFileSync(new URL('../../../public/data/fonts.json', import.meta.url), 'utf8')) as { fonts: { id: string; faces: { file: string; style: string; subset: string }[] }[] }
const file = (id: string) => catalogue.fonts.find((f) => f.id === id)!.faces.find((f) => f.style === 'normal' && f.subset === 'latin')!.file

describe('een eigen font', () => {
  it('herkent een monoletter', () => {
    expect(isMonospaced(local(file('jetbrains-mono')))).toBe(true)
    expect(isMonospaced(local(file('inter')))).toBe(false)
  })

  it('raadt de soort uit het contrast', () => {
    expect(guessKind(local(file('inter')), 1.18)).toBe('schreefloos')
    expect(guessKind(local(file('eb-garamond')), 2.9)).toBe('schreef')
    expect(guessKind(local(file('jetbrains-mono')), 1.1)).toBe('mono')
  })

  it('wordt een letter in de kast, zonder bestanden, gemeten zoals de rest', () => {
    const entry = ownEntry(local(file('lora')), 'MijnLetter.woff2')
    expect(entry.id).toBe('eigen:Lora')
    expect(entry.faces).toEqual([])
    expect(entry.kind).toBe('schreef')
    expect(entry.metrics.xHeight).toBeGreaterThan(0.4)
    expect(entry.axes?.wght).toBeTruthy()
  })

  it('maakt een nette id van een rare naam', () => {
    expect(ownId('Mijn/Merk:letter')).toBe('eigen:MijnMerkletter')
    expect(ownId('***')).toBe('eigen:letter')
  })
})
