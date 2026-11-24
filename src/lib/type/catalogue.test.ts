import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DRAWERS, hasWeight, nearestWeight, parseCatalogue, weightRange } from './catalogue'

const catalogue = parseCatalogue(JSON.parse(readFileSync(new URL('../../../public/data/fonts.json', import.meta.url), 'utf8')))
const byId = (id: string) => catalogue.fonts.find((f) => f.id === id)!

describe('de kast', () => {
  it('heeft ongeveer 150 families, in elk laatje iets', () => {
    expect(catalogue.fonts.length).toBeGreaterThanOrEqual(130)
    expect(catalogue.fonts.length).toBeLessThanOrEqual(170)
    for (const drawer of DRAWERS) expect(catalogue.fonts.some((f) => f.drawer === drawer)).toBe(true)
  })

  it('heeft van elke letter een gewoon latin-bestand, lokaal, en een licentie', () => {
    for (const font of catalogue.fonts) {
      expect(font.faces.some((f) => f.style === 'normal' && f.subset === 'latin'), font.id).toBe(true)
      expect(font.faces.every((f) => f.file.startsWith(`fonts/${font.id}/`)), font.id).toBe(true)
      expect(font.license, font.id).toMatch(/\w/)
    }
  })

  it('heeft van elke letter een woff voor de pers', () => {
    for (const font of catalogue.fonts) expect(Object.keys(font.woff).length, font.id).toBeGreaterThan(0)
  })

  it('heeft zinnige metrieken', () => {
    for (const { id, metrics } of catalogue.fonts) {
      expect(metrics.xHeight, id).toBeGreaterThan(0.15)
      expect(metrics.xHeight, id).toBeLessThan(1)
      expect(metrics.avgWidth, id).toBeGreaterThan(0.25)
      expect(metrics.contrast, id).toBeGreaterThanOrEqual(1)
    }
  })

  it('meet een Bodoni met meer contrast dan een Inter', () => {
    expect(byId('bodoni-moda').metrics.contrast).toBeGreaterThan(3 * byId('inter').metrics.contrast)
  })

  it('weet dat Inter een I en een l heeft die op elkaar lijken, en Atkinson niet', () => {
    expect(byId('inter').coverage.distinctIl1).toBe(false)
    expect(byId('atkinson-hyperlegible-next').coverage.distinctIl1).toBe(true)
  })
})

describe('gewichten', () => {
  const variable = { weights: [100, 900], axes: { wght: { min: 100, default: 400, max: 900 } } }
  const fixed = { weights: [400, 700], axes: null }

  it('neemt bij een variabel font precies wat je vraagt, binnen de as', () => {
    expect(nearestWeight(variable, 550)).toBe(550)
    expect(nearestWeight(variable, 1000)).toBe(900)
    expect(hasWeight(variable, 550)).toBe(true)
  })

  it('neemt bij een statisch font het dichtstbijzijnde gewicht', () => {
    expect(nearestWeight(fixed, 600)).toBe(700)
    expect(nearestWeight(fixed, 300)).toBe(400)
    expect(hasWeight(fixed, 600)).toBe(false)
    expect(weightRange(fixed)).toEqual([400, 700])
  })

  it('struikelt niet over rommel', () => {
    expect(() => parseCatalogue({ fonts: [] })).toThrow('kast')
    expect(() => parseCatalogue(null)).toThrow('kast')
    expect(parseCatalogue({ fonts: [{ id: 'x' }, catalogue.fonts[0]] }).fonts).toHaveLength(1)
  })
})
