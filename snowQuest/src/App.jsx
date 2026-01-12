import { Canvas, useFrame } from '@react-three/fiber'
import { PointerLockControls, useGLTF, Environment } from '@react-three/drei'
import { Physics, RigidBody } from '@react-three/rapier'
import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'

function Player() {
  const playerRef = useRef()
  const velocity = new THREE.Vector3()
  const direction = new THREE.Vector3()
  const keys = useRef({})
  const [canJump, setCanJump] = useState(true)

  useEffect(() => {
    const down = (e) => {
      keys.current[e.code] = true
      if (e.code === 'Space' && canJump) {
        setCanJump(false)
        if (playerRef.current) {
          playerRef.current.setLinvel({ 
            x: playerRef.current.linvel().x, 
            y: 8, // Jump force
            z: playerRef.current.linvel().z 
          }, true)
        }
      }
    }
    
    const up = (e) => {
      keys.current[e.code] = false
    }

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)

    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [canJump])

  // Check if player is on ground for jumping
  useFrame(() => {
    if (!playerRef.current) return
    
    // Reset jump ability when player is near ground
    const position = playerRef.current.translation()
    if (position.y < 1.1) { // Slightly above ground level
      setCanJump(true)
    }
  })

  useFrame((state) => {
    if (!playerRef.current) return

    direction.set(0, 0, 0)

    if (keys.current.KeyW) direction.z -= 1
    if (keys.current.KeyS) direction.z += 1
    if (keys.current.KeyA) direction.x -= 1
    if (keys.current.KeyD) direction.x += 1

    if (direction.length() > 0) {
      direction.normalize()
    }

    const speed = keys.current.ShiftLeft ? 6 : 3
    direction.applyEuler(state.camera.rotation)
    velocity.copy(direction).multiplyScalar(speed)

    playerRef.current.setLinvel(
      {
        x: velocity.x,
        y: playerRef.current.linvel().y,
        z: velocity.z,
      },
      true
    )
    
    // Update camera to follow player
    const playerPosition = playerRef.current.translation()
    state.camera.position.set(playerPosition.x, playerPosition.y + 1.6, playerPosition.z)
  })

  return (
    <RigidBody
      ref={playerRef}
      colliders="capsule"
      mass={1}
      position={[0, 5, 10]}
      enabledRotations={[false, false, false]}
      lockRotations
      friction={0.5}
    />
  )
}

function Model() {
  const { scene, error } = useGLTF('/models/villageM.glb', undefined, undefined, (error) => {
    console.error('Error loading model:', error)
  })
  
  useEffect(() => {
    if (scene) {
      console.log('Model loaded successfully!')
      
      // Scale the model down - try different scales
      scene.scale.set(0.5, 0.5, 0.5)
      scene.position.set(0, 0, 0)
      
      // Add basic materials if model doesn't have them
      scene.traverse((child) => {
        if (child.isMesh) {
          // Ensure material exists
          if (!child.material) {
            child.material = new THREE.MeshStandardMaterial({ 
              color: 0x888888,
              roughness: 0.8,
              metalness: 0.2
            })
          }
          
          // Enable casting/receiving shadows
          child.castShadow = true
          child.receiveShadow = true
        }
      })
    }
    
    if (error) {
      console.error('Model loading error:', error)
    }
  }, [scene, error])
  
  if (error) {
    return (
      <mesh>
        <boxGeometry args={[10, 10, 10]} />
        <meshStandardMaterial color="red" wireframe />
      </mesh>
    )
  }
  
  return <primitive object={scene} />
}

useGLTF.preload('/models/villageM.glb')

export default function App() {
  const [loaded, setLoaded] = useState(false)
  
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      background: '#87CEEB' // Sky blue background as fallback
    }}>
      <Canvas
        shadows
        camera={{ 
          fov: 75,
          position: [0, 5, 15]
        }}
        onPointerDown={(e) => e.target.requestPointerLock()}
        onCreated={() => setLoaded(true)}
      >
        {/* Sky/Environment */}
        <Environment preset="sunset" />
        
        {/* Lights - Add more lights to illuminate the scene */}
        <ambientLight intensity={1} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1.5} 
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        
        {/* Hemisphere light for more natural outdoor lighting */}
        <hemisphereLight 
          args={['#87CEEB', '#8B7355', 0.6]} 
        />
        
        {/* Point light for additional illumination */}
        <pointLight position={[0, 15, 0]} intensity={0.5} />
        
        <Physics gravity={[0, -20, 0]}>
          {/* Add a simple ground plane as backup */}
          <RigidBody type="fixed">
            <mesh 
              rotation={[-Math.PI / 2, 0, 0]} 
              position={[0, -2, 0]}
              receiveShadow
            >
              <planeGeometry args={[100, 100]} />
              <meshStandardMaterial 
                color="#3a7c3a" 
                roughness={0.8}
                metalness={0.2}
              />
            </mesh>
          </RigidBody>
          
          <RigidBody type="fixed" colliders="trimesh">
            <Model />
          </RigidBody>
          
          <Player />
        </Physics>
        
        <PointerLockControls />
        
        {/* Loading indicator */}
        {!loaded && (
          <mesh>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
          </mesh>
        )}
      </Canvas>
      
      {/* Debug info overlay */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        <div>Controls: WASD to move, SPACE to jump</div>
        <div>Click to lock pointer, ESC to unlock</div>
      </div>
    </div>
  )
}