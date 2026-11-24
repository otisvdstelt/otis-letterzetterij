import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { Mesh } from 'three'
import { air } from '../../lib/air'
import { DRUKKER } from '../../lib/world/spec'
import { currentRemarks, useLetters } from '../../lib/store'
import { motion } from './motion'
import { Piece } from './Piece'

/**
 * De drukker, met zijn draaipunten. Hij ademt, kijkt naar de pers als je trekt en steekt zijn hand uit,
 * en knikt als hij iets nieuws te zeggen heeft. Met minder beweging staat hij stil
 */
export function Drukker3D({ reducedMotion }: { reducedMotion: boolean }) {
  const pulls = useLetters((s) => s.pulls)
  const quiet = useLetters((s) => s.quiet)
  const first = useLetters((s) => currentRemarks(s)[0]?.id ?? null)
  const body = useRef<Mesh>(null)
  const head = useRef<Mesh>(null)
  const armR = useRef<Mesh>(null)
  const armL = useRef<Mesh>(null)
  const pulledAt = useRef(-Infinity)
  const noddedAt = useRef(-Infinity)

  useEffect(() => {
    if (pulls === 0 || reducedMotion) return
    pulledAt.current = air.time.value
    motion.wake(1.8)
  }, [pulls, reducedMotion])

  useEffect(() => {
    if (!first || quiet || reducedMotion) return
    noddedAt.current = air.time.value
    motion.wake(0.9)
  }, [first, quiet, reducedMotion])

  useFrame(() => {
    if (reducedMotion) return
    const time = air.time.value
    const sincePull = time - pulledAt.current
    const sinceNod = time - noddedAt.current
    // Naar de pers kijken en de hand uitsteken, en daarna weer terug
    const busy = sincePull < 1.6 ? Math.sin(Math.min(1, sincePull / 1.6) * Math.PI) : 0
    if (sincePull < 1.7 || sinceNod < 0.8) motion.wake(0.2)
    const nod = sinceNod < 0.7 ? Math.sin((sinceNod / 0.7) * Math.PI * 2) * 0.12 : 0
    if (body.current) body.current.scale.y = 1 + Math.sin(time * 1.7) * 0.006
    if (head.current) {
      head.current.rotation.y = Math.sin(time * 0.35) * 0.12 + busy * 0.55
      head.current.rotation.x = nod + busy * 0.18
    }
    if (armR.current) armR.current.rotation.x = -busy * 0.9 + Math.sin(time * 1.7) * 0.02
    if (armL.current) armL.current.rotation.x = Math.sin(time * 1.7 + 1) * 0.02
  })

  return (
    <group position={DRUKKER.at as unknown as [number, number, number]} rotation={[0, DRUKKER.turn, 0]}>
      <Piece name="drukker-lijf" ref={body} />
      <Piece name="drukker-hoofd" ref={head} />
      <Piece name="drukker-arm-l" ref={armL} />
      <Piece name="drukker-arm-r" ref={armR} />
    </group>
  )
}
