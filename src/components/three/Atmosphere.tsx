import { useFrame } from '@react-three/fiber'
import { useState, useRef } from 'react'
import { Color, type DirectionalLight, type HemisphereLight, type PointLight } from 'three'
import { air, stepNight, type Phase } from '../../lib/air'
import { LAMP, WINDOW } from '../../lib/world/spec'
import { look } from './look'
import { setGlow } from './materials'

const c = (hex: string) => new Color(hex)

// Overdag valt er licht door het raam. 's Nachts doet de lamp boven de pers het werk
const DAY = { hemiSky: c('#fbf1dc'), hemiGround: c('#a08266'), hemi: 2.2, sun: c('#ffe6b8'), sunPower: 2.6, lamp: 0.8, paper: c('#f7f4eb'), ink: c('#1c1917') }
const NIGHT: typeof DAY = { hemiSky: c('#4a5488'), hemiGround: c('#1d1a26'), hemi: 0.5, sun: c('#a9bfff'), sunPower: 0.3, lamp: 4.2, paper: c('#171b2e'), ink: c('#070914') }

/** Het licht, het uur en de klok die elke shader leest */
export function Atmosphere({ phase, shadowSize }: { phase: Phase; shadowSize: number }) {
  const hemi = useRef<HemisphereLight>(null)
  const sun = useRef<DirectionalLight>(null)
  const lamp = useRef<PointLight>(null)
  const night = phase === 'night'

  // De drukkerij opent al in zijn uur. Daarna valt de nacht geleidelijk
  useState(() => {
    air.night.value = night ? 1 : 0
  })

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    air.time.value += dt
    air.night.value = stepNight(air.night.value, phase, delta)
    const dusk = air.night.value
    look.paper.copy(DAY.paper).lerp(NIGHT.paper, dusk)
    look.ink.copy(DAY.ink).lerp(NIGHT.ink, dusk)
    if (hemi.current) {
      hemi.current.color.copy(DAY.hemiSky).lerp(NIGHT.hemiSky, dusk)
      hemi.current.groundColor.copy(DAY.hemiGround).lerp(NIGHT.hemiGround, dusk)
      hemi.current.intensity = DAY.hemi + (NIGHT.hemi - DAY.hemi) * dusk
    }
    if (sun.current) {
      sun.current.color.copy(DAY.sun).lerp(NIGHT.sun, dusk)
      sun.current.intensity = DAY.sunPower + (NIGHT.sunPower - DAY.sunPower) * dusk
    }
    if (lamp.current) lamp.current.intensity = DAY.lamp + (NIGHT.lamp - DAY.lamp) * dusk
    setGlow(dusk)
  }, -3)

  const windowMid: [number, number, number] = [(WINDOW.x0 + WINDOW.x1) / 2, (WINDOW.y0 + WINDOW.y1) / 2, WINDOW.z]
  return (
    <>
      <hemisphereLight ref={hemi} args={['#f6ead0', '#7d5f45', DAY.hemi]} />
      {/* Licht door het raam, schuin naar binnen */}
      <directionalLight ref={sun} position={[windowMid[0] - 1.2, windowMid[1] + 2.4, windowMid[2] - 3]} color="#ffe2b0" intensity={DAY.sunPower} castShadow shadow-mapSize={[shadowSize, shadowSize]} shadow-bias={-0.0006} shadow-normalBias={0.03}>
        <orthographicCamera attach="shadow-camera" args={[-6, 6, 6, -6, 0.5, 20]} />
      </directionalLight>
      {/* De lamp boven de pers */}
      <pointLight ref={lamp} position={[LAMP.at[0], LAMP.at[1] - 0.05, LAMP.at[2]]} color="#ffc98a" intensity={DAY.lamp} distance={5} decay={1.4} />
    </>
  )
}
