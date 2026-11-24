import { useMemo } from 'react'
import { strings } from '../../content/strings'
import { buildScale } from '../../lib/type/scale'
import { withFont } from '../../lib/type/zetsel'
import { currentSuggestions, fontById, store, useLetters } from '../../lib/store'
import { Vel } from './Vel'

const p = strings.proef

/** De drie paren van de drukker naast elkaar, met dezelfde tekst. Je kiest door te kijken; dat paar wordt het jouwe */
export function Proefdruk() {
  const list = useLetters(currentSuggestions)
  const z = useLetters((s) => s.zetsel)
  const vellen = useMemo(
    () =>
      list.flatMap((s) => {
        const kop = fontById(s.kop)
        const tekst = fontById(s.tekst)
        if (!kop || !tekst) return []
        const zetsel = withFont(withFont(z, 'kop', kop), 'tekst', tekst)
        return [{ s, kop, tekst, zetsel, scale: buildScale(zetsel, kop, tekst) }]
      }),
    [list, z],
  )
  return (
    <section className="proefdruk" aria-labelledby="proef-kop">
      <div className="paneel-boven">
        <h2 id="proef-kop" className="toonbank-kop">
          {p.kop}
        </h2>
        <button type="button" className="quiet" onClick={() => store.proefdruk(false)}>
          {p.sluit}
        </button>
      </div>
      <p className="klein-uitleg">{p.uitleg}</p>
      <ol className="proef-vellen">
        {vellen.map(({ s, kop, tekst, zetsel, scale }) => (
          <li key={`${s.kop}|${s.tekst}`} className="proef-vel">
            <button type="button" className="inked" aria-label={p.dezeLabel(kop.family, tekst.family)} onClick={() => store.proefKies(s)}>
              {p.deze}
            </button>
            <div className="vel-houder" tabIndex={0} aria-label={p.dezeLabel(kop.family, tekst.family)}>
              <Vel zetsel={zetsel} kop={kop} tekst={tekst} scale={scale} compact />
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
