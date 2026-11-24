import { useEffect, useState } from 'react'
import { ExtrudeGeometry, ShapePath, type BufferGeometry } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { nearestWeight, type FontEntry } from '../../lib/type/catalogue'
import { leadLine, leadText, type LeadLine } from '../../lib/type/lood'
import { isOwn } from '../../lib/type/zetsel'
import { loadFont, ownFonts } from '../../lib/fontFile'
import { PRESS } from '../../lib/world/spec'
import { box, tint } from '../../lib/world/kit'
import { lettersOf, useLetters } from '../../lib/store'
import { motion } from './motion'
import { paint } from './materials'

/** Hoe hoog een letter van lood is, van voet tot oog (in de drukkerij: type-hoog) */
const TYPE_HIGH = 0.024
const RELIEF = 0.006
const BODY = 0.075

/** Van een regel zetsel naar één geometrie: per teken een blokje lood met het oog erop, in spiegelbeeld */
function leadGeometry(line: LeadLine): BufferGeometry | null {
  if (line.glyphs.length === 0) return null
  const fit = Math.min(BODY / (line.ascent + line.descent), PRESS.forme.width / line.width)
  const pieces: BufferGeometry[] = []
  const left = (-line.width * fit) / 2
  const em = (line.ascent + line.descent) * fit
  for (const glyph of line.glyphs) {
    // Het blokje: zo breed als de letter, zo diep als het korps
    pieces.push(box(Math.max(0.002, glyph.advance * fit - 0.0008), TYPE_HIGH, em, '#7d8186', { at: [left + (glyph.x + glyph.advance / 2) * fit, 0, 0] }))
    if (glyph.commands.length === 0) continue
    const path = new ShapePath()
    for (const { command, args } of glyph.commands) {
      if (command === 'moveTo') path.moveTo(args[0], args[1])
      else if (command === 'lineTo') path.lineTo(args[0], args[1])
      else if (command === 'quadraticCurveTo') path.quadraticCurveTo(args[0], args[1], args[2], args[3])
      else if (command === 'bezierCurveTo') path.bezierCurveTo(args[0], args[1], args[2], args[3], args[4], args[5])
    }
    // three zoekt zelf uit wat een gat is (wat binnen een andere omtrek ligt), welke kant de omtrek ook op draait.
    // Dat moet ook: TrueType en CFF draaien andersom, en spiegelen draait het nog eens om
    const shapes = path.toShapes()
    if (shapes.length === 0) continue
    const eye = new ExtrudeGeometry(shapes, { depth: RELIEF / fit, bevelEnabled: false, curveSegments: 4 })
    eye.deleteAttribute('uv')
    // Het oog ligt plat op het blokje: x blijft x, de hoogte van de letter wordt diepte
    eye.scale(fit, fit, fit)
    eye.rotateX(-Math.PI / 2)
    eye.translate(left, TYPE_HIGH, ((line.ascent - line.descent) / 2) * fit)
    pieces.push(tint(eye, '#1d1b19', 0.03))
  }
  const indexed = pieces.map((p) => (p.index ? p.toNonIndexed() : p))
  for (const p of indexed) if (!p.getAttribute('normal')) p.computeVertexNormals()
  const merged = mergeGeometries(indexed.map((p) => {
    for (const name of Object.keys(p.attributes)) if (!['position', 'normal', 'color'].includes(name)) p.deleteAttribute(name)
    return p
  }), false)
  return merged
}

/** Gecachet per letter en tekst: hetzelfde zetsel geeft hetzelfde lood, zonder opnieuw te gieten */
const cache = new Map<string, Promise<BufferGeometry | null>>()

function cast(font: FontEntry, weight: number, text: string): Promise<BufferGeometry | null> {
  const own = isOwn(font.id)
  const w = String(nearestWeight({ weights: Object.keys(font.woff).map(Number), axes: null }, weight))
  const url = own ? `eigen:${font.id}` : `${import.meta.env.BASE_URL}${font.woff[w] ?? Object.values(font.woff)[0]}`
  const key = `${url}|${text}`
  let pending = cache.get(key)
  if (!pending) {
    const source = own ? Promise.resolve(ownFonts.get(font.id)) : loadFont(url)
    pending = source.then((parsed) => (parsed ? leadGeometry(leadLine(parsed, text)) : null)).catch(() => null)
    cache.set(key, pending)
  }
  return pending
}

/** Je kop in lood op het bed van de pers, letter voor letter, in spiegelbeeld */
export function Lood() {
  const z = useLetters((s) => s.zetsel)
  const letters = useLetters((s) => lettersOf(s.zetsel, s))
  const [geometry, setGeometry] = useState<BufferGeometry | null>(null)
  const text = leadText(z.zin)

  useEffect(() => {
    if (!letters) return
    let alive = true
    void cast(letters.kop, z.kopStijl.weight, text).then((g) => {
      if (!alive) return
      setGeometry(g)
      motion.wake(0.2)
    })
    return () => {
      alive = false
    }
  }, [letters, text, z.kopStijl.weight])

  if (!geometry) return null
  const [x, y, zz] = PRESS.forme.at
  return <mesh geometry={geometry} material={paint} position={[x, y, zz]} castShadow receiveShadow />
}
