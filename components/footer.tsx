"use client"

import { useState } from "react"

export function Footer() {
  const [showKamui, setShowKamui] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isFading, setIsFading] = useState(false)

  const handleClick = () => {
    setShowKamui(true)
    setTimeout(() => {
      setIsFading(true)
      setTimeout(() => {
        setIsVisible(false)
      }, 3000) // 3 second fade duration
    }, 1000) // Show kamui for 1 second before starting fade
  }

  if (!isVisible) return null

  return (
    <div
      className={`text-center py-4 cursor-pointer transition-all duration-[3000] ease-out ${
        isFading ? "opacity-0 transform scale-95" : "opacity-100 transform scale-100"
      }`}
      onClick={handleClick}
    >
      <p className="text-sm text-gray-500 transition-all duration-500">
        {showKamui ? "kamui" : "Faderco Drop © 2025 — Engineered in solitude. Signed: Akatsuki"}
      </p>
    </div>
  )
}
