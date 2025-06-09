"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import Image from "next/image"

export function EnhancedBackground() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Background image from Unsplash */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2000&auto=format&fit=crop"
            alt="Background"
            fill
            className="object-cover opacity-[0.03] dark:opacity-[0.05]"
            priority
          />
        </div>

        {/* Main background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/90" />

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          {/* Abstract shapes - visible in both light and dark modes */}
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl transform -translate-x-1/4 translate-y-1/4" />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(to right, ${theme === "dark" ? "#ffffff" : "#000000"} 1px, transparent 1px), 
                              linear-gradient(to bottom, ${theme === "dark" ? "#ffffff" : "#000000"} 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />

          {/* Subtle radial gradient */}
          <div className="absolute inset-0 bg-radial-gradient from-primary/5 to-transparent dark:from-primary/10 dark:to-transparent opacity-70" />
        </div>
      </div>

      {/* Gradient overlay at the bottom for content readability */}
      <div className="fixed bottom-0 left-0 right-0 h-1/3 z-0 pointer-events-none bg-gradient-to-t from-background to-transparent" />
    </>
  )
}
