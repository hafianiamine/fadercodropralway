"use client"

import type React from "react"

import { createContext, useState, useEffect } from "react"

type Language = "en" | "fr" | "ar"

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
}

export const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    // Get language from localStorage or browser preference
    const savedLanguage = localStorage.getItem("language") as Language
    const browserLanguage = navigator.language.split("-")[0] as Language

    if (savedLanguage && ["en", "fr", "ar"].includes(savedLanguage)) {
      setLanguage(savedLanguage)
    } else if (["en", "fr", "ar"].includes(browserLanguage)) {
      setLanguage(browserLanguage)
    }

    // Set dir attribute for RTL languages
    if (language === "ar") {
      document.documentElement.dir = "rtl"
      document.documentElement.lang = "ar"
    } else {
      document.documentElement.dir = "ltr"
      document.documentElement.lang = language
    }
  }, [language])

  const handleSetLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage)
    localStorage.setItem("language", newLanguage)

    // Set dir attribute for RTL languages
    if (newLanguage === "ar") {
      document.documentElement.dir = "rtl"
      document.documentElement.lang = "ar"
    } else {
      document.documentElement.dir = "ltr"
      document.documentElement.lang = newLanguage
    }
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage }}>{children}</LanguageContext.Provider>
  )
}
