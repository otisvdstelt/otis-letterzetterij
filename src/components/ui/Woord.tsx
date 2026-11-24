import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { strings } from '../../content/strings'

/**
 * Een drukkerswoord met uitleg erbij: met de muis erover, met een tik, of met het toetsenbord.
 * Escape of ergens anders tikken sluit hem weer
 */
export function Woord({ children, uitleg }: { children: ReactNode; uitleg: string }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(false)
  const root = useRef<HTMLSpanElement>(null)
  const shown = open || hover

  useEffect(() => {
    if (!open) return
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', close)
    document.addEventListener('pointerdown', close)
    return () => {
      document.removeEventListener('keydown', close)
      document.removeEventListener('pointerdown', close)
    }
  }, [open])

  return (
    <span className="woord" ref={root} onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)} onPointerLeave={() => setHover(false)}>
      {children}
      <button type="button" className="woord-vraag" aria-expanded={shown} aria-describedby={shown ? id : undefined} aria-label={`${strings.winkelhaak.wat}`} onClick={() => setOpen(!open)}>
        <span aria-hidden="true">?</span>
      </button>
      {shown && (
        <span role="tooltip" id={id} className="tag woord-uitleg">
          {uitleg}
        </span>
      )}
    </span>
  )
}
