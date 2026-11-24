import { PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer } from '@react-three/postprocessing'
import { use, useEffect, useRef, useState } from 'react'
import { Vector3 } from 'three'
import { airMoving, type Phase } from '../lib/air'
import { store, useLetters } from '../lib/store'
import { PRESS, VIEWS } from '../lib/world/spec'
import { lettering, PartsContext, useDrukkerijModel } from './three/assets'
import { Atmosphere } from './three/Atmosphere'
import { CameraRig, type Inset } from './three/CameraRig'
import { Drukkerij } from './three/Drukkerij'
import { InkPaper } from './three/InkPaper'
import { look } from './three/look'
import { motion } from './three/motion'
import { Reveal } from './three/Reveal'

export interface WorldProps {
  phase: Phase
  reducedMotion: boolean
  /** Een telefoon of een zuinig apparaat krijgt minder pixels en kleinere schaduwen */
  modest: boolean
  onReady: () => void
  /** Hoeveel ruimte de papieren panelen innemen, zodat de camera het onderwerp in de vrije ruimte zet */
  inset: Inset
  /** Waar de hendel van de pers op het scherm staat, zodat je hem in de papieren laag kunt pakken */
  onLever?: (at: { x: number; y: number } | null) => void
}

export type { Inset }

// Wat elk soort apparaat moet tekenen
const BUDGET = {
  full: { dpr: [1, 1.75] as [number, number], shadow: 2048 },
  modest: { dpr: [1, 1.25] as [number, number], shadow: 1024 },
}

/**
 * frameloop demand: er wordt alleen getekend als de store verandert, of zolang er iets beweegt (motion.wake).
 * Dit houdt de klok gaande zolang er iets onderweg is, ook de schemering: anders bleef het licht halverwege hangen
 * als je snel tussen dag en nacht wisselde
 */
function Wakker({ phase }: { phase: Phase }) {
  const invalidate = useThree((s) => s.invalidate)
  const current = useRef(phase)
  useEffect(() => store.subscribe(() => invalidate()), [invalidate])
  useEffect(() => {
    current.current = phase
    invalidate()
  }, [phase, invalidate])
  useEffect(() => {
    let frame = 0
    const tick = () => {
      if (motion.awake() || airMoving(current.current)) invalidate()
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [invalidate])
  return null
}

/** Meet waar het handvat van de hendel op het scherm staat, na elke camerabeweging */
function LeverOnScreen({ onLever }: { onLever: (at: { x: number; y: number } | null) => void }) {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const view = useLetters((s) => s.view)
  const last = useRef('')
  useFrame(() => {
    const p = new Vector3(...PRESS.lever.tip).project(camera)
    const at = view === 'pers' && p.z < 1 ? { x: Math.round(((p.x + 1) / 2) * size.width), y: Math.round(((1 - p.y) / 2) * size.height) } : null
    const key = JSON.stringify(at)
    if (key === last.current) return
    last.current = key
    onLever(at)
  })
  return null
}

/** De drukkerij in 3D. Alleen weergave: hij leest de store en stuurt intenties terug */
export default function World({ phase, reducedMotion, modest, onReady, inset, onLever }: WorldProps) {
  const parts = useDrukkerijModel()
  use(lettering)
  const budget = modest ? BUDGET.modest : BUDGET.full
  // Haalt het apparaat de 50 beelden per seconde niet, dan gaan er pixels af. Gaat het weer goed, dan komen ze terug
  const [dpr, setDpr] = useState(budget.dpr[1])

  useEffect(
    () => () => {
      document.body.style.cursor = ''
    },
    [],
  )

  return (
    <Canvas
      shadows={modest ? false : 'percentage'}
      flat
      frameloop="demand"
      dpr={[1, dpr]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ fov: VIEWS.werkbank.wide.fov, near: 0.1, far: 40, position: VIEWS.werkbank.wide.position as unknown as [number, number, number] }}
      onCreated={(state) => {
        state.gl.setClearColor(look.paper)
        if (import.meta.env.DEV) (window as unknown as { __drukkerij?: unknown }).__drukkerij = state
      }}
    >
      <PerformanceMonitor bounds={() => [50, 62]} flipflops={3} onDecline={() => setDpr((d) => Math.max(0.75, d - 0.25))} onIncline={() => setDpr((d) => Math.min(budget.dpr[1], d + 0.25))} onFallback={() => setDpr(0.75)} />
      <PartsContext value={parts}>
        <Wakker phase={phase} />
        <CameraRig reducedMotion={reducedMotion} inset={inset} />
        {onLever && <LeverOnScreen onLever={onLever} />}
        <Atmosphere phase={phase} shadowSize={budget.shadow} />
        <Drukkerij reducedMotion={reducedMotion} />
        <Reveal reducedMotion={reducedMotion} onShown={onReady} />
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <InkPaper />
        </EffectComposer>
      </PartsContext>
    </Canvas>
  )
}
