"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useTranslation } from "@/hooks/use-translation"
import { useToast } from "@/hooks/use-toast"
import {
  Upload,
  Folder,
  FileIcon,
  ImageIcon,
  FileText,
  FileArchive,
  FileVideo,
  FileAudio,
  X,
  Loader2,
  ArrowRight,
  Info,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function EnhancedUploadForm() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files))
      toast({
        title: "Files added",
        description: `${e.target.files.length} files selected for upload`,
      })
    }
  }

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  // Handle drop event
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        setFiles(Array.from(e.dataTransfer.files))
        toast({
          title: "Files added",
          description: `${e.dataTransfer.files.length} files dropped for upload`,
        })
      }
    },
    [toast],
  )

  // Remove a file from the list
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Simulate upload
  const handleUpload = () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please add files before uploading",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    // Simulate progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setUploading(false)
            toast({
              title: "Upload complete",
              description: "Your files have been uploaded successfully",
            })
          }, 500)
          return 100
        }
        return prev + 1
      })
    }, 50)
  }

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

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Calculate total size
  const totalSize = files.reduce((acc, file) => acc + file.size, 0)

  return (
    <Card className="w-full backdrop-blur-sm bg-background/70 border border-border/50 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Upload className="h-5 w-5 text-primary" />
          {t("upload.requestFiles")}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Drag & Drop Area */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
            dragActive
              ? "border-primary/70 bg-primary/5"
              : "border-muted-foreground/20 hover:border-muted-foreground/30 hover:bg-muted/30"
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
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

          <div className="flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-8 w-8 text-primary" />
            </div>

            <div>
              <h3 className="font-medium text-lg mb-1">{dragActive ? "Drop files here" : "Upload your files"}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t("upload.dragAndDrop")}</p>

              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <FileIcon className="h-4 w-4" />
                  {t("upload.addFiles")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => folderInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Folder className="h-4 w-4" />
                  {t("upload.addFolders")}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* File List */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="rounded-lg border bg-card">
                <div className="p-3 border-b flex items-center justify-between">
                  <h3 className="font-medium text-sm">
                    {files.length} {t("upload.filesSelected")} ({formatFileSize(totalSize)})
                  </h3>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    <span>Up to 2GB free</span>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto">
                  <ul className="divide-y">
                    {files.map((file, index) => (
                      <motion.li
                        key={`${file.name}-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 group hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                            {getFileIcon(file)}
                          </div>
                          <div className="truncate">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Progress */}
        <AnimatePresence>
          {uploading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{Math.round(uploadProgress)}%</span>
                <span className="text-muted-foreground">Uploading...</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      <CardFooter className="pt-2">
        <Button onClick={handleUpload} disabled={files.length === 0 || uploading} className="w-full gap-2">
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("upload.uploading")}
            </>
          ) : (
            <>
              {t("upload.transfer")}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
