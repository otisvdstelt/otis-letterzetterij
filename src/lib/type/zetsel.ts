// Het zetsel: alles wat het vel bepaalt. Hetzelfde zetsel geeft altijd hetzelfde vel.
// Puur: een zetsel erin, een zetsel eruit. De store houdt het vast, de link reist ermee

import { hasWeight, MOODS, nearestWeight, type FontEntry, type Mood } from './catalogue.ts'
import { isHex, type Hex } from './color.ts'
import { GOAL_SPECS, GOALS, TEMPLATES, templateFor, type Goal, type Template } from './goals.ts'

export type Role = 'kop' | 'tekst'
export const ROLES: readonly Role[] = ['kop', 'tekst']

export type Align = 'links' | 'midden' | 'uitvullen'
export const ALIGNS: readonly Align[] = ['links', 'midden', 'uitvullen']

/** Hoe één rol gezet wordt */
export interface RoleStyle {
  weight: number
  italic: boolean
  /** Letterspatiëring in em, bovenop wat de schaal al doet */
  tracking: number
  /** Standen van variabele assen, behalve wght (dat is weight) */
  axes: Record<string, number>
}

export interface Zetsel {
  /** Font-id's uit de kast, of eigen:<naam> voor een eigen fontbestand */
  kop: string
  tekst: string
  /** De letter die vaststaat (jouw letter). De drukker zoekt er een partner bij en wisselt hem nooit */
  klem: Role | null
  doel: Goal
  /** Eén of twee, of geen */
  stemming: Mood[]
  sjabloon: Template
  kopStijl: RoleStyle
  tekstStijl: RoleStyle
  /** Broodtekst in px op een breed scherm */
  maat: number
  /** Interlinie van de broodtekst */
  interlinie: number
  /** Schaalverhouding */
  ratio: number
  /** Regellengte in tekens */
  regel: number
  uitlijning: Align
  tabelcijfers: boolean
  /** text-wrap: pretty, tegen een woord alleen op de laatste regel */
  mooiAfbreken: boolean
  inkt: Hex
  papier: Hex
  tweedeInkt: Hex | null
  /** Je eigen zin, hooguit 280 tekens. Hij reist mee in de link */
  zin: string
  /** De rest van jouw tekst: leeg betekent dat het sjabloon zijn eigen voorbeeld zet */
  eigen: EigenTekst
}

/** Jouw tekst naast de kop: de naam van je project, een alinea, de tekst op een knop, en een menu (komma's ertussen) */
export interface EigenTekst {
  naam: string
  alinea: string
  knop: string
  menu: string
}

export const MAX_EIGEN: Record<keyof EigenTekst, number> = { naam: 40, alinea: 800, knop: 40, menu: 80 }
export const leegEigen = (): EigenTekst => ({ naam: '', alinea: '', knop: '', menu: '' })

export const MAX_ZIN = 280
export const MAX_MOODS = 2

/** Grenzen voor wat je in de winkelhaak kunt zetten */
export const LIMITS = {
  maat: [12, 40],
  interlinie: [1, 2.4],
  ratio: [1.067, 1.8],
  regel: [20, 120],
  tracking: [-0.1, 0.3],
} as const

const clampTo = (v: number, [min, max]: readonly [number, number]) => Math.min(max, Math.max(min, v))
const round = (v: number, digits: number) => Math.round(v * 10 ** digits) / 10 ** digits

export const isOwn = (id: string) => id.startsWith('eigen:')
/** Een letter uit het magazijn: wel van Fontsource, maar niet in de kast. Hij heet magazijn:<id> */
export const isArchive = (id: string) => id.startsWith('magazijn:')
/** Gaat deze letter niet mee in een link? Eigen fonts nooit, en magazijnletters ook niet: de ontvanger heeft ze niet */
export const isForeign = (id: string) => isOwn(id) || isArchive(id)
/** De Fontsource-id, ook van een magazijnletter */
export const fontsourceId = (id: string) => (isArchive(id) ? id.slice('magazijn:'.length) : id)

export const plainStyle = (weight = 400): RoleStyle => ({ weight, italic: false, tracking: 0, axes: {} })

/** Een begin. De drukker heeft het zo voor je klaargezet */
export function startZetsel(zin: string, kop = 'fraunces', tekst = 'inter'): Zetsel {
  const spec = GOAL_SPECS.website
  return {
    kop,
    tekst,
    klem: null,
    doel: 'website',
    stemming: [],
    sjabloon: spec.template,
    kopStijl: plainStyle(600),
    tekstStijl: plainStyle(400),
    maat: spec.base,
    interlinie: spec.leading,
    ratio: spec.ratio,
    regel: spec.idealMeasure,
    uitlijning: 'links',
    tabelcijfers: false,
    mooiAfbreken: false,
    inkt: '#2c2823',
    papier: '#fcfaf3',
    tweedeInkt: '#8f4526',
    zin,
    eigen: leegEigen(),
  }
}

/** Een ander doel: de schaal, de maat, de interlinie, de regel en het sjabloon van dat doel */
export function withGoal(z: Zetsel, doel: Goal): Zetsel {
  const spec = GOAL_SPECS[doel]
  return { ...z, doel, sjabloon: templateFor(doel), ratio: spec.ratio, maat: spec.base, interlinie: spec.leading, regel: spec.idealMeasure }
}

/** Een gewicht dat goed staat voor deze rol: een kop iets zwaarder, de tekst gewoon */
export function defaultWeight(font: Pick<FontEntry, 'weights' | 'axes'>, role: Role): number {
  return nearestWeight(font, role === 'kop' ? 600 : 400)
}

/** Een letter in een rol zetten. Het gewicht schuift naar wat hij heeft, cursief gaat uit als hij die niet heeft, assen beginnen op hun standaard */
export function withFont(z: Zetsel, role: Role, font: Pick<FontEntry, 'id' | 'weights' | 'axes' | 'italic'>): Zetsel {
  const key = role === 'kop' ? 'kopStijl' : 'tekstStijl'
  const old = z[key]
  const weight = hasWeight(font, old.weight) ? old.weight : defaultWeight(font, role)
  const style: RoleStyle = { weight, italic: old.italic && font.italic, tracking: old.tracking, axes: {} }
  return { ...z, [role]: font.id, [key]: style }
}

/** Zet een zin netjes: geen regeleinden, geen dubbele spaties, hooguit 280 tekens */
export function cleanZin(zin: string): string {
  return [...zin.replace(/\s+/g, ' ').trimStart()].slice(0, MAX_ZIN).join('')
}

/**
 * Hou een zetsel geldig, wat er ook in kwam (een oude link, een slider die doorschiet).
 * Getallen binnen hun grenzen, kleuren als hex, een zin van hooguit 280 tekens, hooguit twee stemmingen
 */
export function normalize(z: Zetsel): Zetsel {
  const style = (s: RoleStyle): RoleStyle => ({
    weight: clampTo(Math.round(s.weight), [1, 1000]),
    italic: Boolean(s.italic),
    tracking: round(clampTo(s.tracking, LIMITS.tracking), 3),
    axes: Object.fromEntries(Object.entries(s.axes ?? {}).filter(([tag, v]) => /^[a-zA-Z]{4}$/.test(tag) && Number.isFinite(v))),
  })
  return {
    ...z,
    klem: z.klem === 'kop' || z.klem === 'tekst' ? z.klem : null,
    doel: GOALS.includes(z.doel) ? z.doel : 'website',
    stemming: [...new Set(z.stemming.filter((m) => MOODS.includes(m)))].slice(0, MAX_MOODS),
    sjabloon: TEMPLATES.includes(z.sjabloon) ? z.sjabloon : templateFor(z.doel),
    kopStijl: style(z.kopStijl),
    tekstStijl: style(z.tekstStijl),
    maat: round(clampTo(z.maat, LIMITS.maat), 1),
    interlinie: round(clampTo(z.interlinie, LIMITS.interlinie), 2),
    ratio: round(clampTo(z.ratio, LIMITS.ratio), 3),
    regel: Math.round(clampTo(z.regel, LIMITS.regel)),
    uitlijning: ['links', 'midden', 'uitvullen'].includes(z.uitlijning) ? z.uitlijning : 'links',
    inkt: isHex(z.inkt) ? z.inkt : '#2c2823',
    papier: isHex(z.papier) ? z.papier : '#fcfaf3',
    tweedeInkt: z.tweedeInkt && isHex(z.tweedeInkt) ? z.tweedeInkt : null,
    zin: cleanZin(z.zin),
    eigen: {
      naam: clip(z.eigen?.naam ?? '', MAX_EIGEN.naam),
      // Een alinea mag regels hebben, maar geen lege regels achter elkaar
      alinea: [...(z.eigen?.alinea ?? '').replace(/\n{3,}/g, '\n\n').trimStart()].slice(0, MAX_EIGEN.alinea).join(''),
      knop: clip(z.eigen?.knop ?? '', MAX_EIGEN.knop),
      menu: clip(z.eigen?.menu ?? '', MAX_EIGEN.menu),
    },
  }
}

const clip = (text: string, max: number) => [...text.replace(/\s+/g, ' ').trimStart()].slice(0, max).join('')

/** Zet een rol om in zijn stijl, met een wijziging erin */
export function withStyle(z: Zetsel, role: Role, patch: Partial<RoleStyle>): Zetsel {
  const key = role === 'kop' ? 'kopStijl' : 'tekstStijl'
  return { ...z, [key]: { ...z[key], ...patch } }
}

/** Een stemming aan of uit. Er kunnen er hooguit twee aan staan; een derde duwt de oudste eruit */
export function toggleMood(z: Zetsel, mood: Mood): Zetsel {
  if (z.stemming.includes(mood)) return { ...z, stemming: z.stemming.filter((m) => m !== mood) }
  return { ...z, stemming: [...z.stemming, mood].slice(-MAX_MOODS) }
}

/** Zijn twee zetsels hetzelfde vel? */
export const sameZetsel = (a: Zetsel, b: Zetsel) => JSON.stringify(a) === JSON.stringify(b)
