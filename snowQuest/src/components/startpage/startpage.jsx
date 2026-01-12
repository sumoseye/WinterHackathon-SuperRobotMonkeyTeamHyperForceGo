// components/StartPage/StartPage.jsx
import React from 'react'
import StartButton from '../StartButton/StartButton'
import './StartPage.css'

const StartPage = ({ onStart, title = "Welcome", subtitle = "" }) => {
  return (
    <div className="start-page">
      <div className="start-page-content">
        {title && <h1 className="start-title">{title}</h1>}
        {subtitle && <p className="start-subtitle">{subtitle}</p>}
        
        <StartButton onClick={onStart} />
        
        {/* Optional decorative elements */}
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
        <div className="decoration-circle circle-3"></div>
      </div>
    </div>
  )
}

export default StartPage