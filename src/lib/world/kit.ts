// Een kleine modelleerkit van geschilderde vormen, gestapeld en samengevoegd tot de drukkerij.
// Alles is eenvoudig en per hoekpunt ingekleurd, zodat één materiaal het allemaal kan schilderen
import { BoxGeometry, BufferAttribute, Color, CylinderGeometry, Euler, ExtrudeGeometry, IcosahedronGeometry, LatheGeometry, Matrix4, Path, Quaternion, Shape, TorusGeometry, Vector2, Vector3, type BufferGeometry } from 'three'
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { valueNoise } from './noise.ts'

/** Eén kleur, of een overloop van de voet van een stuk naar de top */
export type Tint = string | readonly [bottom: string, top: string]

/** Waar een stuk komt te staan als het af is */
export interface Place {
  at?: readonly [number, number, number]
  rot?: readonly [number, number, number]
  scale?: number | readonly [number, number, number]
}

/**
 * Een benoemd stuk in het gebakken model.
 * paint is cel shaded, glow is zijn eigen licht (de lamp), light is een lichtbundel door het raam,
 * paper krijgt in de app een eigen shader (het vel uit de pers en de vellen aan de lijn)
 */
export interface Part {
  name: string
  geometry: BufferGeometry
  material: 'paint' | 'glow' | 'light' | 'paper'
  pivot?: readonly [number, number, number]
}

const scratch = { color: new Color(), bottom: new Color(), top: new Color(), matrix: new Matrix4(), position: new Vector3(), quaternion: new Quaternion(), scale: new Vector3(), euler: new Euler() }

function fleck(x: number, y: number, z: number): number {
  return valueNoise(x * 3.1 + y * 1.7, z * 3.1 - y * 2.3)
}

/** Schildert een stuk. Penseelspikkels zorgen dat vlakke kleur niet gedrukt lijkt */
export function tint<G extends BufferGeometry>(geometry: G, colour: Tint, flecks = 0.07): G {
  const position = geometry.getAttribute('position')
  const colors = new Float32Array(position.count * 3)
  geometry.computeBoundingBox()
  const box = geometry.boundingBox!
  const height = Math.max(1e-6, box.max.y - box.min.y)
  const washed = typeof colour !== 'string'
  if (washed) {
    scratch.bottom.set(colour[0])
    scratch.top.set(colour[1])
  } else {
    scratch.bottom.set(colour)
  }
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    scratch.color.copy(scratch.bottom)
    if (washed) scratch.color.lerp(scratch.top, (y - box.min.y) / height)
    scratch.color.multiplyScalar(1 + (fleck(x * 4, y * 4, z * 4) - 0.5) * 2 * flecks)
    colors[i * 3] = scratch.color.r
    colors[i * 3 + 1] = scratch.color.g
    colors[i * 3 + 2] = scratch.color.b
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3))
  return geometry
}

/** Kleur in banden over de hoogte, van onder naar boven. Elke band loopt tot zijn `to` (een hoogte) */
export function bands<G extends BufferGeometry>(geometry: G, stops: readonly { to: number; colour: string }[], flecks = 0.05): G {
  const position = geometry.getAttribute('position')
  const colors = new Float32Array(position.count * 3)
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    const stop = stops.find((s) => y <= s.to + 1e-5) ?? stops[stops.length - 1]
    scratch.color.set(stop.colour).multiplyScalar(1 + (fleck(x * 9, y * 9, z * 9) - 0.5) * 2 * flecks)
    colors[i * 3] = scratch.color.r
    colors[i * 3 + 1] = scratch.color.g
    colors[i * 3 + 2] = scratch.color.b
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3))
  return geometry
}

/** Verplaatst, draait en schaalt een stuk naar zijn plek */
export function put<G extends BufferGeometry>(geometry: G, place?: Place): G {
  if (!place) return geometry
  const { at = [0, 0, 0], rot = [0, 0, 0], scale = 1 } = place
  scratch.position.set(at[0], at[1], at[2])
  scratch.quaternion.setFromEuler(scratch.euler.set(rot[0], rot[1], rot[2]))
  if (typeof scale === 'number') scratch.scale.setScalar(scale)
  else scratch.scale.set(scale[0], scale[1], scale[2])
  geometry.applyMatrix4(scratch.matrix.compose(scratch.position, scratch.quaternion, scratch.scale))
  return geometry
}

const finish = (geometry: BufferGeometry, colour: Tint, place?: Place) => {
  geometry.deleteAttribute('uv')
  return put(tint(geometry, colour), place)
}

/** Een blok dat op zijn voet staat */
export function box(width: number, height: number, depth: number, colour: Tint, place?: Place): BufferGeometry {
  return finish(new BoxGeometry(width, height, depth).translate(0, height / 2, 0), colour, place)
}

/** Een blok gegeven door zijn hoeken in plaats van zijn midden, voor muren en planken */
export function slab(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, colour: Tint): BufferGeometry {
  return box(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), colour, { at: [(x0 + x1) / 2, Math.min(y0, y1), (z0 + z1) / 2] })
}

/** Een platte omtrek met dikte, getekend in x en y, met eventueel een gat */
export function extrude(outline: readonly (readonly [number, number])[], depth: number, colour: Tint, place?: Place, hole?: readonly [number, number, number]): BufferGeometry {
  const shape = new Shape(outline.map(([x, y]) => new Vector2(x, y)))
  if (hole) shape.holes.push(new Path().absarc(hole[0], hole[1], hole[2], 0, Math.PI * 2, true))
  const raw = new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 16 }).translate(0, 0, -depth / 2)
  raw.deleteAttribute('uv')
  return put(tint(mergeVertices(raw, 1e-4), colour), place)
}

/** Een paal of toren op zijn voet. Drie zijden maakt een prisma */
export function cyl(topRadius: number, bottomRadius: number, height: number, colour: Tint, place?: Place, sides = 10): BufferGeometry {
  return finish(new CylinderGeometry(topRadius, bottomRadius, height, sides, 1).translate(0, height / 2, 0), colour, place)
}

/** Een kegel op zijn voet */
export function cone(radius: number, height: number, colour: Tint, place?: Place, sides = 10): BufferGeometry {
  return cyl(0.001, radius, height, colour, place, sides)
}

/** Een ring rechtop en gecentreerd, voor hengsels en randen */
export function ring(radius: number, thickness: number, colour: Tint, place?: Place, sides = 16, tube = 6): BufferGeometry {
  return finish(new TorusGeometry(radius, thickness, tube, sides), colour, place)
}

/**
 * Gedraaid op een draaibank: een profiel van [straal, hoogte] rond de y-as.
 * Voor potjes, flesjes, de ketel, de vijzel en kurken
 */
export function lathe(profile: readonly (readonly [number, number])[], colour: Tint, place?: Place, segments = 16): BufferGeometry {
  const geometry = new LatheGeometry(
    profile.map(([r, y]) => new Vector2(Math.max(0.0005, r), y)),
    segments,
  )
  geometry.deleteAttribute('uv')
  // De naad van de draaibank sluiten, anders breekt de belijning daar
  const merged = mergeVertices(geometry, 1e-5)
  merged.computeVertexNormals()
  return put(tint(merged, colour), place)
}

/** Een hobbelige bol, gecentreerd, voor inktvlekken, de lamp en het hoofd van de drukker */
export function blob(radius: number, colour: Tint, place?: Place, lumpiness = 0.2, seed = 0, detail = 2): BufferGeometry {
  const sphere = new IcosahedronGeometry(1, detail)
  sphere.deleteAttribute('uv')
  sphere.deleteAttribute('normal')
  const geometry = mergeVertices(sphere, 1e-4)
  const position = geometry.getAttribute('position')
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    const swell = 1 + (valueNoise(x * 1.6 + seed * 7.3, z * 1.6 + y * 1.9 + seed * 3.1) - 0.5) * 2 * lumpiness
    position.setXYZ(i, x * radius * swell, y * radius * swell, z * radius * swell)
  }
  geometry.computeVertexNormals()
  return put(tint(geometry, colour), place)
}

/** Duwt elke hoek een beetje opzij, zodat hout met de hand gezaagd lijkt */
export function roughen<G extends BufferGeometry>(geometry: G, amount: number, seed = 0): G {
  const position = geometry.getAttribute('position')
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    const kx = Math.round(x * 50) + seed * 13
    const ky = Math.round(y * 50)
    const kz = Math.round(z * 50)
    position.setXYZ(
      i,
      x + (valueNoise(kx * 0.731 + ky * 0.37, kz * 0.913) - 0.5) * 2 * amount,
      y + (valueNoise(ky * 0.577 + kz * 0.21, kx * 0.811 + 5) - 0.5) * 2 * amount,
      z + (valueNoise(kz * 0.659 + kx * 0.43, ky * 0.727 + 9) - 0.5) * 2 * amount,
    )
  }
  return geometry
}

/** Voegt stukken samen tot één mesh */
export function join(pieces: readonly BufferGeometry[]): BufferGeometry {
  // Alles moet geïndexeerd zijn om samen te gaan
  const indexed = pieces.map((p) => (p.getIndex() ? p : mergeVertices(p, 1e-5)))
  const merged = mergeGeometries(indexed as BufferGeometry[], false)
  if (!merged) throw new Error('de stukken passen niet samen')
  for (const piece of pieces) piece.dispose()
  return merged
}

/** Een benoemd stuk, opnieuw gecentreerd op het punt waar het om draait of aan hangt */
export function part(name: string, pieces: readonly BufferGeometry[], material: Part['material'] = 'paint', pivot?: readonly [number, number, number]): Part {
  const geometry = join(pieces)
  if (pivot) geometry.translate(-pivot[0], -pivot[1], -pivot[2])
  return { name, geometry, material, pivot }
}

const UP = new Vector3(0, 1, 0)
const ONE = new Vector3(1, 1, 1)

/** Een taps toelopend stuk van het ene punt naar het andere, voor stelen, takken en poten */
export function limb(from: readonly [number, number, number], to: readonly [number, number, number], fromRadius: number, toRadius: number, colour: Tint, sides = 8): BufferGeometry {
  const direction = new Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2])
  const length = direction.length()
  const geometry = new CylinderGeometry(toRadius, fromRadius, length, sides, 1).translate(0, length / 2, 0)
  geometry.deleteAttribute('uv')
  tint(geometry, colour)
  scratch.quaternion.setFromUnitVectors(UP, direction.normalize())
  geometry.applyMatrix4(scratch.matrix.compose(scratch.position.set(from[0], from[1], from[2]), scratch.quaternion, ONE))
  return geometry
}
