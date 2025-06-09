"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTranslation } from "@/hooks/use-translation"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, ExternalLink, BookOpen, FileCode, HelpCircle } from "lucide-react"

interface ResourcesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResourcesDialog({ open, onOpenChange }: ResourcesDialogProps) {
  const { t } = useTranslation()

  const resources = [
    {
      title: t("resources.userGuide"),
      description: t("resources.userGuideDesc"),
      icon: <BookOpen className="h-5 w-5" />,
      link: "#",
      linkText: t("resources.download"),
    },
    {
      title: t("resources.apiDocs"),
      description: t("resources.apiDocsDesc"),
      icon: <FileCode className="h-5 w-5" />,
      link: "#",
      linkText: t("resources.view"),
    },
    {
      title: t("resources.faq"),
      description: t("resources.faqDesc"),
      icon: <HelpCircle className="h-5 w-5" />,
      link: "#",
      linkText: t("resources.browse"),
    },
    {
      title: t("resources.bestPractices"),
      description: t("resources.bestPracticesDesc"),
      icon: <FileText className="h-5 w-5" />,
      link: "#",
      linkText: t("resources.read"),
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t("resources.title")}</DialogTitle>
          <DialogDescription>{t("resources.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2 py-4">
          {resources.map((resource, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {resource.icon}
                  {resource.title}
                </CardTitle>
                <CardDescription>{resource.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="outline" className="w-full gap-2">
                  {resource.link.includes("download") ? (
                    <Download className="h-4 w-4" />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}
                  {resource.linkText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-medium mb-2">{t("resources.needHelp")}</h3>
          <p className="text-sm text-muted-foreground">{t("resources.needHelpDesc")}</p>
          <Button variant="link" className="p-0 h-auto mt-2">
            {t("resources.contactSupport")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
