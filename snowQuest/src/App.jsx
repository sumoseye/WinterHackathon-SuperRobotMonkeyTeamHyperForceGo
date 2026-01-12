import { Canvas, useFrame } from '@react-three/fiber'
import { PointerLockControls, useGLTF, Environment } from '@react-three/drei'
import { Physics, RigidBody, useRapier, CapsuleCollider } from '@react-three/rapier'
import { useRef, useEffect, useState, useMemo } from 'react'
import * as THREE from 'three'

// --- SNOW COMPONENT ---
function Snow({ count = 3000 }) {
  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100
      positions[i * 3 + 1] = Math.random() * 40
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100
      velocities[i * 3] = (Math.random() - 0.5) * 2
      velocities[i * 3 + 1] = Math.random() * 2 + 2
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 2
    }
    return { positions, velocities }
  }, [count])

  const pointsRef = useRef()

  useFrame((state, delta) => {
    if (!pointsRef.current) return
    const posAttribute = pointsRef.current.geometry.attributes.position
    for (let i = 0; i < count; i++) {
      posAttribute.array[i * 3 + 1] -= velocities[i * 3 + 1] * delta
      posAttribute.array[i * 3] -= Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.05
      if (posAttribute.array[i * 3 + 1] < 0) {
        posAttribute.array[i * 3 + 1] = 40
        posAttribute.array[i * 3] = (Math.random() - 0.5) * 100
        posAttribute.array[i * 3 + 2] = (Math.random() - 0.5) * 100
      }
    }
    posAttribute.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.15} color="white" transparent opacity={0.8} sizeAttenuation={true} depthWrite={false} />
    </points>
  )
}

// --- PLAYER BODY MESH (Visible Collision Object) ---
function PlayerBody() {
  return (
    <group>
      {/* Body - Capsule shape made of cylinder + spheres */}
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.5, 1.5, 8, 16]} />
        <meshStandardMaterial 
          color="#4488ff" 
          transparent 
          opacity={0.7}
          metalness={0.3}
          roughness={0.5}
        />
      </mesh>
      
      {/* Head - Sphere on top */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial 
          color="#ffcc88" 
          metalness={0.2}
          roughness={0.6}
        />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[0.12, 1.3, 0.28]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      <mesh position={[-0.12, 1.3, 0.28]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
    </group>
  )
}

function Player() {
  const playerRef = useRef()
  const bodyRef = useRef() // Reference to the visible body mesh
  const { rapier, world } = useRapier()
  
  // Vectors
  const moveDirection = new THREE.Vector3()
  const frontVector = new THREE.Vector3()
  const sideVector = new THREE.Vector3()
  
  const keys = useRef({})
  const isGrounded = useRef(false)
  const jumpRequested = useRef(false)
  const [thirdPerson, setThirdPerson] = useState(false)

  useEffect(() => {
    const down = (e) => {
      keys.current[e.code] = true
      if (e.code === 'Space') jumpRequested.current = true
      // Toggle view with V key
      if (e.code === 'KeyV') setThirdPerson(prev => !prev)
    }
    const up = (e) => {
      keys.current[e.code] = false
      if (e.code === 'Space') jumpRequested.current = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useFrame((state) => {
    if (!playerRef.current) return

    // --- 1. Ground Check ---
    const position = playerRef.current.translation()
    const rayOrigin = { x: position.x, y: position.y - 1.25, z: position.z }
    const ray = new rapier.Ray(rayOrigin, { x: 0, y: -1, z: 0 })
    const hit = world.castRay(ray, 0.5, true, null, null, playerRef.current)
    isGrounded.current = !!hit

    // --- 2. Jump ---
    if (jumpRequested.current && isGrounded.current) {
       playerRef.current.setLinvel({ 
        x: playerRef.current.linvel().x, 
        y: 8, 
        z: playerRef.current.linvel().z 
      }, true)
      jumpRequested.current = false
    }

    // --- 3. Movement ---
    state.camera.getWorldDirection(frontVector)
    frontVector.y = 0 
    frontVector.normalize() 
    sideVector.copy(frontVector).cross(state.camera.up).normalize()

    moveDirection.set(0, 0, 0)

    if (keys.current.KeyW) moveDirection.add(frontVector)
    if (keys.current.KeyS) moveDirection.sub(frontVector)
    if (keys.current.KeyD) moveDirection.add(sideVector)
    if (keys.current.KeyA) moveDirection.sub(sideVector)

    if (moveDirection.length() > 0) moveDirection.normalize()

    const speed = keys.current.ShiftLeft ? 12 : 8
    const currentVel = playerRef.current.linvel()
    
    playerRef.current.setLinvel(
      {
        x: moveDirection.x * speed,
        y: currentVel.y, 
        z: moveDirection.z * speed,
      },
      true
    )
    
    // --- 4. Update Camera ---
    const playerPos = playerRef.current.translation()
    
    if (thirdPerson) {
      // Third Person: Camera behind and above the player
      const cameraOffset = new THREE.Vector3()
      state.camera.getWorldDirection(cameraOffset)
      cameraOffset.multiplyScalar(-5) // 5 units behind
      cameraOffset.y = 3 // 3 units above
      
      state.camera.position.set(
        playerPos.x + cameraOffset.x,
        playerPos.y + cameraOffset.y,
        playerPos.z + cameraOffset.z
      )
      state.camera.lookAt(playerPos.x, playerPos.y + 1, playerPos.z)
    } else {
      // First Person: Camera at head level
      state.camera.position.set(playerPos.x, playerPos.y + 1.0, playerPos.z)
    }

    // --- 5. Rotate Player Body to face movement direction ---
    if (bodyRef.current && moveDirection.length() > 0) {
      const angle = Math.atan2(moveDirection.x, moveDirection.z)
      bodyRef.current.rotation.y = angle
    }
  })

  return (
    <RigidBody
      ref={playerRef}
      colliders={false}
      mass={1}
      position={[10, 5, 0]}
      enabledRotations={[false, false, false]}
      lockRotations
      friction={0}
      ccd={true}
    >
      {/* Physics Collider */}
      <CapsuleCollider args={[0.75, 0.5]} />
      
      {/* Visible Player Body - This follows the camera/physics body */}
      <group ref={bodyRef}>
        <PlayerBody />
      </group>
    </RigidBody>
  )
}

function Model() {
  const { scene, error } = useGLTF('/models/vilage.glb', undefined, undefined, (e) => console.error(e))
  
  useEffect(() => {
    if (scene) {
      scene.scale.set(0.5, 0.5, 0.5)
      scene.position.set(0, 0, 0)
      scene.traverse((child) => {
        if (child.isMesh) {
          if (!child.material) {
            child.material = new THREE.MeshStandardMaterial({ 
              color: 0x888888, 
              roughness: 0.8, 
              metalness: 0.2 
            })
          }
          child.castShadow = true
          child.receiveShadow = true
        }
      })
    }
  }, [scene, error])
  
  if (error) return null
  return <primitive object={scene} />
}

useGLTF.preload('/models/vilage.glb')

export default function App() {
  const [loaded, setLoaded] = useState(false)
  
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, background: '#aaccff' }}>
      <Canvas
        shadows
        camera={{ fov: 75 }}
        onPointerDown={(e) => e.target.requestPointerLock()}
        onCreated={() => setLoaded(true)}
      >
        <Environment preset="park" />
        <fog attach="fog" args={['#aaccff', 5, 60]} />
        
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1.0} 
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        
        <Snow count={4000} />
        
        <Physics gravity={[0, -15, 0]}>
          <RigidBody type="fixed" colliders="trimesh">
            <Model />
          </RigidBody>
          <Player />
        </Physics>
        
        <PointerLockControls />
        
        {!loaded && (
          <mesh>
            <sphereGeometry args={[1]} />
            <meshStandardMaterial color="white" />
          </mesh>
        )}
      </Canvas>
      
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px',
        lineHeight: '1.6'
      }}>
        <div><b>Controls:</b></div>
        <div>WASD - Move</div>
        <div>SPACE - Jump</div>
        <div>SHIFT - Run</div>
        <div>V - Toggle View (1st/3rd Person)</div>
      </div>
    </div>
  )
}