"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Download,
  Activity,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  QrCode,
  Calendar,
  Globe,
  HardDrive,
  Users,
  Search,
  SortAsc,
  SortDesc,
  Filter,
  ExternalLink,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react"
import { QRCodeDialog } from "@/components/qr-code-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible"

interface UserDashboardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface DownloadLog {
  id: string
  ip_address: string
  downloaded_at: string
  user_agent: string
}

interface File {
  id: string
  transfer_id: string
  filename: string
  original_filename: string
  file_size: number
  file_type: string
  storage_type: string
  created_at: string
  transfer_share_link: string
  transfer_created_at: string
  transfer_expires_at: string
  download_count: number
  is_active: boolean
  download_logs?: DownloadLog[]
}

interface Transfer {
  id: string
  share_link: string
  created_at: string
  expires_at: string
  download_count: number
  is_active: boolean
  password: string | null
  files: Array<{
    filename: string
    original_filename: string
    file_size: number
    storage_type: string
  }>
  download_logs: Array<{
    id: string
    ip_address: string
    downloaded_at: string
    user_agent: string
  }>
}

interface RecentDownload {
  id: string
  ip_address: string
  downloaded_at: string
  user_agent: string
  transfers: {
    share_link: string
    created_at: string
  }
}

interface Stats {
  totalTransfers: number
  totalFiles: number
  totalDownloads: number
  activeTransfers: number
  totalSize: number
}

interface User {
  id: string
  email: string
  username: string
}

export function UserDashboard({ open, onOpenChange }: UserDashboardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<Stats>({
    totalTransfers: 0,
    totalFiles: 0,
    totalDownloads: 0,
    activeTransfers: 0,
    totalSize: 0,
  })
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [filteredFiles, setFilteredFiles] = useState<File[]>([])
  const [recentDownloads, setRecentDownloads] = useState<RecentDownload[]>([])
  const [loading, setLoading] = useState(true)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [selectedShareLink, setSelectedShareLink] = useState("")
  const [passwordInputs, setPasswordInputs] = useState<{ [key: string]: string }>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "transfer_created_at",
    direction: "desc",
  })
  const [expandedFiles, setExpandedFiles] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open])

  useEffect(() => {
    // Apply filtering and sorting to files
    let result = [...files]

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      result = result.filter(
        (file) =>
          file.original_filename.toLowerCase().includes(lowerSearchTerm) ||
          file.file_type.toLowerCase().includes(lowerSearchTerm),
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof File]
      const bValue = b[sortConfig.key as keyof File]

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue
      } else {
        return 0
      }
    })

    setFilteredFiles(result)
  }, [files, searchTerm, sortConfig])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/user/dashboard")
      if (response.ok) {
        const data = await response.json()
        setUser(data.user || null)
        setTransfers(data.transfers || [])
        setFiles(data.files || [])
        setFilteredFiles(data.files || [])
        setRecentDownloads(data.recentDownloads || [])
        setStats(
          data.stats || {
            totalTransfers: 0,
            totalFiles: 0,
            totalDownloads: 0,
            activeTransfers: 0,
            totalSize: 0,
          },
        )
      } else {
        console.error("Failed to fetch user data:", response.statusText)
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTransfer = async (transferId: string) => {
    try {
      const response = await fetch(`/api/user/transfers/${transferId}/toggle`, {
        method: "POST",
      })

      if (response.ok) {
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error("Failed to toggle transfer:", error)
    }
  }

  const updatePassword = async (transferId: string) => {
    try {
      const password = passwordInputs[transferId] || ""
      const response = await fetch(`/api/user/transfers/${transferId}/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: password.trim() || null }),
      })

      if (response.ok) {
        fetchData() // Refresh data
        setPasswordInputs({ ...passwordInputs, [transferId]: "" })
      }
    } catch (error) {
      console.error("Failed to update password:", error)
    }
  }

  const copyShareLink = (shareLink: string) => {
    const fullUrl = `${window.location.origin}/download/${shareLink}`
    navigator.clipboard.writeText(fullUrl)
  }

  const openQRCode = (shareLink: string) => {
    setSelectedShareLink(shareLink)
    setQrDialogOpen(true)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStorageIcon = (storageType: string) => {
    switch (storageType) {
      case "r2":
        return <Globe className="h-3 w-3" />
      case "supabase":
        return <HardDrive className="h-3 w-3" />
      default:
        return <FileText className="h-3 w-3" />
    }
  }

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <img src="/placeholder.svg?height=16&width=16" alt="Image" className="h-4 w-4" />
    } else if (fileType.startsWith("video/")) {
      return <img src="/placeholder.svg?height=16&width=16" alt="Video" className="h-4 w-4" />
    } else if (fileType.startsWith("audio/")) {
      return <img src="/placeholder.svg?height=16&width=16" alt="Audio" className="h-4 w-4" />
    } else if (fileType.includes("pdf")) {
      return <img src="/placeholder.svg?height=16&width=16" alt="PDF" className="h-4 w-4" />
    } else if (fileType.includes("word") || fileType.includes("document")) {
      return <img src="/placeholder.svg?height=16&width=16" alt="Document" className="h-4 w-4" />
    } else if (fileType.includes("excel") || fileType.includes("spreadsheet")) {
      return <img src="/placeholder.svg?height=16&width=16" alt="Spreadsheet" className="h-4 w-4" />
    } else if (fileType.includes("zip") || fileType.includes("compressed")) {
      return <img src="/placeholder.svg?height=16&width=16" alt="Archive" className="h-4 w-4" />
    } else {
      return <FileText className="h-4 w-4" />
    }
  }

  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase()
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      return <Smartphone className="h-3 w-3" />
    } else if (ua.includes("tablet") || ua.includes("ipad")) {
      return <Tablet className="h-3 w-3" />
    } else {
      return <Monitor className="h-3 w-3" />
    }
  }

  const getDeviceType = (userAgent: string) => {
    const ua = userAgent.toLowerCase()
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      return "Mobile"
    } else if (ua.includes("tablet") || ua.includes("ipad")) {
      return "Tablet"
    } else {
      return "Desktop"
    }
  }

  const getBrowserName = (userAgent: string) => {
    const ua = userAgent.toLowerCase()
    if (ua.includes("chrome")) return "Chrome"
    if (ua.includes("firefox")) return "Firefox"
    if (ua.includes("safari")) return "Safari"
    if (ua.includes("edge")) return "Edge"
    if (ua.includes("opera")) return "Opera"
    return "Unknown"
  }

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date()
  }

  const daysUntilExpiry = (expiryDate: string) => {
    const now = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }))
  }

  const toggleFileExpansion = (fileId: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [fileId]: !prev[fileId],
    }))
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              My Dashboard
              {user && <span className="text-sm text-muted-foreground">- {user.email}</span>}
            </DialogTitle>
            <DialogDescription>Manage all your uploaded files and view download analytics</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-8">Loading your dashboard...</div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">My Transfers</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalTransfers}</div>
                      <p className="text-xs text-muted-foreground">Total uploads</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Files Shared</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalFiles}</div>
                      <p className="text-xs text-muted-foreground">Across all transfers</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Downloads</CardTitle>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalDownloads}</div>
                      <p className="text-xs text-muted-foreground">Total downloads</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.activeTransfers}</div>
                      <p className="text-xs text-muted-foreground">Available for download</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
                      <p className="text-xs text-muted-foreground">Total file size</p>
                    </CardContent>
                  </Card>
                </div>

                <Tabs defaultValue="files" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="files">My Files & Downloads</TabsTrigger>
                    <TabsTrigger value="transfers">My Transfers</TabsTrigger>
                    <TabsTrigger value="downloads">Download Activity</TabsTrigger>
                  </TabsList>

                  <TabsContent value="files" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search files..."
                          className="pl-8"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Filter className="h-4 w-4 mr-1" />
                            Filter
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setSearchTerm("")}>All Files</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSearchTerm("image")}>Images</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSearchTerm("video")}>Videos</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSearchTerm("document")}>Documents</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[300px]">
                                <button className="flex items-center" onClick={() => handleSort("original_filename")}>
                                  File Name
                                  {sortConfig.key === "original_filename" &&
                                    (sortConfig.direction === "asc" ? (
                                      <SortAsc className="ml-1 h-3 w-3" />
                                    ) : (
                                      <SortDesc className="ml-1 h-3 w-3" />
                                    ))}
                                </button>
                              </TableHead>
                              <TableHead>
                                <button className="flex items-center" onClick={() => handleSort("file_size")}>
                                  Size
                                  {sortConfig.key === "file_size" &&
                                    (sortConfig.direction === "asc" ? (
                                      <SortAsc className="ml-1 h-3 w-3" />
                                    ) : (
                                      <SortDesc className="ml-1 h-3 w-3" />
                                    ))}
                                </button>
                              </TableHead>
                              <TableHead>
                                <button className="flex items-center" onClick={() => handleSort("transfer_created_at")}>
                                  Upload Date
                                  {sortConfig.key === "transfer_created_at" &&
                                    (sortConfig.direction === "asc" ? (
                                      <SortAsc className="ml-1 h-3 w-3" />
                                    ) : (
                                      <SortDesc className="ml-1 h-3 w-3" />
                                    ))}
                                </button>
                              </TableHead>
                              <TableHead>
                                <button className="flex items-center" onClick={() => handleSort("download_count")}>
                                  Downloads
                                  {sortConfig.key === "download_count" &&
                                    (sortConfig.direction === "asc" ? (
                                      <SortAsc className="ml-1 h-3 w-3" />
                                    ) : (
                                      <SortDesc className="ml-1 h-3 w-3" />
                                    ))}
                                </button>
                              </TableHead>
                              <TableHead>
                                <button className="flex items-center" onClick={() => handleSort("transfer_expires_at")}>
                                  Expiry Date
                                  {sortConfig.key === "transfer_expires_at" &&
                                    (sortConfig.direction === "asc" ? (
                                      <SortAsc className="ml-1 h-3 w-3" />
                                    ) : (
                                      <SortDesc className="ml-1 h-3 w-3" />
                                    ))}
                                </button>
                              </TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredFiles.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                  No files found
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredFiles.map((file) => (
                                <>
                                  <TableRow key={file.id}>
                                    <TableCell className="font-medium">
                                      <div className="flex items-center gap-2">
                                        <Collapsible>
                                          <CollapsibleTrigger
                                            onClick={() => toggleFileExpansion(file.id)}
                                            className="flex items-center gap-1"
                                          >
                                            {expandedFiles[file.id] ? (
                                              <ChevronDown className="h-3 w-3" />
                                            ) : (
                                              <ChevronRight className="h-3 w-3" />
                                            )}
                                          </CollapsibleTrigger>
                                        </Collapsible>
                                        {getFileTypeIcon(file.file_type)}
                                        <span className="truncate max-w-[250px]" title={file.original_filename}>
                                          {file.original_filename}
                                        </span>
                                        {!file.is_active && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger>
                                                <Badge variant="outline" className="ml-1">
                                                  <EyeOff className="h-3 w-3" />
                                                </Badge>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>This transfer is inactive</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>{formatFileSize(file.file_size)}</TableCell>
                                    <TableCell>{formatDate(file.transfer_created_at)}</TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        <Download className="h-3 w-3" />
                                        {file.download_count}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {isExpired(file.transfer_expires_at) ? (
                                        <Badge variant="destructive" className="flex items-center gap-1">
                                          <AlertCircle className="h-3 w-3" />
                                          Expired
                                        </Badge>
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {daysUntilExpiry(file.transfer_expires_at)} days left
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-2">
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => copyShareLink(file.transfer_share_link)}
                                              >
                                                <Copy className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Copy download link</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openQRCode(file.transfer_share_link)}
                                              >
                                                <QrCode className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Show QR code</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                  window.open(`/download/${file.transfer_share_link}`, "_blank")
                                                }
                                              >
                                                <ExternalLink className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Open download page</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => toggleTransfer(file.transfer_id)}
                                              >
                                                {file.is_active ? (
                                                  <EyeOff className="h-4 w-4" />
                                                ) : (
                                                  <Eye className="h-4 w-4" />
                                                )}
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>{file.is_active ? "Deactivate" : "Activate"} transfer</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </div>
                                    </TableCell>
                                  </TableRow>

                                  {/* Download Logs Expansion */}
                                  {expandedFiles[file.id] && (
                                    <TableRow>
                                      <TableCell colSpan={6} className="bg-muted/50 p-4">
                                        <div className="space-y-3">
                                          <h4 className="font-medium flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            Download History ({file.download_count} downloads)
                                          </h4>
                                          {file.download_logs && file.download_logs.length > 0 ? (
                                            <div className="space-y-2">
                                              {file.download_logs.map((log) => (
                                                <div
                                                  key={log.id}
                                                  className="flex items-center justify-between p-3 bg-background rounded-lg border"
                                                >
                                                  <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1">
                                                      {getDeviceIcon(log.user_agent)}
                                                      <span className="text-sm font-medium">
                                                        {getDeviceType(log.user_agent)}
                                                      </span>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                      {getBrowserName(log.user_agent)}
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                      {log.ip_address}
                                                    </Badge>
                                                  </div>
                                                  <div className="text-sm text-muted-foreground">
                                                    {formatDate(log.downloaded_at)}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="text-center py-4 text-muted-foreground">
                                              No downloads yet
                                            </div>
                                          )}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="transfers" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>My Transfers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {transfers.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">No transfers found</div>
                        ) : (
                          <div className="space-y-4">
                            {transfers.map((transfer) => (
                              <div key={transfer.id} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <div className="font-medium">Transfer {transfer.share_link.slice(-8)}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {transfer.files?.length || 0} files • {transfer.download_logs?.length || 0}{" "}
                                      downloads
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                      <Calendar className="h-3 w-3" />
                                      Created: {formatDate(transfer.created_at)}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={transfer.is_active ? "default" : "secondary"}>
                                      {transfer.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                    {transfer.password && (
                                      <Badge variant="outline" className="text-xs">
                                        <Lock className="h-3 w-3 mr-1" />
                                        Protected
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {/* Files List */}
                                <div className="space-y-1">
                                  <div className="text-sm font-medium">Files:</div>
                                  {transfer.files?.map((file, index) => (
                                    <div
                                      key={index}
                                      className="text-xs text-muted-foreground flex justify-between items-center"
                                    >
                                      <span className="flex items-center gap-1">
                                        {getStorageIcon(file.storage_type)}
                                        {file.original_filename}
                                      </span>
                                      <span>{formatFileSize(file.file_size)}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* Download History */}
                                {transfer.download_logs && transfer.download_logs.length > 0 && (
                                  <div className="space-y-1">
                                    <div className="text-sm font-medium">Recent Downloads:</div>
                                    {transfer.download_logs.slice(0, 3).map((log, index) => (
                                      <div key={index} className="text-xs text-muted-foreground">
                                        {log.ip_address} • {formatDate(log.downloaded_at)}
                                      </div>
                                    ))}
                                    {transfer.download_logs.length > 3 && (
                                      <div className="text-xs text-muted-foreground">
                                        +{transfer.download_logs.length - 3} more downloads
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="flex flex-wrap gap-2">
                                  <Button variant="outline" size="sm" onClick={() => toggleTransfer(transfer.id)}>
                                    {transfer.is_active ? (
                                      <EyeOff className="h-4 w-4 mr-1" />
                                    ) : (
                                      <Eye className="h-4 w-4 mr-1" />
                                    )}
                                    {transfer.is_active ? "Deactivate" : "Activate"}
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyShareLink(transfer.share_link)}
                                  >
                                    <Copy className="h-4 w-4 mr-1" />
                                    Copy Link
                                  </Button>

                                  <Button variant="outline" size="sm" onClick={() => openQRCode(transfer.share_link)}>
                                    <QrCode className="h-4 w-4 mr-1" />
                                    QR Code
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(`/download/${transfer.share_link}`, "_blank")}
                                  >
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    Open
                                  </Button>
                                </div>

                                {/* Password Management */}
                                <div className="flex gap-2 items-center">
                                  <Input
                                    placeholder={transfer.password ? "Update password" : "Set password (optional)"}
                                    value={passwordInputs[transfer.id] || ""}
                                    onChange={(e) =>
                                      setPasswordInputs({ ...passwordInputs, [transfer.id]: e.target.value })
                                    }
                                    className="flex-1"
                                    type="password"
                                  />
                                  <Button variant="outline" size="sm" onClick={() => updatePassword(transfer.id)}>
                                    {transfer.password ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="downloads" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Recent Download Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {recentDownloads.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">No download activity yet</div>
                        ) : (
                          <div className="space-y-3">
                            {recentDownloads.map((download) => (
                              <div key={download.id} className="border rounded-lg p-3">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-1">
                                    <div className="font-medium">
                                      Transfer {download.transfers.share_link.slice(-8)}
                                    </div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                      {getDeviceIcon(download.user_agent)}
                                      {getDeviceType(download.user_agent)} • {getBrowserName(download.user_agent)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Downloaded from: {download.ip_address}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatDate(download.downloaded_at)}
                                    </div>
                                  </div>
                                  <Badge variant="outline">
                                    <Download className="h-3 w-3 mr-1" />
                                    Downloaded
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <QRCodeDialog open={qrDialogOpen} onOpenChange={setQrDialogOpen} shareLink={selectedShareLink} />
    </>
  )
}
