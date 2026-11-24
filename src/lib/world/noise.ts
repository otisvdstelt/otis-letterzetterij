// Ruis die overal hetzelfde antwoordt. De modelleerkit, de bakker en de shaders-op-de-CPU lezen hieruit

function hash2(ix: number, iz: number): number {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

/** Zachte value noise van 0 tot 1 */
export function valueNoise(x: number, z: number): number {
  const ix = Math.floor(x)
  const iz = Math.floor(z)
  const fx = x - ix
  const fz = z - iz
  const ux = fx * fx * (3 - 2 * fx)
  const uz = fz * fz * (3 - 2 * fz)
  const a = hash2(ix, iz)
  const b = hash2(ix + 1, iz)
  const c = hash2(ix, iz + 1)
  const d = hash2(ix + 1, iz + 1)
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz
}

/** Een paar octaven value noise, nog steeds 0 tot 1 */
export function fbm(x: number, z: number, octaves = 4): number {
  let sum = 0
  let amplitude = 0.5
  let total = 0
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x, z) * amplitude
    total += amplitude
    x = x * 2.03 + 17.1
    z = z * 2.03 + 9.7
    amplitude *= 0.5
  }
  return sum / total
}

/** Een reeks met een seed, zodat elke keer bakken de rommel op dezelfde plek legt */
export function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
