import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { strings } from '../../content/strings'
import { fontStack } from '../../lib/type/fontface'
import { familyOf, lettersOf, store, useLetters } from '../../lib/store'
import { useMediaQuery } from '../../hooks/useLayout'
import { Drukker } from './Drukker'

/** Zo ver kan de hendel omlaag, in graden. Voorbij de drempel drukt hij */
const DOWN = 38
const PULL_AT = 26
/** Het draaipunt van de hendel in de tekening */
const PIVOT = { x: 236, y: 96 }

/**
 * De handpers, getekend. Sleep de hendel omlaag of druk op Enter: de degel zakt, en het vel komt eruit.
 * Hij staat in het midden tot de drukkerij in 3D er is, zodat het midden nooit leeg is
 */
export function Pers({ painted = false, ready = false, stage }: { painted?: boolean; ready?: boolean; stage?: ReactNode }) {
  const pulls = useLetters((s) => s.pulls)
  const hinted = useLetters((s) => s.hinted)
  const printed = useLetters((s) => s.printed)
  const zetsel = useLetters((s) => s.zetsel)
  const letters = useLetters((s) => lettersOf(s.zetsel, s))
  const recent = useLetters((s) => s.recent)
  const canUndo = useLetters((s) => s.past.length > 0)
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [angle, setAngle] = useState(0)
  const [dragging, setDragging] = useState(false)
  const drawing = useRef<SVGSVGElement>(null)
  const dragged = useRef(false)
  const startY = useRef(0)
  const p = strings.pers

  const [pressing, setPressing] = useState(false)
  // Na het trekken zakt de degel even, en veert de hendel terug
  const [seenPulls, setSeenPulls] = useState(pulls)
  if (pulls !== seenPulls) {
    setSeenPulls(pulls)
    setPressing(true)
  }
  useEffect(() => {
    if (!pressing) return
    const timer = window.setTimeout(() => setPressing(false), reduced ? 10 : 650)
    return () => window.clearTimeout(timer)
  }, [pressing, reduced])

  const angleFrom = (event: PointerEvent) => {
    const svg = drawing.current
    // Zonder tekening (de drukkerij in 3D): hoe ver je omlaag sleept
    if (!svg) return Math.max(0, Math.min(DOWN, (event.clientY - startY.current) * 0.45))
    const box = svg.getBoundingClientRect()
    const scale = box.width / 400
    const dx = event.clientX - (box.left + PIVOT.x * scale)
    const dy = event.clientY - (box.top + PIVOT.y * scale)
    // In rust wijst de hendel schuin omhoog (-22°); omlaag is positief
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI + 22
    return Math.max(0, Math.min(DOWN, deg))
  }

  const down = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragged.current = false
    startY.current = event.clientY
    setDragging(true)
  }
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragging) return
    dragged.current = true
    setAngle(angleFrom(event))
  }
  const up = () => {
    if (!dragging) return
    setDragging(false)
    if (angle >= PULL_AT) store.pull()
    setAngle(0)
  }

  const lever = dragging ? angle : pressing ? DOWN : 0
  const platen = dragging ? (angle / DOWN) * 10 : pressing ? 10 : 0

  return (
    <section className="pers" aria-labelledby="pers-kop" data-geschilderd={painted}>
      <h2 id="pers-kop" className="sr-only">
        {p.trek}
      </h2>
      <div className="pers-podium" data-geschilderd={painted} data-klaar={ready}>
        {painted && (
          <div className="pers-wereld" aria-hidden="true">
            {stage}
          </div>
        )}
        {/* De getekende pers staat er tot de drukkerij in 3D klaar is. Zo is het midden nooit leeg */}
        {(!painted || !ready) && (
          <svg ref={drawing} className="pers-tekening" viewBox="0 0 400 250" role="img" aria-label={p.tekeningLabel}>
            <ellipse cx="200" cy="236" rx="170" ry="10" fill="currentColor" opacity="0.12" filter="url(#bleed)" />
            <g filter="url(#wobble)" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              {/* De inktplaat met de rol erop */}
              <rect x="34" y="176" width="64" height="8" rx="2" fill="#33363b" strokeWidth="2" />
              <circle cx="62" cy="170" r="6" fill="#2c2823" strokeWidth="2" />
              <path d="M62 170 72 152" strokeWidth="2.5" fill="none" />
              {/* Het bed met de rails en de poten */}
              <path d="M110 188h250M118 188l-6 42M352 188l6 42M150 188l-3 42M320 188l3 42" strokeWidth="5" fill="none" className="pers-ijzer" />
              <rect x="108" y="178" width="254" height="10" rx="2" fill="var(--color-iron)" strokeWidth="2" />
              {/* De ijzeren boog */}
              <path d="M140 178V74c0-28 22-44 48-44h24c26 0 48 16 48 44v104" strokeWidth="11" fill="none" className="pers-ijzer" />
              <path d="M140 178V74c0-28 22-44 48-44h24c26 0 48 16 48 44v104" strokeWidth="5" fill="none" stroke="var(--color-iron)" />
              {/* De veerkast bovenop */}
              <rect x="184" y="14" width="32" height="22" rx="5" fill="var(--color-oak)" strokeWidth="2" />
              {/* De degel, die zakt als je trekt */}
              <g style={{ transform: `translateY(${platen}px)`, transition: dragging ? 'none' : 'transform 260ms var(--ease-out-expo)' }}>
                <path d="M200 36v94" strokeWidth="5" fill="none" />
                <rect x="150" y="128" width="100" height="16" rx="2" fill="var(--color-lead)" strokeWidth="2.5" />
              </g>
              {/* Het vel op het bed, met de zin erop */}
              <rect x="156" y="168" width="88" height="10" rx="1" fill="var(--color-canvas)" strokeWidth="1.5" />
              {/* De hendel */}
              <g className="pers-hendel-tekening" style={{ transform: `rotate(${lever}deg)`, transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`, transition: dragging ? 'none' : 'transform 420ms var(--ease-out-expo)' }}>
                <path d={`M${PIVOT.x} ${PIVOT.y} 340 54`} strokeWidth="6" fill="none" className="pers-ijzer" />
                <path d="M334 57 378 36" strokeWidth="13" stroke="var(--color-oak)" fill="none" />
                <circle cx={PIVOT.x} cy={PIVOT.y} r="7" fill="var(--color-iron)" strokeWidth="2" />
              </g>
            </g>
          </svg>
        )}
        <button
          type="button"
          className="pers-hendel"
          data-sleept={dragging}
          aria-label={p.hendel}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={() => {
            setDragging(false)
            setAngle(0)
          }}
          onClick={() => {
            // Na slepen telt de klik niet nog een keer
            if (dragged.current) {
              dragged.current = false
              return
            }
            store.pull()
          }}
        />
        {!hinted && !painted && (
          <p className="tag pers-hint" aria-hidden="true">
            {p.hint}
          </p>
        )}
        {printed && letters && pulls > 0 && (
          <div className="pers-vel paper" key={pulls} data-beweegt={!reduced} aria-hidden="true">
            <span style={{ fontFamily: fontStack(letters.kop), fontWeight: printed.kopStijl.weight, color: printed.inkt }}>{printed.zin}</span>
          </div>
        )}
      </div>

      <div className="pers-zij">
      {/* In 3D past de hint niet over het podium; hij staat eronder, met de drukker */}
      {!hinted && painted && (
        <p className="tag pers-hint-onder" aria-hidden="true">
          {p.hint}
        </p>
      )}
      <Drukker />
      <div className="pers-knoppen">
        <button type="button" className="plaque" onClick={() => store.pull()}>
          {p.trek}
        </button>
        {printed && (
          <button type="button" className="inked" onClick={() => store.hang()}>
            {p.hang}
          </button>
        )}
        <button type="button" className="quiet" disabled={!canUndo} onClick={() => store.undo()}>
          {p.ongedaan}
        </button>
      </div>

      {recent.length > 0 && (
        <div className="eerder">
          <h3 className="hand eerder-kop">{p.eerder}</h3>
          <ul className="eerder-lijst">
            {recent.map((z, i) => {
              const kop = familyOf(z.kop)
              const tekst = familyOf(z.tekst)
              const current = JSON.stringify(z) === JSON.stringify(zetsel)
              return (
                <li key={i}>
                  <button type="button" className="slip paper eerder-vel" aria-label={p.terugpakken(kop, tekst)} aria-pressed={current} onClick={() => store.continueFrom(z)}>
                    {kop === tekst ? kop : `${kop} + ${tekst}`}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      </div>
    </section>
  )
}
