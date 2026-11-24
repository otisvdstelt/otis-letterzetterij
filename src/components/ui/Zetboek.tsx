import { useEffect, useRef } from 'react'
import { strings } from '../../content/strings'
import { familyOf, store, useLetters } from '../../lib/store'

const SEEN = 'letterzetterij-zetboek'
const seen = () => {
  try {
    return window.localStorage.getItem(SEEN) === '1'
  } catch {
    return false
  }
}
const markSeen = () => {
  try {
    window.localStorage.setItem(SEEN, '1')
  } catch {
    // Dan ligt het boek de volgende keer weer open
  }
}

const b = strings.zetboek

/**
 * Het zetboek: opdrachten om mee te beginnen. Elk heeft een doel, een gevoel en een paar, en drukt meteen.
 * Bij een eerste bezoek ligt het open. Je kunt het sluiten en zelf beginnen
 */
export function Zetboek({ firstVisit }: { firstVisit: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const catalogue = useLetters((s) => s.catalogue)

  useEffect(() => {
    if (!firstVisit || !catalogue || seen()) return
    markSeen()
    dialog.current?.showModal()
  }, [firstVisit, catalogue])

  const open = () => {
    markSeen()
    dialog.current?.showModal()
  }

  return (
    <>
      <button type="button" className="slip paper schakelaar kop-boek" aria-haspopup="dialog" onClick={open}>
        {b.knop}
      </button>
      <dialog ref={dialog} className="colofon boek" aria-labelledby="zetboek-kop" onClick={(event) => event.target === dialog.current && dialog.current?.close()}>
        <div className="colofon-vel boek-vel">
          <div className="colofon-boven">
            <h2 id="zetboek-kop" className="colofon-kop">
              {b.kop}
            </h2>
            <button type="button" className="quiet" onClick={() => dialog.current?.close()}>
              {b.sluit}
            </button>
          </div>
          <p className="boek-intro">{b.intro}</p>
          <ol className="boek-bladzijden">
            {b.opdrachten.map((op) => (
              <li key={op.id} className="bladzijde">
                <p className="bladzijde-naam">{op.naam}</p>
                <p className="bladzijde-uitleg">{op.uitleg}</p>
                <p className="bladzijde-recept hand">
                  {strings.doelen[op.doel].naam}, {op.gevoel.map((g) => strings.stemmingen[g]).join(' en ')}: {strings.vel.letters(familyOf(op.kop), familyOf(op.tekst))}
                </p>
                <button
                  type="button"
                  className="inked"
                  disabled={!catalogue}
                  aria-label={`${b.druk}: ${op.naam}`}
                  onClick={() => {
                    store.opdracht(op)
                    dialog.current?.close()
                  }}
                >
                  {b.druk}
                </button>
              </li>
            ))}
          </ol>
          <button type="button" className="quiet" onClick={() => dialog.current?.close()}>
            {b.zelf}
          </button>
        </div>
      </dialog>
    </>
  )
}
