import { oplossing, strings } from '../../content/strings'
import { currentRemarks, store, useLetters } from '../../lib/store'

/**
 * De drukker zegt iets, op een papiertje. Alleen het belangrijkste; de rest staat bij Leesbaar.
 * Wat hij zegt, komt ook in de aria-live-regio. Hij is stil te zetten
 */
export function Drukker() {
  const quiet = useLetters((s) => s.quiet)
  const list = useLetters(currentRemarks)
  const first = list[0]
  if (quiet || !first) return null
  const words = store.words(first)
  return (
    <div className="drukker" data-toon={first.tone}>
      <p className="tag drukker-ballon" aria-live="polite">
        <span>{words}</span>
        <span className="drukker-wie">{strings.briefje.groet}</span>
      </p>
      {first.fix && (
        <button type="button" className="inked klein drukker-fix" onClick={() => store.fix(first)}>
          {oplossing(first.fix.id, first.fix.params, first.id)}
        </button>
      )}
    </div>
  )
}
