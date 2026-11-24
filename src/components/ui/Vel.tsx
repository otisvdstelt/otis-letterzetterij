import { useEffect, useRef } from 'react'
import { strings } from '../../content/strings'
import type { FontEntry } from '../../lib/type/catalogue'
import type { Scale } from '../../lib/type/scale'
import type { Zetsel } from '../../lib/type/zetsel'
import { useFontFaces } from '../../hooks/useFontFaces'
import { Sjabloon } from './Sjablonen'
import { velStijl } from './velStijl'

/** Staat er ergens één woord alleen op de laatste regel van een alinea? */
function hasWidow(root: HTMLElement): boolean {
  for (const p of root.querySelectorAll<HTMLElement>('[data-weduwe]')) {
    const node = p.firstChild
    if (!node || node.nodeType !== Node.TEXT_NODE) continue
    const text = node.textContent ?? ''
    if (text.length < 2) continue
    const range = document.createRange()
    const topAt = (i: number) => {
      range.setStart(node, i)
      range.setEnd(node, i + 1)
      return range.getBoundingClientRect().top
    }
    const last = topAt(text.length - 1)
    if (Math.abs(topAt(0) - last) < 2) continue
    // Zoek met halveren waar de laatste regel begint
    let lo = 0
    let hi = text.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (topAt(mid) < last - 2) lo = mid + 1
      else hi = mid
    }
    if (text.slice(lo).trim().split(/\s+/).length === 1) return true
  }
  return false
}

interface VelProps {
  zetsel: Zetsel
  kop: FontEntry
  tekst: FontEntry
  scale: Scale
  /** Meld het als er een woord alleen op de laatste regel staat */
  onWidow?: (widow: boolean) => void
  label?: string
  compact?: boolean
}

/** Het vel: het sjabloon van het doel, met jouw zin, in echte HTML-tekst */
export function Vel({ zetsel, kop, tekst, scale, onWidow, label, compact }: VelProps) {
  const ref = useRef<HTMLElement>(null)
  useFontFaces([kop, tekst])

  useEffect(() => {
    const el = ref.current
    if (!el || !onWidow) return
    let frame = 0
    const check = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => onWidow(hasWidow(el)))
    }
    const observer = new ResizeObserver(check)
    observer.observe(el)
    check()
    // Pas als de letters er zijn, staan de regels waar ze blijven
    void document.fonts.ready.then(check)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [zetsel, kop, tekst, onWidow])

  return (
    <article ref={ref} lang="nl" className="vel" data-sjabloon={zetsel.sjabloon} data-compact={compact} style={velStijl(zetsel, kop, tekst, scale)} aria-label={label ?? strings.vel.letters(kop.family, tekst.family)}>
      <Sjabloon kind={zetsel.sjabloon} zin={zetsel.zin} />
    </article>
  )
}
