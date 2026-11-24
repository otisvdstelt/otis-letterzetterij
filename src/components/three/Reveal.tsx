import { useFrame, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { air } from '../../lib/air'
import { motion } from './motion'

/** De eerste keer verschijnt de drukkerij als verf die zich vanuit het midden over het papier spreidt. Met minder beweging staat hij er meteen */
export function Reveal({ reducedMotion }: { reducedMotion: boolean }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    air.wipe.value = 0
    air.reveal.value = reducedMotion ? 1 : 0
    motion.wake(1.8)
    invalidate()
  }, [reducedMotion, invalidate])

  useFrame((_, delta) => {
    if (air.reveal.value >= 1) return
    air.reveal.value = Math.min(1, air.reveal.value + Math.min(delta, 0.05) / 1.4)
  })
  return null
}
