"use client"

import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useTranslation } from "@/hooks/use-translation"
import {
  Upload,
  Folder,
  MoreVertical,
  Lock,
  Copy,
  Clock,
  RefreshCw,
  Loader2,
  AlertCircle,
  X,
  FileIcon,
  ImageIcon,
  FileText,
  FileArchive,
  FileVideo,
  FileAudio,
  Eye,
  Download,
  Trash2,
  ShieldCheck,
  ShieldQuestion,
  QrCode,
  Mail,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { QRCodeDialog } from "@/components/qr-code-dialog"
import { motion, AnimatePresence } from "framer-motion"
import { SecurityInfoDialog } from "@/components/security-info-dialog"
import { EncryptionAnimation } from "./encryption-animation"
import { FilePreviewDialog } from "./file-preview-dialog"

// Maximum file size (1TB in bytes)
const MAX_FILE_SIZE = 1099511627776

// Add these constants at the top of the component
const CHUNK_SIZE = 1 * 1024 * 1024 // 1MB chunks

export function UploadForm() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [invalidFiles, setInvalidFiles] = useState<{ name: string; reason: string }[]>([])
  const [emailTo, setEmailTo] = useState("")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [shareLink, setShareLink] = useState("")
  const [passwordProtection, setPasswordProtection] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [expiryDays, setExpiryDays] = useState(7)
  const [downloadLimit, setDownloadLimit] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showQrCode, setShowQrCode] = useState(false)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(true)
  const [showAutoDeleteInfo, setShowAutoDeleteInfo] = useState(false)
  const [showSecurityInfo, setShowSecurityInfo] = useState(false)
  const [endToEndEncryption, setEndToEndEncryption] = useState(true)
  const [showEncryptionAnimation, setShowEncryptionAnimation] = useState(false)
  const [emailResults, setEmailResults] = useState<any>(null)

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // New state for better upload tracking
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<string>("")
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [failedFiles, setFailedFiles] = useState<string[]>([])

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const userData = await response.json()
          setUser(userData.user)
          setIsLoggedIn(true)
        } else if (response.status === 401) {
          setUser(null)
          setIsLoggedIn(false)
        } else {
          setUser(null)
          setIsLoggedIn(false)
        }
      } catch (error) {
        setUser(null)
        setIsLoggedIn(false)
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuth()
  }, [])

  // Session check on focus
  useEffect(() => {
    const handleFocus = () => {
      checkAuth()
    }

    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const userData = await response.json()
          setUser(userData.user)
          setIsLoggedIn(true)
        } else if (response.status === 401) {
          setUser(null)
          setIsLoggedIn(false)
        } else {
          setUser(null)
          setIsLoggedIn(false)
        }
      } catch (error) {
        setUser(null)
        setIsLoggedIn(false)
      }
    }

    window.addEventListener("focus", handleFocus)
    const interval = setInterval(checkAuth, 5000)

    return () => {
      window.removeEventListener("focus", handleFocus)
      clearInterval(interval)
    }
  }, [])

  // Prevent default drag behavior
  useEffect(() => {
    const handleDocumentDragOver = (e: DragEvent) => {
      e.preventDefault()
    }

    const handleDocumentDrop = (e: DragEvent) => {
      e.preventDefault()
      if (dropZoneRef.current && !dropZoneRef.current.contains(e.target as Node)) {
        setDragActive(false)
      }
    }

    document.addEventListener("dragover", handleDocumentDragOver)
    document.addEventListener("drop", handleDocumentDrop)

    return () => {
      document.removeEventListener("dragover", handleDocumentDragOver)
      document.removeEventListener("drop", handleDocumentDrop)
    }
  }, [])

  // Validate files
  const validateFiles = (filesToValidate: File[]): { valid: File[]; invalid: { name: string; reason: string }[] } => {
    const valid: File[] = []
    const invalid: { name: string; reason: string }[] = []

    filesToValidate.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        invalid.push({
          name: file.name,
          reason: t("upload.fileTooLarge"),
        })
        return
      }

      valid.push(file)
    })

    return { valid, invalid }
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const { valid, invalid } = validateFiles(newFiles)

      if (invalid.length > 0) {
        setInvalidFiles((prev) => [...prev, ...invalid])
        toast({
          title: t("upload.invalidFiles"),
          description: t("upload.someFilesNotAdded"),
          variant: "destructive",
        })
      }

      if (valid.length > 0) {
        setFiles((prev) => [...prev, ...valid])
      }
    }
  }

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      const rect = dropZoneRef.current?.getBoundingClientRect()
      if (rect) {
        const { left, top, right, bottom } = rect
        const { clientX, clientY } = e
        if (clientX < left || clientX > right || clientY < top || clientY > bottom) {
          setDragActive(false)
        }
      }
    }
  }, [])

  // Handle drop event
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const newFiles = Array.from(e.dataTransfer.files)
        const { valid, invalid } = validateFiles(newFiles)

        if (invalid.length > 0) {
          setInvalidFiles((prev) => [...prev, ...invalid])
          toast({
            title: t("upload.invalidFiles"),
            description: t("upload.someFilesNotAdded"),
            variant: "destructive",
          })
        }

        if (valid.length > 0) {
          setFiles((prev) => [...prev, ...valid])
        }
      }
    },
    [files, t, toast],
  )

  // Remove a file from the list
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Remove all files
  const removeAllFiles = () => {
    setFiles([])
    toast({
      title: t("upload.filesRemoved"),
      description: t("upload.allFilesRemoved"),
    })
  }

  // Remove an invalid file from the list
  const removeInvalidFile = (index: number) => {
    setInvalidFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Generate a random password
  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let result = ""
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(result)
  }

  // Copy password to clipboard
  const copyPassword = () => {
    navigator.clipboard.writeText(password)
    toast({
      title: t("upload.passwordCopied"),
      description: t("upload.passwordCopiedDesc"),
    })
  }

  // Copy share link to clipboard
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink)
    toast({
      title: t("upload.linkCopied"),
      description: t("upload.linkCopiedDesc"),
    })
  }

  // Replace the handleSubmit function with your multipart upload logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (files.length === 0) {
      toast({
        title: t("upload.noFiles"),
        description: t("upload.pleaseAddFiles"),
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setUploadError(null)
    setShowEncryptionAnimation(true)
    setUploadProgress(0)
    setUploadedFiles([])
    setFailedFiles([])

    try {
      const recipientEmailsArray = emailTo
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email.length > 0)

      // Process each file using your multipart approach
      const uploadResults = []

      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        const file = files[fileIndex]
        setCurrentFileIndex(fileIndex)
        setUploadStatus(`Uploading ${file.name} (${formatFileSize(file.size)})...`)

        try {
          const result = await uploadFileMultipart(file, fileIndex, files.length)
          uploadResults.push(result)
          setUploadedFiles((prev) => [...prev, file.name])
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error)
          setFailedFiles((prev) => [...prev, file.name])
        }
      }

      if (uploadResults.length === 0) {
        throw new Error("All files failed to upload")
      }

      // Create transfer record for the first successful upload (or handle multiple files)
      const firstResult = uploadResults[0]
      if (firstResult) {
        setShareLink(firstResult.shareLink)
        setUploadComplete(true)
        setEmailResults(firstResult.email)
      }

      setShowEncryptionAnimation(false)
      setUploadProgress(100)

      toast({
        title: "Upload Complete! 🎉",
        description: `${uploadResults.length} file${uploadResults.length > 1 ? "s" : ""} uploaded successfully!`,
      })
    } catch (error) {
      console.error("Upload error:", error)
      setUploadError(error instanceof Error ? error.message : "Upload failed")
      setShowEncryptionAnimation(false)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setUploadStatus("")
    }
  }

  // Add your exact multipart upload function
  const uploadFileMultipart = async (file: File, fileIndex: number, totalFiles: number) => {
    // Step 1: Initiate multipart upload
    const initResponse = await fetch("/api/upload/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      }),
    })

    if (!initResponse.ok) {
      throw new Error("Failed to initiate upload")
    }

    const { uploadId, key } = await initResponse.json()
    const parts = []
    let uploaded = 0
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

    // Step 2: Upload each chunk
    for (let i = 1; i <= totalChunks; i++) {
      const start = (i - 1) * CHUNK_SIZE
      const chunk = file.slice(start, Math.min(start + CHUNK_SIZE, file.size))

      // Get presigned URL for this part
      const urlResponse = await fetch("/api/upload/get-part-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId, partNumber: i, key }),
      })

      if (!urlResponse.ok) {
        throw new Error(`Failed to get part URL for chunk ${i}`)
      }

      const { url } = await urlResponse.json()

      // Replace the fetch call with retry logic:
      const uploadChunkWithRetry = async (url, chunk, maxRetries = 3) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const response = await fetch(url, {
              method: "PUT",
              body: chunk,
              signal: AbortSignal.timeout(25000), // 25s timeout
            })
            if (response.ok) return response
            throw new Error(`HTTP ${response.status}`)
          } catch (error) {
            console.log(`Chunk ${i} attempt ${attempt}/${maxRetries} failed:`, error)
            if (attempt === maxRetries) throw error
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
          }
        }
      }

      // Use it instead of direct fetch:
      const uploadResponse = await uploadChunkWithRetry(url, chunk)

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload chunk ${i}`)
      }

      // Collect the ETag for this part
      const etag = uploadResponse.headers.get("ETag")
      parts.push({ PartNumber: i, ETag: etag })

      // Update progress
      uploaded += chunk.size
      const fileProgress = Math.round((uploaded / file.size) * 100)
      const overallProgress = Math.round(((fileIndex + uploaded / file.size) / totalFiles) * 100)
      setUploadProgress(overallProgress)

      setUploadStatus(`${file.name}: ${fileProgress}% (chunk ${i}/${totalChunks})`)
    }

    // Step 3: Complete the multipart upload
    const transferData = {
      title,
      message,
      recipientEmails: emailTo
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e.length > 0),
      password,
      passwordHash: password ? await hashPassword(password) : null,
      expiryDays,
      downloadLimit,
      autoDeleteEnabled,
      endToEndEncryption,
      originalFilename: file.name,
      fileSize: file.size,
      contentType: file.type || "application/octet-stream",
    }

    const completeResponse = await fetch("/api/upload/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId, key, parts, transferData }),
    })

    if (!completeResponse.ok) {
      throw new Error("Failed to complete upload")
    }

    const result = await completeResponse.json()
    return result
  }

  // Add the hashPassword function if not already present
  const hashPassword = async (password: string) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hash = await crypto.subtle.digest("SHA-256", data)
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  }

  // Fallback to old upload method for small files
  // const handleFallbackUpload = async (e: React.FormEvent) => {
  //   e.preventDefault()

  //   if (files.length === 0) {
  //     toast({
  //       title: t("upload.noFiles"),
  //       description: t("upload.pleaseAddFiles"),
  //       variant: "destructive",
  //     })
  //     return
  //   }

  //   setUploading(true)
  //   setUploadError(null)
  //   setShowEncryptionAnimation(true)

  //   try {
  //     const formData = new FormData()

  //     files.forEach((file) => {
  //       formData.append("files", file)
  //     })

  //     const recipientEmailsArray = emailTo
  //       .split(",")
  //       .map((email) => email.trim())
  //       .filter((email) => email.length > 0)

  //     formData.append("title", title)
  //     formData.append("message", message)
  //     formData.append("senderEmail", user?.email || "")
  //     formData.append("recipientEmails", JSON.stringify(recipientEmailsArray))
  //     formData.append("password", password)
  //     formData.append("expiryDays", expiryDays.toString())
  //     formData.append("downloadLimit", downloadLimit.toString())
  //     formData.append("autoDeleteEnabled", autoDeleteEnabled.toString())
  //     formData.append("endToEndEncryption", endToEndEncryption.toString())

  //     const xhr = new XMLHttpRequest()

  //     xhr.upload.addEventListener("progress", (event) => {
  //       if (event.lengthComputable) {
  //         const percentComplete = (event.loaded / event.total) * 100
  //         setUploadProgress(Math.round(percentComplete))
  //       }
  //     })

  //     const uploadPromise = new Promise((resolve, reject) => {
  //       xhr.onload = () => {
  //         if (xhr.status >= 200 && xhr.status < 300) {
  //           try {
  //             resolve(JSON.parse(xhr.responseText))
  //           } catch (e) {
  //             reject(new Error("Invalid response format"))
  //           }
  //         } else {
  //           reject(new Error(`Upload failed with status ${xhr.status}`))
  //         }
  //       }
  //       xhr.onerror = () => reject(new Error("Network error"))
  //       xhr.ontimeout = () => reject(new Error("Upload timeout"))
  //     })

  //     xhr.open("POST", "/api/upload")
  //     xhr.timeout = 900000
  //     xhr.send(formData)

  //     const result = await uploadPromise

  //     setUploadProgress(100)

  //     if (result.success) {
  //       setShareLink(result.transfer.shareLink)
  //       setUploadComplete(true)
  //       setShowEncryptionAnimation(false)
  //       setEmailResults(result.email)

  //       toast({
  //         title: t("upload.uploadComplete"),
  //         description: t("upload.filesReadyToShare"),
  //       })
  //     } else {
  //       throw new Error(result.error || "Upload failed")
  //     }
  //   } catch (error) {
  //     console.error("Upload error:", error)
  //     setUploadError(error instanceof Error ? error.message : "Upload failed")
  //     setShowEncryptionAnimation(false)
  //     toast({
  //       title: "Upload Failed",
  //       description: error instanceof Error ? error.message : "Please try again",
  //       variant: "destructive",
  //     })
  //   } finally {
  //     setUploading(false)
  //     setUploadProgress(0)
  //   }
  // }

  // Choose upload method based on file size
  // const handleSubmit = async (e: React.FormEvent) => {
  //   const totalSize = files.reduce((acc, file) => acc + file.size, 0)
  //   const sizeInMB = totalSize / (1024 * 1024)

  //   // Use presigned URLs for files over 10MB or multiple files
  //   if (sizeInMB > 10 || files.length > 1) {
  //     console.log(`Using presigned upload for ${sizeInMB.toFixed(2)}MB`)
  //     await handlePresignedUpload(e)
  //   } else {
  //     console.log(`Using fallback upload for ${sizeInMB.toFixed(2)}MB`)
  //     await handleFallbackUpload(e)
  //   }
  // }

  // Reset the form
  const resetForm = () => {
    setFiles([])
    setInvalidFiles([])
    setEmailTo("")
    setTitle("")
    setMessage("")
    setUploading(false)
    setUploadComplete(false)
    setShareLink("")
    setPasswordProtection(false)
    setPassword("")
    setUploadProgress(0)
    setUploadError(null)
    setEmailResults(null)
    setCurrentFileIndex(0)
    setUploadStatus("")
    setUploadedFiles([])
    setFailedFiles([])
  }

  // Preview a file
  const previewFileHandler = (file: File) => {
    setPreviewFile(file)
    setShowPreview(true)
  }

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // Get file icon based on type
  const getFileIcon = (file: File) => {
    const type = file.type

    if (type.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4" />
    } else if (type.startsWith("video/")) {
      return <FileVideo className="h-4 w-4" />
    } else if (type.startsWith("audio/")) {
      return <FileAudio className="h-4 w-4" />
    } else if (type.includes("pdf") || type.includes("document") || type.includes("text")) {
      return <FileText className="h-4 w-4" />
    } else if (type.includes("zip") || type.includes("compressed") || type.includes("archive")) {
      return <FileArchive className="h-4 w-4" />
    } else {
      return <FileIcon className="h-4 w-4" />
    }
  }

  // Calculate total file size
  const totalSize = files.reduce((acc, file) => acc + file.size, 0)
  const formattedSize = formatFileSize(totalSize)

  // Format file size
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (checkingAuth) {
    return (
      <Card className="backdrop-blur-xl bg-background/50 border border-primary/10 shadow-lg">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="backdrop-blur-xl bg-background/50 border border-primary/10 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            {t("upload.requestFiles")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isLoggedIn ? (
            <div className="text-center py-8 space-y-4">
              <div className="bg-muted/50 rounded-lg p-6">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Login Required</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You need to be logged in to upload files. Please login using the button in the header.
                </p>
              </div>
            </div>
          ) : !user?.is_verified ? (
            <div className="text-center py-8 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <AlertCircle className="h-12 w-12 mx-auto text-amber-600 mb-4" />
                <h3 className="text-lg font-medium mb-2 text-amber-800">Account Pending Verification</h3>
                <p className="text-sm text-amber-700 mb-4">
                  Your account is waiting for admin approval. You'll be able to upload files once an admin verifies your
                  account.
                </p>
              </div>
            </div>
          ) : !uploadComplete ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div
                ref={dropZoneRef}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/20 hover:border-primary/30 hover:bg-muted/10"
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex justify-center space-x-4 mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 transition-colors hover:border-primary hover:text-primary"
                  >
                    <Upload className="h-4 w-4" />
                    {t("upload.addFiles")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => folderInputRef.current?.click()}
                    className="flex items-center gap-2 transition-colors hover:border-primary hover:text-primary"
                  >
                    <Folder className="h-4 w-4" />
                    {t("upload.addFolders")}
                  </Button>
                  <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" />
                  <input
                    ref={folderInputRef}
                    type="file"
                    webkitdirectory="true"
                    directory=""
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                <p className="text-sm text-muted-foreground">{t("upload.dragAndDrop")}</p>

                <AnimatePresence>
                  {files.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="mt-4 text-left"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">
                          {files.length} {t("upload.filesSelected")} ({formattedSize})
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive hover:text-destructive/80"
                          onClick={removeAllFiles}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          {t("upload.removeAll")}
                        </Button>
                      </div>
                      <ul className="mt-2 text-xs space-y-1 max-h-32 overflow-y-auto">
                        {files.map((file, index) => (
                          <motion.li
                            key={index}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.03 }}
                            className="flex items-center justify-between group hover:bg-muted/50 rounded p-1"
                          >
                            <div className="flex items-center gap-2 truncate">
                              {getFileIcon(file)}
                              <span className="truncate">
                                {file.name} ({formatFileSize(file.size)})
                              </span>
                              {uploadedFiles.includes(file.name) && <CheckCircle className="h-3 w-3 text-green-600" />}
                              {failedFiles.includes(file.name) && <XCircle className="h-3 w-3 text-red-600" />}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {(file.type.startsWith("image/") ||
                                file.type === "application/pdf" ||
                                file.type === "text/plain") && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => previewFileHandler(file)}
                                  title={t("upload.preview")}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={() => removeFile(index)}
                                title={t("upload.remove")}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>

                {invalidFiles.length > 0 && (
                  <div className="mt-4 text-left">
                    <p className="text-sm font-medium text-destructive">
                      {invalidFiles.length} {t("upload.invalidFiles")}
                    </p>
                    <ul className="mt-2 text-xs text-destructive space-y-1 max-h-24 overflow-y-auto">
                      {invalidFiles.map((file, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between group hover:bg-destructive/10 rounded p-1"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <AlertCircle className="h-3 w-3" />
                            <span className="truncate">
                              {file.name} - {file.reason}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeInvalidFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Security Banner */}
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10 mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{t("upload.secureTransfer")}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 gap-1"
                  onClick={() => setShowSecurityInfo(true)}
                >
                  <ShieldQuestion className="h-3 w-3" />
                  {t("upload.learnMore")}
                </Button>
              </div>

              {/* Encryption Animation */}
              <AnimatePresence>
                {showEncryptionAnimation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <EncryptionAnimation
                      text={`Encrypting ${files.length} files for secure transfer`}
                      speed={1.5}
                      loop={false}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{Math.round(uploadProgress)}%</span>
                    <span>{uploadStatus || "Uploading..."}</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                  {currentFileIndex >= 0 && files.length > 1 && (
                    <p className="text-xs text-muted-foreground text-center">
                      File {currentFileIndex + 1} of {files.length} • Direct upload to R2
                    </p>
                  )}
                  {uploadedFiles.length > 0 && (
                    <p className="text-xs text-green-600 text-center">
                      ✅ {uploadedFiles.length} uploaded
                      {failedFiles.length > 0 && (
                        <span className="text-red-600"> • ❌ {failedFiles.length} failed</span>
                      )}
                    </p>
                  )}
                </div>
              )}

              {uploadError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t("upload.uploadFailed")}</AlertTitle>
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Unlimited uploads with R2 ∞</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="email-to" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Send files to (Email addresses)
                    <span className="text-xs text-muted-foreground">(comma separated for multiple)</span>
                  </Label>
                  <Input
                    id="email-to"
                    type="email"
                    placeholder="recipient@email.com, another@email.com"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="title">{t("upload.title")}</Label>
                  <Input
                    id="title"
                    placeholder={t("upload.titlePlaceholder")}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="message">{t("upload.message")}</Label>
                  <Textarea
                    id="message"
                    placeholder={t("upload.messagePlaceholder")}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="auto-delete" checked={autoDeleteEnabled} onCheckedChange={setAutoDeleteEnabled} />
                  <div className="flex items-center gap-1">
                    <Label htmlFor="auto-delete" className="text-sm">
                      {t("upload.autoDelete")}
                    </Label>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAutoDeleteInfo(true)}>
                      <AlertCircle className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            // UPLOAD COMPLETE UI
            <div className="space-y-6">
              <div className="text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Upload Complete! ⚡</h3>
                  <p className="text-sm text-muted-foreground">
                    {uploadedFiles.length} file{uploadedFiles.length > 1 ? "s" : ""} uploaded to R2
                    {failedFiles.length > 0 && <span className="text-amber-600"> • {failedFiles.length} failed</span>}
                  </p>
                </div>
              </div>

              {/* Email Results */}
              {emailResults && emailResults.sent > 0 && (
                <div className="rounded-lg border p-4 bg-green-50 border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium text-green-800">Email Notifications Sent</h4>
                  </div>
                  <p className="text-sm text-green-700">
                    ✅ Successfully sent to {emailResults.sent} recipient{emailResults.sent > 1 ? "s" : ""}
                    {emailResults.failed > 0 && (
                      <span className="text-amber-600">
                        <br />
                        ⚠️ {emailResults.failed} email{emailResults.failed > 1 ? "s" : ""} failed to send
                      </span>
                    )}
                  </p>
                </div>
              )}

              <div className="rounded-lg border p-4 bg-muted/20">
                <h4 className="font-medium mb-3">Share Link</h4>
                <div className="flex items-center gap-2 mb-4">
                  <Input value={shareLink} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={copyShareLink} title="Copy Link">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setShowQrCode(true)} title="Show QR Code">
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>

                {passwordProtection && (
                  <div className="flex items-center gap-2 text-sm p-2 bg-amber-50 rounded border border-amber-200">
                    <Lock className="h-4 w-4 text-amber-600" />
                    <span>Password: </span>
                    <code className="bg-white px-2 py-1 rounded border">{password}</code>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyPassword}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              <Button onClick={resetForm} className="w-full flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Upload More Files
              </Button>
            </div>
          )}
        </CardContent>

        {!uploadComplete && isLoggedIn && user?.is_verified && (
          <CardFooter className="flex justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setPasswordDialogOpen(true)}>
                  <Lock className="h-4 w-4 mr-2" />
                  {passwordProtection ? t("upload.removePassword") : t("upload.addPassword")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setExpiryDays(expiryDays === 7 ? 14 : 7)}>
                  <Clock className="h-4 w-4 mr-2" />
                  {t("upload.expiresIn")} {expiryDays === 7 ? "14" : "7"} {t("upload.days")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDownloadLimit(downloadLimit === 0 ? 10 : 0)}>
                  <Download className="h-4 w-4 mr-2" />
                  {downloadLimit === 0 ? t("upload.limitDownloads") : t("upload.removeDownloadLimit")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={uploading || files.length === 0}
              className="min-w-[120px]"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadStatus || "Uploading..."}
                </>
              ) : (
                t("upload.transfer")
              )}
            </Button>
          </CardFooter>
        )}
      </Card>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("upload.passwordProtection")}</DialogTitle>
            <DialogDescription>{t("upload.passwordProtectionDesc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center space-x-2">
              <Switch id="password-protection" checked={passwordProtection} onCheckedChange={setPasswordProtection} />
              <Label htmlFor="password-protection">{t("upload.enablePasswordProtection")}</Label>
            </div>

            {passwordProtection && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("upload.enterPassword")}
                    type="text"
                  />
                  <Button variant="outline" onClick={generatePassword} title={t("upload.generatePassword")}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {password && (
                  <div className="flex items-center gap-2 text-sm">
                    <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={copyPassword}>
                      <Copy className="h-3 w-3" />
                      {t("upload.copyPassword")}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setPasswordDialogOpen(false)}>{t("upload.done")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FilePreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        file={previewFile}
        onDownload={() => {
          setShowPreview(false)
        }}
      />

      <Dialog open={showAutoDeleteInfo} onOpenChange={setShowAutoDeleteInfo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("upload.autoDeleteInfo")}</DialogTitle>
            <DialogDescription>{t("upload.autoDeleteInfoDesc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">{t("upload.autoDeleteExplanation")}</p>

            <div className="bg-muted/50 p-3 rounded-md">
              <h4 className="text-sm font-medium mb-1">{t("upload.howItWorks")}</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                <li>{t("upload.autoDeleteStep1")}</li>
                <li>{t("upload.autoDeleteStep2")}</li>
                <li>{t("upload.autoDeleteStep3")}</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowAutoDeleteInfo(false)}>{t("upload.understood")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QRCodeDialog
        open={showQrCode}
        onOpenChange={setShowQrCode}
        value={shareLink}
        title={t("upload.qrCodeTitle")}
        description={t("upload.qrCodeDescription")}
      />

      <SecurityInfoDialog open={showSecurityInfo} onOpenChange={setShowSecurityInfo} />
    </>
  )
}
