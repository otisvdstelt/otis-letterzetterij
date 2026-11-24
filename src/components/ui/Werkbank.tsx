import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { strings } from '../../content/strings'
import { MOODS } from '../../lib/type/catalogue'
import { GOALS } from '../../lib/type/goals'
import { ROLES } from '../../lib/type/zetsel'
import { familyOf, store, useLetters } from '../../lib/store'
import { Woord } from './Woord'

const w = strings.werkbank

/** Gevoelens als een rij knopjes: één tabstop, de pijltjes lopen erdoor, spatie of Enter zet er een aan of uit */
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

/**
 * Stap één, aan de werkbank: waar is het voor, hoe moet het voelen, en heb je al een letter.
 * Smal, als een lijstje naast de drukkerij
 */
export function Werkbank({ eigen }: { eigen?: ReactNode }) {
  const z = useLetters((s) => s.zetsel)
  const catalogue = useLetters((s) => s.catalogue)
  const [letter, setLetter] = useState(z.klem !== null)
  return (
    <section className="paneel werkbank" aria-labelledby="werkbank-kop">
      <h2 id="werkbank-kop" className="paneel-naam">
        {strings.stappen.namen.werkbank}
      </h2>

      <fieldset className="werkbank-deel">
        <legend>{w.doelKort}</legend>
        <div className="doelen" role="radiogroup" aria-label={w.doelKort}>
          {GOALS.map((goal) => (
            <label key={goal} className="doel" data-aan={z.doel === goal} title={strings.doelen[goal].uitleg}>
              <input type="radio" name="doel" value={goal} checked={z.doel === goal} onChange={() => store.goal(goal)} />
              <span>{strings.doelen[goal].naam}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="werkbank-deel">
        <legend>{w.stemmingKop}</legend>
        <div className="gevoelens" role="group" aria-label={w.stemmingKop} onKeyDown={walk}>
          {MOODS.map((mood, i) => (
            <button key={mood} type="button" className="gevoel" tabIndex={i === 0 ? 0 : -1} aria-pressed={z.stemming.includes(mood)} onClick={() => store.mood(mood)}>
              {strings.stemmingen[mood]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="werkbank-deel">
        <button type="button" className="quiet jouw-letter" aria-expanded={letter} disabled={!catalogue} onClick={() => setLetter(!letter)}>
          {letter ? w.letterDicht : w.letterKnop}
        </button>
        {letter && (
          <div className="jouw-letter-inhoud">
            <p className="klein-uitleg">
              <Woord uitleg={strings.winkelhaak.uitleg.klem}>{w.letterUitleg}</Woord>
            </p>
            {z.klem ? (
              <p className="klem-staat">
                <span className="klem" aria-hidden="true" />
                <span>{w.klemOp(familyOf(z[z.klem]), z.klem)}</span>
                <button type="button" className="quiet" onClick={() => store.clamp(null)}>
                  {w.klemEraf}
                </button>
              </p>
            ) : (
              ROLES.map((role) => (
                <button key={role} type="button" className="slip paper klem-knop" onClick={() => store.clamp(role)}>
                  <span className="klem" aria-hidden="true" />
                  {w.zetKlem(role)}: <span className="hand">{familyOf(z[role])}</span>
                </button>
              ))
            )}
            {eigen}
          </div>
        )}
      </div>
    </section>
  )
}
