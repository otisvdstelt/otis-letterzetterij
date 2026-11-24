import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector3, type PerspectiveCamera } from 'three'
import { useLetters } from '../../lib/store'
import { VIEWS, type Vec3 } from '../../lib/world/spec'
import { motion } from './motion'

/** Hoeveel ruimte de papieren panelen innemen, in px. De camera schuift zijn beeld zo, dat het onderwerp in de vrije ruimte staat */
export interface Inset {
  left: number
  right: number
  top: number
  bottom: number
}

const DOLLY = 1.1
const ease = (x: number) => (x >= 1 ? 1 : 1 - (1 - x) ** 3)
const v = (p: Vec3) => new Vector3(p[0], p[1], p[2])

/**
 * De camera loopt mee door de drukkerij: werkbank, kast, pers en waslijn. Ze schuift er rustig heen, zonder mist,
 * zodat je ziet waar je bent. Met minder beweging staat ze er meteen
 */
export function CameraRig({ reducedMotion, inset }: { reducedMotion: boolean; inset: Inset }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)
  const invalidate = useThree((s) => s.invalidate)
  const view = useLetters((s) => s.view)
  // De vorm van de vrije ruimte bepaalt of het beeld breed of smal is
  const free = { w: Math.max(1, width - inset.left - inset.right), h: Math.max(1, height - inset.top - inset.bottom) }
  const narrow = free.w / free.h < 1.2
  const from = useRef<{ position: Vector3; target: Vector3; fov: number } | null>(null)
  const goal = useRef({ position: new Vector3(), target: new Vector3(), fov: 40 })
  const target = useRef(new Vector3())
  const started = useRef(-1)

  // Het beeld opzij schuiven: het midden van de vrije ruimte wordt het midden van de lens
  useEffect(() => {
    const dx = (inset.right - inset.left) / 2
    const dy = (inset.bottom - inset.top) / 2
    camera.setViewOffset(width, height, dx, dy, width, height)
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, width, height, inset.left, inset.right, inset.top, inset.bottom, invalidate])

  useEffect(() => {
    const spot = narrow ? VIEWS[view].narrow : VIEWS[view].wide
    goal.current = { position: v(spot.position), target: v(spot.target), fov: spot.fov }
    if (from.current === null || reducedMotion) {
      camera.position.copy(goal.current.position)
      target.current.copy(goal.current.target)
      camera.fov = spot.fov
      camera.lookAt(target.current)
      camera.updateProjectionMatrix()
      from.current = { position: camera.position.clone(), target: target.current.clone(), fov: camera.fov }
      started.current = -1
      invalidate()
      return
    }
    from.current = { position: camera.position.clone(), target: target.current.clone(), fov: camera.fov }
    started.current = performance.now()
    motion.wake(DOLLY + 0.2)
  }, [view, narrow, reducedMotion, camera, invalidate])

  useFrame(() => {
    if (started.current < 0 || !from.current) return
    const t = ease((performance.now() - started.current) / (DOLLY * 1000))
    camera.position.lerpVectors(from.current.position, goal.current.position, t)
    target.current.lerpVectors(from.current.target, goal.current.target, t)
    camera.fov = from.current.fov + (goal.current.fov - from.current.fov) * t
    camera.lookAt(target.current)
    camera.updateProjectionMatrix()
    motion.wake(0.2)
    if (t >= 1) started.current = -1
  })

  return null
}
