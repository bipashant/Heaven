import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Experience } from './three/Experience'
import { Interface } from './ui/Interface'
import { LabelLayer } from './three/parts/Labels'

/** Wait (briefly) for the Devanagari web font so canvas glyph textures use it. */
function useFontsReady(timeout = 2500) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let done = false
    const finish = () => {
      if (!done) {
        done = true
        setReady(true)
      }
    }
    const t = setTimeout(finish, timeout)
    Promise.all([
      document.fonts.load('600 64px "Noto Serif Devanagari"', 'ॐ'),
      document.fonts.ready,
    ]).then(finish, finish)
    return () => clearTimeout(t)
  }, [timeout])
  return ready
}

export default function App() {
  const fonts = useFontsReady()
  return (
    <>
      <div className="stage">
        {fonts && (
          <Canvas
            flat
            dpr={[1, 1.75]}
            camera={{ fov: 50, near: 1, far: 80000, position: [4000, 2000, 6000] }}
            gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
            onCreated={({ gl }) => {
              gl.toneMapping = THREE.NoToneMapping
            }}
          >
            <Suspense fallback={null}>
              <Experience />
            </Suspense>
          </Canvas>
        )}
      </div>
      <LabelLayer />
      <Interface />
      <SpeedInsights />
    </>
  )
}
