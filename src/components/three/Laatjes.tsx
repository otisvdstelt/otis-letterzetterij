import { Text } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { strings } from '../../content/strings'
import { DRAWERS } from '../../lib/type/catalogue'
import { drawerAt } from '../../lib/world/spec'
import { store, useLetters } from '../../lib/store'
import { FACES, PAGE_INK } from './look'
import { motion } from './motion'
import { Piece } from './Piece'

/** Een laatje dat een stukje openschuift onder je wijzer, en helemaal als je erop tikt. De kast in de papieren laag gaat mee open */
function Laatje({ index, reducedMotion }: { index: number; reducedMotion: boolean }) {
  const drawer = DRAWERS[index]
  const open = useLetters((s) => s.drawer === drawer)
  const group = useRef<Group>(null)
  const hover = useRef(false)
  const out = useRef(0)
  const [x, y, z] = drawerAt(index)

  useFrame((_, delta) => {
    const want = open ? 0.45 : hover.current ? 0.06 : 0
    out.current = reducedMotion ? want : out.current + (want - out.current) * (1 - Math.exp(-Math.min(delta, 0.1) * 9))
    if (group.current) group.current.position.z = out.current
    if (Math.abs(want - out.current) > 0.002) motion.wake(0.1)
  })

  return (
    <group
      ref={group}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation()
        store.openDrawer(open ? null : drawer)
      }}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation()
        hover.current = true
        document.body.style.cursor = 'pointer'
        motion.wake(0.6)
      }}
      onPointerOut={() => {
        hover.current = false
        document.body.style.cursor = ''
        motion.wake(0.6)
      }}
    >
      <Piece name={`laatje-${index}`} />
      <Text font={FACES.hand} fontSize={0.045} anchorX="center" anchorY="middle" color={PAGE_INK} position={[x, y + 0.03, z + 0.012]} renderOrder={3}>
        {strings.kast.laatjes[drawer]}
      </Text>
    </group>
  )
}

export function Laatjes({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      {DRAWERS.map((_, i) => (
        <Laatje key={i} index={i} reducedMotion={reducedMotion} />
      ))}
    </>
  )
}
