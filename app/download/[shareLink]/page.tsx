"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { BackgroundImage } from "@/components/background-image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "@/hooks/use-translation"
import {
  FileIcon,
  LockIcon,
  CalendarIcon,
  DownloadIcon,
  AlertCircle,
  FileText,
  ImageIcon,
  FileVideo,
  FileAudio,
  FileArchive,
  Eye,
  User,
  Download,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Transfer {
  id: string
  title: string
  message: string
  sender_email: string
  password_protected: boolean
  expires_at: string
  download_limit: number
  download_count: number
  created_at: string
  files: Array<{
    id: string
    filename: string
    original_filename: string
    file_size: number
    file_type: string
    storage_type?: string
  }>
}

export default function DownloadPage() {
  const { shareLink } = useParams()
  const { t } = useTranslation()
  const { toast } = useToast()
  const [transfer, setTransfer] = useState<Transfer | null>(null)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState("")
  const [passwordRequired, setPasswordRequired] = useState(false)
  const [passwordError, setPasswordError] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [downloadSpeed, setDownloadSpeed] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [previewFile, setPreviewFile] = useState<{
    id: string
    filename: string
    type: string
    url: string
  } | null>(null)
  const [expired, setExpired] = useState(false)
  const [downloadLimitReached, setDownloadLimitReached] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (shareLink) {
      fetchTransfer()
    }
  }, [shareLink])

  const fetchTransfer = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/transfer/${shareLink}`)
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          setError("Transfer not found")
        } else if (response.status === 410) {
          setExpired(true)
        } else if (response.status === 403) {
          setDownloadLimitReached(true)
        } else {
          setError(data.error || "Failed to load transfer")
        }
        return
      }

      if (data.success) {
        setTransfer(data.transfer)
        setPasswordRequired(data.transfer.password_protected)
      }
    } catch (error) {
      console.error("Error fetching transfer:", error)
      setError("Failed to load transfer")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch(`/api/transfer/${shareLink}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setPasswordRequired(false)
        setPasswordError(false)
        toast({
          title: t("download.passwordCorrect"),
          description: t("download.filesUnlocked"),
        })
      } else {
        setPasswordError(true)
        toast({
          title: t("download.incorrectPassword"),
          description: t("download.tryAgain"),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Password verification error:", error)
      setPasswordError(true)
      toast({
        title: t("download.incorrectPassword"),
        description: t("download.tryAgain"),
        variant: "destructive",
      })
    }
  }

  const downloadFile = async (fileId?: string) => {
    if (!transfer) return

    try {
      setDownloading(true)
      setDownloadProgress(0)

      // Build download URL
      const downloadUrl = fileId
        ? `/api/transfer/${shareLink}/download?fileId=${fileId}`
        : `/api/transfer/${shareLink}/download`

      // Create invisible link and trigger download (the original working method)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.style.display = "none"

      if (fileId) {
        const file = transfer.files.find((f) => f.id === fileId)
        if (file) {
          link.download = file.original_filename
        }
      } else {
        link.download = `${transfer.title || "files"}.zip`
      }

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Simulate progress for UI feedback (since we can't track real progress with direct download)
      let progress = 0
      const progressInterval = setInterval(() => {
        progress += Math.random() * 15 + 5 // 5-20% increments
        if (progress >= 100) {
          progress = 100
          clearInterval(progressInterval)
          setTimeout(() => {
            setDownloading(false)
            setDownloadProgress(0)
            toast({
              title: t("download.downloadComplete"),
              description: t("download.filesSaved"),
            })
          }, 500)
        }
        setDownloadProgress(Math.round(progress))
      }, 200)

      // Update download count
      await fetch(`/api/transfer/${shareLink}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "download" }),
      })

      // Update local state
      setTransfer((prev) =>
        prev
          ? {
              ...prev,
              download_count: prev.download_count + 1,
            }
          : null,
      )
    } catch (error) {
      console.error("Download error:", error)
      setDownloading(false)
      setDownloadProgress(0)
      toast({
        title: "Download failed",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleDownload = () => downloadFile()

  const handleSingleFileDownload = (fileId: string) => downloadFile(fileId)

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <ImageIcon className="h-4 w-4" />
    } else if (fileType.startsWith("video/")) {
      return <FileVideo className="h-4 w-4" />
    } else if (fileType.startsWith("audio/")) {
      return <FileAudio className="h-4 w-4" />
    } else if (fileType.includes("pdf") || fileType.includes("document") || fileType.includes("text")) {
      return <FileText className="h-4 w-4" />
    } else if (fileType.includes("zip") || fileType.includes("compressed") || fileType.includes("archive")) {
      return <FileArchive className="h-4 w-4" />
    } else {
      return <FileIcon className="h-4 w-4" />
    }
  }

  const previewFileHandler = (file: Transfer["files"][0]) => {
    const previewableTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "application/pdf",
      "video/mp4",
      "video/webm",
      "text/plain",
    ]

    if (previewableTypes.some((type) => file.file_type.includes(type))) {
      // Create preview URL
      const previewUrl = `/api/transfer/${shareLink}/download?fileId=${file.id}&preview=true`

      setPreviewFile({
        id: file.id,
        filename: file.original_filename,
        type: file.file_type,
        url: previewUrl,
      })
    } else {
      toast({
        title: t("download.previewNotAvailable"),
        description: t("download.fileTypeNotPreviewable"),
      })
    }
  }

  function formatTimeRemaining(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} ${t("download.seconds")}`
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      return `${minutes} ${minutes === 1 ? t("download.minute") : t("download.minutes")}`
    } else {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return `${hours} ${hours === 1 ? t("download.hour") : t("download.hours")}, ${minutes} ${minutes === 1 ? t("download.minute") : t("download.minutes")}`
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col">
        <BackgroundImage />
        <Header onAboutClick={() => {}} onHowToUseClick={() => {}} />
        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-64 bg-muted rounded mb-4"></div>
            <div className="h-4 w-48 bg-muted rounded"></div>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex flex-col">
        <BackgroundImage />
        <Header onAboutClick={() => {}} onHowToUseClick={() => {}} />
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <Card className="w-full max-w-md backdrop-blur-sm bg-background/80">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Error
              </CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    )
  }

  if (expired) {
    return (
      <main className="min-h-screen flex flex-col">
        <BackgroundImage />
        <Header onAboutClick={() => {}} onHowToUseClick={() => {}} />
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <Card className="w-full max-w-md backdrop-blur-sm bg-background/80">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                {t("download.linkExpired")}
              </CardTitle>
              <CardDescription>{t("download.linkExpiredDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t("download.contactSender")}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (downloadLimitReached) {
    return (
      <main className="min-h-screen flex flex-col">
        <BackgroundImage />
        <Header onAboutClick={() => {}} onHowToUseClick={() => {}} />
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <Card className="w-full max-w-md backdrop-blur-sm bg-background/80">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                {t("download.downloadLimitReached")}
              </CardTitle>
              <CardDescription>{t("download.downloadLimitReachedDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t("download.contactSender")}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  if (!transfer) {
    return (
      <main className="min-h-screen flex flex-col">
        <BackgroundImage />
        <Header onAboutClick={() => {}} onHowToUseClick={() => {}} />
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <Card className="w-full max-w-md backdrop-blur-sm bg-background/80">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Transfer not found
              </CardTitle>
              <CardDescription>The requested transfer could not be found.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col">
      <BackgroundImage />
      <Header onAboutClick={() => {}} onHowToUseClick={() => {}} />
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <Card className="w-full max-w-2xl backdrop-blur-sm bg-background/80">
          <CardHeader>
            <CardTitle className="text-2xl">{transfer.title || "File Transfer"}</CardTitle>
            <CardDescription>{t("download.readyToDownload")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Transfer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Shared by:</span>
                  <span className="font-medium">{transfer.sender_email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Downloads:</span>
                  <span className="font-medium">
                    {transfer.download_count}
                    {transfer.download_limit > 0 && ` / ${transfer.download_limit}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">{formatDate(transfer.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Expires:</span>
                  <span className="font-medium">{formatDate(transfer.expires_at)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FileIcon className="h-4 w-4" />
                  <span>{formatFileSize(transfer.files.reduce((acc, file) => acc + file.file_size, 0))}</span>
                </div>
              </div>

              {passwordRequired ? (
                <form onSubmit={handlePasswordSubmit} className="space-y-3 mt-6">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <LockIcon className="h-4 w-4" />
                    <span>{t("download.passwordProtected")}</span>
                  </div>
                  <Input
                    type="password"
                    placeholder={t("download.enterPassword")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={passwordError ? "border-red-500" : ""}
                  />
                  {passwordError && <p className="text-red-500 text-sm">{t("download.incorrectPassword")}</p>}
                  <Button type="submit" className="w-full">
                    {t("download.unlock")}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4 mt-4">
                  {downloading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{Math.round(downloadProgress)}%</span>
                        <span>
                          {formatTimeRemaining(timeRemaining)} {t("download.remaining")}
                        </span>
                      </div>
                      <Progress value={downloadProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {t("download.downloadingAt")} {formatFileSize(downloadSpeed)}/s
                      </p>
                    </div>
                  )}

                  <Tabs defaultValue="files" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="files">{t("download.files")}</TabsTrigger>
                      <TabsTrigger value="preview" disabled={!previewFile}>
                        {t("download.preview")}
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="files" className="mt-4">
                      <div className="border rounded-md">
                        <div className="p-3 border-b bg-muted/50">
                          <h3 className="font-medium">{t("download.contents")}</h3>
                        </div>
                        <ul className="divide-y">
                          {transfer.files.map((file, index) => (
                            <li key={index} className="p-3 flex items-center justify-between hover:bg-muted/30">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {getFileIcon(file.file_type)}
                                <span className="truncate">{file.original_filename}</span>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {formatFileSize(file.file_size)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => previewFileHandler(file)}
                                  disabled={
                                    !["image/jpeg", "image/png", "application/pdf", "video/mp4", "text/plain"].some(
                                      (type) => file.file_type.includes(type),
                                    )
                                  }
                                  title="Preview"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleSingleFileDownload(file.id)}
                                  disabled={downloading}
                                  title="Download this file"
                                >
                                  <DownloadIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button onClick={handleDownload} className="w-full mt-4 gap-2" size="lg" disabled={downloading}>
                        <DownloadIcon className="h-4 w-4" />
                        {downloading ? t("download.downloading") : t("download.downloadFiles")}
                      </Button>
                    </TabsContent>
                    <TabsContent value="preview" className="mt-4">
                      {previewFile && (
                        <div className="border rounded-md p-4 flex justify-center">
                          {previewFile.type.includes("image/") ? (
                            <img
                              src={previewFile.url || "/placeholder.svg"}
                              alt={previewFile.filename}
                              className="max-h-[400px] w-auto object-contain rounded"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg?height=400&width=600&text=Image+Preview+Error"
                              }}
                            />
                          ) : previewFile.type.includes("video/") ? (
                            <video
                              controls
                              className="max-h-[400px] w-auto rounded"
                              poster="/placeholder.svg?height=400&width=600&text=Video+Preview"
                            >
                              <source src={previewFile.url} type={previewFile.type} />
                              {t("download.browserNotSupported")}
                            </video>
                          ) : previewFile.type.includes("pdf") ? (
                            <iframe src={previewFile.url} title="PDF preview" className="w-full h-[400px] rounded" />
                          ) : previewFile.type.includes("text/") ? (
                            <iframe
                              src={previewFile.url}
                              title="Text preview"
                              className="w-full h-[400px] rounded border"
                            />
                          ) : (
                            <div className="text-center p-8">
                              <FileIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                              <p>{t("download.previewNotAvailable")}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center text-xs text-muted-foreground">
            {t("download.secureTransfer")}
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
