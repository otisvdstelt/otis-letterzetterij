import { useEffect, useRef } from 'react'
import { strings } from '../../content/strings'
import { familyOf, store, useLetters } from '../../lib/store'

/** Wie een link krijgt, krijgt een welkom: iemand heeft dit vel voor je gezet. Hang het op, of zet het verder */
export function Welkom() {
  const welcome = useLetters((s) => s.welcome)
  const z = useLetters((s) => s.zetsel)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (welcome) heading.current?.focus()
  }, [welcome])
  if (!welcome) return null
  const w = strings.welkom
  const replaced = welcome.replaced
  return (
    <section className="welkom paper" aria-labelledby="welkom-kop">
      <h2 id="welkom-kop" className="welkom-kop" tabIndex={-1} ref={heading}>
        {w.kop}
      </h2>
      <p>{w.uitleg(familyOf(z.kop), familyOf(z.tekst))}</p>
      {replaced.kop && <p className="klein-uitleg">{strings.vel.eigenVervangen(replaced.kop, familyOf(z.kop))}</p>}
      {replaced.tekst && <p className="klein-uitleg">{strings.vel.eigenVervangen(replaced.tekst, familyOf(z.tekst))}</p>}
      <div className="knoppenrij">
        <button type="button" className="plaque" onClick={() => store.welcomeDone(true)}>
          {w.hang}
        </button>
        <button type="button" className="inked" onClick={() => store.welcomeDone(false)}>
          {w.verder}
        </button>
      </div>
    </section>
  )
}
