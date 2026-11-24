// Een vel of een hele waslijn als link: /vel/<code> en /waslijn/<code>. Binair, base64url, met een versienummer voorop,
// net als het flesje. Er is geen backend: alles wat nodig is, zit in de link. Het formaat staat in docs/LINKFORMAAT.md

import { MOODS, type Mood } from './catalogue.ts'
import { isHex } from './color.ts'
import { fromBase64Url, Reader, toBase64Url, Writer } from './bytes.ts'
import { GOALS, TEMPLATES } from './goals.ts'
import { ALIGNS, cleanZin, isOwn, normalize, type RoleStyle, type Zetsel } from './zetsel.ts'

export const VEL_VERSION = 1
export const WASLIJN_VERSION = 1
/** Hooguit zoveel vellen aan een gedeelde waslijn. Aan je eigen lijn hangen er zes */
export const MAX_SHARED_SHEETS = 24

const CLAMPS = [null, 'kop', 'tekst'] as const

/** Een eigen font gaat niet mee: de link noemt zijn naam en een nette vervanger uit de kast */
export type FallbackFor = (ownId: string) => string

/** Wat er bij het lezen vervangen is: de naam van het eigen font dat niet meeging, per rol */
export interface Replaced {
  kop?: string
  tekst?: string
}

const ownName = (id: string) => id.slice('eigen:'.length)

function writeFont(w: Writer, id: string, fallbackFor: FallbackFor) {
  if (isOwn(id)) {
    w.byte(1)
    w.text(ownName(id).slice(0, 60))
    w.text(fallbackFor(id))
  } else {
    w.byte(0)
    w.text(id)
  }
}

function readFont(r: Reader): { id: string; replaced?: string } {
  const kind = r.byte()
  if (kind === 0) return { id: r.text(80) }
  if (kind === 1) {
    const name = r.text(60)
    return { id: r.text(80), replaced: name }
  }
  throw new RangeError('onbekende soort letter')
}

function writeStyle(w: Writer, s: RoleStyle) {
  w.varint(s.weight)
  w.byte(s.italic ? 1 : 0)
  w.signed(s.tracking * 1000)
  const axes = Object.entries(s.axes).slice(0, 8)
  w.byte(axes.length)
  for (const [tag, value] of axes) {
    for (let i = 0; i < 4; i++) w.byte(tag.charCodeAt(i))
    w.signed(value * 10)
  }
}

function readStyle(r: Reader): RoleStyle {
  const weight = r.varint()
  const italic = r.byte() === 1
  const tracking = r.signed() / 1000
  const count = r.byte()
  if (count > 8) throw new RangeError('te veel assen')
  const axes: Record<string, number> = {}
  for (let i = 0; i < count; i++) {
    const tag = String.fromCharCode(r.byte(), r.byte(), r.byte(), r.byte())
    axes[tag] = r.signed() / 10
  }
  return { weight, italic, tracking, axes }
}

const index = <T>(list: readonly T[], value: T) => Math.max(0, list.indexOf(value))
const at = <T>(list: readonly T[], i: number): T => {
  if (i >= list.length) throw new RangeError('buiten de lijst')
  return list[i]
}

function writeVel(z: Zetsel, fallbackFor: FallbackFor): Uint8Array {
  const w = new Writer()
  w.byte(VEL_VERSION)
  writeFont(w, z.kop, fallbackFor)
  writeFont(w, z.tekst, fallbackFor)
  w.byte(index(GOALS, z.doel))
  w.byte(z.stemming.length)
  for (const m of z.stemming) w.byte(index(MOODS, m))
  w.byte(index(TEMPLATES, z.sjabloon))
  w.byte(index(CLAMPS, z.klem))
  writeStyle(w, z.kopStijl)
  writeStyle(w, z.tekstStijl)
  w.varint(z.maat * 10)
  w.varint(z.interlinie * 100)
  w.varint(z.ratio * 1000)
  w.varint(z.regel)
  w.byte(index(ALIGNS, z.uitlijning))
  w.byte((z.tabelcijfers ? 1 : 0) | (z.mooiAfbreken ? 2 : 0) | (z.tweedeInkt ? 4 : 0))
  w.hex(z.inkt)
  w.hex(z.papier)
  if (z.tweedeInkt) w.hex(z.tweedeInkt)
  w.text(cleanZin(z.zin))
  return w.done()
}

/** Versie 1, zoals hierboven geschreven. Een nieuwe versie krijgt een eigen lezer, en deze blijft staan */
function readVelV1(r: Reader): { zetsel: Zetsel; replaced: Replaced } {
  const kop = readFont(r)
  const tekst = readFont(r)
  const doel = at(GOALS, r.byte())
  const moodCount = r.byte()
  if (moodCount > MOODS.length) throw new RangeError('te veel stemmingen')
  const stemming: Mood[] = Array.from({ length: moodCount }, () => at(MOODS, r.byte()))
  const sjabloon = at(TEMPLATES, r.byte())
  const klem = at(CLAMPS, r.byte())
  const kopStijl = readStyle(r)
  const tekstStijl = readStyle(r)
  const maat = r.varint() / 10
  const interlinie = r.varint() / 100
  const ratio = r.varint() / 1000
  const regel = r.varint()
  const uitlijning = at(ALIGNS, r.byte())
  const flags = r.byte()
  const inkt = r.hex()
  const papier = r.hex()
  const tweedeInkt = flags & 4 ? r.hex() : null
  const zin = r.text(400)
  if (![inkt, papier, tweedeInkt ?? '#000000'].every(isHex)) throw new RangeError('geen kleur')
  const zetsel: Zetsel = {
    kop: kop.id,
    tekst: tekst.id,
    klem,
    doel,
    stemming,
    sjabloon,
    kopStijl,
    tekstStijl,
    maat,
    interlinie,
    ratio,
    regel,
    uitlijning,
    tabelcijfers: Boolean(flags & 1),
    mooiAfbreken: Boolean(flags & 2),
    inkt,
    papier,
    tweedeInkt,
    zin,
  }
  const replaced: Replaced = {}
  if (kop.replaced) replaced.kop = kop.replaced
  if (tekst.replaced) replaced.tekst = tekst.replaced
  return { zetsel: normalize(zetsel), replaced }
}

const READERS: Record<number, (r: Reader) => { zetsel: Zetsel; replaced: Replaced }> = { 1: readVelV1 }

function readVel(bytes: Uint8Array) {
  const r = new Reader(bytes)
  const read = READERS[r.byte()]
  if (!read) throw new RangeError('onbekende versie')
  const result = read(r)
  if (!r.done) throw new RangeError('te lang')
  return result
}

/** Een eigen font zonder vervanger: dan de tekstletter uit de kast die het meest gewoon is */
const noFallback: FallbackFor = () => 'source-serif-4'

export function encodeVel(z: Zetsel, fallbackFor: FallbackFor = noFallback): string {
  return toBase64Url(writeVel(z, fallbackFor))
}

/** Lees een vel uit een link. Klopt er iets niet, of is het een versie die we niet kennen: null */
export function decodeVel(code: string): { zetsel: Zetsel; replaced: Replaced } | null {
  try {
    return readVel(fromBase64Url(code))
  } catch {
    return null
  }
}

export function encodeWaslijn(sheets: readonly Zetsel[], fallbackFor: FallbackFor = noFallback): string {
  const w = new Writer()
  w.byte(WASLIJN_VERSION)
  w.varint(sheets.length)
  for (const z of sheets) w.raw(writeVel(z, fallbackFor))
  return toBase64Url(w.done())
}

export function decodeWaslijn(code: string): { zetsel: Zetsel; replaced: Replaced }[] | null {
  try {
    const r = new Reader(fromBase64Url(code))
    if (r.byte() !== WASLIJN_VERSION) return null
    const count = r.varint()
    if (count > MAX_SHARED_SHEETS) return null
    const sheets = Array.from({ length: count }, () => readVel(r.raw()))
    return r.done ? sheets : null
  } catch {
    return null
  }
}

export type Route = { kind: 'vel'; code: string } | { kind: 'waslijn'; code: string } | { kind: 'drukkerij' }

/** Waar het adres naartoe wijst: /vel/<code>, /waslijn/<code>, of dezelfde twee in de hash */
export function readRoute(pathname: string, hash = ''): Route {
  const match = (pathname.match(/^\/(vel|waslijn)\/([A-Za-z0-9_-]+)\/?$/) ?? hash.match(/^#\/?(vel|waslijn)\/([A-Za-z0-9_-]+)$/)) as [string, 'vel' | 'waslijn', string] | null
  return match ? { kind: match[1], code: match[2] } : { kind: 'drukkerij' }
}

export const velPath = (z: Zetsel, fallbackFor?: FallbackFor) => `/vel/${encodeVel(z, fallbackFor)}`
export const waslijnPath = (sheets: readonly Zetsel[], fallbackFor?: FallbackFor) => `/waslijn/${encodeWaslijn(sheets, fallbackFor)}`
