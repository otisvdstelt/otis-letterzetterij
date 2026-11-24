import type { ThreeEvent } from '@react-three/fiber'
import { forwardRef } from 'react'
import type { Material, Mesh } from 'three'
import { useParts } from './assets'
import { paint } from './materials'

interface PieceProps {
  name: string
  material?: Material
  /** Stukken met een draaipunt staan daar, tenzij er al een groep op die plek staat */
  hung?: boolean
  castShadow?: boolean
  receiveShadow?: boolean
  renderOrder?: number
  onClick?: (event: ThreeEvent<MouseEvent>) => void
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void
}

/** Eén benoemd stuk uit de gebakken drukkerij */
export const Piece = forwardRef<Mesh, PieceProps>(function Piece({ name, material = paint, hung = false, castShadow = true, receiveShadow = true, ...rest }, ref) {
  const parts = useParts()
  if (!parts.geometry[name]) {
    console.warn(`De drukkerij heeft geen stuk dat ${name} heet. Draai npm run world om het te bakken.`)
    return null
  }
  return <mesh ref={ref} name={name} geometry={parts.geometry[name]} material={material} position={hung ? undefined : parts.pivot[name]} castShadow={castShadow} receiveShadow={receiveShadow} {...rest} />
})
