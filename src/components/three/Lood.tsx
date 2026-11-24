import { useEffect, useState } from 'react'
import type { BufferGeometry } from 'three'
import { leadText } from '../../lib/type/lood'
import { PRESS } from '../../lib/world/spec'
import { lettersOf, useLetters } from '../../lib/store'
import { cast } from './gieten'
import { motion } from './motion'
import { paint } from './materials'

/** Je kop in lood op het bed van de pers, letter voor letter, in spiegelbeeld */
export function Lood() {
  const z = useLetters((s) => s.zetsel)
  const letters = useLetters((s) => lettersOf(s.zetsel, s))
  const [geometry, setGeometry] = useState<BufferGeometry | null>(null)
  const text = leadText(z.zin)

  useEffect(() => {
    if (!letters) return
    let alive = true
    void cast(letters.kop, z.kopStijl.weight, text).then((g) => {
      if (!alive) return
      setGeometry(g)
      motion.wake(0.2)
    })
    return () => {
      alive = false
    }
  }, [letters, text, z.kopStijl.weight])

  if (!geometry) return null
  const [x, y, zz] = PRESS.forme.at
  return <mesh geometry={geometry} material={paint} position={[x, y, zz]} castShadow receiveShadow />
}
