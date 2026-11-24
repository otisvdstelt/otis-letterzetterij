import { Text } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { BoxGeometry, MeshToonMaterial } from 'three'
import { air } from '../../lib/air'
import { pinAt } from '../../lib/world/spec'
import { familyOf, store, useLetters } from '../../lib/store'
import { Afdruk } from './Afdruk'
import { FACES, PAGE_INK } from './look'
import { windUniform } from './drukwerk'
import { toonGradient } from './materials'
import { motion } from './motion'

const pin = new BoxGeometry(0.018, 0.06, 0.02).translate(0, -0.012, 0.004)
const wood = new MeshToonMaterial({ color: '#c8a77a', gradientMap: toonGradient })
const card = new BoxGeometry(0.2, 0.05, 0.004)
const cardPaper = new MeshToonMaterial({ color: '#fcfaf3', gradientMap: toonGradient })

/**
 * De waslijn: hooguit zes vellen in de wind. Ze wapperen als je naar de lijn kijkt, en even na het ophangen.
 * Daarbuiten hangen ze stil, zodat de drukkerij niet voor niks blijft tekenen. Met minder beweging nooit.
 * Op de knijper hangt een kaartje met het paar. Een vel aantikken haalt het terug in de pers
 */
export function Waslijn3D({ reducedMotion }: { reducedMotion: boolean }) {
  const own = useLetters((s) => s.waslijn)
  const visiting = useLetters((s) => s.visiting)
  const view = useLetters((s) => s.view)
  const sheets = visiting ?? own
  const gust = useRef(-Infinity)

  useEffect(() => {
    gust.current = air.time.value
    motion.wake(4)
  }, [sheets.length])

  useFrame((_, delta) => {
    const watching = view === 'waslijn' || air.time.value - gust.current < 4
    const want = reducedMotion || !watching ? 0 : air.wind.strength
    windUniform.value += (want - windUniform.value) * (1 - Math.exp(-Math.min(delta, 0.1) * 2))
    if (watching && !reducedMotion) motion.wake(0.2)
  })

  return (
    <>
      {sheets.map((z, i) => {
        const [x, y, zz] = pinAt(i)
        return (
          <group
            key={`${i}-${z.kop}-${z.tekst}-${z.zin}`}
            position={[x, y - 0.01, zz + 0.02]}
            rotation={[0, -0.18, ((i * 37) % 5) * 0.01 - 0.02]}
            onClick={(event: ThreeEvent<MouseEvent>) => {
              event.stopPropagation()
              store.continueFrom(z)
            }}
            onPointerOver={() => (document.body.style.cursor = 'pointer')}
            onPointerOut={() => (document.body.style.cursor = '')}
          >
            <Afdruk zetsel={z} hanging />
            {/* Het kaartje met het paar, aan de knijper boven het vel */}
            <mesh geometry={card} material={cardPaper} position={[0, 0.045, 0.006]} />
            <Text font={FACES.hand} fontSize={0.017} maxWidth={0.19} anchorX="center" anchorY="middle" textAlign="center" color={PAGE_INK} position={[0, 0.045, 0.0095]} lineHeight={1}>
              {familyOf(z.kop) === familyOf(z.tekst) ? familyOf(z.kop) : `${familyOf(z.kop)} + ${familyOf(z.tekst)}`}
            </Text>
            <mesh geometry={pin} material={wood} position={[-0.13, 0, 0.005]} />
            <mesh geometry={pin} material={wood} position={[0.13, 0, 0.005]} />
          </group>
        )
      })}
    </>
  )
}
