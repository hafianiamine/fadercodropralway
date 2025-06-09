import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Please log in to view your dashboard" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Check if it's admin session
    if (sessionToken === "admin_session") {
      const userEmail = "admin@faderco.com"

      // Get admin transfers using sender_email
      const { data: transfers, error: transfersError } = await supabase
        .from("transfers")
        .select(`
          *,
          files (*),
          download_logs (
            id,
            ip_address,
            downloaded_at,
            user_agent
          )
        `)
        .eq("sender_email", userEmail)
        .order("created_at", { ascending: false })

      if (transfersError) {
        console.error("Error fetching transfers:", transfersError)
        return NextResponse.json({ error: "Failed to fetch transfers" }, { status: 500 })
      }

      // Process files for admin with download logs
      const allFiles = []
      transfers?.forEach((transfer) => {
        const downloadLogs = transfer.download_logs || []
        transfer.files?.forEach((file) => {
          allFiles.push({
            ...file,
            transfer_share_link: transfer.share_link,
            transfer_created_at: transfer.created_at,
            transfer_expires_at: transfer.expires_at,
            download_count: downloadLogs.length,
            is_active: transfer.is_active,
            download_logs: downloadLogs,
          })
        })
      })

      const stats = {
        totalTransfers: transfers?.length || 0,
        totalFiles: allFiles.length,
        totalDownloads: transfers?.reduce((acc, t) => acc + (t.download_logs?.length || 0), 0) || 0,
        activeTransfers: transfers?.filter((t) => t.is_active).length || 0,
        totalSize: allFiles.reduce((acc, file) => acc + (file.file_size || 0), 0),
      }

      return NextResponse.json({
        user: {
          id: "admin",
          email: "admin@faderco.com",
          username: "Admin User",
        },
        transfers: transfers || [],
        files: allFiles,
        recentDownloads: [],
        stats,
      })
    }

    // For regular users, check the session in the database
    if (sessionToken.startsWith("user_session_")) {
      const userId = sessionToken.replace("user_session_", "")

      // Get user from database
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .eq("session_token", sessionToken)
        .single()

      if (userError || !user) {
        console.error("User lookup error:", userError)
        return NextResponse.json({ error: "Invalid session" }, { status: 401 })
      }

      const userEmail = user.email
      console.log("Fetching data for user email:", userEmail)

      // Get user transfers using sender_email with download logs
      const { data: transfers, error: transfersError } = await supabase
        .from("transfers")
        .select(`
          *,
          files (*),
          download_logs (
            id,
            ip_address,
            downloaded_at,
            user_agent
          )
        `)
        .eq("sender_email", userEmail)
        .order("created_at", { ascending: false })

      if (transfersError) {
        console.error("Error fetching transfers:", transfersError)
        return NextResponse.json({ error: "Failed to fetch transfers" }, { status: 500 })
      }

      console.log(`Found ${transfers?.length || 0} transfers for user ${userEmail}`)

      // Process files to include all required information with download logs
      const allFiles = []
      transfers?.forEach((transfer) => {
        const downloadLogs = transfer.download_logs || []

        transfer.files?.forEach((file) => {
          allFiles.push({
            ...file,
            transfer_share_link: transfer.share_link,
            transfer_created_at: transfer.created_at,
            transfer_expires_at: transfer.expires_at,
            download_count: downloadLogs.length,
            is_active: transfer.is_active,
            download_logs: downloadLogs,
          })
        })
      })

      // Calculate detailed stats
      const totalTransfers = transfers?.length || 0
      const totalFiles = allFiles.length
      const totalDownloads = transfers?.reduce((acc, t) => acc + (t.download_logs?.length || 0), 0) || 0
      const activeTransfers = transfers?.filter((t) => t.is_active).length || 0
      const totalSize = allFiles.reduce((acc, file) => acc + (file.file_size || 0), 0)

      // Get recent downloads across all user transfers
      const { data: recentDownloads } = await supabase
        .from("download_logs")
        .select(`
          *,
          transfers (
            share_link,
            created_at
          )
        `)
        .in("transfer_id", transfers?.map((t) => t.id) || [])
        .order("downloaded_at", { ascending: false })
        .limit(10)

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.name,
        },
        transfers: transfers || [],
        files: allFiles,
        recentDownloads: recentDownloads || [],
        stats: {
          totalTransfers,
          totalFiles,
          totalDownloads,
          activeTransfers,
          totalSize,
        },
      })
    }

    return NextResponse.json({ error: "Invalid session format" }, { status: 401 })
  } catch (error) {
    console.error("Dashboard fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
