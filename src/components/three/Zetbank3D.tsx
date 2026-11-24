import { Text } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { BoxGeometry, MeshToonMaterial, type BufferGeometry, type Mesh } from 'three'
import { air } from '../../lib/air'
import { DRAWERS } from '../../lib/type/catalogue'
import { drawerAt, WINKELHAAK, ZETBANK, zetbankRow } from '../../lib/world/spec'
import { currentSuggestions, fontById, store, useLetters } from '../../lib/store'
import { cast } from './gieten'
import { FACES, PAGE_INK } from './look'
import { paint, toonGradient } from './materials'
import { motion } from './motion'

const ROW = { width: ZETBANK.x1 - ZETBANK.x0 - 0.12, body: 0.09 }

/** De regels staan schuin tegen een latje, met het beeld naar je toe, zodat je ze vanaf de kast kunt lezen */
const TILT = 0.6

/** Eén paar van de drukker: de kop in lood, leesbaar, met de tekstletter op een kaartje ervoor. Erop tikken zet het op het vel */
function Regel({ index, kop, tekst }: { index: number; kop: string; tekst: string }) {
  const [geometry, setGeometry] = useState<BufferGeometry | null>(null)
  const kopFont = useLetters((s) => fontById(kop, s))
  const tekstFont = useLetters((s) => fontById(tekst, s))
  const current = useLetters((s) => s.zetsel.kop === kop && s.zetsel.tekst === tekst)
  const lift = useRef(0)
  const hover = useRef(false)
  const group = useRef<Mesh>(null)

  useEffect(() => {
    if (!kopFont) return
    let alive = true
    void cast(kopFont, 600, kopFont.family, ROW, false).then((g) => {
      if (!alive) return
      setGeometry(g)
      motion.wake(0.3)
    })
    return () => {
      alive = false
    }
  }, [kopFont])

  useFrame((_, delta) => {
    const want = hover.current || current ? 0.03 : 0
    lift.current += (want - lift.current) * (1 - Math.exp(-Math.min(delta, 0.1) * 10))
    if (group.current) group.current.position.y = lift.current
    if (Math.abs(want - lift.current) > 0.001) motion.wake(0.1)
  })

  const [x, y, z] = zetbankRow(index)
  return (
    <group
      position={[x, y + 0.03 + (2 - index) * 0.04, z]}
      rotation={[TILT, 0, 0]}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation()
        store.take({ kop, tekst })
      }}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation()
        hover.current = true
        document.body.style.cursor = 'pointer'
        motion.wake(0.5)
      }}
      onPointerOut={() => {
        hover.current = false
        document.body.style.cursor = ''
        motion.wake(0.5)
      }}
    >
      <mesh ref={group} geometry={geometry ?? undefined} material={paint} castShadow receiveShadow visible={geometry !== null} />
      {tekstFont && (
        <Text font={FACES.hand} fontSize={0.034} anchorX="center" anchorY="middle" color={PAGE_INK} position={[0, 0.002, 0.072]} rotation={[-Math.PI / 2, 0, 0]}>
          {`met ${tekstFont.family}`}
        </Text>
      )}
    </group>
  )
}

/** De drie paren die de drukker op de zetbank klaarlegt */
export function Zetbank3D() {
  const list = useLetters(currentSuggestions)
  return (
    <>
      {list.slice(0, 3).map((s, i) => (
        <Regel key={`${s.kop}|${s.tekst}`} index={i} kop={s.kop} tekst={s.tekst} />
      ))}
    </>
  )
}

const sort = new BoxGeometry(0.03, 0.024, 0.075)
const lead = new MeshToonMaterial({ color: '#7d8186', gradientMap: toonGradient })

/**
 * Een gekozen letter gaat zichtbaar naar de winkelhaak: een loden blokje vliegt in een boog uit zijn laatje.
 * Met minder beweging ligt het er meteen
 */
export function Vlucht({ reducedMotion }: { reducedMotion: boolean }) {
  const kop = useLetters((s) => s.zetsel.kop)
  const tekst = useLetters((s) => s.zetsel.tekst)
  const mesh = useRef<Mesh>(null)
  const flight = useRef<{ from: [number, number, number]; at: number } | null>(null)
  const last = useRef({ kop, tekst })

  useEffect(() => {
    const changed = kop !== last.current.kop ? kop : tekst !== last.current.tekst ? tekst : null
    last.current = { kop, tekst }
    if (!changed || reducedMotion) return
    const font = fontById(changed)
    const drawer = font ? DRAWERS.indexOf(font.drawer) : -1
    if (drawer < 0) return
    const [x, y, z] = drawerAt(drawer)
    flight.current = { from: [x, y, z + 0.1], at: air.time.value }
    motion.wake(1.2)
  }, [kop, tekst, reducedMotion])

  useFrame(() => {
    const m = mesh.current
    const f = flight.current
    if (!m) return
    if (!f) {
      m.visible = false
      return
    }
    const t = Math.min(1, (air.time.value - f.at) / 0.9)
    const e = t * t * (3 - 2 * t)
    m.visible = t < 1
    m.position.set(f.from[0] + (WINKELHAAK[0] - f.from[0]) * e, f.from[1] + (WINKELHAAK[1] + 0.02 - f.from[1]) * e + Math.sin(t * Math.PI) * 0.35, f.from[2] + (WINKELHAAK[2] - f.from[2]) * e)
    m.rotation.set(t * 6, t * 3, 0)
    motion.wake(0.2)
    if (t >= 1) flight.current = null
  })

  return <mesh ref={mesh} geometry={sort} material={lead} visible={false} castShadow />
}
