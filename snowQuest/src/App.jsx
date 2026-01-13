import { Canvas, useFrame } from '@react-three/fiber'
import { PointerLockControls, useGLTF, Environment, Text } from '@react-three/drei'
import { Physics, RigidBody, useRapier, CapsuleCollider } from '@react-three/rapier'
import { useRef, useEffect, useState, useMemo } from 'react'
import * as THREE from 'three'
import useChatbot from './hooks/useChatbot'
import { ChatUI } from './components/startpage/chatUI'

// --- SANTA CHARACTER COMPONENT ---
function SantaCharacter({ position = [60, -0.3, 38], rotation = [0, 103, 0], scale = 1 }) {
  const { scene } = useGLTF('models/Santa.glb')
  
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
          if (child.material) {
            child.material.metalness = 0.1
            child.material.roughness = 0.8
          }
        }
      })
    }
  }, [scene])
  
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={scene} />
    </group>
  )
}

// --- PLAYER BODY MESH ---
function PlayerBody() {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.5, 1.5, 8, 16]} />
        <meshStandardMaterial 
          color="#4488ff" 
          opacity={1}
          metalness={0.3}
          roughness={0.5}
        />
      </mesh>
      
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial 
          color="#ffcc88" 
          metalness={0.2}
          roughness={0.6}
        />
      </mesh>
      
      <mesh position={[0.12, 1.5, 0.28]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      <mesh position={[-0.12, 1.5, 0.28]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
    </group>
  )
}

// --- PLAYER COMPONENT WITH PROXIMITY DETECTION ---
function Player({ 
  onNearSanta, 
  onInteract, 
  showChat = false, 
  onNearGlasses, 
  onCollectGlasses,
  glassesPosition = [55, 0.5, 35] // Default glasses position - adjust this!
}) {
  const playerRef = useRef()
  const bodyRef = useRef()
  const { rapier, world } = useRapier()
  
  const moveDirection = new THREE.Vector3()
  const frontVector = new THREE.Vector3()
  const sideVector = new THREE.Vector3()
  
  const keys = useRef({})
  const isGrounded = useRef(false)
  const jumpRequested = useRef(false)
  const [thirdPerson, setThirdPerson] = useState(false)
  const playerPosition = useRef(new THREE.Vector3(10, 6, 0))
  const santaPosition = new THREE.Vector3(60, -0.3, 38)
  const glassesPos = new THREE.Vector3(glassesPosition[0], glassesPosition[1], glassesPosition[2])
  const [isNearSanta, setIsNearSanta] = useState(false)
  const [isNearGlasses, setIsNearGlasses] = useState(false)

  useEffect(() => {
    const down = (e) => {
      // Don't capture keys if chat is open
      if (showChat) return;
      
      keys.current[e.code] = true
      if (e.code === 'Space') jumpRequested.current = true
      if (e.code === 'KeyV') setThirdPerson(prev => !prev)
      
      // E key interactions
      if (e.code === 'KeyE') {
        if (isNearSanta) {
          onInteract?.()
        } else if (isNearGlasses) {
          onCollectGlasses?.()
        }
      }
    }
    
    const up = (e) => {
      if (showChat) return;
      
      keys.current[e.code] = false
      if (e.code === 'Space') jumpRequested.current = false
    }
    
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [isNearSanta, isNearGlasses, onInteract, onCollectGlasses, showChat])

  useFrame((state) => {
    if (!playerRef.current) return

    const position = playerRef.current.translation()
    playerPosition.current.set(position.x, position.y, position.z)
    
    // Check distance to Santa
    const distanceToSanta = playerPosition.current.distanceTo(santaPosition)
    const nearSanta = distanceToSanta < 15
    
    if (nearSanta && !isNearSanta) {
      setIsNearSanta(true)
      onNearSanta?.(true)
    } else if (!nearSanta && isNearSanta) {
      setIsNearSanta(false)
      onNearSanta?.(false)
    }
    
    // Check distance to Glasses
    const distanceToGlasses = playerPosition.current.distanceTo(glassesPos)
    const nearGlasses = distanceToGlasses < 5 // 5 units radius for glasses
    
    if (nearGlasses && !isNearGlasses) {
      setIsNearGlasses(true)
      onNearGlasses?.(true)
    } else if (!nearGlasses && isNearGlasses) {
      setIsNearGlasses(false)
      onNearGlasses?.(false)
    }

    const rayOrigin = { x: position.x, y: position.y - 1.25, z: position.z }
    const ray = new rapier.Ray(rayOrigin, { x: 0, y: -1, z: 0 })
    const hit = world.castRay(ray, 0.5, true, null, null, playerRef.current)
    isGrounded.current = !!hit

    if (jumpRequested.current && isGrounded.current) {
       playerRef.current.setLinvel({ 
        x: playerRef.current.linvel().x, 
        y: 8, 
        z: playerRef.current.linvel().z 
      }, true)
      jumpRequested.current = false
    }

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
    
    const playerPos = playerRef.current.translation()
    
    if (thirdPerson) {
      const cameraOffset = new THREE.Vector3()
      state.camera.getWorldDirection(cameraOffset)
      cameraOffset.multiplyScalar(-5)
      cameraOffset.y = 3
      
      state.camera.position.set(
        playerPos.x + cameraOffset.x,
        playerPos.y + cameraOffset.y,
        playerPos.z + cameraOffset.z
      )
      state.camera.lookAt(playerPos.x, playerPos.y + 1, playerPos.z)
    } else {
      state.camera.position.set(playerPos.x, playerPos.y + 1.0, playerPos.z)
    }

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
      position={[10, 6, 0]}
      enabledRotations={[false, false, false]}
      lockRotations
      friction={0}
      ccd={true}
    >
      <CapsuleCollider args={[0.75, 0.5]} />
      <group ref={bodyRef}>
        <PlayerBody />
      </group>
    </RigidBody>
  )
}

// --- INTERACTION UI COMPONENT ---
function InteractionUI({ show, message = "Press E to talk to Santa" }) {
  if (!show) return null
  
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '15px 30px',
      borderRadius: '10px',
      border: '2px solid #d32f2f',
      zIndex: 999,
      fontFamily: 'monospace',
      fontSize: '18px',
      textAlign: 'center',
      backdropFilter: 'blur(5px)',
      boxShadow: '0 0 20px rgba(211, 47, 47, 0.5)'
    }}>
      {message}
    </div>
  )
}

// --- ITEM FOUND NOTIFICATION ---
function ItemFoundNotification({ show, itemName }) {
  if (!show) return null
  
  return (
    <div style={{
      position: 'fixed',
      top: '30%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
      color: 'white',
      padding: '20px 40px',
      borderRadius: '15px',
      border: '3px solid #81C784',
      zIndex: 1001,
      fontFamily: 'monospace',
      fontSize: '24px',
      textAlign: 'center',
      boxShadow: '0 0 30px rgba(76, 175, 80, 0.7)',
      animation: 'popIn 0.5s ease-out'
    }}>
      <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎉</div>
      <div>You found Santa's {itemName}!</div>
      <div style={{ fontSize: '16px', marginTop: '10px' }}>Talk to Santa to let him know!</div>
      <style>{`
        @keyframes popIn {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.1); }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// --- SNOWFLAKE TRANSITION COMPONENT ---
function SnowflakeTransition({ onComplete, snowflakeImageUrl = '/flakesanthisim-removebg-preview.png' }) {
  const [snowflakes, setSnowflakes] = useState([])
  const [opacity, setOpacity] = useState(1)
  const startTimeRef = useRef(Date.now())
  
  useEffect(() => {
    const initialFlakes = []
    for (let i = 0; i < 80; i++) {
      initialFlakes.push({
        id: i,
        startX: Math.random() * 100,
        startY: -5 - Math.random() * 30,
        size: 40 + Math.random() * 60,
        speed: 80 + Math.random() * 120,
        startRotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 120,
        wobbleSpeed: 0.5 + Math.random() * 1.5,
        wobbleAmount: 10 + Math.random() * 20,
        delay: Math.random() * 400,
        flakeOpacity: 0.7 + Math.random() * 0.3
      })
    }
    setSnowflakes(initialFlakes)
    startTimeRef.current = Date.now()
  }, [])
  
  useEffect(() => {
    if (snowflakes.length === 0) return
    
    let animationFrame
    
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current
      
      setSnowflakes(prev => prev.map(flake => {
        const activeTime = Math.max(0, elapsed - flake.delay)
        const currentY = flake.startY + (flake.speed * activeTime) / 1000
        const currentX = flake.startX + Math.sin(activeTime / 1000 * flake.wobbleSpeed) * flake.wobbleAmount
        const currentRotation = flake.startRotation + (flake.rotationSpeed * activeTime) / 1000
        
        return {
          ...flake,
          currentY,
          currentX,
          currentRotation
        }
      }))
      
      if (elapsed > 2500) {
        setOpacity(Math.max(0, 1 - (elapsed - 2500) / 800))
      }
      
      if (elapsed > 3300) {
        onComplete()
        return
      }
      
      animationFrame = requestAnimationFrame(animate)
    }
    
    animationFrame = requestAnimationFrame(animate)
    
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
    }
  }, [snowflakes.length, onComplete])
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(180deg, #0d1b2a 0%, #1b3a4b 40%, #2d5a87 100%)',
      zIndex: 3000,
      overflow: 'hidden',
      opacity: opacity,
      transition: 'opacity 0.4s ease-out',
      pointerEvents: opacity > 0 ? 'all' : 'none'
    }}>
      {snowflakes.map(flake => (
        <img
          key={flake.id}
          src={snowflakeImageUrl}
          alt=""
          style={{
            position: 'absolute',
            left: `${flake.currentX ?? flake.startX}%`,
            top: `${flake.currentY ?? flake.startY}%`,
            width: flake.size,
            height: flake.size,
            transform: `translate(-50%, -50%) rotate(${flake.currentRotation ?? flake.startRotation}deg)`,
            opacity: flake.flakeOpacity,
            filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))',
            pointerEvents: 'none',
            willChange: 'transform, top, left'
          }}
          onError={(e) => {
            e.target.style.display = 'none'
          }}
        />
      ))}
      
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        zIndex: 10
      }}>
        <div style={{
          color: 'white',
          fontSize: '5rem',
          fontFamily: "'Fredoka One', cursive",
          textShadow: '0 0 40px rgba(100, 200, 255, 0.9), 0 0 80px rgba(100, 200, 255, 0.5), 0 4px 20px rgba(0,0,0,0.5)',
          letterSpacing: '4px',
          animation: 'titlePulse 2s ease-in-out infinite'
        }}>
          Snow Quest
        </div>
        <style>{`
          @keyframes titlePulse {
            0%, 100% { 
              transform: scale(1);
              text-shadow: 0 0 40px rgba(100, 200, 255, 0.9), 0 0 80px rgba(100, 200, 255, 0.5), 0 4px 20px rgba(0,0,0,0.5);
            }
            50% { 
              transform: scale(1.02);
              text-shadow: 0 0 60px rgba(100, 200, 255, 1), 0 0 100px rgba(100, 200, 255, 0.7), 0 4px 20px rgba(0,0,0,0.5);
            }
          }
        `}</style>
      </div>
    </div>
  )
}

// --- START PAGE COMPONENT ---
function StartPage({ onStart }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.85) 100%)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      animation: 'fadeIn 0.8s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 8px 30px rgba(22, 191, 197, 0.3);
          }
          50% {
            box-shadow: 0 8px 40px rgba(36, 170, 190, 0.4);
          }
        }
      `}</style>
      
      <div style={{
        textAlign: 'center',
        padding: '40px',
        position: 'relative',
        zIndex: 2
      }}>
        <h1 style={{
          fontSize: '6rem',
          fontWeight: '1200',
          fontFamily: "'Fredoka One', cursive",
          color: 'white',
          marginBottom: '20px',
          textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          letterSpacing: '2px',
          animation: 'slideDown 0.8s ease-out 0.2s both'
        }}>
          Snow Quest
        </h1>
        
        <button 
          onClick={onStart}
          style={{
            position: 'relative',
            background: 'linear-gradient(145deg,rgb(51, 238, 255),rgb(0, 143, 204))',
            border: 'none',
            borderRadius: '50px',
            color: 'white',
            padding: '24px 60px',
            fontSize: '1.8rem',
            fontWeight: '700',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(22, 191, 197, 0.3)',
            animation: 'pulse 2s infinite',
            minWidth: '250px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(22, 191, 197, 0.5)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(22, 191, 197, 0.3)'
          }}
        >
          START
        </button>
      </div>
    </div>
  )
}

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

// --- MODEL COMPONENT ---
function Model({ glassesVisible }) {
  const { scene, error } = useGLTF('/models/villageFinal.glb', undefined, undefined, (e) => console.error(e))
  
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
          
          // Check if this is the glasses object - adjust name based on your Blender model
          const name = child.name.toLowerCase()
          if (name.includes('glass') || name.includes('glasses') || name.includes('spectacle')) {
            child.visible = glassesVisible
            console.log('Found glasses:', child.name, 'visible:', glassesVisible)
          }
        }
      })
    }
  }, [scene, error, glassesVisible])
  
  if (error) return null
  return <primitive object={scene} />
}

useGLTF.preload('/models/villageFinal.glb')

// --- GLASSES POSITION CONSTANT ---
// IMPORTANT: Change this to match where your glasses are in the Blender model!
const GLASSES_POSITION = [55, 0.5, 35] // [X, Y, Z] - adjust these values!

export default function App() {
  const [loaded, setLoaded] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [showTransition, setShowTransition] = useState(false)
  const [showGame, setShowGame] = useState(false)
  const [isNearSanta, setIsNearSanta] = useState(false)
  const [isNearGlasses, setIsNearGlasses] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [glassesVisible, setGlassesVisible] = useState(true)
  const [glassesCollected, setGlassesCollected] = useState(false)
  const [showItemNotification, setShowItemNotification] = useState(false)
  
  // Initialize chatbot
  const chatbot = useChatbot()
  
  const handleStartGame = () => {
    setGameStarted(true)
    setShowTransition(true)
  }
  
  const handleTransitionComplete = () => {
    setShowTransition(false)
    setShowGame(true)
  }
  
  const handleExitToMenu = () => {
    setGameStarted(false)
    setShowTransition(false)
    setShowGame(false)
    setShowChat(false)
    setIsNearSanta(false)
    setIsNearGlasses(false)
    setGlassesVisible(true)
    setGlassesCollected(false)
  }
  
  const handleNearSanta = (near) => {
    setIsNearSanta(near)
  }
  
  const handleNearGlasses = (near) => {
    // Only show near glasses if they haven't been collected
    if (!glassesCollected) {
      setIsNearGlasses(near)
    }
  }
  
  const handleInteract = () => {
    if (isNearSanta) {
      setShowChat(true)
    }
  }
  
  const handleCollectGlasses = () => {
    if (!glassesCollected) {
      setGlassesVisible(false)
      setGlassesCollected(true)
      setIsNearGlasses(false)
      setShowItemNotification(true)
      
      // Add to chatbot found items if available
      if (chatbot.addFoundItem) {
        chatbot.addFoundItem('glasses')
      }
      
      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowItemNotification(false)
      }, 3000)
    }
  }
  
  const handleCloseChat = () => {
    setShowChat(false)
  }
  
  // Determine which interaction message to show
  const getInteractionMessage = () => {
    if (isNearSanta && !showChat) {
      return "Press E to talk to Santa"
    }
    if (isNearGlasses && !glassesCollected) {
      return "Press E to pick up Santa's glasses 🤓"
    }
    return null
  }
  
  const interactionMessage = getInteractionMessage()
  
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, background: '#aaccff' }}>
      {/* Start Page */}
      {!gameStarted && <StartPage onStart={handleStartGame} />}
      
      {/* Snowflake Transition Animation */}
      {showTransition && (
        <SnowflakeTransition 
          onComplete={handleTransitionComplete} 
          snowflakeImageUrl="/flakesanthisim-removebg-preview.png"
        />
      )}
      
      {/* 3D Game Canvas */}
      <Canvas
        shadows
        camera={{ fov: 75 }}
        onPointerDown={(e) => {
          if (showGame && !showChat) {
            e.target.requestPointerLock()
          }
        }}
        onCreated={() => setLoaded(true)}
        style={{ 
          display: showGame ? 'block' : 'none',
          opacity: showGame ? 1 : 0,
          transition: 'opacity 0.5s ease-in'
        }}
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
            <Model glassesVisible={glassesVisible} />
          </RigidBody>
          
          <SantaCharacter />
          
          <Player 
            onNearSanta={handleNearSanta}
            onNearGlasses={handleNearGlasses}
            onInteract={handleInteract}
            onCollectGlasses={handleCollectGlasses}
            showChat={showChat}
            glassesPosition={GLASSES_POSITION}
          />
        </Physics>
        
        <PointerLockControls />
        
        {!loaded && (
          <mesh>
            <sphereGeometry args={[1]} />
            <meshStandardMaterial color="white" />
          </mesh>
        )}
      </Canvas>
      
      {/* Interaction UI - Shows for both Santa and Glasses */}
      <InteractionUI 
        show={!!interactionMessage && !showChat} 
        message={interactionMessage}
      />
      
      {/* Item Found Notification */}
      <ItemFoundNotification 
        show={showItemNotification}
        itemName="glasses"
      />
      
      {/* Chat UI */}
      <ChatUI 
        isOpen={showChat}
        onClose={handleCloseChat}
        chatbot={chatbot}
      />
      
      {/* Controls Info */}
      {showGame && (
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
          <div><b>🎅 Help Santa find his glasses!</b></div>
          <div style={{ marginTop: '10px' }}>
            <div>WASD: Move</div>
            <div>Space: Jump</div>
            <div>Shift: Run</div>
            <div>E: Interact</div>
            <div>V: Toggle 3rd person</div>
          </div>
          <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '10px' }}>
            <div style={{ color: glassesCollected ? '#4CAF50' : '#ff9800' }}>
              🤓 Glasses: {glassesCollected ? '✅ Found!' : '🔍 Missing'}
            </div>
          </div>
        </div>
      )}
      
      {/* Exit Button */}
      {showGame && (
        <button 
          onClick={handleExitToMenu}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'rgba(22, 230, 237, 0.7)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}
        >
          Exit to Menu
        </button>
      )}
    </div>
  )
}