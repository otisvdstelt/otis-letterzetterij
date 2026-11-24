import { useId, useMemo, useState, type KeyboardEvent } from 'react'
import { strings } from '../../content/strings'
import { DRAWERS, type Drawer, type FontEntry } from '../../lib/type/catalogue'
import { ROLES } from '../../lib/type/zetsel'
import { familyOf, store, useLetters } from '../../lib/store'
import { useSpecimens } from '../../hooks/useCatalogue'
import { Magazijn } from './Magazijn'
import { Specimen } from './Specimen'
import { Voorstel } from './Voorstel'

const k = strings.kast
const normal = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** Pijltjes op en neer lopen door de letters, Home en End naar het begin en het eind. De tabstop loopt mee */
function walk(event: KeyboardEvent<HTMLUListElement>) {
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
  const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button.letter:not(:disabled)')]
  const at = buttons.indexOf(document.activeElement as HTMLButtonElement)
  const to = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, at + (event.key === 'ArrowDown' ? 1 : -1)))
  event.preventDefault()
  for (const b of buttons) b.tabIndex = -1
  if (buttons[to]) {
    buttons[to].tabIndex = 0
    buttons[to].focus()
  }
}

/**
 * Stap twee, bij de kast: de drie paren die de drukker op de zetbank legde, en de zes laatjes.
 * Een laatje opentrekken (hier of in de drukkerij) zet het laatjespaneel ernaast
 */
export function KastPaneel({ failed }: { failed: boolean }) {
  const open = useLetters((s) => s.drawer)
  return (
    <section className="paneel kast" aria-labelledby="kast-kop">
      <div className="paneel-boven">
        <h2 id="kast-kop" className="paneel-naam">
          {strings.stappen.namen.kast}
        </h2>
        <button type="button" className="quiet" onClick={() => store.look('werkbank')}>
          ← {strings.stappen.namen.werkbank}
        </button>
      </div>
      {failed && <p className="hand">{strings.laden.kastMislukt}</p>}
      <Voorstel />
      <h3 className="voorstel-kop">{k.zelf}</h3>
      <ul className="laatjes-lijst">
        {DRAWERS.map((drawer) => (
          <li key={drawer}>
            <button type="button" className="laatje-knop" aria-pressed={open === drawer} onClick={() => store.openDrawer(open === drawer ? null : drawer)}>
              <span className="laatje-greep" aria-hidden="true" />
              {k.laatjes[drawer]}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Het open laatje: de letters met hun "Aa", een zoekveld over de hele kast, en onderin het magazijn */
export function LaatjePaneel() {
  const drawer = useLetters((s) => s.drawer)
  const catalogue = useLetters((s) => s.catalogue)
  const role = useLetters((s) => s.role)
  const z = useLetters((s) => s.zetsel)
  const specimens = useSpecimens()
  const [query, setQuery] = useState('')
  const searchId = useId()
  const searching = query.trim().length > 0

  const fonts = useMemo(() => {
    const q = normal(query.trim())
    return (catalogue ?? []).filter((f: FontEntry) => (q ? normal(f.family).includes(q) : f.drawer === drawer))
  }, [catalogue, query, drawer])

  if (!drawer) return null
  const chosen = fonts.findIndex((f) => f.id === z[role])
  return (
    <section className="paneel laatje-paneel" aria-labelledby="laatje-kop">
      <div className="paneel-boven">
        <h2 id="laatje-kop" className="paneel-naam">
          {searching ? k.zoek : k.laatjeKop(k.laatjes[drawer as Drawer])}
        </h2>
        <button type="button" className="quiet" onClick={() => store.openDrawer(null)}>
          {k.sluitLaatje}
        </button>
      </div>
      {!searching && <p className="klein-uitleg">{k.laatjeUitleg[drawer]}</p>}
      <div className="kast-rol" role="radiogroup" aria-label={k.naar}>
        <span className="hand">{k.naar}</span>
        {ROLES.map((r) => (
          <label key={r} className="stemming" data-aan={role === r}>
            <input type="radio" name="kast-rol" checked={role === r} onChange={() => store.setRole(r)} />
            {k.rollen[r]}
          </label>
        ))}
      </div>
      {/* Jouw letter gevonden? Zet er hier meteen een klem op */}
      {z.klem !== role && (
        <button type="button" className="slip paper klem-knop" onClick={() => store.clamp(role)}>
          <span className="klem" aria-hidden="true" />
          {strings.werkbank.zetKlem(role)}: <span className="hand">{familyOf(z[role])}</span>
        </button>
      )}
      <div className="field kast-zoek">
        <label htmlFor={searchId}>{k.zoek}</label>
        <input id={searchId} type="search" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
      </div>
      {searching && fonts.length === 0 && <p className="hand">{k.zoekLeeg}</p>}
      <ul className="letters" onKeyDown={walk}>
        {fonts.map((f, i) => {
          const used = ROLES.filter((r) => z[r] === f.id)
          return (
            <li key={f.id}>
              <button type="button" className="letter" tabIndex={i === (chosen >= 0 ? chosen : 0) ? 0 : -1} aria-label={k.pakLabel(f.family, role)} aria-pressed={z[role] === f.id} onClick={() => store.pick(f.id)}>
                <Specimen shape={specimens.data?.[f.id]} />
                <span className="letter-naam">{f.family}</span>
                <span className="letter-meta">{[f.axes?.wght ? k.variabel : null, f.italic ? k.cursief : null, f.license].filter(Boolean).join(' · ')}</span>
                {used.length > 0 && <span className="letter-in-gebruik">{used.map(k.inGebruik).join(', ')}</span>}
              </button>
            </li>
          )
        })}
      </ul>
      <Magazijn />
    </section>
  )
}
