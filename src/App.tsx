import { useCallback, useEffect, useState } from 'react'
import { PaperFilters } from './components/ui/Chrome'
import { Header } from './components/ui/Header'
import { InktPapier } from './components/ui/InktPapier'
import { Inktrol } from './components/ui/Inktrol'
import { Kast } from './components/ui/Kast'
import { Leesbaar } from './components/ui/Leesbaar'
import { Meenemen } from './components/ui/Meenemen'
import { Nieuws } from './components/ui/Nieuws'
import { Pers } from './components/ui/Pers'
import { Tabs } from './components/ui/Tabs'
import { Vel } from './components/ui/Vel'
import { Waslijn } from './components/ui/Waslijn'
import { Welkom } from './components/ui/Welkom'
import { Werkbank } from './components/ui/Werkbank'
import { Winkelhaak } from './components/ui/Winkelhaak'
import { strings } from './content/strings'
import { useCatalogue } from './hooks/useCatalogue'
import { keepPhase, readPhase, type Phase } from './lib/air'
import { keepOwn } from './lib/route'
import { codeOf, currentScale, lettersOf, store, useLetters } from './lib/store'

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

/** Het vel in het midden, live */
function HetVel() {
  const z = useLetters((s) => s.zetsel)
  const letters = useLetters((s) => lettersOf(s.zetsel, s))
  const scale = useLetters(currentScale)
  const onWidow = useCallback((weduwe: boolean) => store.setSheet({ weduwe }), [])
  if (!letters || !scale) return <div className="vel vel-leeg paper" aria-hidden="true" />
  return (
    <div className="vel-houder">
      <Vel zetsel={z} kop={letters.kop} tekst={letters.tekst} scale={scale} onWidow={onWidow} />
    </div>
  )
}

export default function App({ broken = false }: { broken?: boolean }) {
  const [phase, setPhase] = useState<Phase>(readPhase)
  const catalogue = useCatalogue()
  useAddress()

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

  const tabs = [
    {
      id: 'vel',
      label: strings.vel.tabs.vel,
      content: (
        <>
          <Winkelhaak />
          <InktPapier />
        </>
      ),
    },
    { id: 'leesbaar', label: strings.vel.tabs.leesbaar, content: <Leesbaar /> },
    { id: 'meenemen', label: strings.vel.tabs.meenemen, content: <Meenemen /> },
  ]

  return (
    <div className="drukkerij-pagina">
      <PaperFilters />
      <Header phase={phase} onPhase={choosePhase} />
      {broken && <p className="mislukt slip paper hand">{strings.welkom.onleesbaar}</p>}
      <main className="drukkerij">
        <div className="links">
          <Werkbank />
          <Kast failed={catalogue.isError} />
        </div>
        <div className="midden">
          <Welkom />
          <Pers />
          <HetVel />
          <Waslijn />
        </div>
        <aside className="rechts paper" aria-label={strings.vel.tabsLabel}>
          <Tabs tabs={tabs} label={strings.vel.tabsLabel} />
        </aside>
      </main>
      <Nieuws />
      <Inktrol />
    </div>
  )
}
