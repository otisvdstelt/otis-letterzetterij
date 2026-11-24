// De toestand van de lucht in de drukkerij, gedeeld door elke shader. Eén tikker beweegt hem, materialen lezen hem

export type Phase = 'day' | 'night'

export const air = {
  /** Seconden sinds de drukkerij wakker werd */
  time: { value: 0 },
  /** 0 overdag, 1 nacht */
  night: { value: 0 },
  /** 0 niets te zien dan papier, 1 het hele beeld */
  reveal: { value: 0 },
  /** Hoe het beeld komt en gaat: 0 spreidt vanuit het midden, 1 mist erin, 2 mist eraf */
  wipe: { value: 0 },
  /** De wind door het open raam, voor de vellen aan de waslijn. Richting in x en z, sterkte van 0 tot 1 */
  wind: { x: 1, z: 0.35, strength: 0.4 },
}

const PHASE_KEY = 'letterzetterij-uur'

/** Nacht van acht uur 's avonds tot zeven uur 's ochtends */
export function clockPhase(now = new Date()): Phase {
  const hour = now.getHours()
  return hour >= 20 || hour < 7 ? 'night' : 'day'
}

/** Het uur volgt de klok, tenzij er op dit apparaat zelf gekozen is. Een tijd in het adres gaat voor alles */
export function readPhase(): Phase {
  const asked = new URLSearchParams(window.location.search).get('tijd')
  if (asked === 'dag') return 'day'
  if (asked === 'nacht') return 'night'
  try {
    const kept = window.localStorage.getItem(PHASE_KEY)
    if (kept === 'day' || kept === 'night') return kept
  } catch {
    // Opslag kan geweigerd worden, dan geldt de klok
  }
  return clockPhase()
}

/** Onthoud het gekozen uur op dit apparaat, of vergeet het (null) en volg de klok weer */
export function keepPhase(phase: Phase | null) {
  try {
    if (phase === null) window.localStorage.removeItem(PHASE_KEY)
    else window.localStorage.setItem(PHASE_KEY, phase)
  } catch {
    // De keuze duurt dan zo lang als de pagina
  }
  paintPhase(phase ?? clockPhase())
}

/** Het papier van de pagina en de balk van de browser volgen het uur */
export function paintPhase(phase: Phase) {
  document.documentElement.dataset.theme = phase
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', phase === 'night' ? '#171b2e' : '#f7f4eb')
}
