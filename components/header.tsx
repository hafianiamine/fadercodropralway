"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSelector } from "@/components/language-selector"
import { useTranslation } from "@/hooks/use-translation"
import { Menu, X, User, Settings } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AdminDashboard } from "@/components/admin-dashboard"
import { UserDashboard } from "@/components/user-dashboard"

interface HeaderProps {
  onAboutClick: () => void
  onResourcesClick: () => void
  onHowToUseClick: () => void
}

export function Header({ onAboutClick, onResourcesClick, onHowToUseClick }: HeaderProps) {
  const { t } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false)
  const [userDashboardOpen, setUserDashboardOpen] = useState(false)

  const [changelogDialogOpen, setChangelogDialogOpen] = useState(false)
  const [featuresDialogOpen, setFeaturesDialogOpen] = useState(false)

  const [showSignup, setShowSignup] = useState(false)
  const [name, setName] = useState("")
  const [success, setSuccess] = useState("")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)

  const [phone, setPhone] = useState("")
  const [company, setCompany] = useState("")
  const [jobPosition, setJobPosition] = useState("")

  // Check if user is logged in on component mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const userData = await response.json()
        setIsLoggedIn(true)
        setUser(userData)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsLoggedIn(true)
        setUser(data.user)
        setLoginDialogOpen(false)
        if (data.user.role === "admin") {
          setAdminDashboardOpen(true) // Open admin dashboard
        } else {
          setUserDashboardOpen(true)
        }
        setEmail("")
        setPassword("")
      } else {
        setError(data.error || "Login failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          company,
          jobPosition,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Account created! Please wait for admin approval.")
        setName("")
        setEmail("")
        setPassword("")
        setPhone("")
        setCompany("")
        setJobPosition("")
        // Switch back to login after 3 seconds
        setTimeout(() => {
          setShowSignup(false)
          setSuccess("")
        }, 3000)
      } else {
        setError(data.error || "Registration failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      // Clear local state immediately
      setIsLoggedIn(false)
      setAdminDashboardOpen(false)
      setUserDashboardOpen(false)
      setUser(null)

      // Call logout API
      await fetch("/api/auth/logout", { method: "POST" })

      // Force a page reload to ensure clean state
      window.location.reload()
    } catch (error) {
      console.error("Logout failed:", error)
      // Even if API fails, clear local state
      setIsLoggedIn(false)
      setAdminDashboardOpen(false)
      setUserDashboardOpen(false)
      setUser(null)
    }
  }

  return (
    <header className="w-full py-4 px-4 md:px-8 flex items-center justify-between relative z-20">
      <div className="flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8 text-primary"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 16.3c2.2 0 4-1.8 4-4V4.7c0-2.2-1.8-4-4-4s-4 1.8-4 4v7.6c0 2.2 1.8 4 4 4z" />
            <path d="M21 12.3V7.7c0-1.7-1.3-3-3-3s-3 1.3-3 3v4.6c0 1.7 1.3 3 3 3s3-1.3 3-3z" />
          </svg>
          <span className="font-bold text-xl hidden sm:inline-block">Faderco Drop</span>
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-6">
        <nav className="flex items-center gap-4">
          <Button
            variant="link"
            className="text-sm hover:text-primary transition-colors p-0 h-auto"
            onClick={onAboutClick}
          >
            {t("nav.about")}
          </Button>
          <Button
            variant="link"
            className="text-sm hover:text-primary transition-colors p-0 h-auto"
            onClick={onHowToUseClick}
          >
            {t("nav.howToUse")}
          </Button>
          <Button
            variant="link"
            className="text-sm hover:text-primary transition-colors p-0 h-auto"
            onClick={() => setFeaturesDialogOpen(true)}
          >
            Features
          </Button>
          <Button
            variant="link"
            className="text-sm hover:text-primary transition-colors p-0 h-auto"
            onClick={() => setChangelogDialogOpen(true)}
          >
            Changelog
          </Button>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSelector />

          {isLoggedIn ? (
            <>
              {user?.role === "admin" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setAdminDashboardOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                  Admin Panel
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setUserDashboardOpen(true)}
                >
                  <User className="h-4 w-4" />
                  My Dashboard
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Login
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{showSignup ? "Create Account" : "Admin Login"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {!showSignup ? (
                    // Login Form
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">
                          Email
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="whoami@faderco.com"
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium">
                          Password
                        </label>
                        <input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="admin123"
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        />
                      </div>
                      {error && <div className="text-sm text-red-500">{error}</div>}
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Signing in..." : "Sign In"}
                      </Button>
                      <div className="text-center">
                        <Button type="button" variant="link" onClick={() => setShowSignup(true)} className="text-sm">
                          Don't have an account? Sign up
                        </Button>
                      </div>
                    </form>
                  ) : (
                    // Signup Form
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="signup-name" className="text-sm font-medium">
                          Full Name
                        </label>
                        <input
                          id="signup-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="signup-email" className="text-sm font-medium">
                          Email
                        </label>
                        <input
                          id="signup-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="signup-password" className="text-sm font-medium">
                          Password
                        </label>
                        <input
                          id="signup-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Choose a password"
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="signup-phone" className="text-sm font-medium">
                          Phone Number
                        </label>
                        <input
                          id="signup-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+213 XXX XXX XXX"
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="signup-company" className="text-sm font-medium">
                          Company Name
                        </label>
                        <input
                          id="signup-company"
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="Your company name"
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="signup-position" className="text-sm font-medium">
                          Job Position
                        </label>
                        <input
                          id="signup-position"
                          type="text"
                          value={jobPosition}
                          onChange={(e) => setJobPosition(e.target.value)}
                          placeholder="Your job title"
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          required
                        />
                      </div>
                      {error && <div className="text-sm text-red-500">{error}</div>}
                      {success && <div className="text-sm text-green-500">{success}</div>}
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Creating account..." : "Create Account"}
                      </Button>
                      <div className="text-center">
                        <Button type="button" variant="link" onClick={() => setShowSignup(false)} className="text-sm">
                          Already have an account? Sign in
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground text-center">
                        Note: New accounts require admin approval before you can upload files.
                      </div>
                    </form>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="md:hidden flex items-center gap-2">
        <ThemeToggle />
        <LanguageSelector />
        {isLoggedIn ? (
          user?.role === "admin" ? (
            <Button variant="outline" size="sm" onClick={() => setAdminDashboardOpen(true)}>
              <Settings className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setUserDashboardOpen(true)}>
              <User className="h-4 w-4" />
            </Button>
          )
        ) : (
          <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <User className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </Dialog>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-background/95 backdrop-blur-sm p-4 flex flex-col gap-2 border-b md:hidden">
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
              setFeaturesDialogOpen(true)
            }}
          >
            Features
          </Button>
          <Button
            variant="ghost"
            className="p-2 hover:bg-muted rounded-md justify-start"
            onClick={() => {
              setMobileMenuOpen(false)
              setChangelogDialogOpen(true)
            }}
          >
            Changelog
          </Button>
        </div>
      )}

      {/* User Dashboard Popup */}
      <UserDashboard open={userDashboardOpen} onOpenChange={setUserDashboardOpen} />

      {/* Admin Dashboard Popup */}
      <AdminDashboard open={adminDashboardOpen} onOpenChange={setAdminDashboardOpen} />

      {/* Features Dialog */}
      <Dialog open={featuresDialogOpen} onOpenChange={setFeaturesDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Platform Features
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid gap-4">
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="grid gap-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-500/20 text-green-600 p-1 rounded-full mt-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">End-to-End Encryption</h3>
                      <p className="text-sm text-muted-foreground">
                        All files are encrypted before upload and decrypted only when downloaded
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500/20 text-blue-600 p-1 rounded-full mt-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">Hybrid Storage</h3>
                      <p className="text-sm text-muted-foreground">
                        Smart storage using R2 for large files and database for smaller ones
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-500/20 text-purple-600 p-1 rounded-full mt-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">Email Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        Automatic email delivery with download links to recipients
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-500/20 text-indigo-600 p-1 rounded-full mt-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">QR Code Sharing</h3>
                      <p className="text-sm text-muted-foreground">Generate QR codes for easy mobile sharing</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-500/20 text-amber-600 p-1 rounded-full mt-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">Password Protection</h3>
                      <p className="text-sm text-muted-foreground">
                        Optional password protection for sensitive transfers
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-rose-500/20 text-rose-600 p-1 rounded-full mt-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">Auto-Expiry</h3>
                      <p className="text-sm text-muted-foreground">
                        Automatic file deletion after expiration for security
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-emerald-500/20 text-emerald-600 p-1 rounded-full mt-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">Admin Dashboard</h3>
                      <p className="text-sm text-muted-foreground">
                        Complete admin panel for managing transfers and users
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-sky-500/20 text-sky-600 p-1 rounded-full mt-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">Multi-language</h3>
                      <p className="text-sm text-muted-foreground">Support for multiple languages and regions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-teal-500/20 text-teal-600 p-1 rounded-full mt-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">5TB Storage Limit</h3>
                      <p className="text-sm text-muted-foreground">Upload files up to 5TB in size</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Changelog Dialog */}
      <Dialog open={changelogDialogOpen} onOpenChange={setChangelogDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Changelog
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid gap-6">
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-primary">v2.1.0</h3>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">Latest</span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="bg-green-500/20 text-green-600 p-1 rounded-full mt-0.5">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Added R2 storage integration for large files</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-green-500/20 text-green-600 p-1 rounded-full mt-0.5">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Implemented real-time upload progress tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-green-500/20 text-green-600 p-1 rounded-full mt-0.5">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Enhanced admin dashboard with storage analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-green-500/20 text-green-600 p-1 rounded-full mt-0.5">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Added SMTP configuration management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-green-500/20 text-green-600 p-1 rounded-full mt-0.5">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Improved email notification system</span>
                  </li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-blue-600">v2.0.0</h3>
                  <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded-full font-medium">
                    Major Release
                  </span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-500/20 text-blue-600 p-1 rounded-full mt-0.5">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Added end-to-end encryption for all files</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-500/20 text-blue-600 p-1 rounded-full mt-0.5">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Implemented user authentication system</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-500/20 text-blue-600 p-1 rounded-full mt-0.5">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Created comprehensive admin panel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-500/20 text-blue-600 p-1 rounded-full mt-0.5">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Added password protection for transfers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-500/20 text-blue-600 p-1 rounded-full mt-0.5">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Implemented QR code generation</span>
                  </li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-purple-600">v1.5.0</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="bg-purple-500/20 text-purple-600 p-1 rounded-full mt-0.5">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Enhanced email notification system</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-purple-500/20 text-purple-600 p-1 rounded-full mt-0.5">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Added auto-expiry functionality</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-purple-500/20 text-purple-600 p-1 rounded-full mt-0.5">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Multi-language support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-purple-500/20 text-purple-600 p-1 rounded-full mt-0.5">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Improved UI/UX design</span>
                  </li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-orange-600">v1.0.0</h3>
                  <span className="text-xs bg-orange-500/10 text-orange-600 px-2 py-1 rounded-full font-medium">
                    Initial Release
                  </span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="bg-orange-500/20 text-orange-600 p-1 rounded-full mt-0.5">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Basic file upload and sharing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-orange-500/20 text-orange-600 p-1 rounded-full mt-0.5">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Responsive design</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-orange-500/20 text-orange-600 p-1 rounded-full mt-0.5">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Share link generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-orange-500/20 text-orange-600 p-1 rounded-full mt-0.5">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>Multiple file support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
