import { useEffect, useMemo, useState } from 'react'
import type { CanvasTexture } from 'three'
import { strings } from '../../content/strings'
import { familyName } from '../../lib/type/fontface'
import { hash } from '../../lib/type/prng'
import type { Zetsel } from '../../lib/type/zetsel'
import { familyOf, lettersOf, useLetters } from '../../lib/store'
import { useFontFaces } from '../../hooks/useFontFaces'
import { hangingGeometry, printMask, printMaterial, sheetGeometry } from './drukwerk'
import { motion } from './motion'

/** Een afdruk van een zetsel: zijn zin in zijn kopletter, in zijn inkt, op zijn papier */
export function Afdruk({ zetsel, hanging = false }: { zetsel: Zetsel; hanging?: boolean }) {
  const letters = useLetters((s) => lettersOf(zetsel, s))
  useFontFaces([letters?.kop, letters?.tekst])
  const seed = useMemo(() => hash(JSON.stringify(zetsel)), [zetsel])
  const material = useMemo(() => printMaterial({ ink: zetsel.inkt, paper: zetsel.papier, seed, hanging }), [zetsel.inkt, zetsel.papier, seed, hanging])
  const [mask, setMask] = useState<CanvasTexture | null>(null)

  useEffect(() => {
    let alive = true
    let made: CanvasTexture | null = null
    void printMask({
      zin: zetsel.zin,
      family: `'${familyName(zetsel.kop)}', serif`,
      weight: zetsel.kopStijl.weight,
      italic: zetsel.kopStijl.italic,
      onder: strings.vel.letters(familyOf(zetsel.kop), familyOf(zetsel.tekst)),
      onderFamily: `'${familyName(zetsel.tekst)}', sans-serif`,
    }).then((texture) => {
      if (!alive) {
        texture.dispose()
        return
      }
      made = texture
      setMask(texture)
      motion.wake(0.3)
    })
    return () => {
      alive = false
      made?.dispose()
    }
  }, [zetsel.zin, zetsel.kop, zetsel.tekst, zetsel.kopStijl.weight, zetsel.kopStijl.italic, letters])

  useEffect(() => {
    material.uniforms.uMask.value = mask
    material.uniforms.uInked.value = mask ? 1 : 0
  }, [material, mask])
  useEffect(() => () => material.dispose(), [material])

  return <mesh geometry={hanging ? hangingGeometry : sheetGeometry} material={material} castShadow receiveShadow />
}
