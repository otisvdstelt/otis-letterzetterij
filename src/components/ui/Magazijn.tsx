import { useQuery } from '@tanstack/react-query'
import { useId, useMemo, useRef, useState } from 'react'
import { strings } from '../../content/strings'
import type { ArchiveItem } from '../../lib/type/eigen'
import { store, useLetters } from '../../lib/store'

const m = strings.magazijn
const CONSENT = 'letterzetterij-magazijn'

/** Toestemming voor het magazijn, alleen voor deze sessie */
const consented = () => {
  try {
    return window.sessionStorage.getItem(CONSENT) === 'ja'
  } catch {
    return false
  }
}
const keepConsent = () => {
  try {
    window.sessionStorage.setItem(CONSENT, 'ja')
  } catch {
    // Dan vragen we het de volgende keer gewoon nog eens
  }
}

const normal = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
const SHOWN = 30

/**
 * Het magazijn: alle letters van Fontsource die niet in de kast staan. De lijst komt van deze site;
 * een letter zelf komt pas na een duidelijke vraag van jsDelivr
 */
export function Magazijn() {
  const role = useLetters((s) => s.role)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [trouble, setTrouble] = useState<string | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const searchId = useId()
  const list = useQuery({
    queryKey: ['magazijn'],
    queryFn: async (): Promise<ArchiveItem[]> => {
      const response = await fetch(`${import.meta.env.BASE_URL}data/magazijn.json`)
      if (!response.ok) throw new Error(String(response.status))
      return response.json()
    },
    enabled: open,
    staleTime: Infinity,
  })

  const found = useMemo(() => {
    const q = normal(query.trim())
    return (list.data ?? []).filter(([, family]) => !q || normal(family).includes(q))
  }, [list.data, query])

  const ask = () => {
    if (consented()) setOpen(true)
    else dialog.current?.showModal()
  }

  const fetchFont = async (item: ArchiveItem) => {
    setBusy(item[0])
    setTrouble(null)
    try {
      const { fetchArchiveFont } = await import('../../lib/magazijn')
      store.addArchive(await fetchArchiveFont(item))
    } catch {
      setTrouble(m.mislukt(item[1]))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="magazijn">
      {!open ? (
        <>
          <button type="button" className="slip paper magazijn-knop" onClick={ask}>
            {list.data ? m.knop(list.data.length) : m.knopKort}
          </button>
          <p className="klein-uitleg">{m.uitleg}</p>
        </>
      ) : (
        <>
          <div className="magazijn-boven">
            <p className="paneel-kop">{m.knopKort}</p>
            <button type="button" className="quiet" onClick={() => setOpen(false)}>
              {m.sluit}
            </button>
          </div>
          <div className="field kast-zoek">
            <label htmlFor={searchId}>{m.zoek}</label>
            <input id={searchId} type="search" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
          </div>
          {trouble && (
            <p className="hand" role="alert">
              {trouble}
            </p>
          )}
          {list.data && found.length === 0 && <p className="hand">{m.leeg}</p>}
          <ul className="letters">
            {found.slice(0, SHOWN).map((item) => (
              <li key={item[0]}>
                <button type="button" className="letter magazijn-letter" disabled={busy !== null} aria-label={m.pak(item[1], role)} onClick={() => void fetchFont(item)}>
                  <span className="letter-naam">{item[1]}</span>
                  <span className="letter-meta">{busy === item[0] ? m.halen : [m.categorie[item[2]] ?? item[2], item[6]].join(' · ')}</span>
                </button>
              </li>
            ))}
          </ul>
          {found.length > SHOWN && <p className="klein-uitleg">{m.meer(found.length - SHOWN)}</p>}
        </>
      )}
      <dialog ref={dialog} className="colofon" aria-labelledby="magazijn-vraag">
        <div className="colofon-vel">
          <h2 id="magazijn-vraag" className="colofon-kop">
            {m.vraagKop}
          </h2>
          <p>{m.vraag}</p>
          <p className="klein-uitleg">{m.sessie}</p>
          <div className="knoppenrij">
            <button
              type="button"
              className="plaque"
              onClick={() => {
                keepConsent()
                dialog.current?.close()
                setOpen(true)
              }}
            >
              {m.ja}
            </button>
            <button type="button" className="inked" onClick={() => dialog.current?.close()}>
              {m.nee}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )
}
