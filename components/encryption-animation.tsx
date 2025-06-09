"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, Unlock, ArrowRight } from "lucide-react"

interface EncryptionAnimationProps {
  text?: string
  speed?: number
  loop?: boolean
  className?: string
}

export function EncryptionAnimation({
  text = "Your files are securely encrypted during transfer",
  speed = 1,
  loop = true,
  className = "",
}: EncryptionAnimationProps) {
  const [currentState, setCurrentState] = useState<"encrypting" | "encrypted" | "decrypting" | "decrypted">(
    "encrypting",
  )
  const [displayText, setDisplayText] = useState(text)
  const [encryptedText, setEncryptedText] = useState("")

  // Characters to use for encryption visualization
  const encryptionChars = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

  // Generate random encrypted text
  const generateEncryptedText = (length: number) => {
    let result = ""
    for (let i = 0; i < length; i++) {
      result += encryptionChars.charAt(Math.floor(Math.random() * encryptionChars.length))
    }
    return result
  }

  // Gradually encrypt the text
  const encryptText = () => {
    setCurrentState("encrypting")
    const originalChars = text.split("")
    const encryptedChars = originalChars.map(() => "")
    let iterations = 0

    const interval = setInterval(() => {
      iterations++

      // Update random positions with encryption characters
      for (let i = 0; i < Math.min(iterations * 2, originalChars.length); i++) {
        const position = Math.floor(Math.random() * originalChars.length)
        if (encryptedChars[position] !== encryptionChars.charAt(Math.floor(Math.random() * encryptionChars.length))) {
          encryptedChars[position] = encryptionChars.charAt(Math.floor(Math.random() * encryptionChars.length))
        }
      }

      setDisplayText(encryptedChars.join(""))

      // When fully encrypted
      if (iterations >= originalChars.length / 2 + 5) {
        clearInterval(interval)
        const fullyEncrypted = generateEncryptedText(text.length)
        setEncryptedText(fullyEncrypted)
        setDisplayText(fullyEncrypted)
        setCurrentState("encrypted")

        // Move to transmission phase
        setTimeout(() => {
          setCurrentState("decrypting")
          decryptText(fullyEncrypted)
        }, 1000 / speed)
      }
    }, 50 / speed)
  }

  // Gradually decrypt the text
  const decryptText = (encrypted: string) => {
    const encryptedChars = encrypted.split("")
    const originalChars = text.split("")
    let iterations = 0

    const interval = setInterval(() => {
      iterations++

      // Gradually reveal original characters
      for (let i = 0; i < Math.min(iterations * 2, originalChars.length); i++) {
        const position = Math.floor(Math.random() * originalChars.length)
        if (encryptedChars[position] !== originalChars[position]) {
          encryptedChars[position] = originalChars[position]
        }
      }

      setDisplayText(encryptedChars.join(""))

      // When fully decrypted
      if (iterations >= originalChars.length / 2 + 5) {
        clearInterval(interval)
        setDisplayText(text)
        setCurrentState("decrypted")

        // If looping, start over after a delay
        if (loop) {
          setTimeout(() => {
            encryptText()
          }, 2000 / speed)
        }
      }
    }, 50 / speed)
  }

  // Start the animation
  useEffect(() => {
    const timer = setTimeout(() => {
      encryptText()
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`relative overflow-hidden rounded-lg border border-primary/20 bg-primary/5 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{
              scale: currentState === "encrypting" || currentState === "encrypted" ? [1, 1.2, 1] : 1,
              opacity: currentState === "encrypting" || currentState === "encrypted" ? [0.7, 1, 0.7] : 0.7,
            }}
            transition={{
              duration: 1.5,
              repeat: currentState === "encrypting" || currentState === "encrypted" ? Number.POSITIVE_INFINITY : 0,
              repeatType: "loop",
            }}
            className="bg-primary/10 p-2 rounded-full"
          >
            <Lock className="h-4 w-4 text-primary" />
          </motion.div>
          <span className="text-sm font-medium">Sender</span>
        </div>

        <motion.div
          animate={{
            x: [0, 10, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
          }}
        >
          <ArrowRight className="h-5 w-5 text-primary/70" />
        </motion.div>

        <div className="flex items-center gap-2">
          <motion.div
            animate={{
              scale: currentState === "decrypting" || currentState === "decrypted" ? [1, 1.2, 1] : 1,
              opacity: currentState === "decrypting" || currentState === "decrypted" ? [0.7, 1, 0.7] : 0.7,
            }}
            transition={{
              duration: 1.5,
              repeat: currentState === "decrypting" || currentState === "decrypted" ? Number.POSITIVE_INFINITY : 0,
              repeatType: "loop",
            }}
            className="bg-primary/10 p-2 rounded-full"
          >
            <Unlock className="h-4 w-4 text-primary" />
          </motion.div>
          <span className="text-sm font-medium">Recipient</span>
        </div>
      </div>

      <div className="relative h-10 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentState}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <p className={`text-sm font-mono ${currentState === "encrypted" ? "text-primary/70" : "text-foreground"}`}>
              {displayText}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-3 flex justify-between text-xs text-muted-foreground">
        <span>
          {currentState === "encrypting" && "Encrypting..."}
          {currentState === "encrypted" && "Encrypted"}
          {currentState === "decrypting" && "Decrypting..."}
          {currentState === "decrypted" && "Decrypted"}
        </span>
        <span>End-to-end encrypted</span>
      </div>

      {/* Data packets animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {currentState === "encrypted" && (
          <>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1 w-1 rounded-full bg-primary/60"
                initial={{
                  left: "30%",
                  top: "50%",
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  left: "70%",
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 1 + Math.random() * 0.5,
                  delay: i * 0.2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "loop",
                }}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
