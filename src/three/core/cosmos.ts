import * as THREE from 'three'
import { SUN_ORBIT_R, Y } from '../../data/layout'

/** Shared positions of the sun and moon (the sun circles Meru: day/night on Bhū-maṇḍala). */
export const cosmos = {
  sun: new THREE.Vector3(),
  moon: new THREE.Vector3(),
  sunAngle: 0,
}

const START = Math.PI * 0.3 // south-east: lights Kailāsa's south face on arrival
const PERIOD = 900 // seconds for one day around Meru

export function updateCosmos(t: number) {
  const a = START + (t / PERIOD) * Math.PI * 2
  cosmos.sunAngle = a
  cosmos.sun.set(Math.cos(a) * SUN_ORBIT_R, Y.sun, Math.sin(a) * SUN_ORBIT_R)
  cosmos.moon.set(Math.cos(a + Math.PI) * (SUN_ORBIT_R - 20), Y.sun + 15, Math.sin(a + Math.PI) * (SUN_ORBIT_R - 20))
}
updateCosmos(0)
