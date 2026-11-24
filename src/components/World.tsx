import { PerformanceMonitor } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { EffectComposer } from '@react-three/postprocessing'
import { use, useEffect, useState } from 'react'
import type { Phase } from '../lib/air'
import { store } from '../lib/store'
import { VIEWS } from '../lib/world/spec'
import { lettering, PartsContext, useDrukkerijModel } from './three/assets'
import { Atmosphere } from './three/Atmosphere'
import { CameraRig } from './three/CameraRig'
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
}

// Wat elk soort apparaat moet tekenen
const BUDGET = {
  full: { dpr: [1, 1.75] as [number, number], shadow: 2048 },
  modest: { dpr: [1, 1.25] as [number, number], shadow: 1024 },
}

/**
 * frameloop demand: er wordt alleen getekend als de store verandert, of zolang er iets beweegt (motion.wake).
 * Dit houdt de klok gaande zolang er iets onderweg is
 */
function Wakker() {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => store.subscribe(() => invalidate()), [invalidate])
  useEffect(() => {
    let frame = 0
    const tick = () => {
      if (motion.awake()) invalidate()
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [invalidate])
  return null
}

/** De drukkerij in 3D. Alleen weergave: hij leest de store en stuurt intenties terug */
export default function World({ phase, reducedMotion, modest, onReady }: WorldProps) {
  const parts = useDrukkerijModel()
  use(lettering)
  const budget = modest ? BUDGET.modest : BUDGET.full
  // Haalt het apparaat de 50 beelden per seconde niet, dan gaan er pixels af. Gaat het weer goed, dan komen ze terug
  const [dpr, setDpr] = useState(budget.dpr[1])

  useEffect(() => {
    onReady()
    return () => {
      document.body.style.cursor = ''
    }
    // De drukkerij komt één keer binnen
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Canvas
      shadows="percentage"
      flat
      frameloop="demand"
      dpr={[1, dpr]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ fov: VIEWS.wide.fov, near: 0.1, far: 40, position: VIEWS.wide.position as unknown as [number, number, number] }}
      onCreated={(state) => {
        state.gl.setClearColor(look.paper)
        if (import.meta.env.DEV) (window as unknown as { __drukkerij?: unknown }).__drukkerij = state
      }}
    >
      <PerformanceMonitor bounds={() => [50, 62]} flipflops={3} onDecline={() => setDpr((d) => Math.max(0.75, d - 0.25))} onIncline={() => setDpr((d) => Math.min(budget.dpr[1], d + 0.25))} onFallback={() => setDpr(0.75)} />
      <PartsContext value={parts}>
        <Wakker />
        <CameraRig />
        <Atmosphere phase={phase} shadowSize={budget.shadow} />
        <Drukkerij />
        <Reveal reducedMotion={reducedMotion} />
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <InkPaper />
        </EffectComposer>
      </PartsContext>
    </Canvas>
  )
}
