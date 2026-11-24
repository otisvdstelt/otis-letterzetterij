// Toeval dat zich laat herhalen. Hetzelfde zetsel geeft altijd hetzelfde vel

/** Een 32-bit hash van een tekst (FNV-1a, met een laatste mix zodat korte teksten goed spreiden) */
export function hash(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return h >>> 0
}

/** Een generator die getallen van 0 tot 1 geeft, altijd dezelfde reeks voor dezelfde seed (mulberry32) */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Random = () => number

/** Een geheel getal van 0 tot en met max - 1 */
export const pick = (random: Random, max: number) => Math.min(max - 1, Math.floor(random() * max))

/** Kies een index met kans naar gewicht */
export function weighted(random: Random, weights: readonly number[]): number {
  const total = weights.reduce((sum, w) => sum + Math.max(0, w), 0)
  if (total <= 0) return pick(random, weights.length)
  let r = random() * total
  for (let i = 0; i < weights.length; i++) {
    r -= Math.max(0, weights[i])
    if (r < 0) return i
  }
  return weights.length - 1
}

/** Een getal tussen a en b */
export const between = (random: Random, a: number, b: number) => a + (b - a) * random()
