import { useGLTF } from '@react-three/drei'
import { createContext, use, useMemo } from 'react'
import type { BufferGeometry, Mesh } from 'three'

import drukkerijUrl from '../../assets/drukkerij.glb?url'

/** De hele drukkerij in één Draco-bestand, gebakken door npm run world. De naam draagt een hash, dus nooit een oude uit de cache */
export const DRUKKERIJ_URL = drukkerijUrl
/** De decoder komt van deze site, niet van een CDN */
const DRACO_PATH = `${import.meta.env.BASE_URL}draco/`

// Begin met downloaden zodra deze chunk draait, nog voordat een component erom vraagt
useGLTF.preload(DRUKKERIJ_URL, DRACO_PATH)

/** De gebakken drukkerij, uit elkaar gehaald in benoemde stukken */
export interface Parts {
  geometry: Record<string, BufferGeometry>
  /** Waar elk stuk aan hangt of om draait */
  pivot: Record<string, [number, number, number]>
}

/** Wacht tot het model gedecodeerd is. Zolang rolt de inktrol */
export function useDrukkerijModel(): Parts {
  const gltf = useGLTF(DRUKKERIJ_URL, DRACO_PATH)
  return useMemo(() => {
    const parts: Parts = { geometry: {}, pivot: {} }
    gltf.scene.traverse((object) => {
      const mesh = object as Mesh
      if (!mesh.isMesh) return
      parts.geometry[mesh.name] = mesh.geometry
      parts.pivot[mesh.name] = [mesh.position.x, mesh.position.y, mesh.position.z]
    })
    return parts
  }, [gltf])
}

/** De handschriften, heel even afgewacht, zodat geen kaartje in een vervangletter verschijnt */
export const lettering: Promise<unknown> = Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1500))])

export const PartsContext = createContext<Parts | null>(null)

export function useParts(): Parts {
  const parts = use(PartsContext)
  if (!parts) throw new Error('useParts hoort binnen de drukkerij')
  return parts
}
