// Koppelen: past deze kop bij deze tekst, voor dit doel?
// Elke regel is een pure functie met een score (-1 tot 1) en een code voor de uitleg. De woorden staan in strings.ts.
// Een harde regel sluit een paar helemaal uit. Het doel weegt de regels; de stemming ordent, maar verplicht niets

import type { FontEntry, Kind, Mood } from './catalogue.ts'
import { GOAL_SPECS, GOALS, type Goal } from './goals.ts'
import { hash, mulberry32, pick } from './prng.ts'
import type { Role } from './zetsel.ts'

export type RuleId = 'soort' | 'zelfde-soort' | 'twee-display' | 'broodtekst' | 'x-hoogte' | 'familie' | 'karakter' | 'leesbaar' | 'display' | 'cursief' | 'handschrift' | 'interface' | 'gewichten' | 'haarlijnen'

/** De uitleg bij een regel, als code. strings.ts maakt er een zin van */
export type Note =
  | 'schreef-schreefloos'
  | 'twee-schreef'
  | 'genoeg-verschil'
  | 'te-gelijk'
  | 'twee-display'
  | 'tekst-display'
  | 'tekst-handschrift'
  | 'tekst-mono'
  | 'x-gelijk'
  | 'x-anders'
  | 'familie-veilig'
  | 'familie-dun'
  | 'valt-op'
  | 'leest-rustig'
  | 'leest-zwaar'
  | 'display-past'
  | 'display-liever-niet'
  | 'geen-cursief'
  | 'handschrift-te-veel'
  | 'interface-goed'
  | 'interface-tekens'
  | 'interface-cijfers'
  | 'interface-schreef'
  | 'veel-gewichten'
  | 'weinig-gewichten'
  | 'haarlijnen'

export interface RuleResult {
  rule: RuleId
  score: number
  note: Note
  /** Sluit het paar uit, wat de rest ook zegt */
  hard?: boolean
}

type Font = Pick<FontEntry, 'id' | 'family' | 'kind' | 'moods' | 'italic' | 'weights' | 'axes' | 'metrics' | 'coverage'>

const BODY_KINDS: readonly Kind[] = ['schreef', 'schreefloos']
const clamp1 = (v: number) => Math.max(-1, Math.min(1, v))

/** Hoeveel gewichten een familie heeft. Een variabel font telt als negen */
export const weightCount = (f: Pick<Font, 'weights' | 'axes'>) => (f.axes?.wght ? 9 : f.weights.length)

/**
 * Hoe ver twee letters in karakter uit elkaar liggen. 0 is dezelfde, vanaf ongeveer 0,6 zie je het verschil.
 * Contrast in de stokken telt het zwaarst, dan de breedte, dan de x-hoogte, en een andere soort telt als één
 */
export function distance(a: Font, b: Font): number {
  const contrast = Math.abs(Math.log(a.metrics.contrast / b.metrics.contrast)) / Math.log(2.5)
  const width = Math.abs(a.metrics.avgWidth - b.metrics.avgWidth) / 0.08
  const x = Math.abs(a.metrics.xHeight - b.metrics.xHeight) / 0.1
  return contrast + 0.6 * width + 0.3 * x + (a.kind === b.kind ? 0 : 1)
}

/** Verschil in x-hoogte, als deel van die van de tekst */
export const xHeightGap = (kop: Font, tekst: Font) => Math.abs(kop.metrics.xHeight - tekst.metrics.xHeight) / tekst.metrics.xHeight

/** Genoeg verschil om twee letters van dezelfde soort naast elkaar te zetten */
export const ENOUGH = 0.6
/** Een verschil in x-hoogte boven 15% valt op */
export const X_GAP = 0.15

export const rules: Record<RuleId, (kop: Font, tekst: Font, goal: Goal) => RuleResult | null> = {
  /** Schreef met schreefloos: het oudste recept dat werkt */
  soort: (kop, tekst) => {
    const kinds = new Set([kop.kind, tekst.kind])
    return kinds.has('schreef') && kinds.has('schreefloos') ? { rule: 'soort', score: 1, note: 'schreef-schreefloos' } : null
  },

  /** Twee keer dezelfde soort alleen met genoeg verschil */
  'zelfde-soort': (kop, tekst) => {
    if (kop.id === tekst.id || kop.kind !== tekst.kind || kop.kind === 'display') return null
    if (distance(kop, tekst) >= ENOUGH) return { rule: 'zelfde-soort', score: 0.2, note: kop.kind === 'schreef' ? 'twee-schreef' : 'genoeg-verschil' }
    return { rule: 'zelfde-soort', score: -1, note: 'te-gelijk' }
  },

  /** Geen twee display-letters */
  'twee-display': (kop, tekst) => (kop.kind === 'display' && tekst.kind === 'display' ? { rule: 'twee-display', score: -1, note: 'twee-display', hard: true } : null),

  /** Geen display-, handschrift- of mono-letter als broodtekst */
  broodtekst: (_kop, tekst) => {
    if (BODY_KINDS.includes(tekst.kind)) return null
    const note: Note = tekst.kind === 'display' ? 'tekst-display' : tekst.kind === 'handschrift' ? 'tekst-handschrift' : 'tekst-mono'
    return { rule: 'broodtekst', score: -1, note, hard: true }
  },

  /** De x-hoogtes liggen dicht bij elkaar. Vloeiend: hoe dichter, hoe beter, en boven 15% gaat het hard omlaag */
  'x-hoogte': (kop, tekst) => {
    if (kop.id === tekst.id) return null
    const gap = xHeightGap(kop, tekst)
    const score = gap <= X_GAP ? 0.5 - gap * 5 : -Math.min(1, 0.25 + (gap - X_GAP) * 4)
    return { rule: 'x-hoogte', score, note: gap <= 0.08 ? 'x-gelijk' : 'x-anders' }
  },

  /** Dezelfde familie in verschillende gewichten is veilig, als er gewichten genoeg zijn */
  familie: (kop, tekst) => {
    if (kop.id !== tekst.id) return null
    return weightCount(kop) >= 3 ? { rule: 'familie', score: 0.8, note: 'familie-veilig' } : { rule: 'familie', score: -0.6, note: 'familie-dun' }
  },

  /** Een groot verschil in karakter valt op, en dat is precies wat een kop moet doen */
  karakter: (kop, tekst) => {
    if (kop.id === tekst.id || kop.kind === tekst.kind) return null
    const d = distance(kop, tekst)
    return d > 1.2 ? { rule: 'karakter', score: 0.4 * Math.min(1, (d - 1.2) / 1.2), note: 'valt-op' } : null
  },

  /** Leest de broodtekst lang? Een gewone x-hoogte, niet te veel contrast, niet te smal */
  leesbaar: (_kop, tekst, goal) => {
    if (!BODY_KINDS.includes(tekst.kind)) return null
    const { xHeight, contrast, avgWidth } = tekst.metrics
    // Vloeiend, zodat twee goede letters niet precies even goed zijn: een x-hoogte rond de helft van de em,
    // weinig contrast in de stokken, en een gewone breedte
    let score = 0
    score += 0.4 - Math.abs(xHeight - 0.5) * 6
    score += 0.3 - Math.max(0, contrast - 1.8) * 0.3
    score += 0.2 - Math.abs(avgWidth - 0.46) * 4
    if (goal === 'boek' && tekst.kind === 'schreef') score += 0.3
    score = clamp1(score)
    return { rule: 'leesbaar', score, note: score >= 0 ? 'leest-rustig' : 'leest-zwaar' }
  },

  /** Een display-letter als kop: goed op een affiche, liever niet in een app */
  display: (kop, _tekst, goal) => {
    if (kop.kind !== 'display') return null
    const score = GOAL_SPECS[goal].display
    return { rule: 'display', score, note: score > 0 ? 'display-past' : 'display-liever-niet' }
  },

  /** Een boek heeft een cursief nodig, anders verzint de browser er een */
  cursief: (_kop, tekst, goal) => (GOAL_SPECS[goal].needsItalic && !tekst.italic ? { rule: 'cursief', score: -1, note: 'geen-cursief', hard: true } : null),

  /** Een handschrift als kop van een boek, een app of een dia: daar leest niemand verder dan bladzijde twee */
  handschrift: (kop, _tekst, goal) => (kop.kind === 'handschrift' && (goal === 'boek' || goal === 'app' || goal === 'presentatie') ? { rule: 'handschrift', score: -1, note: 'handschrift-te-veel' } : null),

  /** Een app: schreefloos, tekens die je niet verwart, en tabelcijfers */
  interface: (kop, tekst, goal) => {
    if (!GOAL_SPECS[goal].interface) return null
    let score = 0
    score += tekst.kind === 'schreefloos' ? 0.4 : -0.8
    score += tekst.coverage.distinctIl1 ? 0.3 : -0.7
    score += tekst.coverage.distinctO0 ? 0.1 : -0.3
    score += tekst.coverage.tabular ? 0.2 : -0.3
    if (kop.kind === 'schreef' && kop.id !== tekst.id) score -= 0.2
    score = clamp1(score)
    const note: Note = score >= 0.5 ? 'interface-goed' : tekst.kind !== 'schreefloos' ? 'interface-schreef' : !tekst.coverage.distinctIl1 || !tekst.coverage.distinctO0 ? 'interface-tekens' : 'interface-cijfers'
    return { rule: 'interface', score, note }
  },

  /** Een huisstijl wil families met veel gewichten */
  gewichten: (kop, tekst, goal) => {
    if (!GOAL_SPECS[goal].manyWeights) return null
    const n = (weightCount(kop) + weightCount(tekst)) / 2
    const score = clamp1((n - 4) / 4)
    return { rule: 'gewichten', score, note: score >= 0 ? 'veel-gewichten' : 'weinig-gewichten' }
  },

  /** Op een beamer verdwijnen haarlijnen */
  haarlijnen: (kop, tekst, goal) => (goal === 'presentatie' && (tekst.metrics.contrast > 3 || kop.metrics.contrast > 4.5) ? { rule: 'haarlijnen', score: -0.8, note: 'haarlijnen' } : null),
}

/** Wat een regel standaard weegt. Het doel kan het per regel veranderen */
const BASE_WEIGHTS: Record<RuleId, number> = {
  soort: 0.6,
  'zelfde-soort': 0.8,
  'twee-display': 1,
  broodtekst: 1,
  'x-hoogte': 0.6,
  familie: 0.7,
  karakter: 0.5,
  leesbaar: 1,
  display: 1,
  cursief: 1,
  handschrift: 1,
  interface: 1,
  gewichten: 1,
  haarlijnen: 1,
}

export interface PairScore {
  total: number
  /** Een harde regel gebroken */
  blocked: boolean
  results: RuleResult[]
}

/** Alle regels op een paar, gewogen naar het doel */
export function scorePair(kop: Font, tekst: Font, goal: Goal): PairScore {
  const goalWeights = GOAL_SPECS[goal].weights
  const results = (Object.keys(rules) as RuleId[]).flatMap((id) => {
    const result = rules[id](kop, tekst, goal)
    return result ? [result] : []
  })
  const blocked = results.some((r) => r.hard)
  const total = results.reduce((sum, r) => sum + r.score * BASE_WEIGHTS[r.rule] * (goalWeights[r.rule] ?? 1), 0)
  return { total: blocked ? -Infinity : total, blocked, results }
}

/** Hoe goed een paar bij de gekozen stemmingen past: 0 tot 1 */
export function moodMatch(kop: Font, tekst: Font, moods: readonly Mood[]): number {
  if (moods.length === 0) return 0
  const have = new Set([...kop.moods, ...tekst.moods])
  return moods.filter((m) => have.has(m)).length / moods.length
}

/** Een paar uit het zetboek (pairings.json). De zin waarom gaat ongezien door de kern heen */
export interface Pairing {
  kop: string
  tekst: string
  doel: Goal[]
  stemming: Mood[]
  waarom: string
}

export function parsePairings(data: unknown): Pairing[] {
  if (!Array.isArray(data)) return []
  return data.filter(
    (p): p is Pairing =>
      typeof p === 'object' && p !== null && typeof p.kop === 'string' && typeof p.tekst === 'string' && Array.isArray(p.doel) && p.doel.every((g: unknown) => GOALS.includes(g as Goal)) && typeof p.waarom === 'string',
  )
}

/** Waarom de drukker dit voorstelt: een recept uit het zetboek, of de regels die het sterkst meetellen */
export type Reason = { kind: 'zetboek'; waarom: string } | { kind: 'regels'; notes: Note[] }

export interface Suggestion {
  kop: string
  tekst: string
  score: number
  reason: Reason
}

export interface SuggestOptions {
  goal: Goal
  moods?: readonly Mood[]
  /** De letter die vaststaat, en in welke rol */
  clamp?: { role: Role; id: string } | null
  /** Paren die het niet mogen worden (bijvoorbeeld wat er nu al staat) */
  exclude?: readonly { kop: string; tekst: string }[]
  /** Een extra eis aan het paar, voor een oplossing die precies één klacht moet wegnemen */
  where?: (kop: Font, tekst: Font) => boolean
  count?: number
}

const key = (kop: string, tekst: string) => `${kop}|${tekst}`

/** Alle paren die mogen, met hun score: gewogen regels, plus wat het zetboek en de stemming erbij doen */
export function rankPairs(fonts: readonly Font[], pairings: readonly Pairing[], options: SuggestOptions): Suggestion[] {
  const { goal, moods = [], clamp = null, exclude = [], where } = options
  const byId = new Map(fonts.map((f) => [f.id, f]))
  const curated = new Map(pairings.map((p) => [key(p.kop, p.tekst), p]))
  const excluded = new Set(exclude.map((p) => key(p.kop, p.tekst)))
  const bodies = fonts.filter((f) => BODY_KINDS.includes(f.kind))

  let pairs: [Font, Font][]
  if (clamp) {
    const fixed = byId.get(clamp.id)
    if (!fixed) return []
    pairs = clamp.role === 'kop' ? bodies.map((t) => [fixed, t]) : fonts.map((k) => [k, fixed])
  } else {
    pairs = fonts.flatMap((k) => bodies.map((t): [Font, Font] => [k, t]))
  }

  const out: Suggestion[] = []
  for (const [kop, tekst] of pairs) {
    if (excluded.has(key(kop.id, tekst.id))) continue
    if (where && !where(kop, tekst)) continue
    const { total, blocked, results } = scorePair(kop, tekst, goal)
    if (blocked) continue
    const book = curated.get(key(kop.id, tekst.id))
    // Het zetboek is met de hand gekozen en weegt mee; voor dit doel nog wat meer
    const bonus = book ? 0.6 + (book.doel.includes(goal) ? 0.6 : 0) : 0
    // Een paar uit het zetboek heeft zijn eigen stemming: die telt, niet wat de twee letters los van elkaar zijn
    const mood = book && book.stemming.length && moods.length ? moods.filter((m) => book.stemming.includes(m)).length / moods.length : moodMatch(kop, tekst, moods)
    const score = total + bonus + 1.2 * mood
    const reason: Reason = book
      ? { kind: 'zetboek', waarom: book.waarom }
      : {
          kind: 'regels',
          notes: results
            .filter((r) => r.score > 0)
            .sort((a, b) => b.score * BASE_WEIGHTS[b.rule] - a.score * BASE_WEIGHTS[a.rule])
            .slice(0, 2)
            .map((r) => r.note),
        }
    out.push({ kop: kop.id, tekst: tekst.id, score, reason })
  }
  // Gelijke scores altijd in dezelfde volgorde, zodat hetzelfde zetsel hetzelfde voorstel geeft
  return out.sort((a, b) => b.score - a.score || key(a.kop, a.tekst).localeCompare(key(b.kop, b.tekst)))
}

/**
 * Het voorstel van de drukker: de drie beste paren die bij het doel en de stemming passen.
 * Ze lopen uiteen: geen twee keer dezelfde kop of dezelfde tekst, behalve de letter die vaststaat
 */
export function suggest(fonts: readonly Font[], pairings: readonly Pairing[], options: SuggestOptions): Suggestion[] {
  const count = options.count ?? 3
  const ranked = rankPairs(fonts, pairings, options)
  const picked: Suggestion[] = []
  const kops = new Set<string>()
  const teksts = new Set<string>()
  const fixedRole = options.clamp?.role
  for (const s of ranked) {
    if (picked.length >= count) break
    if (fixedRole !== 'kop' && kops.has(s.kop)) continue
    if (fixedRole !== 'tekst' && teksts.has(s.tekst)) continue
    picked.push(s)
    kops.add(s.kop)
    teksts.add(s.tekst)
  }
  return picked
}

/**
 * Drukker, verras me. Alleen op verzoek: een paar uit de beste 25, gekozen met een seed.
 * Dezelfde seed geeft hetzelfde paar
 */
export function surprise(fonts: readonly Font[], pairings: readonly Pairing[], options: SuggestOptions, seed: number): Suggestion | null {
  const ranked = rankPairs(fonts, pairings, options).slice(0, 25)
  if (ranked.length === 0) return null
  return ranked[pick(mulberry32(hash(`verras-${seed}-${options.goal}`)), ranked.length)]
}

/** De letter uit deze lijst die het meest op `target` lijkt: dezelfde soort eerst, dan het kleinste verschil in karakter */
export function closestFont<T extends Font>(fonts: readonly T[], target: Font): T | null {
  let best: T | null = null
  let bestScore = Infinity
  for (const f of fonts) {
    if (f.id === target.id) continue
    const score = distance(f, target)
    if (score < bestScore || (score === bestScore && best && f.id < best.id)) {
      best = f
      bestScore = score
    }
  }
  return best
}
