import { useRef } from 'react'
import { strings } from '../../content/strings'
import { lettersOf, useLetters } from '../../lib/store'

const PORTFOLIO = 'https://otisstelt.vercel.app'

/** Het colofon: wat het is, wie het maakte, wat er met je gegevens gebeurt (niks), de letters en hun licenties, en de bronnen */
export function Colofon() {
  const dialog = useRef<HTMLDialogElement>(null)
  const letters = useLetters((s) => lettersOf(s.zetsel, s))
  const c = strings.colofon
  const inUse = letters ? [...new Map([letters.kop, letters.tekst].map((f) => [f.id, f])).values()] : []
  return (
    <>
      <button type="button" className="slip paper schakelaar kop-over" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
        {c.knop}
      </button>
      <dialog ref={dialog} className="colofon" aria-labelledby="colofon-kop" onClick={(event) => event.target === dialog.current && dialog.current?.close()}>
        <div className="colofon-vel">
          <div className="colofon-boven">
            <h2 id="colofon-kop" className="colofon-kop">
              {c.kop}
            </h2>
            <button type="button" className="quiet" onClick={() => dialog.current?.close()}>
              {c.sluit}
            </button>
          </div>
          <h3>{c.watKop}</h3>
          <p>{c.wat}</p>
          <h3>{c.wieKop}</h3>
          <p>
            {c.wie}{' '}
            <a className="pen-link" href={PORTFOLIO}>
              {c.portfolio}
            </a>
          </p>
          <h3>{c.privacyKop}</h3>
          <p>{c.privacy}</p>
          <h3>{c.lettersKop}</h3>
          <p>{c.letters}</p>
          {inUse.length > 0 && (
            <>
              <p className="hand">{c.inGebruik}</p>
              <ul>
                {inUse.map((f) => (
                  <li key={f.id}>{strings.meenemen.licentieRegel(f.family, f.license)}</li>
                ))}
              </ul>
            </>
          )}
          <h3>{c.bronnenKop}</h3>
          <ul>
            {c.bronnen.map(([label, href]) => (
              <li key={label}>
                <a className="pen-link" href={href} rel="noreferrer">
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <p>
            <a className="pen-link" href={c.codeLink} rel="noreferrer">
              {c.code}
            </a>
          </p>
        </div>
      </dialog>
    </>
  )
}
