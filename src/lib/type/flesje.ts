// Een flesje uit de Kleurenalchemist als inkt en papier. Gelezen volgens docs/LINKFORMAAT.md in die repo:
// tekst wordt inkt, achtergrond wordt papier, accent wordt tweede inkt. Alleen lezen, nooit schrijven

import { isHex, type Hex } from './color.ts'
import { fromBase64Url, Reader } from './bytes.ts'

/** De rollen in de volgorde van het formaat (één byte per kleur) */
const ROLES = ['achtergrond', 'oppervlak', 'tekst', 'accent', 'signaal'] as const
type Role = (typeof ROLES)[number]

export interface Flesje {
  name: string
  swatches: { hex: Hex; role: Role }[]
}

export interface InkAndPaper {
  inkt: Hex
  papier: Hex
  tweedeInkt: Hex | null
  /** De naam op het etiket */
  naam: string
}

/** Flesje versie 1. Het recept lezen we wel (anders weten we niet waar het ophoudt), maar we bewaren het niet */
function readV1(r: Reader): Flesje {
  const count = r.byte()
  if (count < 1 || count > 12) throw new RangeError('vreemd aantal kleuren')
  const swatches = Array.from({ length: count }, () => {
    const hex = r.hex()
    const role = ROLES[r.byte()]
    if (!role) throw new RangeError('onbekende rol')
    return { hex, role }
  })
  const name = r.text(80)
  r.varint() // datum
  r.varint() // roerslagen
  r.byte() // grootte
  r.uint32() // seed
  const items = r.byte()
  for (let i = 0; i < items; i++) {
    const photo = r.byte() === 1
    r.text()
    if (photo) {
      const pigments = r.byte()
      for (let p = 0; p < pigments; p++) {
        r.hex()
        r.byte()
      }
    }
  }
  return { name, swatches }
}

/** De lezers per versie. Een nieuwe versie van het flesje krijgt hier een eigen lezer; de oude blijven staan */
const READERS: Record<number, (r: Reader) => Flesje> = { 1: readV1 }

function readFlesje(bytes: Uint8Array): Flesje {
  const r = new Reader(bytes)
  const version = r.byte()
  const read = READERS[version]
  if (!read) throw new RangeError(`onbekende versie ${version}`)
  return read(r)
}

/** Lees een flesje uit zijn code. Een versie die we niet kennen, of iets dat niet klopt: null */
export function decodeFlesje(code: string): Flesje | null {
  try {
    const flesje = readFlesje(fromBase64Url(code))
    return flesje.swatches.every((s) => isHex(s.hex)) ? flesje : null
  } catch {
    return null
  }
}

/** Een plank vol flesjes, versie 1. Elk flesje met zijn eigen versiebyte */
export function decodePlank(code: string): Flesje[] | null {
  try {
    const r = new Reader(fromBase64Url(code))
    if (r.byte() !== 1) return null
    const count = r.varint()
    if (count > 200) return null
    return Array.from({ length: count }, () => readFlesje(r.raw()))
  } catch {
    return null
  }
}

/**
 * Haal de code uit wat iemand plakt: een hele link (van welke site dan ook), een pad, of de code zelf.
 * Dezelfde regel als codeFromLink in de Kleurenalchemist
 */
export function codeFromLink(text: string): { kind: 'fles' | 'plank'; code: string } | null {
  const trimmed = text.trim()
  const match = trimmed.match(/(?:^|\/|#\/?)(fles|plank)\/([A-Za-z0-9_-]+)\/?(?:[?#].*)?$/)
  if (match) return { kind: match[1] as 'fles' | 'plank', code: match[2] }
  return /^[A-Za-z0-9_-]{8,}$/.test(trimmed) ? { kind: 'fles', code: trimmed } : null
}

/** De rollen van een flesje als inkt en papier */
export function inkAndPaper(flesje: Flesje): InkAndPaper {
  const find = (role: Role) => flesje.swatches.find((s) => s.role === role)?.hex ?? null
  return { inkt: find('tekst') ?? '#000000', papier: find('achtergrond') ?? '#ffffff', tweedeInkt: find('accent'), naam: flesje.name }
}

export type Plakfout = 'geen-link' | 'onleesbaar' | 'leeg'

/**
 * Alles in één: plak een flesjes- of plankenlink, krijg de flesjes met hun inkt en papier.
 * Een plank geeft er meerdere, om uit te kiezen. Een fout zegt wat er misging, zonder te struikelen
 */
export function readPasted(text: string): { ok: true; flesjes: InkAndPaper[] } | { ok: false; reason: Plakfout } {
  const link = codeFromLink(text)
  if (!link) return { ok: false, reason: 'geen-link' }
  const flesjes = link.kind === 'plank' ? decodePlank(link.code) : [decodeFlesje(link.code)].filter((f): f is Flesje => f !== null)
  if (!flesjes || (link.kind === 'fles' && flesjes.length === 0)) return { ok: false, reason: 'onleesbaar' }
  if (flesjes.length === 0) return { ok: false, reason: 'leeg' }
  return { ok: true, flesjes: flesjes.map(inkAndPaper) }
}
