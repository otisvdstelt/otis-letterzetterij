import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { strings } from '../../content/strings'
import { buildScale } from '../../lib/type/scale'
import { withFont } from '../../lib/type/zetsel'
import type { Suggestion } from '../../lib/type/pairing'
import { currentSuggestions, fontById, store, useLetters } from '../../lib/store'
import { Vel } from './Vel'

const p = strings.proef

/** Zo breed staat het vel op de toonbank; in de proefdruk wordt het hele vel naar de kolom geschaald */
const VEL_BREED = 440

/** Een vel op zijn echte breedte, als geheel verkleind tot het in de kolom past. Geen afgeknipte randen, geen scrollbalk per kolom */
function Geschaald({ children }: { children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ scale: 1, height: 0 })
  useEffect(() => {
    const o = outer.current
    const i = inner.current
    if (!o || !i) return
    const measure = () => setSize({ scale: Math.min(1, o.clientWidth / VEL_BREED), height: i.offsetHeight })
    const observer = new ResizeObserver(measure)
    observer.observe(o)
    observer.observe(i)
    measure()
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={outer} className="geschaald" style={{ height: size.height * size.scale || undefined }}>
      <div ref={inner} style={{ width: VEL_BREED, transform: `scale(${size.scale})`, transformOrigin: '0 0' }}>
        {children}
      </div>
    </div>
  )
}

/**
 * De drie paren van de drukker naast elkaar, met dezelfde tekst. Je kiest door te kijken, zonder namen.
 * Na "Deze" zie je welke drie het waren, zoals bij de oogarts, en druk je hem
 */
export function Proefdruk() {
  const list = useLetters(currentSuggestions)
  const z = useLetters((s) => s.zetsel)
  // De drie van het moment dat je begon: als je kiest, verandert het voorstel niet onder je handen
  const [drie] = useState(() => list)
  const [gekozen, setGekozen] = useState<number | null>(null)
  const [zicht, setZicht] = useState(0)
  const rij = useRef<HTMLOListElement>(null)
  const vellen = useMemo(
    () =>
      drie.flatMap((s) => {
        const kop = fontById(s.kop)
        const tekst = fontById(s.tekst)
        if (!kop || !tekst) return []
        const zetsel = withFont(withFont(z, 'kop', kop), 'tekst', tekst)
        return [{ s, kop, tekst, zetsel, scale: buildScale(zetsel, kop, tekst) }]
      }),
    [drie, z],
  )

  // Op een telefoon staat er één proef in beeld; de stipjes volgen het vegen
  const onScroll = () => {
    const el = rij.current
    const first = el?.firstElementChild as HTMLElement | null
    if (!el || !first) return
    setZicht(Math.round(el.scrollLeft / (first.offsetWidth + 12)))
  }
  const naar = (i: number) => {
    const el = rij.current?.children[i] as HTMLElement | undefined
    el?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }

  const keuze: Suggestion | null = gekozen === null ? null : (vellen[gekozen]?.s ?? null)
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
      <p className="klein-uitleg" aria-live="polite">
        {keuze ? p.namen : p.uitleg}
      </p>
      {keuze && (
        <div className="knoppenrij">
          <button type="button" className="inked" onClick={() => store.proefKies(keuze)}>
            {p.druk}
          </button>
        </div>
      )}
      <div className="proef-stipjes" role="group" aria-label={p.stipjes}>
        {vellen.map((_, i) => (
          <button key={i} type="button" className="stipje" aria-label={p.proefLabel(i + 1)} aria-current={zicht === i} onClick={() => naar(i)} />
        ))}
      </div>
      <ol ref={rij} className="proef-vellen" onScroll={onScroll}>
        {vellen.map(({ s, kop, tekst, zetsel, scale }, i) => (
          <li key={`${s.kop}|${s.tekst}`} className="proef-vel" data-gekozen={gekozen === i}>
            <div className="proef-boven">
              {gekozen === null ? (
                <button type="button" className="inked" aria-label={p.dezeLabel(i + 1)} onClick={() => setGekozen(i)}>
                  {p.deze}
                </button>
              ) : (
                <>
                  <p className="proef-naam">
                    {p.paar(kop.family, tekst.family)}
                    {gekozen === i && <span className="hand"> · {p.gekozen}</span>}
                  </p>
                  {gekozen !== i && (
                    <button type="button" className="quiet" aria-label={p.tochLabel(kop.family, tekst.family)} onClick={() => setGekozen(i)}>
                      {p.toch}
                    </button>
                  )}
                </>
              )}
            </div>
            <Geschaald>
              <Vel zetsel={zetsel} kop={kop} tekst={tekst} scale={scale} start="kop" label={gekozen === null ? p.proefLabel(i + 1) : undefined} />
            </Geschaald>
          </li>
        ))}
      </ol>
    </section>
  )
}
