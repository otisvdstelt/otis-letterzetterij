import { strings, waaromZin } from '../../content/strings'
import { waaromPaar } from '../../lib/type/paar'
import { fontStack } from '../../lib/type/fontface'
import { lettersOf, store, useLetters } from '../../lib/store'

/** Stap drie, bij de pers: welk paar er in de pers ligt, en waarom het werkt. Je tekst staat op de werkbank */
export function PersPaneel() {
  const letters = useLetters((s) => lettersOf(s.zetsel, s))
  const zin = useLetters((s) => s.zetsel.zin)
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
      {letters && <p className="klein-uitleg waarom-nu">{waaromZin(waaromPaar(letters.kop, letters.tekst))}</p>}
      <p className="klein-uitleg pers-zin">“{zin}”</p>
      <button type="button" className="quiet naar-tekst" onClick={() => store.look('werkbank')}>
        {strings.vel.naarWerkbank}
      </button>
    </section>
  )
}
