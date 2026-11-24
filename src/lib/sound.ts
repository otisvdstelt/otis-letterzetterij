// Geluid, synthetisch met Web Audio: het klak van de pers, papier dat ritselt, een laatje dat schuift. Geen audiobestanden.
// Het staat standaard uit, ook als het de vorige keer aan stond. Een browser staat het pas toe na een klik

import { store, type State } from './store'

let context: AudioContext | null = null
let master: GainNode | null = null
let enabled = false
let unsubscribe: (() => void) | null = null
const listeners = new Set<() => void>()
let before: State | null = null

function audio(): AudioContext {
  if (!context) {
    context = new AudioContext()
    master = context.createGain()
    master.gain.value = 0.6
    master.connect(context.destination)
  }
  return context
}

/** Ruis door een filter: papier, een laatje, de inktrol */
function noise(seconds: number, from: number, to: number, loud: number, at = 0, q = 1.2) {
  const ac = audio()
  const t = ac.currentTime + at
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * seconds), ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const source = ac.createBufferSource()
  source.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = q
  filter.frequency.setValueAtTime(from, t)
  filter.frequency.exponentialRampToValueAtTime(to, t + seconds)
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(loud, t + Math.min(0.02, seconds * 0.2))
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds)
  source.connect(filter).connect(gain).connect(master!)
  source.start(t)
  source.stop(t + seconds + 0.02)
}

/** Een doffe dreun: ijzer op lood */
function thump(pitch: number, loud: number, at = 0) {
  const ac = audio()
  const t = ac.currentTime + at
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(pitch, t)
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.45, t + 0.18)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(loud, t + 0.006)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25)
  osc.connect(gain).connect(master!)
  osc.start(t)
  osc.stop(t + 0.3)
}

/** De pers: de rol rolt, de hendel gaat om, klak, en het vel komt eruit */
function press() {
  noise(0.45, 400, 900, 0.05, 0, 0.8)
  thump(110, 0.35, 0.82)
  noise(0.06, 3000, 1800, 0.18, 0.82, 2)
  thump(70, 0.18, 0.86)
  noise(0.5, 2500, 5000, 0.04, 1.3, 0.7)
}

/** Een vel aan de lijn: papier en een knijper */
function rustle() {
  noise(0.35, 3500, 6000, 0.06, 0, 0.6)
  noise(0.03, 1800, 1500, 0.1, 0.3, 4)
}

/** Een laatje dat openschuift */
function drawer() {
  noise(0.28, 300, 700, 0.07, 0, 1.5)
}

/** Een letter uit de kast: een tikje lood */
function tick() {
  noise(0.025, 4200, 3800, 0.08, 0, 6)
}

function listen(state: State) {
  const prev = before
  before = state
  if (!prev || !enabled) return
  if (state.pulls > prev.pulls) press()
  if (state.waslijn.length > prev.waslijn.length) rustle()
  if (state.drawer && state.drawer !== prev.drawer) drawer()
  if (state.zetsel.kop !== prev.zetsel.kop || state.zetsel.tekst !== prev.zetsel.tekst) tick()
}

export const sound = {
  on: () => enabled,
  set(on: boolean) {
    enabled = on
    if (on) {
      void audio().resume()
      before = store.get()
      unsubscribe ??= store.subscribe(() => listen(store.get()))
    } else {
      unsubscribe?.()
      unsubscribe = null
      void context?.suspend()
    }
    for (const listener of listeners) listener()
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
