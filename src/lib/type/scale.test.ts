import { describe, expect, it } from 'vitest'
import { GOAL_SPECS, GOALS } from './goals'
import { buildScale, charsPerLine, fluid, headingLeading, LEVELS, opticalBoost, sizeAt, VIEWPORT } from './scale'
import { startZetsel, withGoal } from './zetsel'

const metrics = (xHeight: number, avgWidth = 0.46) => ({ metrics: { xHeight, capHeight: 0.7, ascent: 1, descent: 0.25, lineGap: 0, avgWidth, contrast: 1.5 } })
const plain = metrics(0.5)

/** Wat de clamp() in de browser zou geven op deze breedte */
function evaluate(clamp: string, vw: number): number {
  const m = clamp.match(/^clamp\(([\d.]+)rem, (-?[\d.]+)rem \+ (-?[\d.]+)vw, ([\d.]+)rem\)$/)
  if (!m) return Number.parseFloat(clamp) * 16
  const [, lo, intercept, slope, hi] = m.map(Number)
  return Math.min(hi * 16, Math.max(lo * 16, intercept * 16 + (slope * vw) / 100))
}

describe('de schaal', () => {
  it('geeft per doel de goede verhouding tussen de stappen', () => {
    for (const goal of GOALS) {
      const scale = buildScale(withGoal(startZetsel('x'), goal), plain, plain)
      expect(scale.ratio).toBe(GOAL_SPECS[goal].ratio)
      expect(scale.levels.h4.max / scale.levels.tekst.max).toBeCloseTo(GOAL_SPECS[goal].ratio, 2)
      expect(scale.levels.h1.max / scale.levels.h2.max).toBeCloseTo(GOAL_SPECS[goal].ratio, 2)
    }
  })

  it('een affiche heeft een verhouding van 1,5 of meer, een website rond 1,25 en een dia rond 1,333', () => {
    expect(GOAL_SPECS.affiche.ratio).toBeGreaterThanOrEqual(1.5)
    expect(GOAL_SPECS.website.ratio).toBe(1.25)
    expect(GOAL_SPECS.presentatie.ratio).toBeCloseTo(1.333, 3)
    expect(GOAL_SPECS.boek.ratio).toBe(1.2)
  })

  it('zet de broodtekst van een website op minstens 16px, ook op een telefoon', () => {
    const scale = buildScale(startZetsel('x'), plain, plain)
    expect(scale.levels.tekst.min).toBeGreaterThanOrEqual(16)
    expect(scale.levels.tekst.max).toBeGreaterThanOrEqual(16)
  })

  it('geeft monotone clamp()-waarden: elk niveau groter dan het vorige, op elke breedte', () => {
    for (const goal of GOALS) {
      const scale = buildScale(withGoal(startZetsel('x'), goal), metrics(0.42), plain)
      for (const vw of [320, VIEWPORT.min, 700, 1024, VIEWPORT.max, 1920]) {
        const sizes = LEVELS.map((name) => evaluate(scale.levels[name].size, vw))
        for (let i = 1; i < sizes.length; i++) expect(sizes[i], `${goal} op ${vw}: ${LEVELS[i]}`).toBeGreaterThan(sizes[i - 1])
      }
      // En elk niveau groeit mee met het scherm, nooit andersom
      for (const name of LEVELS) expect(evaluate(scale.levels[name].size, VIEWPORT.max)).toBeGreaterThanOrEqual(evaluate(scale.levels[name].size, VIEWPORT.min))
    }
  })

  it('rekent de clamp() goed uit aan beide kanten', () => {
    const css = fluid(16, 20)
    expect(evaluate(css, VIEWPORT.min)).toBeCloseTo(16, 2)
    expect(evaluate(css, VIEWPORT.max)).toBeCloseTo(20, 2)
    expect(evaluate(css, 2000)).toBeCloseTo(20, 2)
    expect(fluid(18, 18)).toBe('1.125rem')
    expect(sizeAt({ min: 16, max: 20 }, (VIEWPORT.min + VIEWPORT.max) / 2)).toBeCloseTo(18, 5)
  })

  it('zet koppen strakker en broodtekst ruimer', () => {
    const scale = buildScale(startZetsel('x'), plain, plain)
    for (const name of ['h4', 'h3', 'h2', 'h1', 'groot'] as const) {
      expect(scale.levels[name].leading).toBeGreaterThanOrEqual(1.1)
      expect(scale.levels[name].leading).toBeLessThanOrEqual(1.25)
    }
    expect(scale.levels.tekst.leading).toBeGreaterThanOrEqual(1.5)
    expect(scale.levels.tekst.leading).toBeLessThanOrEqual(1.7)
    expect(headingLeading(80)).toBe(1.1)
    expect(headingLeading(20)).toBe(1.25)
  })

  it('geeft een kop met een kleine x-hoogte een iets grotere maat, hooguit 12%', () => {
    expect(opticalBoost(metrics(0.4), metrics(0.5))).toBe(1.12)
    expect(opticalBoost(metrics(0.48), metrics(0.5))).toBeCloseTo(1.042, 3)
    expect(opticalBoost(metrics(0.55), metrics(0.5))).toBe(1)
    const small = buildScale(startZetsel('x'), metrics(0.45), plain)
    const same = buildScale(startZetsel('x'), plain, plain)
    expect(small.levels.h1.max).toBeGreaterThan(same.levels.h1.max)
    expect(small.levels.tekst.max).toBe(same.levels.tekst.max)
  })

  it('geeft kapitalen extra spatiëring en grote koppen iets minder', () => {
    const scale = buildScale(startZetsel('x'), plain, plain)
    expect(scale.capsTracking).toBeGreaterThan(0)
    expect(scale.levels.groot.tracking).toBeLessThan(0)
    expect(scale.levels.klein.tracking).toBeGreaterThanOrEqual(0)
  })

  it('maakt de regel zo breed als het aantal tekens vraagt', () => {
    const z = startZetsel('x')
    const scale = buildScale(z, plain, plain)
    expect(scale.measure.chars).toBe(z.regel)
    expect(charsPerLine(scale.measure.rem * 16, plain, z.maat)).toBeCloseTo(z.regel, 0)
    // Een bredere letter krijgt een bredere regel voor hetzelfde aantal tekens
    expect(buildScale(z, plain, metrics(0.5, 0.55)).measure.rem).toBeGreaterThan(scale.measure.rem)
  })
})
