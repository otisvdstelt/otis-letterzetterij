import { Component, lazy, Suspense, useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { PaperFilters } from './components/ui/Chrome'
import { EigenFont } from './components/ui/EigenFont'
import { FlesjePlakken } from './components/ui/FlesjePlakken'
import { Header } from './components/ui/Header'
import { Inktrol, Rollend } from './components/ui/Inktrol'
import { KastPaneel } from './components/ui/Kast'
import { Nieuws } from './components/ui/Nieuws'
import { Oogarts } from './components/ui/Oogarts'
import { PersPaneel } from './components/ui/PersPaneel'
import { Hendel, PersTekening } from './components/ui/PersTekening'
import { Proefdruk } from './components/ui/Proefdruk'
import { Strook } from './components/ui/Strook'
import { VelPaneel } from './components/ui/VelPaneel'
import { Waslijn } from './components/ui/Waslijn'
import { Welkom } from './components/ui/Welkom'
import { Werkbank } from './components/ui/Werkbank'
import { Zetboek } from './components/ui/Zetboek'
import type { Inset } from './components/World'
import { strings } from './content/strings'
import { useCatalogue } from './hooks/useCatalogue'
import { canPaint, isModest, useMediaQuery } from './hooks/useLayout'
import { keepPhase, readPhase, type Phase } from './lib/air'
import { keepOwn } from './lib/route'
import { codeOf, store, useLetters } from './lib/store'

// three.js en alles wat erbij hoort komt in een eigen chunk, zodat de papieren laag eerst staat
const World = lazy(() => import('./components/World'))

/** Kan de drukkerij niet geschilderd worden (geen WebGL, een mislukte download), dan blijft alles op papier werken */
class Unpaintable extends Component<{ onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onFail()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/**
 * Zolang er een vel openstaat, staat het in het adres: /vel/<code>. Dat is zo vanaf de eerste verandering,
 * of meteen als je met een link binnenkwam. Elke verandering vervangt het adres, zodat de terugknop de site niet volspamt
 */
function useAddress() {
  const zetsel = useLetters((s) => s.zetsel)
  const catalogue = useLetters((s) => s.catalogue)
  const touched = useLetters((s) => s.past.length > 0 || s.welcome !== null || s.printed !== null || window.location.pathname.startsWith('/vel/'))
  useEffect(() => {
    if (!touched || !catalogue) return
    const code = codeOf(zetsel)
    const target = `/vel/${code}${window.location.search}`
    if (window.location.pathname + window.location.search !== target) window.history.replaceState({ vel: true }, '', target)
    keepOwn(code)
  }, [zetsel, touched, catalogue])
}

function subscribeResize(onChange: () => void) {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

const REM = 16

/**
 * Hoeveel ruimte het papier inneemt, zodat de camera het onderwerp in de vrije ruimte zet.
 * Dezelfde maten als in het stijlblad: kop bovenin, paneel links, het vel rechts, het strookje onderin
 */
function useInset(compact: boolean): Inset {
  const width = useSyncExternalStore(subscribeResize, () => window.innerWidth)
  const height = useSyncExternalStore(subscribeResize, () => window.innerHeight)
  const view = useLetters((s) => s.view)
  const velOpen = useLetters((s) => s.velOpen)
  const breed = useLetters((s) => s.drawer !== null || s.kastPaneel === 'opzij')
  const proef = useLetters((s) => s.proef)
  if (compact) {
    // Op een telefoon staat de drukkerij bovenin, en schuiven de panelen van onder omhoog
    return { left: 0, right: 0, top: 3.9 * REM, bottom: height * ((velOpen || proef) && view !== 'waslijn' ? 0.55 : view === 'kast' && breed ? 0.62 : 0.46) }
  }
  const gutter = Math.min(2, Math.max(1, (width * 0.025) / REM)) * REM
  const left = view === 'waslijn' ? 0 : gutter + (view === 'kast' && breed ? 21 : 14) * REM
  const right = (velOpen || proef) && view !== 'waslijn' ? gutter + Math.min(36 * REM, width * 0.4) : 0
  return { left, right, top: 4.5 * REM, bottom: (view === 'waslijn' ? 14 : 7.5) * REM }
}

export default function App({ broken = false, firstVisit = true }: { broken?: boolean; firstVisit?: boolean }) {
  const [phase, setPhase] = useState<Phase>(readPhase)
  const catalogue = useCatalogue()
  const [painted, setPainted] = useState(canPaint)
  const [failed, setFailed] = useState(false)
  // Tot de drukkerij er is, staat de getekende pers in het midden
  const [worldReady, setWorldReady] = useState(false)
  const [leverAt, setLeverAt] = useState<{ x: number; y: number } | null>(null)
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const compact = useMediaQuery('(max-width: 1023px)')
  const [modest] = useState(isModest)
  const view = useLetters((s) => s.view)
  const step = useLetters((s) => s.step)
  const velOpen = useLetters((s) => s.velOpen)
  const breed = useLetters((s) => s.drawer !== null || s.kastPaneel === 'opzij')
  const printed = useLetters((s) => s.printed !== null)
  const proef = useLetters((s) => s.proef)
  const inset = useInset(compact)
  useAddress()

  const fail = useCallback(() => {
    setPainted(false)
    setFailed(true)
  }, [])

  const choosePhase = useCallback((next: Phase) => {
    setPhase(next)
    keepPhase(next)
  }, [])

  // Ctrl of Cmd met Z maakt de laatste verandering ongedaan, behalve in een veld
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z' || event.shiftKey) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input[type="text"], input[type="search"], textarea, select, [contenteditable="true"]')) return
      event.preventDefault()
      store.undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const atLine = view === 'waslijn'
  const showProef = proef && !atLine
  const showVel = velOpen && !atLine && !showProef
  const drawn = !painted || !worldReady

  return (
    <div className="papier" data-wereld={painted} data-uitzicht={view} data-vel={showVel || showProef} data-proef={showProef} data-laatje={step === 'kast' && breed}>
      <PaperFilters />
      {/* De drukkerij is alleen weergave: alles wat je ermee kunt, staat ook in de papieren laag */}
      {painted && (
        <div className="wereld" aria-hidden="true">
          <Unpaintable onFail={fail}>
            <Suspense fallback={<Rollend />}>
              <World phase={phase} reducedMotion={reducedMotion} modest={modest} inset={inset} onLever={setLeverAt} onReady={() => setWorldReady(true)} />
            </Suspense>
          </Unpaintable>
        </div>
      )}
      {drawn && !atLine && <PersTekening />}
      {!drawn && view === 'pers' && leverAt && <Hendel at={leverAt} />}

      <Header phase={phase} onPhase={choosePhase} boek={<Zetboek firstVisit={firstVisit} />} />
      {broken && <p className="mislukt slip paper hand">{strings.welkom.onleesbaar}</p>}
      {failed && <p className="mislukt slip paper hand">{strings.wereld.mislukt}</p>}

      <main className="tafel">
        {!atLine && step === 'werkbank' && <Werkbank eigen={<EigenFont />} />}
        {!atLine && step === 'kast' && <KastPaneel failed={catalogue.isError} />}
        {!atLine && step === 'pers' && <PersPaneel />}
        {atLine && <Waslijn />}
        <Welkom />
        <Strook />
        {showVel && <VelPaneel plakken={<FlesjePlakken />} />}
        {showProef && <Proefdruk />}
        {!showVel && !showProef && !atLine && printed && (
          <button type="button" className="slip paper hand terug-naar-vel" onClick={() => store.showVel(true)}>
            {strings.vel.terug} →
          </button>
        )}
      </main>
      <Oogarts />
      <Nieuws />
      <Inktrol />
    </div>
  )
}
