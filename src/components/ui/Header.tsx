import { useSyncExternalStore } from 'react'
import { strings } from '../../content/strings'
import { sound } from '../../lib/sound'
import { store, useLetters } from '../../lib/store'
import type { Phase } from '../../lib/air'
import { Colofon } from './Colofon'

interface Switch {
  label: string
  on: boolean
  off: string
  onWord: string
  toggle: () => void
}

/** Twee woorden waarvan het ware onderstreept is, zoals in het portfolio */
function Schakelaar({ label, on, off, onWord, toggle }: Switch) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className="slip paper schakelaar" onClick={toggle}>
      <span className="schakelaar-woord" data-aan={!on}>
        {off}
      </span>
      <span className="schakelaar-streep" aria-hidden="true">
        /
      </span>
      <span className="schakelaar-woord" data-aan={on}>
        {onWord}
      </span>
    </button>
  )
}

/** Bovenaan: de naam op een snipper, het colofon, en de schakelaars voor de drukker en het uur */
export function Header({ phase, onPhase }: { phase: Phase; onPhase: (phase: Phase) => void }) {
  const quiet = useLetters((s) => s.quiet)
  const loud = useSyncExternalStore(sound.subscribe, sound.on)
  const dark = phase === 'night'
  return (
    <header className="kop">
      <div className="kop-links">
        <h1 className="slip paper woordmerk">{strings.titel}</h1>
        <Colofon />
      </div>
      <div className="kop-schakelaars">
        {/* Geen geluid waar niemand om vroeg: het staat uit tot je het zelf aanzet */}
        <Schakelaar label={strings.geluid.label} on={loud} off={strings.geluid.uit} onWord={strings.geluid.aan} toggle={() => sound.set(!loud)} />
        <Schakelaar label={strings.drukkerStil.label} on={quiet} off={strings.drukkerStil.praat} onWord={strings.drukkerStil.stil} toggle={() => store.setQuiet(!quiet)} />
        <Schakelaar label={strings.uur.label} on={dark} off={strings.uur.dag} onWord={strings.uur.nacht} toggle={() => onPhase(dark ? 'day' : 'night')} />
      </div>
    </header>
  )
}
