import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { Group, Mesh } from 'three'
import { air } from '../../lib/air'
import { lever } from '../../lib/lever'
import { PRESS } from '../../lib/world/spec'
import { useLetters } from '../../lib/store'
import { Afdruk } from './Afdruk'
import { Lood } from './Lood'
import { motion } from './motion'
import { Piece } from './Piece'

/** Hoe het trekken verloopt, in seconden na de klik */
const T = { roll: 0.5, down: 0.85, up: 1.25, rise: 2.2 }
const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x))
const span = (t: number, a: number, b: number) => ease((t - a) / (b - a))

/** Waar het vel heen gaat als het uit de pers komt: rechtop voor de boog, een beetje achterover */
const SHOWN = { at: [0, 1.22, 1.05] as const, tilt: -0.18, scale: 1.45 }
const BED = { at: [PRESS.forme.at[0], PRESS.forme.at[1] + 0.03, PRESS.forme.at[2]] as const, tilt: -Math.PI / 2 }

/**
 * De pers in beweging. Na een trek rolt de inktrol over het zetsel en terug, gaat de hendel omlaag,
 * zakt de degel, en komt het vel omhoog. Sleep je de hendel in de papieren laag, dan volgt hij je hand.
 * Met minder beweging staat alles meteen in zijn eindstand
 */
export function Pers3D({ reducedMotion }: { reducedMotion: boolean }) {
  const pulls = useLetters((s) => s.pulls)
  const printed = useLetters((s) => s.printed)
  const zetsel = useLetters((s) => s.zetsel)
  const degel = useRef<Mesh>(null)
  const hendel = useRef<Mesh>(null)
  const rol = useRef<Mesh>(null)
  const sheet = useRef<Group>(null)
  const started = useRef(-Infinity)
  const shown = useRef(0)

  useEffect(() => {
    if (pulls === 0) return
    started.current = reducedMotion ? -Infinity : air.time.value
    shown.current = reducedMotion ? 1 : 0
    motion.wake(T.rise + 0.3)
  }, [pulls, reducedMotion])

  // Het vel blijft liggen zolang het zetsel hetzelfde is. Verander je iets, dan gaat het terug op de stapel
  const fresh = printed !== null && printed === zetsel

  useFrame((_, delta) => {
    const t = air.time.value - started.current
    const held = lever.held()
    const pull = held ? lever.angle() : Math.max(span(t, T.roll, T.down) - span(t, T.down, T.up), 0)
    const roll = Math.sin(Math.min(1, Math.max(0, t / T.roll)) * Math.PI)
    if (held) motion.wake(0.2)
    // Wakker blijven tot alles op zijn plek staat. Op een traag apparaat duurt een animatie langer dan de klok zegt
    if (t < T.rise + 0.1) motion.wake(0.2)

    if (hendel.current) hendel.current.rotation.z = -pull * PRESS.lever.pull
    if (degel.current) degel.current.position.y = PRESS.platen.pivot[1] - pull * PRESS.platen.drop
    if (rol.current) {
      const dx = (PRESS.roller.travel[1] - PRESS.roller.travel[0]) * roll
      rol.current.position.x = PRESS.roller.pivot[0] + dx
      rol.current.rotation.z = -dx / PRESS.roller.radius
    }

    // Het vel: het komt na het drukken omhoog, en zakt weer weg als het zetsel verandert
    const want = fresh ? (reducedMotion ? 1 : span(t, T.up, T.rise)) : 0
    shown.current = reducedMotion ? want : shown.current + (want - shown.current) * (1 - Math.exp(-Math.min(delta, 0.1) * (fresh ? 30 : 6)))
    if (!fresh && shown.current > 0.01) motion.wake(0.2)
    if (sheet.current) {
      const s = shown.current
      sheet.current.visible = s > 0.01
      sheet.current.position.set(BED.at[0] + (SHOWN.at[0] - BED.at[0]) * s, BED.at[1] + (SHOWN.at[1] - BED.at[1]) * s, BED.at[2] + (SHOWN.at[2] - BED.at[2]) * s)
      sheet.current.rotation.x = BED.tilt + (SHOWN.tilt - BED.tilt) * s
      sheet.current.scale.setScalar(0.85 + (SHOWN.scale - 0.85) * s)
    }
  })

  return (
    <>
      <Piece name="degel" ref={degel} />
      <Piece name="hendel" ref={hendel} />
      <Piece name="rol" ref={rol} />
      <Lood />
      <group ref={sheet} visible={false}>
        {printed && <Afdruk zetsel={printed} />}
      </group>
    </>
  )
}
