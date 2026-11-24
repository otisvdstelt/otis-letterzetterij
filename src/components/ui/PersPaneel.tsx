import { strings } from '../../content/strings'
import { fontStack } from '../../lib/type/fontface'
import { lettersOf, store, useLetters } from '../../lib/store'
import { ZinVeld } from './Winkelhaak'

/** Stap drie, bij de pers: welk paar er in de pers ligt, en je zin in de winkelhaak */
export function PersPaneel() {
  const letters = useLetters((s) => lettersOf(s.zetsel, s))
  return (
    <section className="paneel pers-paneel" aria-labelledby="pers-paneel-kop">
      <div className="paneel-boven">
        <h2 id="pers-paneel-kop" className="paneel-naam">
          {strings.stappen.namen.pers}
        </h2>
        <button type="button" className="quiet" onClick={() => store.look('kast')}>
          ← {strings.stappen.namen.kast}
        </button>
      </div>
      {letters && (
        <p className="in-de-pers">
          <span style={{ fontFamily: fontStack(letters.kop) }}>{letters.kop.family}</span>
          {letters.kop.id !== letters.tekst.id && (
            <>
              <span className="hand"> met </span>
              <span style={{ fontFamily: fontStack(letters.tekst) }}>{letters.tekst.family}</span>
            </>
          )}
        </p>
      )}
      <ZinVeld titel />
    </section>
  )
}
