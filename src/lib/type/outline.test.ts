import { describe, expect, it } from 'vitest'
import { boxOf, firstRunInColumn, firstRunInRow, flatten, overlap, rasterize, toSvgPath, type PathCommand } from './outline'

/** Een vierkant met de klok mee, of tegen de klok in */
const square = (x: number, y: number, size: number, reverse = false): PathCommand[] => {
  const points = [
    [x, y],
    [x + size, y],
    [x + size, y + size],
    [x, y + size],
  ]
  if (reverse) points.reverse()
  return [{ command: 'moveTo', args: points[0] }, ...points.slice(1).map((args) => ({ command: 'lineTo' as const, args })), { command: 'closePath', args: [] }]
}

const frame = { minX: 0, minY: 0, maxX: 10, maxY: 10 }

describe('platslaan', () => {
  it('maakt van een vierkant één veelhoek met vier hoeken', () => {
    const polygons = flatten(square(0, 0, 10))
    expect(polygons).toHaveLength(1)
    expect(polygons[0]).toHaveLength(4)
  })

  it('volgt een bocht in kleine stukjes en eindigt op het eindpunt', () => {
    const polygons = flatten([{ command: 'moveTo', args: [0, 0] }, { command: 'quadraticCurveTo', args: [5, 10, 10, 0] }, { command: 'closePath', args: [] }], 4)
    expect(polygons[0]).toHaveLength(5)
    expect(polygons[0].at(-1)).toEqual([10, 0])
    expect(boxOf(polygons).maxY).toBeCloseTo(5)
  })
})

describe('inkleuren', () => {
  it('vult een vierkant helemaal', () => {
    const raster = rasterize(flatten(square(0, 0, 10)), frame, 10, 10)
    expect(raster.cells.every((c) => c === 1)).toBe(true)
  })

  it('laat het gat in een o open (tegengestelde richting)', () => {
    const ring = rasterize(flatten([...square(0, 0, 10), ...square(3, 3, 4, true)]), frame, 10, 10)
    expect(ring.cells[5 * 10 + 5]).toBe(0)
    expect(ring.cells[0]).toBe(1)
    expect(firstRunInRow(ring, 5)).toBe(3)
    expect(firstRunInColumn(ring, 5)).toBe(3)
  })

  it('zet de bovenkant van het font bovenaan het raster', () => {
    const top = rasterize(flatten(square(0, 5, 10)), frame, 10, 10)
    expect(top.cells[0]).toBe(1)
    expect(top.cells[9 * 10]).toBe(0)
  })
})

describe('vergelijken', () => {
  it('geeft 1 voor twee gelijke vormen en minder voor een andere', () => {
    const a = rasterize(flatten(square(0, 0, 10)), frame, 10, 10)
    const b = rasterize(flatten(square(0, 0, 5)), frame, 10, 10)
    expect(overlap(a, a)).toBe(1)
    expect(overlap(a, b)).toBeCloseTo(0.25)
  })
})

describe('svg-pad', () => {
  it('draait y om en rondt af', () => {
    expect(toSvgPath([{ command: 'moveTo', args: [1.4, 2.6] }, { command: 'lineTo', args: [3, 4] }, { command: 'closePath', args: [] }])).toBe('M1 -3L3 -4Z')
  })
})
