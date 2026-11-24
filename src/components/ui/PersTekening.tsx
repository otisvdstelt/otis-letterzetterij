import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { strings } from '../../content/strings'
import { lever as hand } from '../../lib/lever'
import { store, useLetters } from '../../lib/store'
import { useMediaQuery } from '../../hooks/useLayout'

/** Zo ver kan de hendel omlaag, in graden. Voorbij de drempel drukt hij */
const DOWN = 38
const PULL_AT = 26
const PIVOT = { x: 236, y: 96 }

/**
 * De hendel om aan te trekken: slepen omlaag drukt, Enter of spatie ook. In 3D ligt hij over de gebakken hendel,
 * zonder 3D over de getekende pers. De eerste keer staat er een hint bij
 */
export function Hendel({ at, drawing }: { at?: { x: number; y: number } | null; drawing?: SVGSVGElement | null }) {
  const hinted = useLetters((s) => s.hinted)
  const [dragging, setDragging] = useState(false)
  const angle = useRef(0)
  const startY = useRef(0)
  const dragged = useRef(false)
  const p = strings.pers

  const angleFrom = (event: PointerEvent) => {
    if (!drawing) return Math.max(0, Math.min(DOWN, (event.clientY - startY.current) * 0.45))
    const box = drawing.getBoundingClientRect()
    const scale = box.width / 400
    const dx = event.clientX - (box.left + PIVOT.x * scale)
    const dy = event.clientY - (box.top + PIVOT.y * scale)
    return Math.max(0, Math.min(DOWN, (Math.atan2(dy, dx) * 180) / Math.PI + 22))
  }

  const style = at ? { left: at.x - 70, top: at.y - 50 } : undefined
  return (
    <>
      <button
        type="button"
        className="hendel"
        data-sleept={dragging}
        data-wereld={Boolean(at)}
        style={style}
        aria-label={p.hendel}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          dragged.current = false
          startY.current = event.clientY
          setDragging(true)
        }}
        onPointerMove={(event) => {
          if (!dragging) return
          dragged.current = true
          angle.current = angleFrom(event)
          hand.set(angle.current / DOWN, true)
          window.dispatchEvent(new CustomEvent('hendel', { detail: angle.current }))
        }}
        onPointerUp={() => {
          if (!dragging) return
          setDragging(false)
          hand.set(0, false)
          window.dispatchEvent(new CustomEvent('hendel', { detail: 0 }))
          if (angle.current >= PULL_AT) store.pull()
          angle.current = 0
        }}
        onPointerCancel={() => {
          setDragging(false)
          hand.set(0, false)
          angle.current = 0
        }}
        onClick={() => {
          if (dragged.current) {
            dragged.current = false
            return
          }
          store.pull()
        }}
      />
      {!hinted && (
        <p className="tag hendel-hint" style={at ? { left: at.x + 40, top: at.y - 10 } : undefined} aria-hidden="true">
          {p.hint}
        </p>
      )}
    </>
  )
}

/** De getekende pers: midden in beeld zolang er geen drukkerij in 3D is, of als die niet kan */
export function PersTekening() {
  const pulls = useLetters((s) => s.pulls)
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [svg, setSvg] = useState<SVGSVGElement | null>(null)
  const [drag, setDrag] = useState(0)
  const [pressing, setPressing] = useState(false)
  const [seen, setSeen] = useState(pulls)
  if (pulls !== seen) {
    setSeen(pulls)
    setPressing(true)
  }
  useEffect(() => {
    if (!pressing) return
    const timer = window.setTimeout(() => setPressing(false), reduced ? 10 : 650)
    return () => window.clearTimeout(timer)
  }, [pressing, reduced])
  useEffect(() => {
    const follow = (event: Event) => setDrag((event as CustomEvent<number>).detail)
    window.addEventListener('hendel', follow)
    return () => window.removeEventListener('hendel', follow)
  }, [])

  const lever = drag || (pressing ? DOWN : 0)
  const platen = drag ? (drag / DOWN) * 10 : pressing ? 10 : 0
  return (
    <div className="pers-getekend">
      <svg ref={setSvg} className="pers-tekening" viewBox="0 0 400 250" role="img" aria-label={strings.pers.tekeningLabel}>
        <ellipse cx="200" cy="236" rx="170" ry="10" fill="currentColor" opacity="0.12" filter="url(#bleed)" />
        <g filter="url(#wobble)" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <rect x="34" y="176" width="64" height="8" rx="2" fill="#33363b" strokeWidth="2" />
          <circle cx="62" cy="170" r="6" fill="#2c2823" strokeWidth="2" />
          <path d="M62 170 72 152" strokeWidth="2.5" fill="none" />
          <path d="M110 188h250M118 188l-6 42M352 188l6 42M150 188l-3 42M320 188l3 42" strokeWidth="5" fill="none" className="pers-ijzer" />
          <rect x="108" y="178" width="254" height="10" rx="2" fill="var(--color-iron)" strokeWidth="2" />
          <path d="M140 178V74c0-28 22-44 48-44h24c26 0 48 16 48 44v104" strokeWidth="11" fill="none" className="pers-ijzer" />
          <path d="M140 178V74c0-28 22-44 48-44h24c26 0 48 16 48 44v104" strokeWidth="5" fill="none" stroke="var(--color-iron)" />
          <rect x="184" y="14" width="32" height="22" rx="5" fill="var(--color-oak)" strokeWidth="2" />
          <g style={{ transform: `translateY(${platen}px)`, transition: drag ? 'none' : 'transform 260ms var(--ease-out-expo)' }}>
            <path d="M200 36v94" strokeWidth="5" fill="none" />
            <rect x="150" y="128" width="100" height="16" rx="2" fill="var(--color-lead)" strokeWidth="2.5" />
          </g>
          <rect x="156" y="168" width="88" height="10" rx="1" fill="var(--color-canvas)" strokeWidth="1.5" />
          <g style={{ transform: `rotate(${lever}deg)`, transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`, transition: drag ? 'none' : 'transform 420ms var(--ease-out-expo)' }}>
            <path d={`M${PIVOT.x} ${PIVOT.y} 340 54`} strokeWidth="6" fill="none" className="pers-ijzer" />
            <path d="M334 57 378 36" strokeWidth="13" stroke="var(--color-oak)" fill="none" />
            <circle cx={PIVOT.x} cy={PIVOT.y} r="7" fill="var(--color-iron)" strokeWidth="2" />
          </g>
        </g>
      </svg>
      <Hendel drawing={svg} />
    </div>
  )
}
