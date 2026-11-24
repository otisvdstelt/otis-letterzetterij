// Waarom dit paar: in één zin wat ze gemeen hebben en waar ze verschillen. Uit de metingen, als codes;
// strings.ts maakt er een zin van. Een paar werkt als het iets deelt (zodat het bij elkaar hoort) en iets anders doet (zodat de kop opvalt)

import type { FontEntry, Mood } from './catalogue.ts'
import { bouw, schreefvorm } from './zoek.ts'

type Font = Pick<FontEntry, 'id' | 'kind' | 'category' | 'moods' | 'weights' | 'axes' | 'italic' | 'metrics' | 'coverage' | 'scripts'>

export type Gemeen = 'familie' | 'x-hoogte' | 'breedte' | 'bouw' | 'stemming'
export type Verschil = 'schreef' | 'contrast' | 'breedte' | 'rondheid' | 'gewicht'

export interface PaarUitleg {
  gemeen: Gemeen[]
  verschil: Verschil[]
  /** De gedeelde stemming, als die er is */
  stemming: Mood | null
  /** Welke van de twee meer heeft van wat verschilt: de kop of de tekst */
  meer: 'kop' | 'tekst'
}

export function waaromPaar(kop: Font, tekst: Font): PaarUitleg {
  if (kop.id === tekst.id) return { gemeen: ['familie'], verschil: ['gewicht'], stemming: kop.moods[0] ?? null, meer: 'kop' }
  const gemeen: Gemeen[] = []
  const verschil: Verschil[] = []
  const xGap = Math.abs(kop.metrics.xHeight - tekst.metrics.xHeight) / tekst.metrics.xHeight
  const wGap = Math.abs(kop.metrics.avgWidth - tekst.metrics.avgWidth)
  const cRatio = Math.abs(Math.log(kop.metrics.contrast / tekst.metrics.contrast))
  const stemming = kop.moods.find((m) => tekst.moods.includes(m)) ?? null
  if (xGap <= 0.08) gemeen.push('x-hoogte')
  if (wGap <= 0.025) gemeen.push('breedte')
  const bk = bouw(kop)
  if (bk && bk === bouw(tekst)) gemeen.push('bouw')
  if (stemming) gemeen.push('stemming')
  if (schreefvorm(kop) !== schreefvorm(tekst)) verschil.push('schreef')
  if (cRatio >= 0.35) verschil.push('contrast')
  if (wGap > 0.04) verschil.push('breedte')
  if (Math.abs(kop.metrics.roundness - tekst.metrics.roundness) >= 0.06) verschil.push('rondheid')
  const meer = verschil[0] === 'contrast' || verschil[0] === 'schreef' ? (kop.metrics.contrast >= tekst.metrics.contrast ? 'kop' : 'tekst') : kop.metrics.avgWidth >= tekst.metrics.avgWidth ? 'kop' : 'tekst'
  return { gemeen: gemeen.slice(0, 2), verschil: verschil.slice(0, 2), stemming, meer }
}
