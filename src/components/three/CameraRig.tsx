import { useThree } from '@react-three/fiber'
import { useLayoutEffect } from 'react'
import type { PerspectiveCamera } from 'three'
import { VIEWS } from '../../lib/world/spec'

/** De camera staat stil en kijkt naar de pers. Op een smal podium iets dichterbij, met een wijdere blik */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)
  const invalidate = useThree((s) => s.invalidate)
  const narrow = width / Math.max(1, height) < 1.35

  useLayoutEffect(() => {
    const view = narrow ? VIEWS.narrow : VIEWS.wide
    camera.position.set(...view.position)
    camera.fov = view.fov
    camera.lookAt(...view.target)
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, narrow, invalidate])

  return null
}
