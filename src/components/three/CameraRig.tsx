import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import type { PerspectiveCamera } from 'three'
import { air } from '../../lib/air'
import { useLetters, type View } from '../../lib/store'
import { VIEWS } from '../../lib/world/spec'
import { motion } from './motion'

/** Mist erin, camera verzetten, mist eraf. Zoals tussen de plekken in het portfolio */
const FOG_IN = 0.85
const FOG_OUT = 1.1

/**
 * De camera kijkt naar de pers, de kast of de waslijn. Wisselen gaat met een bank mist die van links over het vel rolt.
 * Met minder beweging is het een snede
 */
export function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)
  const invalidate = useThree((s) => s.invalidate)
  const view = useLetters((s) => s.view)
  const narrow = width / Math.max(1, height) < 1.35
  const shown = useRef<View | null>(null)
  const wipe = useRef<{ to: View; at: number; moved: boolean } | null>(null)

  const place = (v: View) => {
    const spot = narrow ? VIEWS[v].narrow : VIEWS[v].wide
    camera.position.set(...spot.position)
    camera.fov = spot.fov
    camera.lookAt(...spot.target)
    camera.updateProjectionMatrix()
    shown.current = v
  }

  useLayoutEffect(() => {
    // De eerste keer, en bij een andere vorm van het podium: meteen op zijn plek
    if (shown.current === null || reducedMotion) {
      place(view)
      invalidate()
      return
    }
    if (shown.current === view) {
      // Terug naar waar we al stonden, terwijl de mist nog onderweg was: dan gaat die overgang niet meer door
      wipe.current = null
      air.wipe.value = 0
      air.reveal.value = 1
      place(view)
      invalidate()
      return
    }
    wipe.current = { to: view, at: air.time.value, moved: false }
    air.wipe.value = 1
    motion.wake(FOG_IN + FOG_OUT + 0.2)
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [view, narrow, reducedMotion])

  useFrame(() => {
    const w = wipe.current
    if (!w) return
    const t = air.time.value - w.at
    // Wakker blijven tot de mist weg is, hoe traag het apparaat ook tekent
    motion.wake(0.2)
    if (t < FOG_IN) {
      air.wipe.value = 1
      air.reveal.value = 1 - t / FOG_IN
      return
    }
    if (!w.moved) {
      place(w.to)
      w.moved = true
    }
    air.wipe.value = 2
    air.reveal.value = Math.min(1, (t - FOG_IN) / FOG_OUT)
    if (air.reveal.value >= 1) {
      wipe.current = null
      air.wipe.value = 0
    }
  })

  return null
}
