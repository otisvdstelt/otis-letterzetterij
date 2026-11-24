import { useId, useMemo, useState, type KeyboardEvent } from 'react'
import { strings } from '../../content/strings'
import { DRAWERS, type Drawer, type FontEntry } from '../../lib/type/catalogue'
import { ROLES } from '../../lib/type/zetsel'
import { store, useLetters } from '../../lib/store'
import { useSpecimens } from '../../hooks/useCatalogue'
import { useMediaQuery } from '../../hooks/useLayout'
import { Magazijn } from './Magazijn'
import { Specimen } from './Specimen'

const normal = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** Pijltjes op en neer lopen door de letters in een laatje, Home en End naar het begin en het eind. De tabstop loopt mee */
function walk(event: KeyboardEvent<HTMLUListElement>) {
  const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End']
  if (!keys.includes(event.key)) return
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

/** De houten letterkast: laatjes vol letters. Een letter gaat naar de kop of de tekst, wat je kiest */
export function Kast({ failed }: { failed: boolean }) {
  const catalogue = useLetters((s) => s.catalogue)
  const role = useLetters((s) => s.role)
  const z = useLetters((s) => s.zetsel)
  // Een laatje dat in de drukkerij is opengetrokken, staat hier ook open
  const pulled = useLetters((s) => s.drawer)
  const specimens = useSpecimens()
  const wide = useMediaQuery('(min-width: 1024px)')
  const [query, setQuery] = useState('')
  // Op een breed scherm staat het eerste laatje open, op een telefoon zijn ze dicht: dan blijft de lijst kort
  const [open, setOpen] = useState<Set<Drawer>>(() => new Set(window.matchMedia('(min-width: 1024px)').matches ? ['schreef'] : []))
  const searchId = useId()
  const k = strings.kast

  const byDrawer = useMemo(() => {
    const q = normal(query.trim())
    const map = new Map<Drawer, FontEntry[]>()
    for (const f of catalogue ?? []) {
      if (q && !normal(f.family).includes(q)) continue
      map.set(f.drawer, [...(map.get(f.drawer) ?? []), f])
    }
    return map
  }, [catalogue, query])

  const searching = query.trim().length > 0
  const toggle = (drawer: Drawer, isOpen: boolean) => {
    if (!isOpen && pulled === drawer) store.openDrawer(null)
    const next = new Set(open)
    if (isOpen) next.add(drawer)
    else next.delete(drawer)
    setOpen(next)
  }

  return (
    <section className="kast" aria-labelledby="kast-kop" data-breed={wide}>
      <h2 id="kast-kop" className="paneel-kop kast-naam">
        {k.kop}
      </h2>
      <p className="paneel-uitleg">{k.uitleg}</p>
      <div className="kast-rol" role="radiogroup" aria-label={k.naar}>
        <span className="hand">{k.naar}</span>
        {ROLES.map((r) => (
          <label key={r} className="stemming" data-aan={role === r}>
            <input type="radio" name="kast-rol" checked={role === r} onChange={() => store.setRole(r)} />
            {k.rollen[r]}
          </label>
        ))}
      </div>
      <div className="field kast-zoek">
        <label htmlFor={searchId}>{k.zoek}</label>
        <input id={searchId} type="search" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
      </div>
      {failed && <p className="hand">{strings.laden.kastMislukt}</p>}
      {searching && byDrawer.size === 0 && <p className="hand">{k.zoekLeeg}</p>}
      {DRAWERS.map((drawer) => {
        const fonts = byDrawer.get(drawer) ?? []
        if (fonts.length === 0) return null
        return (
          <details key={drawer} className="laatje" open={searching || open.has(drawer) || pulled === drawer} onToggle={(e) => !searching && toggle(drawer, e.currentTarget.open)}>
            <summary>
              <span className="laatje-naam">{k.laatjes[drawer]}</span>
              <span className="laatje-aantal">{k.aantal(fonts.length)}</span>
              <span className="laatje-uitleg">{k.laatjeUitleg[drawer]}</span>
            </summary>
            <ul className="letters" onKeyDown={walk}>
              {fonts.map((f, i) => {
                // Eén tabstop per laatje: de letter die nu gekozen is, of de eerste. De pijltjes doen de rest
                const chosen = fonts.findIndex((x) => x.id === z[role])
                const stop = i === (chosen >= 0 ? chosen : 0)
                const used = ROLES.filter((r) => z[r] === f.id)
                return (
                  <li key={f.id}>
                    <button type="button" className="letter" tabIndex={stop ? 0 : -1} aria-label={k.pakLabel(f.family, role)} aria-pressed={z[role] === f.id} onClick={() => store.pick(f.id)}>
                      <Specimen shape={specimens.data?.[f.id]} />
                      <span className="letter-naam">{f.family}</span>
                      <span className="letter-meta">
                        {[f.axes?.wght ? k.variabel : null, f.italic ? k.cursief : null, f.license].filter(Boolean).join(' · ')}
                      </span>
                      {used.length > 0 && <span className="letter-in-gebruik">{used.map(k.inGebruik).join(', ')}</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </details>
        )
      })}
      <Magazijn />
    </section>
  )
}
