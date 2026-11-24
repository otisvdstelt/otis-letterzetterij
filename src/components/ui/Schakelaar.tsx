interface Switch {
  label: string
  on: boolean
  off: string
  onWord: string
  toggle: () => void
}

/** Twee woorden waarvan het ware onderstreept is, zoals in het portfolio */
export function Schakelaar({ label, on, off, onWord, toggle }: Switch) {
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
