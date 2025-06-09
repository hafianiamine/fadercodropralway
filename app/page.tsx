"use client"

import { useState, useEffect } from "react"
import { UploadForm } from "@/components/upload-form"
import { Header } from "@/components/header"
import { Features } from "@/components/features"
import { AboutDialog } from "@/components/about-dialog"
import { ResourcesDialog } from "@/components/resources-dialog"
import { HowToUseDialog } from "@/components/how-to-use-dialog"
import { motion, AnimatePresence } from "framer-motion"
import { Preloader } from "@/components/preloader"
import { BackgroundImage } from "@/components/background-image"
import { Footer } from "@/components/footer"

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [showAbout, setShowAbout] = useState(false)
  const [showResources, setShowResources] = useState(false)
  const [showHowToUse, setShowHowToUse] = useState(false)

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false)
    }, 3500) // 3.5 seconds for the preloader animation

    return () => clearTimeout(timer)
  }, [])

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
      <BackgroundImage />
      <AnimatePresence>
        {loading ? (
          <Preloader key="preloader" />
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex flex-col z-10"
          >
            <Header
              onAboutClick={() => setShowAbout(true)}
              onResourcesClick={() => setShowResources(true)}
              onHowToUseClick={() => setShowHowToUse(true)}
            />
            <div className="flex-1 flex flex-col md:flex-row items-center md:items-start justify-center gap-8 md:gap-16 p-4 md:p-8 max-w-7xl mx-auto w-full">
              <motion.div
                className="w-full md:w-[400px] lg:w-[450px] flex-shrink-0 mt-8 md:mt-16"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <UploadForm />
              </motion.div>
              <motion.div
                className="flex-1 hidden md:block"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Features />
              </motion.div>
            </div>
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>

      <AboutDialog open={showAbout} onOpenChange={setShowAbout} />
      <ResourcesDialog open={showResources} onOpenChange={setShowResources} />
      <HowToUseDialog open={showHowToUse} onOpenChange={setShowHowToUse} />
    </main>
  )
}
