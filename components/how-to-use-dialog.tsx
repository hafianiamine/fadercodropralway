"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Upload, Mail, Download, Shield, ExternalLink, AlertCircle } from "lucide-react"

interface HowToUseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface VideoSettings {
  video_url: string
  video_title: string
}

export function HowToUseDialog({ open, onOpenChange }: HowToUseDialogProps) {
  const [videoSettings, setVideoSettings] = useState<VideoSettings>({
    video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    video_title: "How to use Faderco Drop",
  })
  const [videoError, setVideoError] = useState(false)

  useEffect(() => {
    if (open) {
      fetchVideoSettings()
    }
  }, [open])

  const fetchVideoSettings = async () => {
    try {
      const response = await fetch("/api/admin/video")
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setVideoSettings(data.settings)
        }
      }
    } catch (error) {
      console.error("Failed to fetch video settings:", error)
    }
  }

  // Extract YouTube video ID from URL
  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  // Get proper embed URL
  const getEmbedUrl = (url: string) => {
    if (url.includes("/embed/")) {
      return url
    }
    const videoId = getYoutubeVideoId(url)
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url
  }

  // Get watch URL for fallback
  const getWatchUrl = (url: string) => {
    const videoId = getYoutubeVideoId(url)
    return videoId ? `https://www.youtube.com/watch?v=${videoId}` : url
  }

  const steps = [
    {
      icon: Upload,
      title: "Upload Files",
      description: "Drag and drop your files or click to browse. Support for all file types up to 5TB.",
    },
    {
      icon: Mail,
      title: "Add Recipients",
      description: "Enter email addresses of people you want to share files with (comma separated).",
    },
    {
      icon: Shield,
      title: "Set Security",
      description: "Optionally add a password and set auto-expiry for enhanced security.",
    },
    {
      icon: Download,
      title: "Share & Download",
      description: "Recipients get email notifications with secure download links and QR codes.",
    },
  ]

  const embedUrl = getEmbedUrl(videoSettings.video_url)
  const watchUrl = getWatchUrl(videoSettings.video_url)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto" aria-describedby="how-to-use-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            How to Use Faderco Drop
          </DialogTitle>
          <DialogDescription id="how-to-use-description">
            Learn how to securely upload, share, and manage your files with Faderco Drop
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Video Tutorial */}
          <Card>
            <CardContent className="p-6">
              <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden relative">
                {!videoError ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={embedUrl}
                    title={videoSettings.video_title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full"
                    onError={() => setVideoError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full bg-muted text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mb-4" />
                    <p className="text-center mb-4">Video cannot be embedded</p>
                    <Button
                      variant="outline"
                      onClick={() => window.open(watchUrl, "_blank")}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Watch on YouTube
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Step-by-step Guide */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Step-by-Step Guide</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {steps.map((step, index) => (
                  <div key={index} className="flex gap-3 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                        {index + 1}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <step.icon className="h-4 w-4" />
                        <h4 className="font-medium">{step.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>Got it!</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
