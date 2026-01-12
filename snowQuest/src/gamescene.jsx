import { PointerLockControls } from "@react-three/drei"
import { useThree, useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"


export default function GameScene() {
  const controls = useRef()
  const velocity = useRef(new THREE.Vector3())
  const direction = new THREE.Vector3()
  const { camera } = useThree()

  const keys = useRef({ w: false, a: false, s: false, d: false })

  useFrame((_, delta) => {
    direction.set(0, 0, 0)
    if (keys.current.w) direction.z -= 1
    if (keys.current.s) direction.z += 1
    if (keys.current.a) direction.x -= 1
    if (keys.current.d) direction.x += 1

    direction.normalize()
    direction.applyEuler(camera.rotation)

    camera.position.addScaledVector(direction, delta * 4)
  })

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} />

      <GameMap />

      <PointerLockControls
        ref={controls}
        onLock={() => console.log("FPS mode")}
      />
    </>
  )
}
