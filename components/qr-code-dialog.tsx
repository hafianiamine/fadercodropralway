"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/use-translation"
import { Download, Copy, ExternalLink, QrCode } from "lucide-react"
import { generateQRCodeSVG, generateQRCodeDataURL } from "@/lib/qr-code"
import { useToast } from "@/hooks/use-toast"

interface QRCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: string
  title: string
  description: string
}

export function QRCodeDialog({ open, onOpenChange, value, title, description }: QRCodeDialogProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null)
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && value) {
      setLoading(true)
      setError(null)

      // Generate QR code with the actual URL
      const generateQRCode = async () => {
        try {
          console.log("Generating QR code for:", value)

          // Generate both SVG and data URL versions
          const [svg, dataURL] = await Promise.all([generateQRCodeSVG(value, 256), generateQRCodeDataURL(value, 256)])

          setQrCodeSvg(svg)
          setQrCodeDataURL(dataURL)
          setLoading(false)
        } catch (error) {
          console.error("QR code generation failed:", error)
          setError("Failed to generate QR code")
          setLoading(false)
        }
      }

      generateQRCode()
    }
  }, [open, value])

  const downloadQrCode = async () => {
    if (!qrCodeDataURL) {
      toast({
        title: "Download Failed",
        description: "QR code not ready for download",
        variant: "destructive",
      })
      return
    }

    try {
      // Convert data URL to blob
      const response = await fetch(qrCodeDataURL)
      const blob = await response.blob()

      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `qr-code-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()

      // Clean up
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "QR Code Downloaded",
        description: "QR code has been saved to your downloads",
      })
    } catch (error) {
      console.error("Download failed:", error)
      toast({
        title: "Download Failed",
        description: "Could not download QR code",
        variant: "destructive",
      })
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(value)
      toast({
        title: "Link Copied",
        description: "Download link has been copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      })
    }
  }

  const openLink = () => {
    window.open(value, "_blank")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <QrCode className="h-6 w-6" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-center">{description}</DialogDescription>
        </DialogHeader>

        {/* Main Content - Centered */}
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          {/* QR Code */}
          <div className="flex justify-center">
            {loading ? (
              <div className="w-64 h-64 bg-muted animate-pulse rounded-xl flex items-center justify-center border-2 border-dashed">
                <div className="text-center">
                  <QrCode className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-spin" />
                  <span className="text-sm text-muted-foreground">Generating QR Code...</span>
                </div>
              </div>
            ) : error ? (
              <div className="w-64 h-64 bg-muted rounded-xl flex items-center justify-center border-2 border-destructive">
                <div className="text-center">
                  <QrCode className="h-8 w-8 mx-auto mb-2 text-destructive" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
              </div>
            ) : qrCodeSvg ? (
              <div className="relative">
                <div
                  className="w-64 h-64 bg-white p-4 rounded-xl border-2 shadow-lg"
                  dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                />
                <div className="absolute -bottom-3 -right-3 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg">
                  SCAN ME
                </div>
              </div>
            ) : (
              <div className="w-64 h-64 bg-muted rounded-xl flex items-center justify-center border-2">
                <span className="text-sm text-muted-foreground">No QR code generated</span>
              </div>
            )}
          </div>

          {/* URL Section */}
          <div className="w-full max-w-md text-center space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Download URL</h4>
            <div className="bg-muted/50 border rounded-lg p-4">
              <p className="text-xs font-mono break-all text-center leading-relaxed">{value}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <DialogFooter className="flex-col space-y-3">
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button variant="outline" onClick={copyLink} className="gap-2">
              <Copy className="h-4 w-4" />
              Copy Link
            </Button>
            <Button variant="outline" onClick={openLink} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Open Link
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button variant="outline" onClick={downloadQrCode} disabled={loading || !qrCodeDataURL} className="gap-2">
              <Download className="h-4 w-4" />
              Download PNG
            </Button>
            <Button onClick={() => onOpenChange(false)} className="gap-2">
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
