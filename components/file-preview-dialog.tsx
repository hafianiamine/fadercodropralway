"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/use-translation"
import { FileIcon, Download, X } from "lucide-react"
import Image from "next/image"

interface FilePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: File | null
  onDownload?: () => void
}

export function FilePreviewDialog({ open, onOpenChange, file, onDownload }: FilePreviewDialogProps) {
  const { t } = useTranslation()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && file) {
      generatePreview()
    }

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [open, file])

  const generatePreview = async () => {
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const fileType = file.type.toLowerCase()

      if (fileType.startsWith("image/")) {
        // Image preview
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      } else if (fileType === "text/plain" || fileType.includes("text/")) {
        // Text file preview
        const text = await file.text()
        setPreviewContent(text.substring(0, 5000)) // Limit to first 5000 characters
      } else if (fileType === "application/json") {
        // JSON preview
        const text = await file.text()
        try {
          const json = JSON.parse(text)
          setPreviewContent(JSON.stringify(json, null, 2).substring(0, 5000))
        } catch {
          setPreviewContent(text.substring(0, 5000))
        }
      } else if (fileType === "application/pdf") {
        // PDF preview (create object URL for iframe)
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      } else if (fileType.startsWith("video/")) {
        // Video preview
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      } else if (fileType.startsWith("audio/")) {
        // Audio preview
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      } else {
        setError("Preview not available for this file type")
      }
    } catch (err) {
      console.error("Preview generation failed:", err)
      setError("Failed to generate preview")
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <FileIcon className="h-16 w-16 mb-4" />
          <p>{error}</p>
        </div>
      )
    }

    if (!file) return null

    const fileType = file.type.toLowerCase()

    if (fileType.startsWith("image/") && previewUrl) {
      return (
        <div className="flex justify-center">
          <Image
            src={previewUrl || "/placeholder.svg"}
            alt={file.name}
            width={600}
            height={400}
            className="max-h-[60vh] w-auto object-contain rounded"
            onError={() => setError("Failed to load image")}
          />
        </div>
      )
    }

    if (fileType.startsWith("video/") && previewUrl) {
      return (
        <div className="flex justify-center">
          <video controls className="max-h-[60vh] w-auto rounded" onError={() => setError("Failed to load video")}>
            <source src={previewUrl} type={file.type} />
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    if (fileType.startsWith("audio/") && previewUrl) {
      return (
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <FileIcon className="h-8 w-8 text-primary" />
          </div>
          <audio controls className="w-full max-w-md">
            <source src={previewUrl} type={file.type} />
            Your browser does not support the audio tag.
          </audio>
        </div>
      )
    }

    if (fileType === "application/pdf" && previewUrl) {
      return (
        <iframe
          src={previewUrl}
          title={file.name}
          className="w-full h-[60vh] rounded border"
          onError={() => setError("Failed to load PDF")}
        />
      )
    }

    if (previewContent) {
      return (
        <div className="w-full h-[60vh] overflow-auto">
          <pre className="text-sm whitespace-pre-wrap p-4 bg-muted rounded font-mono">
            {previewContent}
            {previewContent.length >= 5000 && "\n\n... (truncated)"}
          </pre>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <FileIcon className="h-16 w-16 mb-4" />
        <p>Preview not available for this file type</p>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileIcon className="h-5 w-5" />
            {file?.name}
          </DialogTitle>
          <DialogDescription>
            {file && `${formatFileSize(file.size)} • ${file.type || "Unknown type"}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">{renderPreview()}</div>

        <DialogFooter className="flex gap-2">
          {onDownload && (
            <Button variant="outline" onClick={onDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)} className="gap-2">
            <X className="h-4 w-4" />
            {t("upload.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
