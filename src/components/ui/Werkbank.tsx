import { strings } from '../../content/strings'
import { MOODS } from '../../lib/type/catalogue'
import { GOALS } from '../../lib/type/goals'
import { ROLES } from '../../lib/type/zetsel'
import { familyOf, store, useLetters } from '../../lib/store'
import { Voorstel } from './Voorstel'
import { Woord } from './Woord'

/**
 * De werkbank: drie dingen, in elke volgorde. Jouw letter (met een klem), het doel, en de stemming.
 * Daaronder het voorstel van de drukker
 */
export function Werkbank({ dropzone }: { dropzone?: React.ReactNode }) {
  const z = useLetters((s) => s.zetsel)
  const catalogue = useLetters((s) => s.catalogue)
  const w = strings.werkbank
  return (
    <section className="werkbank paper" aria-labelledby="werkbank-kop">
      <h2 id="werkbank-kop" className="paneel-kop">
        {w.kop}
      </h2>
      <p className="paneel-uitleg">{w.uitleg}</p>

      <fieldset className="werkbank-deel">
        <legend>
          <Woord uitleg={strings.winkelhaak.uitleg.klem}>{w.letterKop}</Woord>
        </legend>
        <p className="klein-uitleg">{w.letterUitleg}</p>
        {z.klem ? (
          <p className="klem-staat">
            <span className="klem" aria-hidden="true" />
            <span>{w.klemOp(familyOf(z[z.klem]), z.klem)}</span>
            <button type="button" className="quiet" onClick={() => store.clamp(null)}>
              {w.klemEraf}
            </button>
          </p>
        ) : (
          <div className="knoppenrij">
            {ROLES.map((role) => (
              <button key={role} type="button" className="slip paper klem-knop" disabled={!catalogue} onClick={() => store.clamp(role)}>
                <span className="klem" aria-hidden="true" />
                {w.zetKlem(role)}: <span className="hand">{familyOf(z[role])}</span>
              </button>
            ))}
          </div>
        )}
        {dropzone}
      </fieldset>

      <fieldset className="werkbank-deel">
        <legend>{w.doelKop}</legend>
        <div className="keuzes" role="radiogroup" aria-label={w.doelKop}>
          {GOALS.map((goal) => (
            <label key={goal} className="keuze" data-aan={z.doel === goal}>
              <input type="radio" name="doel" value={goal} checked={z.doel === goal} onChange={() => store.goal(goal)} />
              <span className="keuze-naam">{strings.doelen[goal].naam}</span>
              <span className="keuze-uitleg">{strings.doelen[goal].uitleg}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="werkbank-deel">
        <legend>{w.stemmingKop}</legend>
        <p className="klein-uitleg">{w.stemmingUitleg}</p>
        <div className="stemmingen">
          {MOODS.map((mood) => (
            <label key={mood} className="stemming" data-aan={z.stemming.includes(mood)}>
              <input type="checkbox" checked={z.stemming.includes(mood)} onChange={() => store.mood(mood)} />
              {strings.stemmingen[mood]}
            </label>
          ))}
        </div>
      </fieldset>

      <Voorstel />
    </section>
  )
}
