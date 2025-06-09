"use client"

import { useTranslation } from "@/hooks/use-translation"
import { Zap, Globe, Lock, Clock, Shield, ShieldCheck, FileKey, Key } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import Image from "next/image"
import { EncryptionAnimation } from "./encryption-animation"

export function Features() {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const features = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: t("features.fastTransfers"),
      description: t("features.fastTransfersDesc"),
    },
    {
      icon: <Globe className="h-5 w-5" />,
      title: t("features.globalCDN"),
      description: t("features.globalCDNDesc"),
    },
    {
      icon: <Lock className="h-5 w-5" />,
      title: t("features.encryption"),
      description: t("features.encryptionDesc"),
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: t("features.available"),
      description: t("features.availableDesc"),
    },
  ]

  return (
    <div className="space-y-8 mt-8">
      <div className="space-y-2">
        <div className="relative">
          {/* Animated security elements */}
          <div className="absolute -top-16 -left-16 w-32 h-32 opacity-10 pointer-events-none">
            <motion.div
              animate={{
                rotate: [0, 10, 0, -10, 0],
                scale: [1, 1.05, 1, 1.05, 1],
              }}
              transition={{
                duration: 8,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
              }}
            >
              <Shield className="w-full h-full text-primary" />
            </motion.div>
          </div>

          <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
            <motion.div
              animate={{
                y: [0, -5, 0, 5, 0],
                x: [0, 3, 0, -3, 0],
              }}
              transition={{
                duration: 6,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
              }}
            >
              <Lock className="w-16 h-16 text-primary" />
            </motion.div>
          </div>

          <h2 className="text-3xl font-bold tracking-tight relative">
            {t("features.title")}
            <motion.div
              className="absolute -right-8 top-1/2 -translate-y-1/2"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
              }}
            >
              <ShieldCheck className="h-6 w-6 text-primary" />
            </motion.div>
          </h2>
          <p className="text-muted-foreground">{t("features.subtitle")}</p>
        </div>
      </div>

      {/* Encryption Animation */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <EncryptionAnimation text="Your files are securely encrypted during transfer" speed={1.2} className="mb-6" />
      </motion.div>

      {/* Security visualization */}
      <motion.div
        className="relative bg-primary/5 rounded-xl p-6 border border-primary/10 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Left side - animated lock */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
              }}
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                  <Lock className="h-10 w-10 text-primary" />
                </div>

                {/* Animated circles */}
                <motion.div
                  className="absolute -inset-3 rounded-full border-2 border-primary/30"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "loop",
                  }}
                />

                <motion.div
                  className="absolute -inset-6 rounded-full border border-primary/20"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "loop",
                    delay: 0.5,
                  }}
                />
              </div>
            </motion.div>
          </div>

          {/* Right side - security text */}
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {t("features.securityTitle")}
            </h3>
            <p className="text-muted-foreground mb-4">{t("features.securityDesc")}</p>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileKey className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm">{t("features.endToEndEncryption")}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Key className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm">{t("features.passwordProtection")}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm">{t("features.autoExpiry")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Animated security particles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-primary/40"
            initial={{
              x: Math.random() * 100 + 50,
              y: Math.random() * 100 + 50,
              opacity: 0.3 + Math.random() * 0.5,
            }}
            animate={{
              y: [null, Math.random() * -50 - 20, null],
              x: [null, Math.random() * 50 - 25, null],
              opacity: [null, 0.8, 0.3],
            }}
            transition={{
              duration: 4 + Math.random() * 6,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </motion.div>

      {/* Security image - using Unsplash images */}
      <motion.div
        className="relative rounded-xl overflow-hidden h-48 md:h-64"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Image
          src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=1200&auto=format&fit=crop"
          alt="Secure file transfer visualization"
          fill
          className="object-cover"
        />

        {/* Gradient overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />

        {/* Text overlay */}
        <div className="absolute inset-0 flex items-center p-6">
          <div className="max-w-md">
            <h3 className="text-xl font-bold text-white drop-shadow-md mb-2">{t("features.secureTransferTitle")}</h3>
            <p className="text-white/90 text-sm max-w-xs drop-shadow-md">{t("features.secureTransferDesc")}</p>
          </div>
        </div>

        {/* Animated lock icon */}
        <motion.div
          className="absolute right-8 top-1/2 -translate-y-1/2"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, 0, -5, 0],
          }}
          transition={{
            duration: 5,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
          }}
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Lock className="h-8 w-8 text-white" />
            </div>

            <motion.div
              className="absolute -inset-2 rounded-full border-2 border-white/30"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
              }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Additional security image */}
      <motion.div
        className="relative rounded-xl overflow-hidden h-48 md:h-64 mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Image
          src="https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=1200&auto=format&fit=crop"
          alt="Data encryption visualization"
          fill
          className="object-cover"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-primary/20" />

        {/* Content overlay */}
        <div className="absolute inset-0 flex items-center justify-end p-6">
          <div className="max-w-md text-right">
            <h3 className="text-xl font-bold text-white drop-shadow-md mb-2">End-to-End Encryption</h3>
            <p className="text-white/90 text-sm max-w-xs drop-shadow-md">
              Your data is encrypted before it leaves your device and only decrypted by the recipient
            </p>
          </div>
        </div>

        {/* Shield animation */}
        <motion.div
          className="absolute left-8 top-1/2 -translate-y-1/2"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
          }}
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Removed the features list that was here */}
    </div>
  )
}
