"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

export function EnhancedPreloader() {
  const [progress, setProgress] = useState(0)
  const [textIndex, setTextIndex] = useState(0)
  const texts = ["Simple File Sharing", "Secure Transfers", "Fast Delivery"]

  useEffect(() => {
    // Animate progress from 0 to 100
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 1
      })
    }, 30) // Adjust speed as needed

    // Rotate through text phrases
    const textInterval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % texts.length)
    }, 1500)

    return () => {
      clearInterval(interval)
      clearInterval(textInterval)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-background/90 backdrop-blur-xl"
    >
      <div className="relative z-10 flex flex-col items-center max-w-md px-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8 relative"
        >
          <div className="relative w-24 h-24 mb-4">
            <Image
              src="/placeholder.svg?height=96&width=96&text=FD"
              alt="Faderco Drop Logo"
              width={96}
              height={96}
              className="rounded-xl shadow-lg bg-primary text-white"
            />
            <motion.div
              className="absolute -inset-3 rounded-xl border-2 border-primary/30 -z-10"
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
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-3xl font-bold mb-2"
          >
            Faderco Drop
          </motion.h1>
        </motion.div>

        <div className="h-8 relative mb-8 w-full overflow-hidden">
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

        <div className="w-full max-w-xs relative h-2 bg-muted rounded-full overflow-hidden mb-2">
          <motion.div
            className="absolute top-0 left-0 h-full bg-primary rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeInOut" }}
          />
        </div>

        <p className="text-sm text-muted-foreground">{progress}%</p>
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>
    </motion.div>
  )
}
