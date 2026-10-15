import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { uTime } from './core/time'
import { updateCosmos } from './core/cosmos'
import { useCosmos } from '../state/store'
import { CameraRig } from './CameraRig'
import { Sky } from './realms/Sky'
import { Brahmanda } from './realms/Brahmanda'
import { Vaikuntha } from './realms/Beyond'
import { UpperLokas } from './realms/UpperLokas'
import { Svarga } from './realms/Svarga'
import { Bhuvarloka } from './realms/Bhuvarloka'
import { Bhuloka } from './realms/bhu/Bhuloka'
import { LowerLokas } from './realms/LowerLokas'
import { Yamaloka } from './realms/Yamaloka'
import { LabelProjector, RealmLabels } from './parts/Labels'

/** Advances shared time and signals readiness once shaders have compiled. */
function Ticker() {
  const frames = useRef(0)
  useFrame(({ clock }) => {
    uTime.value = clock.elapsedTime
    updateCosmos(clock.elapsedTime)
    if (frames.current < 6 && ++frames.current === 6) useCosmos.getState().setReady()
  })
  return null
}

/** Studio-free reflections for gold and jewels, built from light panels. */
function Reflections() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#0a0814']} />
      <Lightformer form="rect" intensity={3} color="#ffe1a8" position={[0, 6, -8]} scale={[12, 4, 1]} />
      <Lightformer form="rect" intensity={1.6} color="#a8c8ff" position={[-9, 2, 4]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} />
      <Lightformer form="rect" intensity={1.2} color="#ffb0d8" position={[9, 1, 2]} rotation-y={-Math.PI / 2} scale={[10, 3, 1]} />
      <Lightformer form="ring" intensity={2.5} color="#fff4dc" position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={6} />
      <Lightformer form="rect" intensity={0.6} color="#3a2a5a" position={[0, -6, 0]} rotation-x={-Math.PI / 2} scale={[20, 20, 1]} />
    </Environment>
  )
}

export function Experience() {
  return (
    <>
      <color attach="background" args={['#020108']} />
      <Ticker />
      <Reflections />
      <hemisphereLight args={['#c8d6ff', '#2a1c14', 0.75]} />
      <ambientLight intensity={0.18} color="#b8b0ff" />

      <Sky />
      <Brahmanda />
      <Vaikuntha />
      <UpperLokas />
      <Svarga />
      <Bhuvarloka />
      <Bhuloka />
      <LowerLokas />
      <Yamaloka />

      <RealmLabels />
      <LabelProjector />
      <CameraRig />

      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={1.05} luminanceThreshold={0.82} luminanceSmoothing={0.25} radius={0.78} />
        <Vignette offset={0.28} darkness={0.62} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  )
}
