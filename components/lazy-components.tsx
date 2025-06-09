"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// Lazy load heavy components
export const LazyQRCodeDialog = dynamic(
  () => import("@/components/qr-code-dialog").then((mod) => ({ default: mod.QRCodeDialog })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    ),
  },
)

export const LazyFilePreviewDialog = dynamic(
  () => import("@/components/file-preview-dialog").then((mod) => ({ default: mod.FilePreviewDialog })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    ),
  },
)

export const LazySecurityInfoDialog = dynamic(
  () => import("@/components/security-info-dialog").then((mod) => ({ default: mod.SecurityInfoDialog })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    ),
  },
)

export const LazyAdminDashboard = dynamic(() => import("@/components/admin-dashboard"), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="ml-2">Loading dashboard...</span>
    </div>
  ),
})

export const LazyUserDashboard = dynamic(() => import("@/components/user-dashboard"), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="ml-2">Loading dashboard...</span>
    </div>
  ),
})
