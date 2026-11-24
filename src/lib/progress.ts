// Of de drukkerij nog onderweg is, opengehouden door een Suspense-fallback
// Dit staat buiten de 3D-chunk, zodat het inktrol er al is voordat three.js binnen is

let holds = 0
let everHeld = false
const listeners = new Set<() => void>()
const tell = () => {
  for (const listener of listeners) listener()
}

export const progress = {
  /** Waar zolang er iets wordt vastgehouden */
  pending: () => holds > 0,
  /** Of er ooit iets is vastgehouden */
  started: () => everHeld,
  /** Aangeroepen door de fallback zolang hij er staat, en geeft het loslaten terug */
  hold() {
    holds++
    everHeld = true
    tell()
    return () => {
      holds--
      tell()
    }
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
