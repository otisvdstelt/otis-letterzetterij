// De drukker. Geen AI, een regelmotor: hij kijkt naar het zetsel en zegt wat hem opvalt.
// Elke opmerking heeft een voorwaarde, een gewicht en een toon. Bij kritiek hoort altijd een oplossing in één tik,
// en die oplossing is een nieuw zetsel waarin de klacht echt weg is (dat staat in de tests).
// De woorden staan in strings.ts; hier staan alleen codes en getallen

import { hasWeight, nearestWeight, type FontEntry } from './catalogue.ts'
import { checkInk, fixInk, THRESHOLDS } from './contrast.ts'
import { GOAL_SPECS } from './goals.ts'
import { distance, ENOUGH, rankPairs, scorePair, X_GAP, xHeightGap, type Pairing } from './pairing.ts'
import { hash } from './prng.ts'
import { buildScale } from './scale.ts'
import { isOwn, withFont, withStyle, type Role, type Zetsel } from './zetsel.ts'

export type RemarkId =
  | 'twee-schreef'
  | 'te-gelijk'
  | 'twee-display'
  | 'tekst-display'
  | 'tekst-handschrift'
  | 'tekst-mono'
  | 'x-hoogte'
  | 'familie-dun'
  | 'regel-lang'
  | 'regel-kort'
  | 'te-klein'
  | 'interlinie-krap'
  | 'interlinie-ruim'
  | 'weduwe'
  | 'uitvullen'
  | 'nep-vet'
  | 'nep-cursief'
  | 'geen-vet'
  | 'geen-cursief'
  | 'doel-handschrift'
  | 'doel-dun'
  | 'doel-tekens'
  | 'doel-cijfers'
  | 'doel-schaal'
  | 'doel-display'
  | 'doel-haarlijnen'
  | 'ij'
  | 'inkt-zwak'
  | 'tweede-inkt-zwak'
  | 'inkt-presentatie'
  | 'lof-paar'
  | 'lof-klaar'

export type FixId =
  | 'wissel-kop'
  | 'wissel-tekst'
  | 'als-kop'
  | 'zet-regel'
  | 'zet-maat'
  | 'zet-interlinie'
  | 'mooi-afbreken'
  | 'links-uitlijnen'
  | 'echt-gewicht'
  | 'cursief-uit'
  | 'zwaarder'
  | 'tabelcijfers-aan'
  | 'zet-schaal'
  | 'ij-hoofdletter'
  | 'betere-inkt'
  | 'betere-tweede-inkt'

/** Alle opmerkingen en oplossingen, voor wie ze allemaal een zin moet geven */
export const REMARK_IDS: readonly RemarkId[] = ['twee-schreef', 'te-gelijk', 'twee-display', 'tekst-display', 'tekst-handschrift', 'tekst-mono', 'x-hoogte', 'familie-dun', 'regel-lang', 'regel-kort', 'te-klein', 'interlinie-krap', 'interlinie-ruim', 'weduwe', 'uitvullen', 'nep-vet', 'nep-cursief', 'geen-vet', 'geen-cursief', 'doel-handschrift', 'doel-dun', 'doel-tekens', 'doel-cijfers', 'doel-schaal', 'doel-display', 'doel-haarlijnen', 'ij', 'inkt-zwak', 'tweede-inkt-zwak', 'inkt-presentatie', 'lof-paar', 'lof-klaar']
export const FIX_IDS: readonly FixId[] = ['wissel-kop', 'wissel-tekst', 'als-kop', 'zet-regel', 'zet-maat', 'zet-interlinie', 'mooi-afbreken', 'links-uitlijnen', 'echt-gewicht', 'cursief-uit', 'zwaarder', 'tabelcijfers-aan', 'zet-schaal', 'ij-hoofdletter', 'betere-inkt', 'betere-tweede-inkt']

export type Tone = 'kritiek' | 'tip' | 'lof'
export type Topic = 'paar' | 'zetsel' | 'ontbrekend' | 'doel' | 'nederlands' | 'inkt' | 'lof'
export type Params = Record<string, string | number>

export interface Fix {
  id: FixId
  params: Params
  /** Het zetsel na de oplossing */
  zetsel: Zetsel
}

export interface Remark {
  id: RemarkId
  tone: Tone
  topic: Topic
  /** Hoe belangrijk, binnen zijn toon */
  weight: number
  params: Params
  fix: Fix | null
  /** Welke van de varianten in strings.ts. Hangt af van het zetsel, niet van toeval */
  variant: number
}

/** Wat de drukker weet */
export interface Facts {
  zetsel: Zetsel
  /** De kast, plus eigen fonts */
  fonts: readonly FontEntry[]
  pairings: readonly Pairing[]
  /** Wat het vel in de browser zag, als het dat al weet */
  sheet?: { weduwe?: boolean }
}

const other = (role: Role): Role => (role === 'kop' ? 'tekst' : 'kop')
const styleOf = (z: Zetsel, role: Role) => (role === 'kop' ? z.kopStijl : z.tekstStijl)
const BODY = ['schreef', 'schreefloos']
const IJ = /(^|[^\p{L}])Ij(?=\p{Ll})/u

type Font = FontEntry
type Where = (kop: Font, tekst: Font) => boolean

/**
 * Een andere letter in één rol, zo dat `where` klopt. Eerst de voorkeursrol, dan de andere, maar nooit de geklemde.
 * Alleen letters uit de kast, en het beste paar volgens de koppelregels
 */
function swap(facts: Facts, preferred: Role, where: Where): Fix | null {
  const z = facts.zetsel
  const byId = new Map(facts.fonts.map((f) => [f.id, f]))
  const roles = [preferred, other(preferred)].filter((r) => r !== z.klem)
  for (const role of roles) {
    const fixed = other(role)
    const ranked = rankPairs(facts.fonts, facts.pairings, {
      goal: z.doel,
      moods: z.stemming,
      clamp: { role: fixed, id: z[fixed] },
      where: (kop, tekst) => {
        const moving = role === 'kop' ? kop : tekst
        return moving.id !== z[role] && !isOwn(moving.id) && where(kop as Font, tekst as Font)
      },
    })
    const best = ranked[0]
    const font = best && byId.get(best[role])
    if (font) return { id: role === 'kop' ? 'wissel-kop' : 'wissel-tekst', params: { naam: font.family }, zetsel: withFont(z, role, font) }
  }
  return null
}

const fixOf = (id: FixId, zetsel: Zetsel, params: Params = {}): Fix => ({ id, params, zetsel })

/** Alles wat de drukker over dit zetsel te zeggen heeft, het belangrijkste eerst */
export function remarks(facts: Facts): Remark[] {
  const z = facts.zetsel
  const byId = new Map(facts.fonts.map((f) => [f.id, f]))
  const kop = byId.get(z.kop)
  const tekst = byId.get(z.tekst)
  if (!kop || !tekst) return []

  const spec = GOAL_SPECS[z.doel]
  const out: Omit<Remark, 'variant'>[] = []
  const say = (id: RemarkId, tone: Tone, topic: Topic, weight: number, fix: Fix | null = null, params: Params = {}) => out.push({ id, tone, topic, weight, params, fix })

  // ---------------------------------------------------------------- het paar
  const pair = scorePair(kop, tekst, z.doel)
  const has = (note: string) => pair.results.some((r) => r.note === note)
  const isBody = (f: Font) => BODY.includes(f.kind)

  if (has('twee-display')) {
    say('twee-display', 'kritiek', 'paar', 9, swap(facts, 'tekst', (_k, t) => isBody(t)))
  } else if (!isBody(tekst)) {
    const id: RemarkId = tekst.kind === 'display' ? 'tekst-display' : tekst.kind === 'handschrift' ? 'tekst-handschrift' : 'tekst-mono'
    // Staat de klem op de tekst, dan wordt hij de kop, met een broodletter eronder
    const fix =
      z.klem === 'tekst'
        ? (() => {
            const moved = { ...withFont(withFont(z, 'kop', tekst), 'tekst', kop), klem: 'kop' as const }
            const partner = swap({ ...facts, zetsel: moved }, 'tekst', (_k, t) => isBody(t))
            return partner ? fixOf('als-kop', partner.zetsel, { naam: tekst.family, partner: partner.params.naam }) : null
          })()
        : swap(facts, 'tekst', (_k, t) => isBody(t))
    say(id, 'kritiek', 'paar', 9, fix)
  }
  if (has('te-gelijk')) say('te-gelijk', 'kritiek', 'paar', 6, swap(facts, 'kop', (k, t) => k.id === t.id || k.kind !== t.kind || distance(k, t) >= ENOUGH))
  if (has('twee-schreef')) say('twee-schreef', 'tip', 'paar', 4, swap(facts, 'kop', (k, t) => !(k.kind === 'schreef' && t.kind === 'schreef')))
  if (kop.id !== tekst.id && xHeightGap(kop, tekst) > X_GAP && z.doel !== 'affiche') {
    say('x-hoogte', 'tip', 'paar', 3, swap(facts, 'kop', (k, t) => k.id === t.id || xHeightGap(k, t) <= 0.1), { procent: Math.round(xHeightGap(kop, tekst) * 100) })
  }
  if (has('familie-dun')) say('familie-dun', 'tip', 'paar', 3, swap(facts, 'kop', (k, t) => k.id !== t.id))

  // ---------------------------------------------------------------- het doel
  if (has('handschrift-te-veel')) say('doel-handschrift', 'kritiek', 'doel', 7, swap(facts, 'kop', (k) => k.kind !== 'handschrift'))
  if (z.doel === 'app' && kop.kind === 'display') say('doel-display', 'tip', 'doel', 4, swap(facts, 'kop', (k) => k.kind !== 'display'))
  if (spec.interface && (!tekst.coverage.distinctIl1 || !tekst.coverage.distinctO0 || tekst.kind !== 'schreefloos')) {
    say('doel-tekens', 'kritiek', 'doel', 7, swap(facts, 'tekst', (_k, t) => t.kind === 'schreefloos' && t.coverage.distinctIl1 && t.coverage.distinctO0))
  }
  if (spec.interface && !z.tabelcijfers) {
    const fix = tekst.coverage.tabular ? fixOf('tabelcijfers-aan', { ...z, tabelcijfers: true }) : swap(facts, 'tekst', (_k, t) => t.kind === 'schreefloos' && t.coverage.tabular && t.coverage.distinctIl1 && t.coverage.distinctO0)
    // Wisselt de oplossing de tekst, dan moeten de cijfers daarna nog aan; die stap doet de nieuwe opmerking
    say('doel-cijfers', 'tip', 'doel', 5, fix && fix.id === 'wissel-tekst' ? fixOf('wissel-tekst', { ...fix.zetsel, tabelcijfers: true }, fix.params) : fix)
  }
  if (has('haarlijnen')) {
    const role: Role = tekst.metrics.contrast > 3 ? 'tekst' : 'kop'
    say('doel-haarlijnen', 'tip', 'doel', 4, swap(facts, role, (k, t) => t.metrics.contrast <= 3 && k.metrics.contrast <= 4.5))
  }
  if (z.doel === 'affiche' && z.ratio < spec.minRatio) say('doel-schaal', 'tip', 'doel', 4, fixOf('zet-schaal', { ...z, ratio: spec.ratio }, { ratio: spec.ratio }), { ratio: z.ratio })
  const thin = (['kop', 'tekst'] as const).filter((r) => styleOf(z, r).weight < spec.minWeight)
  if (thin.length > 0) {
    let next = z
    for (const role of thin) next = withStyle(next, role, { weight: nearestWeight(role === 'kop' ? kop : tekst, Math.max(spec.minWeight, role === 'kop' ? 600 : 400)) })
    // Het dichtstbijzijnde gewicht kan bij een statische letter nog steeds te licht zijn; dan blijft de klacht terecht staan
    const fixed = thin.every((role) => styleOf(next, role).weight >= spec.minWeight)
    say('doel-dun', 'kritiek', 'doel', 6, fixed ? fixOf('zwaarder', next) : null, { gewicht: Math.min(...thin.map((r) => styleOf(z, r).weight)) })
  }

  // ---------------------------------------------------------------- ontbrekende delen
  const roleFont = (role: Role) => (role === 'kop' ? kop : tekst)
  for (const role of ['kop', 'tekst'] as const) {
    const font = roleFont(role)
    const style = styleOf(z, role)
    if (!hasWeight(font, style.weight)) {
      const weight = nearestWeight(font, style.weight)
      say('nep-vet', 'kritiek', 'ontbrekend', 5, fixOf('echt-gewicht', withStyle(z, role, { weight }), { rol: role, gewicht: weight }), { rol: role, gewicht: style.weight, naam: font.family })
    }
    if (style.italic && !font.italic) say('nep-cursief', 'kritiek', 'ontbrekend', 5, fixOf('cursief-uit', withStyle(z, role, { italic: false }), { rol: role }), { rol: role, naam: font.family })
  }
  const bold = (f: Font) => (f.axes?.wght ? f.axes.wght.max >= 600 : f.weights.some((w) => w >= 600))
  if (!bold(tekst)) say('geen-vet', 'tip', 'ontbrekend', 3, swap(facts, 'tekst', (_k, t) => bold(t) && isBody(t)), { naam: tekst.family })
  if (!tekst.italic) {
    say('geen-cursief', spec.needsItalic ? 'kritiek' : 'tip', 'ontbrekend', spec.needsItalic ? 8 : 3, swap(facts, 'tekst', (_k, t) => t.italic && isBody(t)), { naam: tekst.family })
  }

  // ---------------------------------------------------------------- het zetsel
  if (z.regel > spec.measure[1]) say('regel-lang', 'kritiek', 'zetsel', 5, fixOf('zet-regel', { ...z, regel: spec.idealMeasure }, { tekens: spec.idealMeasure }), { tekens: z.regel })
  else if (z.regel < spec.measure[0]) say('regel-kort', 'tip', 'zetsel', 4, fixOf('zet-regel', { ...z, regel: spec.idealMeasure }, { tekens: spec.idealMeasure }), { tekens: z.regel })
  if (z.maat < 16) say('te-klein', 'kritiek', 'zetsel', 7, fixOf('zet-maat', { ...z, maat: spec.base }, { px: spec.base }), { px: z.maat })
  if (z.interlinie < 1.4) say('interlinie-krap', 'kritiek', 'zetsel', 5, fixOf('zet-interlinie', { ...z, interlinie: spec.leading }, { waarde: spec.leading }), { waarde: z.interlinie })
  else if (z.interlinie > 1.9) say('interlinie-ruim', 'tip', 'zetsel', 3, fixOf('zet-interlinie', { ...z, interlinie: spec.leading }, { waarde: spec.leading }), { waarde: z.interlinie })
  if (facts.sheet?.weduwe && !z.mooiAfbreken) say('weduwe', 'tip', 'zetsel', 3, fixOf('mooi-afbreken', { ...z, mooiAfbreken: true }))
  if (z.uitlijning === 'uitvullen' && (z.doel === 'website' || z.doel === 'app')) say('uitvullen', 'tip', 'zetsel', 3, fixOf('links-uitlijnen', { ...z, uitlijning: 'links' }))

  // ---------------------------------------------------------------- Nederlands
  if (IJ.test(z.zin)) say('ij', 'kritiek', 'nederlands', 6, fixOf('ij-hoofdletter', { ...z, zin: z.zin.replace(new RegExp(IJ.source, 'gu'), '$1IJ') }))

  // ---------------------------------------------------------------- inkt op papier
  const ink = checkInk(z.inkt, z.papier, z.maat, z.tekstStijl.weight)
  if (!ink.passes) {
    const better = fixInk(z.inkt, z.papier, ink.required)
    say('inkt-zwak', 'kritiek', 'inkt', 8, fixOf('betere-inkt', { ...z, inkt: better }, { hex: better }), { ratio: ink.ratio })
  } else if (z.doel === 'presentatie' && ink.ratio < THRESHOLDS.enhanced) {
    const better = fixInk(z.inkt, z.papier, THRESHOLDS.enhanced)
    say('inkt-presentatie', 'tip', 'inkt', 4, fixOf('betere-inkt', { ...z, inkt: better }, { hex: better }), { ratio: ink.ratio })
  }
  if (z.tweedeInkt) {
    // De tweede inkt kleurt de kleinere koppen; die moeten als kop leesbaar zijn
    const scale = buildScale(z, kop, tekst)
    const second = checkInk(z.tweedeInkt, z.papier, scale.levels.h3.min, z.kopStijl.weight)
    if (!second.passes) {
      const better = fixInk(z.tweedeInkt, z.papier, second.required)
      say('tweede-inkt-zwak', 'kritiek', 'inkt', 6, fixOf('betere-tweede-inkt', { ...z, tweedeInkt: better }, { hex: better }), { ratio: second.ratio })
    }
  }

  // ---------------------------------------------------------------- lof
  const pairTrouble = out.some((r) => r.topic === 'paar' && r.tone === 'kritiek')
  if (!pairTrouble && (has('schreef-schreefloos') || has('familie-veilig') || has('genoeg-verschil') || has('valt-op'))) {
    const note = ['schreef-schreefloos', 'familie-veilig', 'genoeg-verschil', 'valt-op'].find(has) ?? ''
    say('lof-paar', 'lof', 'lof', 2, null, { waarom: note })
  }
  if (!out.some((r) => r.tone === 'kritiek')) say('lof-klaar', 'lof', 'lof', 1)

  const order: Record<Tone, number> = { kritiek: 0, tip: 1, lof: 2 }
  return out
    .sort((a, b) => order[a.tone] - order[b.tone] || b.weight - a.weight)
    .map((r) => ({ ...r, variant: hash(`${r.id}|${z.kop}|${z.tekst}|${z.doel}`) }))
}

/** Wat de drukker als eerste zegt, als hij iets te zeggen heeft */
export const firstRemark = (facts: Facts): Remark | null => remarks(facts)[0] ?? null
