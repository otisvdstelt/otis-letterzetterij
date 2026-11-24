import { useRef, useSyncExternalStore } from 'react'
import { strings } from '../../content/strings'
import type { Phase } from '../../lib/air'
import { sound } from '../../lib/sound'
import { lettersOf, store, useLetters } from '../../lib/store'
import { Schakelaar } from './Schakelaar'

const PORTFOLIO = 'https://otisstelt.vercel.app'

/** Het colofon: wat het is, wie het maakte, wat er met je gegevens gebeurt (niks), de letters en hun licenties, en de bronnen */
export function Colofon({ phase, onPhase }: { phase: Phase; onPhase: (phase: Phase) => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const letters = useLetters((s) => lettersOf(s.zetsel, s))
  const quiet = useLetters((s) => s.quiet)
  const loud = useSyncExternalStore(sound.subscribe, sound.on)
  const dark = phase === 'night'
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
          <h3>{c.drukkerKop}</h3>
          <p>{c.drukkerUitleg}</p>
          <div className="colofon-schakelaars">
            <Schakelaar label={strings.drukkerStil.label} on={quiet} off={strings.drukkerStil.praat} onWord={strings.drukkerStil.stil} toggle={() => store.setQuiet(!quiet)} />
            <span className="colofon-telefoon">
              <Schakelaar label={strings.geluid.label} on={loud} off={strings.geluid.uit} onWord={strings.geluid.aan} toggle={() => sound.set(!loud)} />
              <Schakelaar label={strings.uur.label} on={dark} off={strings.uur.dag} onWord={strings.uur.nacht} toggle={() => onPhase(dark ? 'day' : 'night')} />
            </span>
          </div>
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
