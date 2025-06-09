"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Shield, Lock, Key, FileKey } from "lucide-react"
import { EncryptionAnimation } from "./encryption-animation"
import { motion } from "framer-motion"

interface SecurityInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SecurityInfoDialog({ open, onOpenChange }: SecurityInfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-5 w-5 text-primary" />
            Security & Encryption
          </DialogTitle>
          <DialogDescription>Learn how we protect your files during transfer and storage</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Encryption animation */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">End-to-End Encryption Visualization</h3>
            <EncryptionAnimation text="Your sensitive data is protected with encryption" speed={1.5} />
          </div>

          {/* Encryption explanation */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full mt-1">
                <FileKey className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">End-to-End Encryption</h3>
                <p className="text-sm text-muted-foreground">
                  Your files are encrypted before they leave your device and can only be decrypted by the intended
                  recipient. This means that even we cannot access the contents of your files during transit.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full mt-1">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Password Protection</h3>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security by protecting your files with a password. Only people with the password
                  will be able to access the files, even if they have the download link.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full mt-1">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Secure Storage</h3>
                <p className="text-sm text-muted-foreground">
                  All files are stored with AES-256 encryption at rest. Our servers are protected by multiple security
                  layers and regular security audits to ensure your data remains safe.
                </p>
              </div>
            </div>
          </div>

          {/* Encryption visualization */}
          <div className="rounded-lg border p-4 bg-muted/30">
            <h3 className="font-medium mb-3">How Encryption Works</h3>

            <div className="relative h-20 mb-4">
              {/* Binary data visualization */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-xs font-mono"
                    initial={{
                      left: `${i * 5}%`,
                      top: `${Math.random() * 100}%`,
                      opacity: 0.3 + Math.random() * 0.7,
                      scale: 0.8 + Math.random() * 0.4,
                    }}
                    animate={{
                      opacity: [0.3, 0.7, 0.3],
                      color: ["#000", "#3b82f6", "#000"],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 3,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                    }}
                  >
                    {Math.random() > 0.5 ? "1" : "0"}
                  </motion.div>
                ))}
              </div>
            </div>

            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Your file is split into encrypted chunks</li>
              <li>Each chunk is encrypted with a unique key</li>
              <li>The encrypted chunks are transmitted securely</li>
              <li>The recipient's device reassembles and decrypts the file</li>
            </ol>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
