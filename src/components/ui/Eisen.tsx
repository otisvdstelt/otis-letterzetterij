import { useState, type KeyboardEvent } from 'react'
import { strings } from '../../content/strings'
import { EISEN } from '../../lib/type/zoek'
import { store, useLetters } from '../../lib/store'

/** Een rij knopjes: één tabstop, de pijltjes lopen erdoor */
function walk(event: KeyboardEvent<HTMLDivElement>) {
  const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
  if (!step) return
  const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button')]
  const at = buttons.indexOf(document.activeElement as HTMLButtonElement)
  const to = (at + step + buttons.length) % buttons.length
  event.preventDefault()
  for (const b of buttons) b.tabIndex = -1
  buttons[to].tabIndex = 0
  buttons[to].focus()
}

/** Wat moet het kunnen? Eisen vooraf: een letter die het niet kan, gaat grijs, en de drukker legt hem nooit voor */
export function Eisen() {
  const eisen = useLetters((s) => s.eisen)
  const [open, setOpen] = useState(eisen.length > 0)
  const e = strings.eisen
  return (
    <div className="werkbank-deel">
      <button type="button" className="quiet jouw-letter" aria-expanded={open} onClick={() => setOpen(!open)}>
        {e.knop}
        {eisen.length > 0 && ` (${eisen.length})`}
      </button>
      {open && (
        <>
          <p className="klein-uitleg">{e.uitleg}</p>
          <div className="gevoelens" role="group" aria-label={e.knop} onKeyDown={walk}>
            {EISEN.map((eis, i) => (
              <button key={eis} type="button" className="gevoel" tabIndex={i === 0 ? 0 : -1} aria-pressed={eisen.includes(eis)} onClick={() => store.toggleEis(eis)}>
                {e.namen[eis]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
