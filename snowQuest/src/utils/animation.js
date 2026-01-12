import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import './BottomDialogue.css'

const BottomDialogue = ({ 
  isVisible = false,
  onClose,
  message,
  duration = 3000 // Auto close after 3 seconds
}) => {
  const dialogueRef = useRef(null)
  const timeoutRef = useRef(null)

  // Slide up animation
  const slideUp = () => {
    if (!dialogueRef.current) return
    
    return gsap.to(dialogueRef.current, {
      y: 0,
      duration: 0.5,
      ease: "power3.out"
    })
  }

  // Slide down animation
  const slideDown = () => {
    if (!dialogueRef.current) return
    
    return gsap.to(dialogueRef.current, {
      y: '100%',
      duration: 0.4,
      ease: "power2.in",
      onComplete: onClose
    })
  }

  useEffect(() => {
    if (isVisible && dialogueRef.current) {
      // Reset position
      gsap.set(dialogueRef.current, {
        y: '100%'
      })
      
      // Slide up
      slideUp()
      
      // Auto slide down after duration
      timeoutRef.current = setTimeout(() => {
        slideDown()
      }, duration)
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  return (
    <div className="bottom-dialogue-container">
      <div 
        ref={dialogueRef} 
        className="bottom-dialogue"
        onClick={slideDown} // Click to close
      >
        <div className="dialogue-content">
          {message}
        </div>
        <div className="dialogue-handle">
          <div className="handle-bar" />
        </div>
      </div>a   
    </div>
  )
}

export default BottomDialogue