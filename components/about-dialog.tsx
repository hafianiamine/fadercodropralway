"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTranslation } from "@/hooks/use-translation"
import { Shield, Zap, Globe, Clock, Lock } from "lucide-react"

interface AboutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto bg-background/80 backdrop-blur-xl border-none shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            {t("about.title")}
          </DialogTitle>
          <DialogDescription>{t("about.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">{t("about.whatIs")}</h3>
            <p className="text-muted-foreground">{t("about.whatIsDesc1")}</p>
            <p className="text-muted-foreground mt-2">{t("about.whatIsDesc2")}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-primary" />
                <h4 className="font-medium">{t("about.security")}</h4>
              </div>
              <p className="text-sm text-muted-foreground">{t("about.securityDesc")}</p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-primary" />
                <h4 className="font-medium">{t("about.speed")}</h4>
              </div>
              <p className="text-sm text-muted-foreground">{t("about.speedDesc")}</p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5 text-primary" />
                <h4 className="font-medium">{t("about.global")}</h4>
              </div>
              <p className="text-sm text-muted-foreground">{t("about.globalDesc")}</p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-primary" />
                <h4 className="font-medium">{t("about.control")}</h4>
              </div>
              <p className="text-sm text-muted-foreground">{t("about.controlDesc")}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">{t("about.privacy")}</h3>
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-primary mt-0.5" />
              <p className="text-muted-foreground text-sm">{t("about.privacyDesc")}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-center text-muted-foreground">{t("about.copyright")}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
