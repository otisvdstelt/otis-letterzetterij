import { useSyncExternalStore } from 'react'

/** De uitkomst van een CSS media query, live */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}

/** Onder deze breedte is de pagina ingedeeld voor een telefoon */
export const COMPACT = '(max-width: 1023px)'

/** Kan dit apparaat de drukkerij schilderen? Met ?papier in het adres krijg je altijd de papieren versie */
export function canPaint(): boolean {
  if (new URLSearchParams(window.location.search).has('papier')) return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2'))
  } catch {
    return false
  }
}

/** Een zuinig apparaat: weinig kernen of weinig geheugen, of een telefoon */
export function isModest(): boolean {
  const cores = navigator.hardwareConcurrency ?? 8
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  return cores <= 4 || memory <= 4 || window.matchMedia('(pointer: coarse)').matches
}
