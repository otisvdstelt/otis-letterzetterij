import { useId, useState } from 'react'
import { strings } from '../../content/strings'
import { MAX_EIGEN, type EigenTekst } from '../../lib/type/zetsel'
import { store, useLetters } from '../../lib/store'
import { ZinVeld } from './Winkelhaak'

const j = strings.jouwTekst

/** Begin met jouw tekst: je kop, en als je wilt een naam, een alinea, een knop en een menu. Elk sjabloon zet die */
export function JouwTekst() {
  const eigen = useLetters((s) => s.zetsel.eigen)
  const [meer, setMeer] = useState(() => Object.values(eigen).some((v) => v.trim()))
  const id = useId()
  const set = (key: keyof EigenTekst, value: string) => store.update({ eigen: { ...eigen, [key]: value } }, `eigen-${key}`)
  const veld = (key: Exclude<keyof EigenTekst, 'alinea'>) => (
    <div className="field">
      <label htmlFor={`${id}-${key}`}>{j[key]}</label>
      <input id={`${id}-${key}`} type="text" value={eigen[key]} maxLength={MAX_EIGEN[key] * 2} onChange={(e) => set(key, e.target.value)} />
    </div>
  )
  return (
    <div className="jouw-tekst werkbank-deel">
      <ZinVeld label={j.zin} />
      <button type="button" className="quiet jouw-letter" aria-expanded={meer} onClick={() => setMeer(!meer)}>
        {meer ? j.minder : j.meer}
      </button>
      {meer && (
        <div className="jouw-tekst-meer">
          {veld('naam')}
          <div className="field">
            <label htmlFor={`${id}-alinea`}>{j.alinea}</label>
            <textarea id={`${id}-alinea`} rows={4} value={eigen.alinea} maxLength={MAX_EIGEN.alinea * 2} onChange={(e) => set('alinea', e.target.value)} aria-describedby={`${id}-alinea-uitleg`} />
            <p id={`${id}-alinea-uitleg`} className="klein-uitleg">
              {j.alineaUitleg}
            </p>
          </div>
          {veld('knop')}
          {veld('menu')}
          <p className="klein-uitleg">{j.linkUitleg}</p>
        </div>
      )}
    </div>
  )
}
