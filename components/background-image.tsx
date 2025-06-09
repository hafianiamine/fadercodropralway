"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function BackgroundImage() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background to-background/95" />

        {/* Subtle patterns */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, ${theme === "dark" ? "white" : "black"} 2%, transparent 0%), 
                             radial-gradient(circle at 75px 75px, ${theme === "dark" ? "white" : "black"} 1%, transparent 0%)`,
            backgroundSize: "100px 100px",
          }}
        />

        {/* Decorative elements */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Gradient overlay for content readability */}
      <div className="fixed bottom-0 left-0 right-0 h-1/3 z-0 pointer-events-none bg-gradient-to-t from-background to-transparent" />
    </>
  )
}
