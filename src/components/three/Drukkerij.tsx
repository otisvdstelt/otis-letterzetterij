import { Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { useMemo } from 'react'
import { strings } from '../../content/strings'
import { ZETBOEK } from '../../lib/world/spec'
import { familyOf, pairings, store, useLetters } from '../../lib/store'
import { Drukker3D } from './Drukker3D'
import { Laatjes } from './Laatjes'
import { FACES, PAGE_INK } from './look'
import { glow, shaft, windowGlow } from './materials'
import { Pers3D } from './Pers3D'
import { Piece } from './Piece'
import { Waslijn3D } from './Waslijn3D'
import { Vlucht, Zetbank3D } from './Zetbank3D'

/** Het zetboek ligt open op een recept voor het doel van nu. Erop tikken zet dat paar op het vel */
function Zetboek() {
  const z = useLetters((s) => s.zetsel)
  const catalogue = useLetters((s) => s.catalogue)
  const recipe = useMemo(() => {
    const forGoal = pairings.filter((p) => p.doel.includes(z.doel))
    return forGoal.find((p) => p.kop !== z.kop || p.tekst !== z.tekst) ?? forGoal[0] ?? null
  }, [z.doel, z.kop, z.tekst])
  if (!recipe || !catalogue) return <Piece name="zetboek" />
  const take = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    store.take(recipe)
  }
  const [x, y, zz] = ZETBOEK.at
  return (
    <group>
      <Piece name="zetboek" onClick={take} onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = '')} />
      <group position={[x, y + 0.012, zz]} rotation={[-Math.PI / 2, 0, -ZETBOEK.rot]}>
        <Text font={FACES.display} fontSize={0.032} maxWidth={0.26} anchorX="center" anchorY="top" color={PAGE_INK} position={[-0.155, 0.16, 0]} textAlign="center" lineHeight={1.1}>
          {strings.vel.letters(familyOf(recipe.kop), familyOf(recipe.tekst))}
        </Text>
        <Text font={FACES.hand} fontSize={0.022} maxWidth={0.25} anchorX="left" anchorY="top" color={PAGE_INK} position={[0.03, 0.16, 0]} lineHeight={1.25}>
          {recipe.waarom}
        </Text>
      </group>
    </group>
  )
}

/** De drukkerij, stuk voor stuk uit het gebakken model, met wat er beweegt */
export function Drukkerij({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      {['kamer', 'pers', 'kast', 'zetbank', 'bank', 'waslijn', 'lamp'].map((name) => (
        <Piece key={name} name={name} />
      ))}
      <Piece name="raam" material={windowGlow} castShadow={false} receiveShadow={false} />
      <Piece name="lamp-gloed" material={glow} castShadow={false} receiveShadow={false} />
      <Piece name="licht" material={shaft} castShadow={false} receiveShadow={false} renderOrder={5} />
      <Pers3D reducedMotion={reducedMotion} />
      <Laatjes reducedMotion={reducedMotion} />
      <Zetboek />
      <Drukker3D reducedMotion={reducedMotion} />
      <Waslijn3D reducedMotion={reducedMotion} />
      <Zetbank3D />
      <Vlucht reducedMotion={reducedMotion} />
    </>
  )
}
