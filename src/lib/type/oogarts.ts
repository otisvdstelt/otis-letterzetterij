// De oogarts: "deze of deze?". Je kiest steeds tussen twee letters, zonder hun naam te kennen,
// en een stapel van zestien zakt in zes tot acht rondes naar één. Geen letterkennis nodig.
// Elke ronde legt de twee letters naast elkaar die het meest verschillen; wat op de verliezer lijkt, valt ook af

export interface Oogarts {
  /** Wat er nog op de stapel ligt */
  stapel: string[]
  /** De twee die nu naast elkaar liggen */
  paar: [string, string] | null
  ronde: number
}

export type Afstand = (a: string, b: string) => number

/** Zoveel mag er per ronde hooguit af (de verliezer meegeteld), zodat zestien in zes tot acht rondes één wordt */
const AF = 0.3

/** De twee die het verst uit elkaar liggen. Gelijke afstanden gaan op volgorde, zodat het voorspelbaar blijft */
function verste(stapel: readonly string[], afstand: Afstand): [string, string] | null {
  if (stapel.length < 2) return null
  let best: [string, string] = [stapel[0], stapel[1]]
  let max = -1
  for (let i = 0; i < stapel.length; i++)
    for (let j = i + 1; j < stapel.length; j++) {
      const d = afstand(stapel[i], stapel[j])
      if (d > max) {
        max = d
        best = [stapel[i], stapel[j]]
      }
    }
  return best
}

/** Begin met een stapel (de beste kandidaten voor je doel, hooguit zestien) */
export function begin(stapel: readonly string[], afstand: Afstand): Oogarts {
  const s = [...new Set(stapel)].slice(0, 16)
  return { stapel: s, paar: verste(s, afstand), ronde: 1 }
}

/**
 * Je koos `winnaar`. De verliezer gaat eraf, en ook wat dichter bij de verliezer ligt dan bij de winnaar,
 * maar nooit meer dan ongeveer een derde van de stapel per ronde. Wat het dichtst bij de verliezer ligt, gaat eerst
 */
export function kies(staat: Oogarts, winnaar: string, afstand: Afstand): Oogarts {
  if (!staat.paar || !staat.paar.includes(winnaar)) return staat
  const verliezer = staat.paar[0] === winnaar ? staat.paar[1] : staat.paar[0]
  const max = Math.max(1, Math.round(staat.stapel.length * AF))
  const kant = staat.stapel
    .filter((id) => id !== winnaar && id !== verliezer && afstand(id, verliezer) < afstand(id, winnaar))
    .sort((a, b) => afstand(a, verliezer) - afstand(b, verliezer) || a.localeCompare(b))
    .slice(0, max - 1)
  const weg = new Set([verliezer, ...kant])
  const stapel = staat.stapel.filter((id) => !weg.has(id))
  return { stapel, paar: verste(stapel, afstand), ronde: staat.ronde + 1 }
}

/** Klaar als er één over is */
export const klaar = (staat: Oogarts) => (staat.stapel.length === 1 ? staat.stapel[0] : null)
