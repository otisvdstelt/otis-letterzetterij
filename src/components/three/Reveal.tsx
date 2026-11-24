import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { air } from '../../lib/air'
import { motion } from './motion'

/**
 * De eerste keer verschijnt de drukkerij als verf die zich vanuit het midden over het papier spreidt. Met minder beweging staat hij er meteen.
 * Pas als de verf echt te zien is, meldt hij zich: tot dan blijft de getekende pers staan, ook als een telefoon lang over de eerste beelden doet
 */
export function Reveal({ reducedMotion, onShown }: { reducedMotion: boolean; onShown?: () => void }) {
  const invalidate = useThree((s) => s.invalidate)
  const frames = useRef(0)
  const told = useRef(false)
  useEffect(() => {
    air.wipe.value = 0
    air.reveal.value = reducedMotion ? 1 : 0
    motion.wake(1.8)
    invalidate()
  }, [reducedMotion, invalidate])

  useFrame((_, delta) => {
    frames.current++
    if (!told.current && frames.current > 2 && air.reveal.value >= 0.35) {
      told.current = true
      onShown?.()
    }
    if (air.reveal.value >= 1 || air.wipe.value !== 0) return
    motion.wake(0.2)
    air.reveal.value = Math.min(1, air.reveal.value + Math.min(delta, 0.05) / 1.4)
  })
  return null
}
