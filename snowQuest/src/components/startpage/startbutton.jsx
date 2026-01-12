// components/StartButton/StartButton.jsx
import React from 'react'
import './StartButton.css'

const StartButton = ({ 
  onClick, 
  label = "START", 
  size = "large",
  variant = "primary"
}) => {
  return (
    <button 
      className={`start-button start-button-${size} start-button-${variant}`}
      onClick={onClick}
      aria-label={label}
    >
      <span className="button-text">{label}</span>
      <span className="button-glow"></span>
    </button>
  )
}

export default StartButton