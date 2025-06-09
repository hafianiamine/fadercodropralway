"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  FileText,
  Download,
  Activity,
  Trash2,
  UserPlus,
  Settings,
  HardDrive,
  Database,
  Mail,
  Youtube,
  Save,
  Laptop,
  Tablet,
  Smartphone,
  ComputerIcon as Desktop,
  BugIcon as QuestionMark,
  Chrome,
  ChromeIcon as Firefox,
  AppleIcon as Safari,
  ComputerIcon as InternetExplorer,
} from "lucide-react"

interface AdminDashboardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Transfer {
  id: string
  share_link: string
  created_at: string
  download_count: number
  is_active: boolean
  files: Array<{
    filename: string
    file_size: number
    storage_type: string
  }>
  sender_email: string
  download_logs: DownloadLog[]
}

interface User {
  id: string
  name: string
  email: string
  phone: string
  company: string
  position: string
  created_at: string
  transfers_count: number
  is_verified: boolean
}

interface Stats {
  totalTransfers: number
  totalFiles: number
  totalDownloads: number
  activeTransfers: number
  r2Files: number
  supabaseFiles: number
  databaseFiles: number
  totalR2Storage: number
  totalSupabaseStorage: number
  totalDatabaseStorage: number
}

interface SMTPSettings {
  smtp_host: string
  smtp_port: number
  smtp_user: string
  smtp_password: string
  smtp_from: string
  smtp_secure: boolean
}

interface VideoSettings {
  video_url: string
  video_title: string
}

interface DownloadLog {
  id: string
  transfer_id: string
  ip_address: string
  timestamp: string
  device_type: string
  device: string
  browser: string
}

export function AdminDashboard({ open, onOpenChange }: AdminDashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalTransfers: 0,
    totalFiles: 0,
    totalDownloads: 0,
    activeTransfers: 0,
    r2Files: 0,
    supabaseFiles: 0,
    databaseFiles: 0,
    totalR2Storage: 0,
    totalSupabaseStorage: 0,
    totalDatabaseStorage: 0,
  })
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [newUserPhone, setNewUserPhone] = useState("")
  const [newUserCompany, setNewUserCompany] = useState("")
  const [newUserPosition, setNewUserPosition] = useState("")
  const [smtpSettings, setSMTPSettings] = useState<SMTPSettings>({
    smtp_host: "mail.faderco.dz",
    smtp_port: 587,
    smtp_user: "fadercodrop@faderco.dz",
    smtp_password: "",
    smtp_from: "fadercodrop@faderco.dz",
    smtp_secure: false,
  })
  const [videoSettings, setVideoSettings] = useState<VideoSettings>({
    video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    video_title: "How to use Faderco Drop",
  })
  const [testEmail, setTestEmail] = useState("")
  const [smtpLoading, setSMTPLoading] = useState(false)
  const [videoLoading, setVideoLoading] = useState(false)
  const [testStatus, setTestStatus] = useState<{ message: string; success: boolean } | null>(null)
  const [videoStatus, setVideoStatus] = useState<{ message: string; success: boolean } | null>(null)
  const [expandedTransferId, setExpandedTransferId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open])

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log("Fetching admin data...")

      // Fetch transfers
      const transfersResponse = await fetch("/api/admin/transfers")
      console.log("Transfers response status:", transfersResponse.status)

      if (transfersResponse.ok) {
        const transfersData = await transfersResponse.json()
        console.log("Transfers data:", transfersData)
        setTransfers(transfersData.transfers || [])

        // Calculate enhanced stats from transfers
        const totalTransfers = transfersData.transfers?.length || 0
        const totalDownloads =
          transfersData.transfers?.reduce((acc: number, t: Transfer) => acc + t.download_count, 0) || 0
        const activeTransfers = transfersData.transfers?.filter((t: Transfer) => t.is_active).length || 0

        // Calculate storage stats by type
        let totalFiles = 0
        let r2Files = 0
        let supabaseFiles = 0
        let databaseFiles = 0
        let totalR2Storage = 0
        let totalSupabaseStorage = 0
        let totalDatabaseStorage = 0

        transfersData.transfers?.forEach((transfer: Transfer) => {
          transfer.files?.forEach((file) => {
            totalFiles++
            const fileSize = file.file_size || 0

            switch (file.storage_type) {
              case "r2":
                r2Files++
                totalR2Storage += fileSize
                break
              case "supabase":
                supabaseFiles++
                totalSupabaseStorage += fileSize
                break
              case "database":
                databaseFiles++
                totalDatabaseStorage += fileSize
                break
              default:
                // Handle legacy files without storage_type
                databaseFiles++
                totalDatabaseStorage += fileSize
            }
          })
        })

        const calculatedStats = {
          totalTransfers,
          totalFiles,
          totalDownloads,
          activeTransfers,
          r2Files,
          supabaseFiles,
          databaseFiles,
          totalR2Storage,
          totalSupabaseStorage,
          totalDatabaseStorage,
        }

        console.log("Calculated stats:", calculatedStats)
        setStats(calculatedStats)
      } else {
        console.error("Failed to fetch transfers:", transfersResponse.status)
      }

      // Fetch users
      const usersResponse = await fetch("/api/admin/users")
      console.log("Users response status:", usersResponse.status)

      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        console.log("Users data:", usersData)
        setUsers(usersData.users || [])
      } else {
        console.error("Failed to fetch users:", usersResponse.status)
      }

      await fetchSMTPSettings()
      await fetchVideoSettings()
    } catch (error) {
      console.error("Failed to fetch admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const deactivateTransfer = async (transferId: string) => {
    try {
      const response = await fetch(`/api/admin/transfers/${transferId}/deactivate`, {
        method: "POST",
      })

      if (response.ok) {
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error("Failed to deactivate transfer:", error)
    }
  }

  const addUser = async () => {
    if (newUserName && newUserEmail && newUserPassword && newUserPhone && newUserCompany && newUserPosition) {
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newUserName,
            email: newUserEmail,
            password: newUserPassword,
            phone: newUserPhone,
            company: newUserCompany,
            position: newUserPosition,
          }),
        })

        if (response.ok) {
          // Clear form
          setNewUserName("")
          setNewUserEmail("")
          setNewUserPassword("")
          setNewUserPhone("")
          setNewUserCompany("")
          setNewUserPosition("")
          // Refresh data
          fetchData()
        }
      } catch (error) {
        console.error("Failed to create user:", error)
      }
    }
  }

  const removeUser = (userId: string) => {
    setUsers(users.filter((user) => user.id !== userId))
  }

  const verifyUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/verify`, {
        method: "POST",
      })

      if (response.ok) {
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error("Failed to verify user:", error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const fetchSMTPSettings = async () => {
    try {
      const response = await fetch("/api/admin/smtp")
      if (response.ok) {
        const data = await response.json()
        setSMTPSettings(data.settings)
      }
    } catch (error) {
      console.error("Failed to fetch SMTP settings:", error)
    }
  }

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

  const updateSMTPSettings = async () => {
    try {
      setSMTPLoading(true)
      setTestStatus(null)
      const response = await fetch("/api/admin/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtpSettings),
      })

      if (response.ok) {
        setTestStatus({
          message: "SMTP settings updated successfully!",
          success: true,
        })
      }
    } catch (error) {
      console.error("Failed to update SMTP settings:", error)
      setTestStatus({
        message: "Failed to update SMTP settings",
        success: false,
      })
    } finally {
      setSMTPLoading(false)
    }
  }

  const updateVideoSettings = async () => {
    try {
      setVideoLoading(true)
      setVideoStatus(null)
      const response = await fetch("/api/admin/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(videoSettings),
      })

      if (response.ok) {
        setVideoStatus({
          message: "Video settings updated successfully!",
          success: true,
        })
      }
    } catch (error) {
      console.error("Failed to update video settings:", error)
      setVideoStatus({
        message: "Failed to update video settings",
        success: false,
      })
    } finally {
      setVideoLoading(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) {
      setTestStatus({
        message: "Please enter a test email address",
        success: false,
      })
      return
    }

    try {
      setSMTPLoading(true)
      setTestStatus(null)
      const response = await fetch("/api/admin/smtp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail, useDatabase: true }),
      })

      const data = await response.json()
      if (data.success) {
        setTestStatus({
          message: `Test email sent successfully! Check ${testEmail}`,
          success: true,
        })
      } else {
        setTestStatus({
          message: `Test failed: ${data.error}`,
          success: false,
        })
      }
    } catch (error) {
      console.error("SMTP test failed:", error)
      setTestStatus({
        message: "SMTP test failed",
        success: false,
      })
    } finally {
      setSMTPLoading(false)
    }
  }

  // Extract YouTube video ID from URL
  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  // Validate YouTube URL
  const isValidYoutubeUrl = (url: string) => {
    return url.includes("youtube.com") || url.includes("youtu.be")
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "desktop":
        return <Desktop className="h-4 w-4" />
      case "laptop":
        return <Laptop className="h-4 w-4" />
      case "tablet":
        return <Tablet className="h-4 w-4" />
      case "mobile":
        return <Smartphone className="h-4 w-4" />
      default:
        return <QuestionMark className="h-4 w-4" />
    }
  }

  const getDeviceType = (userAgent: string) => {
    if (/Mobile|Android|iP(hone|od|ad)/i.test(userAgent)) {
      return "mobile"
    } else if (/Tablet|iPad/i.test(userAgent)) {
      return "tablet"
    } else if (/Laptop/i.test(userAgent)) {
      return "laptop"
    } else if (/Desktop/i.test(userAgent)) {
      return "desktop"
    }
    return "unknown"
  }

  const getBrowserName = (userAgent: string) => {
    if (/Chrome/i.test(userAgent)) {
      return <Chrome className="h-4 w-4" />
    } else if (/Firefox/i.test(userAgent)) {
      return <Firefox className="h-4 w-4" />
    } else if (/Safari/i.test(userAgent)) {
      return <Safari className="h-4 w-4" />
    } else if (/Internet Explorer/i.test(userAgent) || /MSIE/i.test(userAgent)) {
      return <InternetExplorer className="h-4 w-4" />
    } else {
      return <QuestionMark className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Admin Dashboard
          </DialogTitle>
          <DialogDescription>Manage transfers, users, and system settings</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enhanced Stats Cards with Storage Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTransfers}</div>
                <p className="text-xs text-muted-foreground">Live database count</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Files</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalFiles}</div>
                <p className="text-xs text-muted-foreground">Across all transfers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDownloads}</div>
                <p className="text-xs text-muted-foreground">Real download count</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Transfers</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeTransfers}</div>
                <p className="text-xs text-muted-foreground">Currently available</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">R2 Files</CardTitle>
                <HardDrive className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.r2Files}</div>
                <p className="text-xs text-muted-foreground">Stored in R2</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                <Database className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatFileSize(stats.totalR2Storage)}</div>
                <p className="text-xs text-muted-foreground">Total R2 storage</p>
              </CardContent>
            </Card>
          </div>

          {/* Storage Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Storage Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-blue-800">R2 Storage</p>
                    <p className="text-xs text-blue-600">{stats.r2Files} files</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-800">{formatFileSize(stats.totalR2Storage)}</p>
                    <p className="text-xs text-blue-600">Cloudflare R2</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-green-800">Supabase Storage</p>
                    <p className="text-xs text-green-600">{stats.supabaseFiles} files</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-800">{formatFileSize(stats.totalSupabaseStorage)}</p>
                    <p className="text-xs text-green-600">Legacy files</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-amber-800">Database Storage</p>
                    <p className="text-xs text-amber-600">{stats.databaseFiles} files</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-800">{formatFileSize(stats.totalDatabaseStorage)}</p>
                    <p className="text-xs text-amber-600">Base64 encoded</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Transfers and Users */}
          <Tabs defaultValue="transfers" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="transfers">Transfers</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="smtp">Email Settings</TabsTrigger>
              <TabsTrigger value="video">Video Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="transfers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transfers</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : transfers.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">No transfers found</div>
                  ) : (
                    <div className="space-y-4">
                      {transfers.map((transfer) => (
                        <div key={transfer.id} className="space-y-4 border rounded-lg">
                          <div className="flex items-center justify-between p-4">
                            <div className="space-y-1">
                              <div className="font-medium">Transfer {transfer.share_link.slice(-8)}</div>
                              <div className="text-sm text-muted-foreground">
                                {transfer.files?.length || 0} files • {transfer.download_count} downloads
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Created: {new Date(transfer.created_at).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-muted-foreground">Sender: {transfer.sender_email}</div>
                              {/* Show storage types */}
                              <div className="flex gap-1">
                                {transfer.files?.map((file, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className={`text-xs ${
                                      file.storage_type === "r2"
                                        ? "border-blue-200 text-blue-700"
                                        : file.storage_type === "supabase"
                                          ? "border-green-200 text-green-700"
                                          : "border-amber-200 text-amber-700"
                                    }`}
                                  >
                                    {file.storage_type || "db"}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={transfer.is_active ? "default" : "secondary"}>
                                {transfer.is_active ? "Active" : "Inactive"}
                              </Badge>
                              {transfer.is_active && (
                                <Button variant="outline" size="sm" onClick={() => deactivateTransfer(transfer.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {/* Download Logs */}
                          <div className="border-t">
                            <Button
                              variant="ghost"
                              className="w-full justify-start rounded-none p-4"
                              onClick={() =>
                                setExpandedTransferId(expandedTransferId === transfer.id ? null : transfer.id)
                              }
                            >
                              Download Logs ({transfer.download_logs?.length || 0})
                            </Button>
                            {expandedTransferId === transfer.id && (
                              <div className="p-4">
                                {transfer.download_logs && transfer.download_logs.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gray-50">
                                        <tr>
                                          <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                          >
                                            IP Address
                                          </th>
                                          <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                          >
                                            Timestamp
                                          </th>
                                          <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                          >
                                            Device
                                          </th>
                                          <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                          >
                                            Browser
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200">
                                        {transfer.download_logs.map((log) => (
                                          <tr key={log.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                              {log.ip_address}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                              {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center gap-2">
                                              {getDeviceIcon(log.device_type)}
                                              {log.device}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center gap-2">
                                              {getBrowserName(log.browser)}
                                              {log.browser}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-muted-foreground">No download logs found</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Users Management
                    <div className="flex gap-2 flex-wrap">
                      <Input
                        placeholder="Name"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        className="w-32"
                      />
                      <Input
                        placeholder="Email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="w-40"
                      />
                      <Input
                        type="password"
                        placeholder="Password"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        className="w-32"
                      />
                      <Input
                        placeholder="Phone"
                        value={newUserPhone}
                        onChange={(e) => setNewUserPhone(e.target.value)}
                        className="w-32"
                      />
                      <Input
                        placeholder="Company"
                        value={newUserCompany}
                        onChange={(e) => setNewUserCompany(e.target.value)}
                        className="w-32"
                      />
                      <Input
                        placeholder="Position"
                        value={newUserPosition}
                        onChange={(e) => setNewUserPosition(e.target.value)}
                        className="w-32"
                      />
                      <Button onClick={addUser} size="sm">
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1 flex-1">
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          <div className="text-sm text-muted-foreground">
                            📞 {user.phone} • 🏢 {user.company} • 💼 {user.position}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={user.is_verified ? "default" : "destructive"}>
                            {user.is_verified ? "Verified" : "Pending"}
                          </Badge>
                          {!user.is_verified && (
                            <Button variant="outline" size="sm" onClick={() => verifyUser(user.id)}>
                              Approve
                            </Button>
                          )}
                          {user.email !== "admin@faderco.com" && (
                            <Button variant="outline" size="sm" onClick={() => removeUser(user.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="smtp" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    SMTP Email Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">SMTP Host</label>
                      <Input
                        value={smtpSettings.smtp_host}
                        onChange={(e) => setSMTPSettings({ ...smtpSettings, smtp_host: e.target.value })}
                        placeholder="mail.faderco.dz"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">SMTP Port</label>
                      <Input
                        type="number"
                        value={smtpSettings.smtp_port}
                        onChange={(e) =>
                          setSMTPSettings({ ...smtpSettings, smtp_port: Number.parseInt(e.target.value) })
                        }
                        placeholder="587"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">SMTP User</label>
                      <Input
                        value={smtpSettings.smtp_user}
                        onChange={(e) => setSMTPSettings({ ...smtpSettings, smtp_user: e.target.value })}
                        placeholder="fadercodrop@faderco.dz"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">SMTP Password</label>
                      <Input
                        type="password"
                        value={smtpSettings.smtp_password}
                        onChange={(e) => setSMTPSettings({ ...smtpSettings, smtp_password: e.target.value })}
                        placeholder="your-app-password"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">From Email</label>
                      <Input
                        value={smtpSettings.smtp_from}
                        onChange={(e) => setSMTPSettings({ ...smtpSettings, smtp_from: e.target.value })}
                        placeholder="fadercodrop@faderco.dz"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={smtpSettings.smtp_secure}
                        onChange={(e) => setSMTPSettings({ ...smtpSettings, smtp_secure: e.target.checked })}
                      />
                      <label className="text-sm font-medium">Use SSL/TLS</label>
                    </div>
                  </div>

                  {/* Simplified email testing interface */}
                  <div className="flex flex-col gap-4 pt-4">
                    <div className="flex gap-4">
                      <Button onClick={updateSMTPSettings} disabled={smtpLoading} className="w-1/3">
                        <Settings className="h-4 w-4 mr-2" />
                        {smtpLoading ? "Saving..." : "Save Settings"}
                      </Button>

                      <div className="flex gap-2 w-2/3">
                        <Input
                          placeholder="test@example.com"
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="secondary"
                          onClick={sendTestEmail}
                          disabled={smtpLoading}
                          className="whitespace-nowrap"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Send Test Mail
                        </Button>
                      </div>
                    </div>

                    {/* Status message */}
                    {testStatus && (
                      <div
                        className={`p-3 rounded-md ${testStatus.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
                      >
                        {testStatus.message}
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">📧 Email Configuration Notes:</h4>
                    <ul className="space-y-1">
                      <li>
                        • Current SMTP server: <span className="font-semibold">mail.faderco.dz</span>
                      </li>
                      <li>• Port 587 for STARTTLS, Port 465 for SSL/TLS</li>
                      <li>
                        • All emails are sent from <span className="font-semibold">fadercodrop@faderco.dz</span>
                      </li>
                      <li>• Settings are stored securely in the database</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="video" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Youtube className="h-5 w-5" />
                    Tutorial Video Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-sm font-medium">YouTube Video URL</label>
                      <Input
                        value={videoSettings.video_url}
                        onChange={(e) => setVideoSettings({ ...videoSettings, video_url: e.target.value })}
                        placeholder="https://www.youtube.com/embed/VIDEO_ID"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter a YouTube video URL or embed URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Video Title</label>
                      <Input
                        value={videoSettings.video_title}
                        onChange={(e) => setVideoSettings({ ...videoSettings, video_title: e.target.value })}
                        placeholder="How to use Faderco Drop"
                      />
                    </div>
                  </div>

                  {/* Video preview */}
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Video Preview</h3>
                    <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
                      <iframe
                        width="100%"
                        height="100%"
                        src={
                          isValidYoutubeUrl(videoSettings.video_url)
                            ? videoSettings.video_url.includes("embed")
                              ? videoSettings.video_url
                              : `https://www.youtube.com/embed/${getYoutubeVideoId(videoSettings.video_url)}`
                            : "https://www.youtube.com/embed/dQw4w9WgXcQ"
                        }
                        title={videoSettings.video_title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      ></iframe>
                    </div>
                  </div>

                  {/* Save button */}
                  <div className="flex flex-col gap-4 pt-4">
                    <Button onClick={updateVideoSettings} disabled={videoLoading} className="w-1/3">
                      <Save className="h-4 w-4 mr-2" />
                      {videoLoading ? "Saving..." : "Save Video Settings"}
                    </Button>

                    {/* Status message */}
                    {videoStatus && (
                      <div
                        className={`p-3 rounded-md ${videoStatus.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
                      >
                        {videoStatus.message}
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">🎬 Video Configuration Notes:</h4>
                    <ul className="space-y-1">
                      <li>• This video appears in the "How to Use" dialog</li>
                      <li>• You can use any YouTube video URL format</li>
                      <li>• Changes will be visible immediately to all users</li>
                      <li>• Recommended: Use a tutorial video that explains how to use Faderco Drop</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
