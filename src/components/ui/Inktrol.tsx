import { useIsFetching } from '@tanstack/react-query'
import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react'
import { strings } from '../../content/strings'
import { progress } from '../../lib/progress'

/** De Suspense-fallback. Hij tekent niets en zegt de inktrol alleen dat hij moet blijven rollen */
export function Rollend() {
  useLayoutEffect(() => progress.hold(), [])
  return null
}

/** Een inktrol in de hoek die heen en weer rolt zolang er iets wordt opgehaald */
export function Inktrol() {
  const pending = useSyncExternalStore(progress.subscribe, progress.pending)
  const fetching = useIsFetching() > 0
  const busy = pending || fetching
  // Blijf nog even staan als het klaar is, lang genoeg om de streep vol te zien lopen
  const [shown, setShown] = useState(busy)
  if (busy && !shown) setShown(true)

  useEffect(() => {
    if (busy) return
    const timer = window.setTimeout(() => setShown(false), 1300)
    return () => window.clearTimeout(timer)
  }, [busy])

  return shown ? <Roller done={!busy} /> : null
}

function Roller({ done }: { done: boolean }) {
  // Eerst zonder streep getekend, zodat het volgende frame iets heeft om uit te rollen
  const [filling, setFilling] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setFilling(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="inktrol" data-filling={filling} data-done={done} role="status" aria-live="polite">
      <svg viewBox="0 0 160 90" aria-hidden="true">
        {/* De streep inkt die hij achterlaat, eerst nat uitgelopen en dan scherp */}
        <g filter="url(#bleed)" opacity="0.35">
          <rect className="inktrol-streep" x="14" y="74" width="114" height="8" rx="3" fill="#2c2823" />
        </g>
        <g filter="url(#wobble)">
          <rect className="inktrol-streep" x="14" y="75" width="114" height="6" rx="2" fill="#2c2823" fillOpacity="0.85" />
        </g>
        <g className="inktrol-rol" filter="url(#wobble)">
          {/* De beugel en het handvat, schuin omhoog naar achteren */}
          <path d="M30 62 46 22" fill="none" stroke="#33363b" strokeWidth="4" strokeLinecap="round" />
          <path d="M44 26 54 6" fill="none" stroke="#5a3d29" strokeWidth="9" strokeLinecap="round" />
          {/* De rol zelf, van rubber, met een glimlijn die meedraait */}
          <g className="inktrol-wiel">
            <circle cx="30" cy="62" r="13" fill="#2c2823" />
            <circle cx="30" cy="62" r="13" fill="none" stroke="#4b4e52" strokeWidth="2.5" />
            <path d="M22 56a10 10 0 0 1 9-5" fill="none" stroke="#fcfaf3" strokeOpacity="0.6" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="30" cy="62" r="2.6" fill="#9a9ea4" />
          </g>
        </g>
      </svg>
      <span className="sr-only">{done ? strings.laden.klaar : strings.laden.bezig}</span>
    </div>
  )
}
