import { useId, useState } from 'react'
import { strings } from '../../content/strings'
import { readPasted, type InkAndPaper } from '../../lib/type/flesje'
import { store } from '../../lib/store'

const f = strings.flesje

/** Plak een flesje (of een hele plank) uit de Kleurenalchemist: tekst wordt inkt, achtergrond papier, accent tweede inkt */
export function FlesjePlakken() {
  const id = useId()
  const [text, setText] = useState('')
  const [trouble, setTrouble] = useState<string | null>(null)
  const [choice, setChoice] = useState<InkAndPaper[] | null>(null)

  const use = (value = text) => {
    setChoice(null)
    const pasted = readPasted(value)
    if (!pasted.ok) {
      setTrouble(f.fouten[pasted.reason])
      return
    }
    setTrouble(null)
    if (pasted.flesjes.length === 1) {
      store.inkFrom(pasted.flesjes[0])
      setText('')
    } else setChoice(pasted.flesjes)
  }

  return (
    <div className="flesje-plakken">
      <p className="hand eigen-kop">{f.kop}</p>
      <form
        className="flesje-rij"
        onSubmit={(event) => {
          event.preventDefault()
          use()
        }}
      >
        <div className="field">
          <label htmlFor={id}>{f.label}</label>
          <input
            id={id}
            type="text"
            spellCheck={false}
            autoComplete="off"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onPaste={(event) => {
              const pasted = event.clipboardData.getData('text')
              if (pasted) {
                event.preventDefault()
                setText(pasted)
                use(pasted)
              }
            }}
            aria-describedby={`${id}-uitleg`}
          />
        </div>
        <button type="submit" className="inked klein" disabled={!text.trim()}>
          {f.knop}
        </button>
      </form>
      <p id={`${id}-uitleg`} className="klein-uitleg">
        {f.uitleg}
      </p>
      {trouble && (
        <p className="hand eigen-fout" role="alert">
          {trouble}
        </p>
      )}
      {choice && (
        <div className="flesje-keuze">
          <p className="klein-uitleg">{f.kies}</p>
          <ul>
            {choice.map((flesje, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="slip paper flesje-knop"
                  onClick={() => {
                    store.inkFrom(flesje)
                    setChoice(null)
                    setText('')
                  }}
                >
                  <span className="flesje-stalen" aria-hidden="true">
                    {[flesje.papier, flesje.inkt, flesje.tweedeInkt].filter(Boolean).map((hex) => (
                      <span key={hex} style={{ background: hex ?? undefined }} />
                    ))}
                  </span>
                  {f.pak(flesje.naam)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
