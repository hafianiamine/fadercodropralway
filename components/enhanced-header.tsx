"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSelector } from "@/components/language-selector"
import { useTranslation } from "@/hooks/use-translation"
import { Menu, X, Upload, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface EnhancedHeaderProps {
  onAboutClick: () => void
  onResourcesClick: () => void
  onHowToUseClick: () => void
}

export function EnhancedHeader({ onAboutClick, onResourcesClick, onHowToUseClick }: EnhancedHeaderProps) {
  const { t } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="w-full py-4 px-4 md:px-8 flex items-center justify-between relative z-20">
      <div className="flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
            FD
          </div>
          <span className="font-bold text-xl hidden sm:inline-block">Faderco Drop</span>
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-6">
        <nav className="flex items-center gap-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1 px-2">
                Products
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              <DropdownMenuItem className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span>File Transfer</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <span>Media Library</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                <span>Portals</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" className="text-sm hover:text-primary transition-colors" onClick={onAboutClick}>
            {t("nav.about")}
          </Button>
          <Button variant="ghost" className="text-sm hover:text-primary transition-colors" onClick={onHowToUseClick}>
            {t("nav.howToUse")}
          </Button>
          <Button variant="ghost" className="text-sm hover:text-primary transition-colors" onClick={onResourcesClick}>
            {t("nav.resources")}
          </Button>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSelector />
        </div>
      </div>

      <div className="md:hidden flex items-center gap-2">
        <ThemeToggle />
        <LanguageSelector />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-sm p-4 flex flex-col gap-2 border-b md:hidden"
          >
            <Button
              variant="ghost"
              className="p-2 hover:bg-muted rounded-md justify-start"
              onClick={() => {
                setMobileMenuOpen(false)
                onAboutClick()
              }}
            >
              {t("nav.about")}
            </Button>
            <Button
              variant="ghost"
              className="p-2 hover:bg-muted rounded-md justify-start"
              onClick={() => {
                setMobileMenuOpen(false)
                onHowToUseClick()
              }}
            >
              {t("nav.howToUse")}
            </Button>
            <Button
              variant="ghost"
              className="p-2 hover:bg-muted rounded-md justify-start"
              onClick={() => {
                setMobileMenuOpen(false)
                onResourcesClick()
              }}
            >
              {t("nav.resources")}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
