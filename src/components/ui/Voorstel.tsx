import { strings } from '../../content/strings'
import { fontStack } from '../../lib/type/fontface'
import { currentSuggestions, familyOf, fontById, store, useLetters } from '../../lib/store'
import { useFontFaces } from '../../hooks/useFontFaces'

/** Drie paren die de drukker voorstelt, elk met één zin waarom. Je kunt ook alles zelf uit de kast pakken */
export function Voorstel() {
  const list = useLetters(currentSuggestions)
  const z = useLetters((s) => s.zetsel)
  const catalogue = useLetters((s) => s.catalogue)
  const fonts = list.flatMap((s) => [fontById(s.kop), fontById(s.tekst)])
  useFontFaces(fonts)
  const v = strings.voorstel
  if (!catalogue) return null
  return (
    <div className="voorstel" aria-labelledby="voorstel-kop">
      <h3 id="voorstel-kop" className="voorstel-kop">
        {strings.kast.paren}
      </h3>
      <p className="klein-uitleg">{z.klem ? v.uitlegKlem(familyOf(z[z.klem]), z.klem) : v.uitlegVrij(z.doel)}</p>
      {list.length === 0 && <p className="hand">{v.leeg}</p>}
      <ol className="voorstel-lijst">
        {list.map((s) => {
          const kop = fontById(s.kop)
          const tekst = fontById(s.tekst)
          if (!kop || !tekst) return null
          const current = s.kop === z.kop && s.tekst === z.tekst
          return (
            <li key={`${s.kop}|${s.tekst}`} className="voorstel-paar slip paper" data-aan={current}>
              <button type="button" className="voorstel-knop" aria-pressed={current} aria-label={v.pak(kop.family, tekst.family)} onClick={() => store.take(s)}>
                <span className="voorstel-kopletter" style={{ fontFamily: fontStack(kop) }}>
                  {kop.family}
                </span>
                <span className="voorstel-tekstletter" style={{ fontFamily: fontStack(tekst) }}>
                  {tekst.family}
                </span>
              </button>
              <p className="voorstel-waarom">
                {s.reason.kind === 'zetboek' ? s.reason.waarom : s.reason.notes.map(v.notitie).join(' ')}
                {s.reason.kind === 'zetboek' && <span className="voorstel-bron"> · {v.zetboek}</span>}
                {current && <span className="voorstel-bron"> · {v.staatAl}</span>}
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
