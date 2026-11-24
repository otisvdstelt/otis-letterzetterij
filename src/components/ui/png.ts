// Een PNG van het vel: de kop, een alinea, een citaat en een bijschrift, in de letters, de inkt en het papier van het vel.
// Op een canvas, met de letters die de pagina al geladen heeft. Geen DOM-naar-plaatje-truc: wat je ziet is wat je krijgt

import type { FontEntry } from '../../lib/type/catalogue'
import { familyName } from '../../lib/type/fontface'
import type { Scale } from '../../lib/type/scale'
import type { Zetsel } from '../../lib/type/zetsel'

const W = 1200
const H = 1500
const MARGIN = 110

export interface PngText {
  alinea: string
  citaat: string
  bijschrift: string
  voet: string
}

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > width && line) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

/** Teken het vel en geef het terug als PNG-blob */
export async function sheetPng(z: Zetsel, kop: FontEntry, tekst: FontEntry, scale: Scale, words: PngText): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('geen canvas')
  // Zorg dat de letters er zijn voor we tekenen
  const kopFont = (px: number) => `${z.kopStijl.italic ? 'italic ' : ''}${z.kopStijl.weight} ${px}px '${familyName(kop.id)}'`
  const tekstFont = (px: number, italic = false) => `${italic ? 'italic ' : ''}${z.tekstStijl.weight} ${px}px '${familyName(tekst.id)}'`
  await Promise.allSettled([document.fonts.load(kopFont(40), z.zin), document.fonts.load(tekstFont(20)), document.fonts.load(tekstFont(20, true))])

  ctx.fillStyle = z.papier
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = z.inkt
  ctx.textBaseline = 'alphabetic'
  const width = W - MARGIN * 2
  // Het vel is 1200 breed: de maten op een breed scherm, iets groter gezet zodat het plaatje leest
  const k = 1.6
  let y = MARGIN

  const block = (text: string, font: string, px: number, leading: number, color: string, tracking = 0) => {
    ctx.font = font
    ctx.fillStyle = color
    ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${tracking * px}px`
    for (const line of wrap(ctx, text, width)) {
      y += px * leading
      ctx.fillText(line, MARGIN, y)
    }
  }

  const h1 = scale.levels.h1.max * k
  block(z.zin, kopFont(h1), h1, scale.levels.h1.leading, z.inkt, scale.levels.h1.tracking)
  y += h1 * 0.5
  const body = scale.levels.tekst.max * k
  block(words.alinea, tekstFont(body), body, z.interlinie, z.inkt, z.tekstStijl.tracking)
  y += body
  const h4 = scale.levels.h4.max * k
  block(words.citaat, kopFont(h4), h4, scale.levels.h4.leading, z.tweedeInkt ?? z.inkt)
  y += body * 0.6
  const small = scale.levels.klein.max * k
  block(words.bijschrift, tekstFont(small, true), small, scale.levels.klein.leading, z.inkt)

  ctx.font = tekstFont(18)
  ctx.globalAlpha = 0.7
  ctx.fillText(words.voet, MARGIN, H - MARGIN / 2)
  ctx.globalAlpha = 1

  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('geen png'))), 'image/png'))
}

/** Laat de browser een bestand opslaan */
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.append(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
