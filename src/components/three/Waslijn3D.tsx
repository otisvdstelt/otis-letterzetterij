import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { BoxGeometry, MeshToonMaterial } from 'three'
import { air } from '../../lib/air'
import { pinAt } from '../../lib/world/spec'
import { useLetters } from '../../lib/store'
import { Afdruk } from './Afdruk'
import { windUniform } from './drukwerk'
import { toonGradient } from './materials'
import { motion } from './motion'

const pin = new BoxGeometry(0.018, 0.06, 0.02).translate(0, -0.012, 0.004)
const wood = new MeshToonMaterial({ color: '#c8a77a', gradientMap: toonGradient })

/**
 * De waslijn: hooguit zes vellen in de wind. Ze wapperen als je naar de lijn kijkt, en even na het ophangen.
 * Daarbuiten hangen ze stil, zodat de drukkerij niet voor niks blijft tekenen. Met minder beweging nooit
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
          <group key={`${i}-${z.kop}-${z.tekst}-${z.zin}`} position={[x, y - 0.01, zz + 0.02]} rotation={[0, -0.18, ((i * 37) % 5) * 0.01 - 0.02]}>
            <Afdruk zetsel={z} hanging />
            <mesh geometry={pin} material={wood} position={[-0.08, 0, 0.005]} />
            <mesh geometry={pin} material={wood} position={[0.08, 0, 0.005]} />
          </group>
        )
      })}
    </>
  )
}
