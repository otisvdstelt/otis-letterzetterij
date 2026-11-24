// De ene bron van de waarheid. Het papieren vel en de drukkerij in 3D zijn twee weergaven van hetzelfde zetsel.
// Ze lezen hieruit en sturen intenties terug: pick, clamp, set, pull, hang. Zelf houden ze niks vast.
// Wat er gebeurt, zet de store als zin in `news`, voor de aria-live-regio

import { useSyncExternalStore } from 'react'
import pairingsData from '../content/pairings.json'
import { opmerking, oplossing, strings } from '../content/strings'
import { hintSeen, keepHintSeen, keepQuiet, keepWaslijn, readQuiet, readWaslijn } from './keep'
import type { Drawer, FontEntry, Mood } from './type/catalogue'
import type { Goal, Template } from './type/goals'
import { closestFont, parsePairings, surprise as surprisePair, suggest, type Suggestion } from './type/pairing'
import { remarks as remarksOf, type Remark } from './type/printer'
import { buildScale, type Scale } from './type/scale'
import { encodeVel, type Replaced } from './type/share'
import { isOwn, normalize, startZetsel, toggleMood, withFont, withGoal, withStyle, type Role, type RoleStyle, type Zetsel } from './type/zetsel'

export const pairings = parsePairings(pairingsData)

/** Hooguit zoveel vellen aan de waslijn */
export const WASLIJN_MAX = 6
const PAST = 25
const RECENT = 5

export interface State {
  /** De kast, zodra hij binnen is */
  catalogue: readonly FontEntry[] | null
  /** Eigen fonts, gemeten op dit apparaat. Ze verlaten het nooit */
  own: readonly FontEntry[]
  zetsel: Zetsel
  /** Hoe het zetsel eerder was, voor ongedaan maken. Nieuwste achteraan */
  past: readonly Zetsel[]
  /** Voor welke rol de kast en de winkelhaak nu werken */
  role: Role
  /** Het vel dat net uit de pers kwam */
  printed: Zetsel | null
  /** Hoe vaak er getrokken is, voor de animatie */
  pulls: number
  /** De laatste vijf gedrukte vellen, nieuwste eerst */
  recent: readonly Zetsel[]
  waslijn: readonly Zetsel[]
  /** Of de waslijn bewaard kon worden */
  kept: boolean
  /** Welke vellen van de lijn naast elkaar liggen (indexen), of null als er niet vergeleken wordt */
  compare: readonly number[] | null
  /** Een waslijn uit een gedeelde link, om te bekijken */
  visiting: readonly Zetsel[] | null
  /** Iemand heeft dit vel voor je gezet */
  welcome: { replaced: Replaced } | null
  /** Eigen fonts uit een link die niet meegingen, per rol */
  replaced: Replaced
  news: { text: string; at: number } | null
  /** De drukker houdt zijn mond */
  quiet: boolean
  /** De hint bij de hendel is gezien */
  hinted: boolean
  /** Hoe vaak de drukker al verraste, als seed */
  surprises: number
  /** Wat het vel in de browser zag */
  sheet: { weduwe: boolean }
  /** Waar de camera in de drukkerij naar kijkt */
  view: View
  /** Een laatje dat in de drukkerij is opengetrokken, zodat de kast in de papieren laag het ook opent */
  drawer: Drawer | null
}

export type View = 'pers' | 'kast' | 'waslijn'

const browser = typeof window !== 'undefined'

let state: State = {
  catalogue: null,
  own: [],
  zetsel: startZetsel(strings.beginzin),
  past: [],
  role: 'kop',
  printed: null,
  pulls: 0,
  recent: [],
  waslijn: browser ? readWaslijn() : [],
  kept: true,
  compare: null,
  visiting: null,
  welcome: null,
  replaced: {},
  news: null,
  quiet: browser ? readQuiet() : false,
  hinted: browser ? hintSeen() : false,
  surprises: 0,
  sheet: { weduwe: false },
  view: 'pers',
  drawer: null,
}

const listeners = new Set<() => void>()
function set(next: Partial<State>) {
  state = { ...state, ...next }
  for (const listener of listeners) listener()
}

const now = () => (typeof performance === 'undefined' ? Date.now() : performance.now())
const say = (text: string) => ({ news: { text, at: now() } })

/** De kast plus de eigen fonts */
let fontsCache: { catalogue: State['catalogue']; own: State['own']; list: FontEntry[] } | null = null
export function allFonts(s: State = state): FontEntry[] {
  if (fontsCache && fontsCache.catalogue === s.catalogue && fontsCache.own === s.own) return fontsCache.list
  const list = [...(s.catalogue ?? []), ...s.own]
  fontsCache = { catalogue: s.catalogue, own: s.own, list }
  return list
}

export const fontById = (id: string, s: State = state) => allFonts(s).find((f) => f.id === id) ?? null

/** Een eigen font reist niet mee in een link: daar komt de letter uit de kast voor in de plaats die er het meest op lijkt */
export function fallbackFor(id: string): string {
  const own = fontById(id)
  const kast = state.catalogue ?? []
  if (!own || kast.length === 0) return 'source-serif-4'
  return closestFont(kast, own)?.id ?? 'source-serif-4'
}

export const codeOf = (z: Zetsel) => encodeVel(z, fallbackFor)

type Letters = { kop: FontEntry; tekst: FontEntry }
let lettersCache: { fonts: FontEntry[]; pairs: Map<string, Letters | null> } | null = null
/** De kop- en tekstletter van een zetsel, als ze er zijn. Steeds hetzelfde object voor hetzelfde paar, zodat een hook niet blijft tekenen */
export function lettersOf(z: Pick<Zetsel, 'kop' | 'tekst'>, s: State = state): Letters | null {
  const fonts = allFonts(s)
  if (!lettersCache || lettersCache.fonts !== fonts) lettersCache = { fonts, pairs: new Map() }
  const key = `${z.kop}|${z.tekst}`
  if (!lettersCache.pairs.has(key)) {
    const kop = fontById(z.kop, s)
    const tekst = fontById(z.tekst, s)
    lettersCache.pairs.set(key, kop && tekst ? { kop, tekst } : null)
  }
  return lettersCache.pairs.get(key) ?? null
}

let scaleCache: { zetsel: Zetsel; fonts: FontEntry[]; scale: Scale | null } | null = null
/** De schaal van het zetsel van nu */
export function currentScale(s: State = state): Scale | null {
  const fonts = allFonts(s)
  if (scaleCache && scaleCache.zetsel === s.zetsel && scaleCache.fonts === fonts) return scaleCache.scale
  const letters = lettersOf(s.zetsel, s)
  const scale = letters ? buildScale(s.zetsel, letters.kop, letters.tekst) : null
  scaleCache = { zetsel: s.zetsel, fonts, scale }
  return scale
}

let remarksCache: { zetsel: Zetsel; fonts: FontEntry[]; weduwe: boolean; list: Remark[] } | null = null
/** Wat de drukker nu zegt, het belangrijkste eerst */
export function currentRemarks(s: State = state): Remark[] {
  const fonts = allFonts(s)
  if (remarksCache && remarksCache.zetsel === s.zetsel && remarksCache.fonts === fonts && remarksCache.weduwe === s.sheet.weduwe) return remarksCache.list
  const list = s.catalogue ? remarksOf({ zetsel: s.zetsel, fonts, pairings, sheet: s.sheet }) : []
  remarksCache = { zetsel: s.zetsel, fonts, weduwe: s.sheet.weduwe, list }
  return list
}

let suggestCache: { key: string; fonts: FontEntry[]; list: Suggestion[] } | null = null
/** Het voorstel van de drukker: drie paren voor dit doel en deze stemming, of bij de geklemde letter */
export function currentSuggestions(s: State = state): Suggestion[] {
  const z = s.zetsel
  const fonts = allFonts(s)
  const clamp = z.klem ? { role: z.klem, id: z[z.klem] } : null
  const key = JSON.stringify([z.doel, z.stemming, clamp])
  if (suggestCache && suggestCache.key === key && suggestCache.fonts === fonts) return suggestCache.list
  const list = s.catalogue ? suggest(fonts, pairings, { goal: z.doel, moods: z.stemming, clamp }) : []
  suggestCache = { key, fonts, list }
  return list
}

/** De naam van een letter, of de id als hij er (nog) niet is */
export const familyOf = (id: string, s: State = state) => fontById(id, s)?.family ?? id

let lastKey = ''
let lastAt = -Infinity
/**
 * Een nieuw zetsel, met het oude in de geschiedenis. Een reeks van dezelfde soort wijziging kort na elkaar
 * (een schuifje dat sleept, typen) telt als één stap
 */
function commit(next: Zetsel, extra: Partial<State> = {}, coalesce?: string) {
  const zetsel = normalize(next)
  if (JSON.stringify(zetsel) === JSON.stringify(state.zetsel)) {
    if (Object.keys(extra).length) set(extra)
    return
  }
  const t = now()
  const merge = coalesce !== undefined && coalesce === lastKey && t - lastAt < 900
  lastKey = coalesce ?? ''
  lastAt = t
  const past = merge ? state.past : [...state.past, state.zetsel].slice(-PAST)
  // Een eigen font dat uit een link niet meekwam: is de rol nu een andere letter, dan klopt de melding niet meer
  const replaced: Replaced = {}
  if (state.replaced.kop && zetsel.kop === state.zetsel.kop) replaced.kop = state.replaced.kop
  if (state.replaced.tekst && zetsel.tekst === state.zetsel.tekst) replaced.tekst = state.replaced.tekst
  set({ zetsel, past, replaced, ...extra })
}

function keep(waslijn: readonly Zetsel[]) {
  return keepWaslijn(waslijn, fallbackFor)
}

const sameSheet = (a: Zetsel, b: Zetsel) => codeOf(a) === codeOf(b)

export const store = {
  get: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },

  /** Zeg iets hardop via de aria-live-regio */
  say(text: string) {
    set(say(text))
  },

  setCatalogue(catalogue: readonly FontEntry[]) {
    set({ catalogue })
  },

  /** Voor welke rol de kast en de winkelhaak werken */
  setRole(role: Role) {
    if (role !== state.role) set({ role })
  },

  /** Een letter uit de kast pakken, voor een rol */
  pick(id: string, role: Role = state.role) {
    const font = fontById(id)
    if (!font) return
    commit(withFont(state.zetsel, role, font), say(strings.nieuws.gepakt(font.family, role)))
  },

  /** Klem op een rol (die letter staat vast), of de klem eraf */
  clamp(role: Role | null) {
    const z = state.zetsel
    if (role === null) commit({ ...z, klem: null }, say(strings.nieuws.klemEraf))
    else commit({ ...z, klem: role }, say(strings.nieuws.klem(familyOf(z[role]), role)))
  },

  goal(doel: Goal) {
    if (doel === state.zetsel.doel) return
    commit(withGoal(state.zetsel, doel), say(strings.nieuws.doel(doel)))
  },

  mood(mood: Mood) {
    const zetsel = toggleMood(state.zetsel, mood)
    commit(zetsel, say(strings.nieuws.stemming(zetsel.stemming.map((m) => strings.stemmingen[m]))))
  },

  template(sjabloon: Template) {
    commit({ ...state.zetsel, sjabloon }, say(strings.nieuws.sjabloon(strings.vel.sjablonen[sjabloon])))
  },

  /** Iets aan het zetsel veranderen. Met een sleutel tellen snelle wijzigingen achter elkaar als één stap */
  update(patch: Partial<Zetsel>, key?: string) {
    commit({ ...state.zetsel, ...patch }, {}, key)
  },

  style(role: Role, patch: Partial<RoleStyle>, key?: string) {
    commit(withStyle(state.zetsel, role, patch), {}, key)
  },

  /** Een paar uit het voorstel op het vel zetten */
  take(s: Pick<Suggestion, 'kop' | 'tekst'>) {
    const kop = fontById(s.kop)
    const tekst = fontById(s.tekst)
    if (!kop || !tekst) return
    commit(withFont(withFont(state.zetsel, 'kop', kop), 'tekst', tekst), say(strings.nieuws.voorstel(kop.family, tekst.family)))
  },

  /** Drukker, verras me. Alleen als je erom vraagt, en de teller is de seed */
  surprise() {
    const z = state.zetsel
    const seed = state.surprises + 1
    const clamp = z.klem ? { role: z.klem, id: z[z.klem] } : null
    const s = surprisePair(allFonts(), pairings, { goal: z.doel, moods: z.stemming, clamp, exclude: [{ kop: z.kop, tekst: z.tekst }] }, seed)
    if (!s) return
    const kop = fontById(s.kop)
    const tekst = fontById(s.tekst)
    if (!kop || !tekst) return
    commit(withFont(withFont(z, 'kop', kop), 'tekst', tekst), { surprises: seed, ...say(strings.nieuws.verrast(kop.family, tekst.family)) })
  },

  /** Doe wat de drukker voorstelt */
  fix(remark: Remark) {
    if (!remark.fix) return
    const label = oplossing(remark.fix.id, remark.fix.params, remark.id)
    commit(remark.fix.zetsel, say(strings.nieuws.opgelost(label)))
  },

  /** Wat de drukker zegt, als zin */
  words(remark: Remark) {
    return opmerking(remark.id, remark.params, remark.variant)
  },

  /** Trek de pers over: het vel komt eruit, en gaat bij de laatste vijf */
  pull() {
    const z = state.zetsel
    const recent = [z, ...state.recent.filter((r) => !sameSheet(r, z))].slice(0, RECENT)
    if (!state.hinted) keepHintSeen()
    set({ printed: z, recent, pulls: state.pulls + 1, hinted: true, view: 'pers', ...say(strings.nieuws.gedrukt) })
  },

  /** Hang een vel aan de waslijn: het net gedrukte, of wat er nu staat */
  hang(z: Zetsel = state.printed ?? state.zetsel) {
    if (state.waslijn.some((w) => sameSheet(w, z))) {
      set(say(strings.nieuws.alAanLijn))
      return
    }
    if (state.waslijn.length >= WASLIJN_MAX) {
      set(say(strings.waslijn.vol))
      return
    }
    const waslijn = [...state.waslijn, z]
    const kept = keep(waslijn)
    set({ waslijn, kept, view: 'waslijn', ...say(strings.nieuws.opgehangen(waslijn.length) + (kept ? '' : ` ${strings.waslijn.nietBewaard}`)) })
  },

  unhang(index: number) {
    if (!state.waslijn[index]) return
    const waslijn = state.waslijn.filter((_, i) => i !== index)
    const compare = state.compare ? state.compare.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)) : null
    set({ waslijn, compare, kept: keep(waslijn), ...say(strings.nieuws.afgehaald) })
  },

  /** Een vel van de lijn of van eerder terug in de pers */
  continueFrom(z: Zetsel) {
    commit(z, { compare: null, ...say(strings.nieuws.terug) })
  },

  /** Vergelijken aan of uit, en een vel erbij of eraf (hooguit drie) */
  comparing(on: boolean) {
    set({ compare: on ? (state.compare ?? []) : null })
  },
  toggleCompare(index: number) {
    const current = state.compare ?? []
    const compare = current.includes(index) ? current.filter((i) => i !== index) : [...current, index].slice(-3)
    set({ compare })
  },

  undo() {
    const previous = state.past.at(-1)
    if (!previous) {
      set(say(strings.nieuws.nietsOngedaan))
      return
    }
    lastKey = ''
    set({ zetsel: previous, past: state.past.slice(0, -1), ...say(strings.nieuws.ongedaan) })
  },

  /** Een vel uit een gedeelde link. Het welkom komt erbij, en wat niet meeging staat erbij */
  openShared(zetsel: Zetsel, replaced: Replaced) {
    set({ zetsel, replaced, welcome: { replaced }, past: [], ...say(strings.nieuws.welkom) })
  },

  /** Weg met het welkom: hang het op, of zet verder */
  welcomeDone(hang: boolean) {
    if (hang) this.hang(state.zetsel)
    set({ welcome: null })
  },

  /** Een gedeelde waslijn: eerst bekijken */
  visit(sheets: readonly Zetsel[]) {
    set({ visiting: sheets })
  },

  leaveVisit(take: boolean) {
    if (!state.visiting) return
    if (!take) {
      set({ visiting: null })
      return
    }
    const waslijn = [...state.waslijn]
    for (const z of state.visiting) if (waslijn.length < WASLIJN_MAX && !waslijn.some((w) => sameSheet(w, z))) waslijn.push(z)
    set({ waslijn, visiting: null, kept: keep(waslijn), ...say(strings.nieuws.overgenomen(waslijn.length)) })
  },

  setQuiet(quiet: boolean) {
    keepQuiet(quiet)
    set({ quiet, ...say(strings.nieuws.drukkerStil(quiet)) })
  },

  /** Wat het vel in de browser zag, voor de drukker */
  setSheet(sheet: State['sheet']) {
    if (sheet.weduwe !== state.sheet.weduwe) set({ sheet })
  },

  /** Kijk ergens anders in de drukkerij */
  look(view: View) {
    if (view !== state.view) set({ view })
  },

  /** Trek een laatje open, in 3D of in de kast; null schuift het weer dicht */
  openDrawer(drawer: Drawer | null) {
    if (drawer !== state.drawer) set({ drawer, ...(drawer ? { view: 'kast' as const } : {}) })
  },

  /**
   * Een eigen font op de werkbank: het komt in de rol die je nu zet, met een klem erop, want het is jouw letter.
   * Het bestand zelf blijft op dit apparaat
   */
  addOwn(font: FontEntry) {
    const role = state.role
    const own = [...state.own.filter((f) => f.id !== font.id), font]
    set({ own })
    commit({ ...withFont(state.zetsel, role, font), klem: role }, say(strings.nieuws.eigen(font.family, role)))
  },

  /** Zeg wat voor letter een eigen font is, als de drukker het verkeerd raadde */
  ownKind(id: string, kind: FontEntry['kind']) {
    const own = state.own.map((f) => (f.id === id ? { ...f, kind, drawer: kind } : f))
    const font = own.find((f) => f.id === id)
    if (!font) return
    set({ own, ...say(strings.nieuws.soort(font.family, strings.eigen.soorten[kind])) })
  },

  /** Inkt en papier uit een flesje van de Kleurenalchemist */
  inkFrom(flesje: { inkt: string; papier: string; tweedeInkt: string | null; naam: string }) {
    commit({ ...state.zetsel, inkt: flesje.inkt, papier: flesje.papier, tweedeInkt: flesje.tweedeInkt }, say(strings.nieuws.flesje(flesje.naam)))
  },
}

/** Lees een stukje van de staat. De selector moet iets teruggeven dat stabiel is zolang het niet verandert */
export function useLetters<T>(select: (s: State) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => select(state),
    () => select(state),
  )
}

export { isOwn }
