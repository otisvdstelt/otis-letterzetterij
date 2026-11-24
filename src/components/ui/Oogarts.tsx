import { useEffect, useRef } from 'react'
import { strings } from '../../content/strings'
import { fontStack } from '../../lib/type/fontface'
import { fontById, store, useLetters } from '../../lib/store'
import { useFontFaces } from '../../hooks/useFontFaces'

const o = strings.oogarts

/**
 * Deze of deze? Zoals bij de oogarts: twee kaartjes met jouw tekst, zonder namen. Eerst voor de kop, dan voor de tekst.
 * Van zestien naar één in zes tot acht rondes
 */
export function Oogarts() {
  const oogarts = useLetters((s) => s.oogarts)
  const z = useLetters((s) => s.zetsel)
  const ref = useRef<HTMLDialogElement>(null)
  const pair = oogarts?.staat.paar ?? null
  const fonts = (pair ?? []).map((id) => fontById(id)).filter((f) => f !== null)
  const kop = oogarts?.kop ? fontById(oogarts.kop) : null
  useFontFaces(kop ? [...fonts, kop] : fonts)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (oogarts && !d.open) d.showModal()
    if (!oogarts && d.open) d.close()
  }, [oogarts])

  const alinea = z.eigen.alinea.split(/\n\s*\n/)[0]?.trim() || strings.zetsel.website.intro
  return (
    <dialog ref={ref} className="oogarts paper" aria-labelledby="oogarts-kop" onCancel={() => store.stopOogarts()}>
      {oogarts && (
        <>
          <div className="paneel-boven">
            <h2 id="oogarts-kop" className="toonbank-kop">
              {o.kop} <span className="hand">{o.fase[oogarts.fase]}</span>
            </h2>
            <button type="button" className="quiet" onClick={() => store.stopOogarts()}>
              {o.stop}
            </button>
          </div>
          <p className="klein-uitleg">{o.uitleg(oogarts.fase)}</p>
          <p className="hand oogarts-ronde" aria-live="polite">
            {o.ronde(oogarts.staat.ronde, oogarts.staat.stapel.length)}
          </p>
          <div className="oogarts-kaartjes">
            {fonts.map((f, i) => (
              <button key={f.id} type="button" className="oogarts-kaart slip paper" aria-label={o.dezeLabel(o.kanten[i])} onClick={() => store.oogartsKies(f.id)}>
                {oogarts.fase === 'kop' ? (
                  <span className="oogarts-kop" style={{ fontFamily: fontStack(f) }}>
                    {z.zin}
                  </span>
                ) : (
                  <>
                    {kop && (
                      <span className="oogarts-kop klein" style={{ fontFamily: fontStack(kop) }}>
                        {z.zin}
                      </span>
                    )}
                    <span className="oogarts-tekst" style={{ fontFamily: fontStack(f) }}>
                      {alinea}
                    </span>
                  </>
                )}
                <span className="oogarts-deze hand">{o.deze}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </dialog>
  )
}
