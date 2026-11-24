import { useEffect, useRef, useState, type ReactNode } from 'react'
import { strings } from '../../content/strings'

/**
 * Op een telefoon is het vel een blad dat van onder omhoog schuift. Ingeklapt steekt de bovenkant uit,
 * zodat je je kop altijd ziet veranderen. Tik of veeg omhoog om het te openen, omlaag om het weg te schuiven
 */
export function Onderblad({ children, label }: { children: ReactNode; label: string }) {
  const [open, setOpen] = useState(false)
  const start = useRef<number | null>(null)
  const sheet = useRef<HTMLElement>(null)
  const b = strings.onderblad

  // Escape schuift het weer omlaag
  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [open])

  return (
    <section ref={sheet} className="onderblad paper" data-open={open} aria-label={label}>
      <button
        type="button"
        className="onderblad-greep"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        onPointerDown={(event) => {
          start.current = event.clientY
        }}
        onPointerUp={(event) => {
          if (start.current === null) return
          const dy = event.clientY - start.current
          start.current = null
          if (dy < -30) setOpen(true)
          if (dy > 30) setOpen(false)
        }}
      >
        <span className="onderblad-streep" aria-hidden="true" />
        <span className="hand">{open ? b.dicht : b.open}</span>
      </button>
      <div className="onderblad-inhoud">
        {children}
      </div>
    </section>
  )
}
