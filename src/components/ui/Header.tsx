import { useSyncExternalStore, type ReactNode } from 'react'
import { strings } from '../../content/strings'
import { sound } from '../../lib/sound'
import { store, useLetters } from '../../lib/store'
import type { Phase } from '../../lib/air'
import { Colofon } from './Colofon'
import { Schakelaar } from './Schakelaar'

/** Bovenaan: de naam, het zetboek, het colofon, de weg naar de waslijn, en de schakelaars voor geluid en het uur */
export function Header({ phase, onPhase, boek }: { phase: Phase; onPhase: (phase: Phase) => void; boek: ReactNode }) {
  const view = useLetters((s) => s.view)
  const step = useLetters((s) => s.step)
  const loud = useSyncExternalStore(sound.subscribe, sound.on)
  const dark = phase === 'night'
  const atLine = view === 'waslijn'
  return (
    <header className="kop">
      <div className="kop-links">
        <h1 className="slip paper woordmerk">{strings.titel}</h1>
        {boek}
        <Colofon />
      </div>
      <div className="kop-schakelaars">
        <button type="button" className="slip paper schakelaar kop-uitzicht" aria-pressed={atLine} onClick={() => store.look(atLine ? step : 'waslijn')}>
          {atLine ? `← ${strings.stappen.namen[step]}` : `${strings.pers.plekken.waslijn.replace('de ', '')} →`}
        </button>
        {/* Geen geluid waar niemand om vroeg: het staat uit tot je het zelf aanzet */}
        <Schakelaar label={strings.geluid.label} on={loud} off={strings.geluid.uit} onWord={strings.geluid.aan} toggle={() => sound.set(!loud)} />
        <Schakelaar label={strings.uur.label} on={dark} off={strings.uur.dag} onWord={strings.uur.nacht} toggle={() => onPhase(dark ? 'day' : 'night')} />
      </div>
    </header>
  )
}
