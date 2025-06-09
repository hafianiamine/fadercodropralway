"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"

export function Preloader() {
  const [textIndex, setTextIndex] = useState(0)
  const texts = ["Faderco Drop", "Send Anything", "Send Anytime"]
  const [progress, setProgress] = useState(0)
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Animate text rotation
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % texts.length)
    }, 1500) // Change text every 1.5 seconds

    // Animate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 1
      })
    }, 40)

    return () => {
      clearInterval(interval)
      clearInterval(progressInterval)
    }
  }, [])

  if (!mounted) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 flex items-center justify-center z-50 bg-background/90 backdrop-blur-xl"
    >
      <div className="relative z-10 flex flex-col items-center max-w-md px-6 text-center">
        {/* Logo with pulsing effect */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 relative"
        >
          <div className="w-24 h-24 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-lg">
            FD
          </div>

          {/* Animated rings */}
          <motion.div
            className="absolute -inset-4 rounded-xl border-2 border-primary/30 -z-10"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />

          <motion.div
            className="absolute -inset-8 rounded-xl border border-primary/20 -z-20"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
        </motion.div>

        {/* App name */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-3xl font-bold mb-6"
        >
          Faderco Drop
        </motion.h1>

        {/* Rotating text */}
        <div className="h-8 relative mb-8 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={textIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-lg text-muted-foreground absolute left-0 right-0 text-center"
            >
              {texts[textIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs relative">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeInOut" }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Loading</span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/30"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0.3 + Math.random() * 0.5,
            }}
            animate={{
              y: [null, Math.random() * -100, null],
              x: [null, Math.random() * 100 - 50, null],
              opacity: [null, 0.8, 0.3],
            }}
            transition={{
              duration: 5 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}
