import { useCallback } from 'react'
import { strings } from '../../content/strings'
import { currentScale, familyOf, lettersOf, store, useLetters } from '../../lib/store'
import { InktPapier } from './InktPapier'
import { Leesbaar } from './Leesbaar'
import { Meenemen } from './Meenemen'
import { Tabs } from './Tabs'
import { Vel } from './Vel'
import { SjabloonKeuze, Fijnzetten, ZinVeld } from './Winkelhaak'
import type { ReactNode } from 'react'

/**
 * Het vel, groot in beeld, zoals het flesje bij de alchemist. Het komt na het drukken en blijft live meeveranderen.
 * Eronder de tabbladen: wat je aan het vel doet, of het leest, en wat je meeneemt
 */
export function VelPaneel({ plakken }: { plakken?: ReactNode }) {
  const z = useLetters((s) => s.zetsel)
  const letters = useLetters((s) => lettersOf(s.zetsel, s))
  const scale = useLetters(currentScale)
  const recent = useLetters((s) => s.recent)
  const onWidow = useCallback((weduwe: boolean) => store.setSheet({ weduwe }), [])
  const p = strings.pers
  const tabs = [
    {
      id: 'vel',
      label: strings.vel.tabs.vel,
      content: (
        <>
          <ZinVeld />
          <SjabloonKeuze />
          <InktPapier plakken={plakken} />
          <Fijnzetten />
        </>
      ),
    },
    { id: 'leesbaar', label: strings.vel.tabs.leesbaar, content: <Leesbaar /> },
    { id: 'meenemen', label: strings.vel.tabs.meenemen, content: <Meenemen /> },
  ]

  return (
    <section className="toonbank" aria-labelledby="vel-kop">
      <div className="paneel-boven">
        <h2 id="vel-kop" className="toonbank-kop">
          {strings.vel.label}
        </h2>
        <button type="button" className="quiet" onClick={() => store.showVel(false)}>
          {strings.vel.zetWeg}
        </button>
      </div>
      {letters && scale && (
        <div className="vel-houder">
          <Vel zetsel={z} kop={letters.kop} tekst={letters.tekst} scale={scale} onWidow={onWidow} />
        </div>
      )}
      <div className="knoppenrij">
        <button type="button" className="inked" onClick={() => store.hang()}>
          {p.hang}
        </button>
      </div>
      <Tabs tabs={tabs} label={strings.vel.tabsLabel} />
      {recent.length > 1 && (
        <div className="eerder">
          <h3 className="hand eerder-kop">{p.eerder}</h3>
          <ul className="eerder-lijst">
            {recent.slice(1).map((r, i) => (
              <li key={i}>
                <button type="button" className="slip paper eerder-vel" aria-label={p.terugpakken(familyOf(r.kop), familyOf(r.tekst))} onClick={() => store.continueFrom(r)}>
                  {familyOf(r.kop) === familyOf(r.tekst) ? familyOf(r.kop) : `${familyOf(r.kop)} + ${familyOf(r.tekst)}`}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
