import { useLayoutEffect, useRef } from 'react'
import { oplossing, strings } from '../../content/strings'
import { currentRemarks, store, useLetters, type Step } from '../../lib/store'

const NEXT: Record<Step, Step | null> = { werkbank: 'kast', kast: 'pers', pers: null }

/**
 * Het strookje onderin, zoals bij de ketel. Wat de drukker zegt (of in één zin wat je nu doet),
 * en hooguit drie knoppen: de volgende stap, een oplossing of "verras me", en ongedaan maken
 */
export function Strook() {
  const view = useLetters((s) => s.view)
  const step = useLetters((s) => s.step)
  const quiet = useLetters((s) => s.quiet)
  const sheets = useLetters((s) => (s.visiting ?? s.waslijn).length)
  const list = useLetters(currentRemarks)
  const canUndo = useLetters((s) => s.past.length > 0)
  const catalogue = useLetters((s) => s.catalogue)
  const t = strings.stappen
  const root = useRef<HTMLElement>(null)

  // Hoe hoog het strookje is, als variabele voor de panelen erboven: die moeten er altijd boven blijven
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const measure = () => document.documentElement.style.setProperty('--strook', `${Math.ceil(el.getBoundingClientRect().height)}px`)
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    measure()
    return () => observer.disconnect()
  }, [])

  const remark = !quiet ? list.find((r) => r.tone !== 'lof') : undefined
  const praise = !quiet && !remark ? list.find((r) => r.tone === 'lof') : undefined
  const waslijn = view === 'waslijn'
  const words = waslijn ? t.waslijnZin(sheets) : remark ? store.words(remark) : step === 'pers' && praise ? store.words(praise) : t.zin[step]
  const next = NEXT[step]

  return (
    <section ref={root} className="strook" aria-label={t.drukkerZegt}>
      <p className="strook-zin hand" aria-live="polite">
        {words}
      </p>
      <div className="strook-knoppen">
        {waslijn ? (
          <button type="button" className="plaque" onClick={() => store.look(step)}>
            {t.terugNaar(step)}
          </button>
        ) : next ? (
          <button type="button" className="plaque" disabled={!catalogue} onClick={() => store.look(next)}>
            {t.verder[step]}
          </button>
        ) : (
          <button type="button" className="plaque" disabled={!catalogue} onClick={() => store.pull()}>
            {t.verder.pers}
          </button>
        )}
        {!waslijn && remark?.fix ? (
          <button type="button" className="inked" onClick={() => store.fix(remark)}>
            {oplossing(remark.fix.id, remark.fix.params, remark.id)}
          </button>
        ) : (
          !waslijn && (
            <button type="button" className="inked" data-tone="rust" disabled={!catalogue} onClick={() => store.surprise()}>
              {strings.voorstel.verras}
            </button>
          )
        )}
        {canUndo && (
          <button type="button" className="quiet" aria-keyshortcuts="Control+Z Meta+Z" onClick={() => store.undo()}>
            {t.ongedaan}
          </button>
        )}
      </div>
    </section>
  )
}
