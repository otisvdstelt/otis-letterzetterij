import { Fragment, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { alternatieven } from '../../content/alternatieven'
import { strings, waaromZin } from '../../content/strings'
import { DRAWERS, type FontEntry } from '../../lib/type/catalogue'
import { fontStack } from '../../lib/type/fontface'
import { waaromPaar } from '../../lib/type/paar'
import { bouw, lijktOp, mist, richting, RICHTINGEN, schreefvorm, voldoet, voldoetEerst, zoekAlternatief, type Richting } from '../../lib/type/zoek'
import { ROLES, type Role } from '../../lib/type/zetsel'
import { currentScale, familyOf, fontById, lettersOf, store, useLetters } from '../../lib/store'
import { useFontFaces } from '../../hooks/useFontFaces'
import { Magazijn } from './Magazijn'
import { Voorstel } from './Voorstel'

const k = strings.kast
const z_ = strings.zoeken
const normal = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** Pijltjes op en neer lopen door de letters, Home en End naar het begin en het eind. De tabstop loopt mee */
function walk(event: KeyboardEvent<HTMLUListElement>) {
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
  const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button.letter')]
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
 * Jouw kop in deze letter. De letter wordt pas geladen als de regel in beeld komt,
 * zodat een laatje van veertig letters niet veertig bestanden tegelijk ophaalt
 */
function InDeLetter({ font, text }: { font: FontEntry; text: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const observer = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setSeen(true), { rootMargin: '200px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [seen])
  useFontFaces(seen ? [font] : [])
  return (
    <span ref={ref} className="letter-proef" style={seen ? { fontFamily: fontStack(font) } : undefined}>
      {text}
    </span>
  )
}

/** Eén letter in een lijst: jouw kop erin, met wat hij is, en knopjes om op te bouwen */
function Letter({ font, tab, onAlike }: { font: FontEntry; tab: boolean; onAlike: (f: FontEntry) => void }) {
  const role = useLetters((s) => s.role)
  const z = useLetters((s) => s.zetsel)
  const eisen = useLetters((s) => s.eisen)
  const opzij = useLetters((s) => s.shortlist.includes(font.id))
  const ok = voldoet(font, eisen)
  const gemist = ok ? null : mist(font, eisen)
  const used = ROLES.filter((r) => z[r] === font.id)
  const vorm = schreefvorm(font)
  const b = bouw(font)
  const meta = [vorm === 'geen' ? (b ? z_.bouw[b] : null) : z_.schreef[vorm], font.axes?.wght ? k.variabel : null, font.italic ? k.cursief : null, font.license].filter(Boolean).join(' · ')
  return (
    <li className="letter-regel" data-grijs={!ok}>
      <button type="button" className="letter" tabIndex={tab ? 0 : -1} aria-label={k.pakLabel(font.family, role)} aria-pressed={z[role] === font.id} onClick={() => store.pick(font.id)}>
        <InDeLetter font={font} text={z.zin.slice(0, 48)} />
        <span className="letter-naam">{font.family}</span>
        <span className="letter-meta">{gemist ? strings.eisen.mist(gemist.eisen, gemist.gewichten) : meta}</span>
        {used.length > 0 && <span className="letter-in-gebruik">{used.map(k.inGebruik).join(', ')}</span>}
      </button>
      <span className="letter-knopjes">
        <button type="button" className="quiet" tabIndex={-1} aria-label={z_.lijktOpLabel(font.family)} onClick={() => onAlike(font)}>
          {z_.lijktOp}
        </button>
        <button type="button" className="quiet" tabIndex={-1} aria-pressed={opzij} aria-label={z_.opzijLabel(font.family, opzij)} onClick={() => store.toggleShortlist(font.id)}>
          {opzij ? '★' : '☆'} {z_.opzij}
        </button>
      </span>
    </li>
  )
}

function Lijst({ fonts, onAlike }: { fonts: readonly FontEntry[]; onAlike: (f: FontEntry) => void }) {
  const role = useLetters((s) => s.role)
  const current = useLetters((s) => s.zetsel[role])
  const eisen = useLetters((s) => s.eisen)
  // Wat je eisen niet haalt, staat onderaan, met een streep ertussen
  const sorted = voldoetEerst(fonts, eisen)
  const goed = eisen.length ? sorted.filter((f) => voldoet(f, eisen)).length : sorted.length
  const chosen = sorted.findIndex((f) => f.id === current)
  return (
    <ul className="letters" onKeyDown={walk}>
      {sorted.map((f, i) => (
        <Fragment key={f.id}>
          {i === goed && (
            <li className="letters-grens hand" aria-hidden="true">
              {strings.eisen.onderaan(sorted.length - goed)}
            </li>
          )}
          <Letter font={f} tab={i === (chosen >= 0 ? chosen : 0)} onAlike={onAlike} />
        </Fragment>
      ))}
    </ul>
  )
}

/** Wat het laatje laat zien: het laatje zelf, een zoekopdracht, een richting, of wat erop lijkt */
type Toon = { soort: 'laatje' } | { soort: 'richting'; richting: Richting; vanaf: string } | { soort: 'lijkt'; vanaf: string }

/** Het open laatje, in plaats van de paren: de letters met jouw kop erin, zoeken, en verder zoeken vanaf je letter */
function Laatje() {
  const drawer = useLetters((s) => s.drawer)
  const catalogue = useLetters((s) => s.catalogue)
  const role = useLetters((s) => s.role)
  const z = useLetters((s) => s.zetsel)
  const [query, setQuery] = useState('')
  const [toon, setToon] = useState<Toon>({ soort: 'laatje' })
  const searchId = useId()
  const all = useMemo(() => catalogue ?? [], [catalogue])
  const mine = fontById(z[role])
  const iets = zoekAlternatief(query, alternatieven)

  const fonts = useMemo(() => {
    if (toon.soort === 'richting') {
      const from = fontById(toon.vanaf)
      return from ? richting(all, from, toon.richting, 8) : []
    }
    if (toon.soort === 'lijkt') {
      const from = fontById(toon.vanaf)
      return from ? lijktOp(all, from, 6) : []
    }
    const q = normal(query.trim())
    if (q) {
      const named = all.filter((f) => normal(f.family).includes(q))
      const alike = iets ? iets.ids.flatMap((id) => all.find((f) => f.id === id) ?? []) : []
      return [...alike, ...named.filter((f) => !alike.includes(f))]
    }
    return all.filter((f) => f.drawer === drawer)
  }, [all, toon, query, drawer, iets])

  if (!drawer) return null
  const titel =
    toon.soort === 'richting' ? z_.richtingKop(z_.richtingen[toon.richting], familyOf(toon.vanaf)) : toon.soort === 'lijkt' ? z_.lijktOpKop(familyOf(toon.vanaf)) : query.trim() ? (iets ? z_.ietsAls(iets.naam) : k.zoek) : k.laatjeKop(k.laatjes[drawer])

  return (
    <>
      <div className="paneel-boven">
        <h2 id="kast-kop" className="paneel-naam">
          {titel}
        </h2>
        <button type="button" className="quiet" onClick={() => (toon.soort === 'laatje' ? store.openDrawer(null) : setToon({ soort: 'laatje' }))}>
          {toon.soort === 'laatje' ? z_.terug : `← ${k.laatjes[drawer]}`}
        </button>
      </div>
      <div className="kast-rol" role="radiogroup" aria-label={k.naar}>
        <span className="hand">{k.naar}</span>
        {ROLES.map((r) => (
          <label key={r} className="stemming" data-aan={role === r}>
            <input type="radio" name="kast-rol" checked={role === r} onChange={() => store.setRole(r)} />
            {k.rollen[r]}
          </label>
        ))}
      </div>
      {z.klem !== role && (
        <button
          type="button"
          className="slip paper klem-knop"
          onClick={() => {
            // Met een klem erop zoekt de drukker er paren bij: die zie je meteen
            store.clamp(role)
            store.openDrawer(null)
          }}
        >
          <span className="klem" aria-hidden="true" />
          {strings.werkbank.zetKlem(role)}: <span className="hand">{familyOf(z[role])}</span>
        </button>
      )}
      <div className="field kast-zoek">
        <label htmlFor={searchId}>{k.zoek}</label>
        <input
          id={searchId}
          type="search"
          value={query}
          placeholder="Helvetica, Garamond…"
          onChange={(e) => {
            setQuery(e.target.value)
            setToon({ soort: 'laatje' })
          }}
          autoComplete="off"
        />
      </div>
      {iets && toon.soort === 'laatje' && <p className="klein-uitleg">{z_.ietsAlsUitleg}</p>}
      {mine && (
        <div className="richtingen">
          <p className="klein-uitleg">{z_.vanaf(mine.family)}</p>
          <div className="gevoelens">
            {RICHTINGEN.map((r) => (
              <button key={r} type="button" className="gevoel" aria-pressed={toon.soort === 'richting' && toon.richting === r} onClick={() => setToon({ soort: 'richting', richting: r, vanaf: mine.id })}>
                {z_.richtingen[r]}
              </button>
            ))}
          </div>
        </div>
      )}
      {fonts.length === 0 && <p className="hand">{k.zoekLeeg}</p>}
      <Lijst fonts={fonts} onAlike={(f) => setToon({ soort: 'lijkt', vanaf: f.id })} />
      <Magazijn />
    </>
  )
}

/** Wat je opzij legde: dezelfde alinea op broodtekstmaat, onder elkaar. Daar maak je je paar van */
function Opzij() {
  const ids = useLetters((s) => s.shortlist)
  const z = useLetters((s) => s.zetsel)
  const scale = useLetters(currentScale)
  const fonts = ids.map((id) => fontById(id)).filter((f): f is FontEntry => f !== null)
  useFontFaces(fonts)
  const o = strings.opzij
  const alinea = z.eigen.alinea.split(/\n\s*\n/)[0]?.trim() || strings.zetsel.website.intro
  return (
    <>
      <div className="paneel-boven">
        <h2 id="kast-kop" className="paneel-naam">
          {o.kop}
        </h2>
        <button type="button" className="quiet" onClick={() => store.kastLaat('paren')}>
          {z_.terug}
        </button>
      </div>
      <p className="klein-uitleg">{fonts.length ? o.uitleg : o.leeg}</p>
      <ul className="opzij-lijst">
        {fonts.map((f) => (
          <li key={f.id} className="opzij-letter">
            <p className="hand opzij-naam">{f.family}</p>
            <p className="opzij-proef" style={{ fontFamily: fontStack(f), fontSize: `${scale?.levels.tekst.max ?? 17}px`, lineHeight: z.interlinie }}>
              {alinea}
            </p>
            <div className="knoppenrij">
              <button type="button" className="inked klein" aria-pressed={z.kop === f.id} onClick={() => store.pick(f.id, 'kop')}>
                {o.alsKop}
              </button>
              <button type="button" className="inked klein" aria-pressed={z.tekst === f.id} onClick={() => store.pick(f.id, 'tekst')}>
                {o.alsTekst}
              </button>
              <button type="button" className="quiet" onClick={() => store.toggleShortlist(f.id)}>
                {o.weg}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

/** De paren, en wat je ermee kunt: naast elkaar drukken, op het oog kiezen, half wisselen, en de laatjes */
function Paren() {
  const open = useLetters((s) => s.drawer)
  const houd = useLetters((s) => s.houd)
  const klem = useLetters((s) => s.zetsel.klem)
  const n = useLetters((s) => s.shortlist.length)
  const letters = useLetters((s) => lettersOf(s.zetsel, s))
  const h = strings.halfWisselen
  return (
    <>
      <div className="paneel-boven">
        <h2 id="kast-kop" className="paneel-naam">
          {strings.stappen.namen.kast}
        </h2>
        <button type="button" className="quiet" onClick={() => store.look('werkbank')}>
          ← {strings.stappen.namen.werkbank}
        </button>
      </div>
      <Voorstel />
      <div className="knoppenrij kast-acties">
        <button type="button" className="inked klein" onClick={() => store.proefdruk(true)}>
          {strings.proef.knop}
        </button>
        <button type="button" className="inked klein" onClick={() => store.startOogarts()}>
          {strings.oogarts.knop}
        </button>
      </div>
      {!klem && letters && (
        <div className="half-wisselen">
          <p className="klein-uitleg">{h.uitleg}</p>
          <div className="gevoelens">
            {(['kop', 'tekst'] as Role[]).map((r) => (
              <button key={r} type="button" className="gevoel" aria-pressed={houd === r} onClick={() => store.hold(houd === r ? null : r)}>
                {r === 'kop' ? h.houdKop : h.houdTekst}: {letters[r].family}
              </button>
            ))}
          </div>
        </div>
      )}
      {letters && <p className="klein-uitleg waarom-nu">{waaromZin(waaromPaar(letters.kop, letters.tekst))}</p>}
      <h3 className="voorstel-kop">{k.zelf}</h3>
      <ul className="laatjes-lijst">
        {DRAWERS.map((drawer) => (
          <li key={drawer}>
            <button type="button" className="laatje-knop" aria-pressed={open === drawer} onClick={() => store.openDrawer(drawer)}>
              <span className="laatje-greep" aria-hidden="true" />
              {k.laatjes[drawer]}
            </button>
          </li>
        ))}
      </ul>
      {n > 0 && (
        <button type="button" className="quiet" onClick={() => store.kastLaat('opzij')}>
          ★ {strings.opzij.knop(n)}
        </button>
      )}
    </>
  )
}

/**
 * Stap twee, bij de kast: de paren van de drukker. Een open laatje of wat je opzij legde, neemt de plek van de paren in,
 * met een terugknop, zodat er nooit twee smalle panelen naast elkaar staan
 */
export function KastPaneel({ failed }: { failed: boolean }) {
  const drawer = useLetters((s) => s.drawer)
  const view = useLetters((s) => s.kastPaneel)
  const kind = drawer ? 'laatje' : view
  return (
    <section className="paneel kast" data-paneel={kind} aria-labelledby="kast-kop">
      {failed && <p className="hand">{strings.laden.kastMislukt}</p>}
      {kind === 'laatje' ? <Laatje /> : kind === 'opzij' ? <Opzij /> : <Paren />}
    </section>
  )
}
