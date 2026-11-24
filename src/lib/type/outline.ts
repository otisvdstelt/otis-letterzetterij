// Een letter als vorm: de omtrek platgeslagen tot veelhoeken, en daarna ingekleurd op een raster.
// Zo kunnen we zonder canvas meten hoe dik een stok is en of twee tekens op elkaar lijken.
// Werkt in Node (het bouwscript) en in de browser (een eigen fontbestand)

export type Point = readonly [number, number]
export type Polygon = Point[]

/** Een padopdracht zoals fontkit hem geeft */
export interface PathCommand {
  command: 'moveTo' | 'lineTo' | 'quadraticCurveTo' | 'bezierCurveTo' | 'closePath'
  args: number[]
}

/** Maak van een pad met bochten een lijst gesloten veelhoeken. Elke bocht wordt `steps` rechte stukjes */
export function flatten(commands: readonly PathCommand[], steps = 8): Polygon[] {
  const polygons: Polygon[] = []
  let current: Point[] = []
  let at: Point = [0, 0]
  const close = () => {
    if (current.length > 2) polygons.push(current)
    current = []
  }
  for (const { command, args } of commands) {
    if (command === 'moveTo') {
      close()
      at = [args[0], args[1]]
      current.push(at)
    } else if (command === 'lineTo') {
      at = [args[0], args[1]]
      current.push(at)
    } else if (command === 'quadraticCurveTo') {
      const [cx, cy, x, y] = args
      for (let i = 1; i <= steps; i++) {
        const t = i / steps
        const u = 1 - t
        current.push([u * u * at[0] + 2 * u * t * cx + t * t * x, u * u * at[1] + 2 * u * t * cy + t * t * y])
      }
      at = [x, y]
    } else if (command === 'bezierCurveTo') {
      const [c1x, c1y, c2x, c2y, x, y] = args
      for (let i = 1; i <= steps; i++) {
        const t = i / steps
        const u = 1 - t
        current.push([
          u * u * u * at[0] + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x,
          u * u * u * at[1] + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y,
        ])
      }
      at = [x, y]
    } else {
      close()
    }
  }
  close()
  return polygons
}

export interface Box {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/** De kleinste doos om alle punten heen. Leeg (een spatie) geeft een doos van niks op nul */
export function boxOf(polygons: readonly Polygon[]): Box {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const polygon of polygons) {
    for (const [x, y] of polygon) {
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }
  return Number.isFinite(minX) ? { minX, minY, maxX, maxY } : { minX: 0, minY: 0, maxX: 0, maxY: 0 }
}

/** Een raster van inkt (1) en papier (0), rij voor rij van boven naar beneden */
export interface Raster {
  width: number
  height: number
  cells: Uint8Array
}

/**
 * Kleur de veelhoeken in op een raster dat `frame` bedekt, met de nonzero-regel zoals fonts dat doen.
 * Elke cel wordt in het midden gepeild. y loopt in het font omhoog, in het raster omlaag
 */
export function rasterize(polygons: readonly Polygon[], frame: Box, width: number, height: number): Raster {
  const cells = new Uint8Array(width * height)
  const sx = (frame.maxX - frame.minX) / width
  const sy = (frame.maxY - frame.minY) / height
  for (let row = 0; row < height; row++) {
    const y = frame.maxY - (row + 0.5) * sy
    // Waar de lijn de randen kruist, met de richting erbij
    const crossings: { x: number; dir: number }[] = []
    for (const polygon of polygons) {
      for (let i = 0; i < polygon.length; i++) {
        const [x0, y0] = polygon[i]
        const [x1, y1] = polygon[(i + 1) % polygon.length]
        if (y0 === y1) continue
        const up = y1 > y0
        if ((up && y >= y0 && y < y1) || (!up && y >= y1 && y < y0)) {
          crossings.push({ x: x0 + ((y - y0) / (y1 - y0)) * (x1 - x0), dir: up ? 1 : -1 })
        }
      }
    }
    if (crossings.length === 0) continue
    crossings.sort((a, b) => a.x - b.x)
    let winding = 0
    let c = 0
    for (let col = 0; col < width; col++) {
      const x = frame.minX + (col + 0.5) * sx
      while (c < crossings.length && crossings[c].x <= x) winding += crossings[c++].dir
      if (winding !== 0) cells[row * width + col] = 1
    }
  }
  return { width, height, cells }
}

/** Hoeveel twee rasters van dezelfde maat overlappen: gedeelde inkt gedeeld door alle inkt. 1 is gelijk */
export function overlap(a: Raster, b: Raster): number {
  let both = 0
  let either = 0
  for (let i = 0; i < a.cells.length; i++) {
    if (a.cells[i] && b.cells[i]) both++
    if (a.cells[i] || b.cells[i]) either++
  }
  return either === 0 ? 1 : both / either
}

/** De lengte van de eerste strook inkt langs een rij, vanaf links. 0 als er geen inkt is */
export function firstRunInRow(raster: Raster, row: number): number {
  let length = 0
  for (let col = 0; col < raster.width; col++) {
    const ink = raster.cells[row * raster.width + col]
    if (ink) length++
    else if (length > 0) break
  }
  return length
}

/** De lengte van de eerste strook inkt langs een kolom, vanaf boven. 0 als er geen inkt is */
export function firstRunInColumn(raster: Raster, col: number): number {
  let length = 0
  for (let row = 0; row < raster.height; row++) {
    const ink = raster.cells[row * raster.width + col]
    if (ink) length++
    else if (length > 0) break
  }
  return length
}

/** Een pad in SVG-taal, met y omgedraaid (fonts tellen omhoog, SVG omlaag) en afgerond op `digits` decimalen */
export function toSvgPath(commands: readonly PathCommand[], scale = 1, dx = 0, digits = 0): string {
  const f = 10 ** digits
  const r = (v: number) => Math.round(v * f) / f
  const x = (v: number) => r((v + dx) * scale)
  const y = (v: number) => r(-v * scale)
  let out = ''
  for (const { command, args } of commands) {
    if (command === 'moveTo') out += `M${x(args[0])} ${y(args[1])}`
    else if (command === 'lineTo') out += `L${x(args[0])} ${y(args[1])}`
    else if (command === 'quadraticCurveTo') out += `Q${x(args[0])} ${y(args[1])} ${x(args[2])} ${y(args[3])}`
    else if (command === 'bezierCurveTo') out += `C${x(args[0])} ${y(args[1])} ${x(args[2])} ${y(args[3])} ${x(args[4])} ${y(args[5])}`
    else out += 'Z'
  }
  return out
}
