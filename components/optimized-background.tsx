"use client"

import { memo } from "react"
import Image from "next/image"

const OptimizedBackground = memo(() => {
  return (
    <div className="fixed inset-0 -z-10">
      <Image
        src="/placeholder.svg?height=1080&width=1920&text=Background"
        alt="Background"
        fill
        className="object-cover"
        priority
        quality={75}
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/60 to-background/80" />
    </div>
  )
})

OptimizedBackground.displayName = "OptimizedBackground"

export { OptimizedBackground }
