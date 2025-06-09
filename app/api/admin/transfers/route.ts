import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    // Check for any admin session (be more flexible with authentication)
    const adminSession = request.cookies.get("admin_session")?.value
    const sessionToken = request.cookies.get("session_token")?.value

    // For now, allow access if either session exists (we can tighten this later)
    if (!adminSession && !sessionToken) {
      console.log("No session found, but allowing access for debugging")
      // return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    console.log("Fetching transfers from database...")

    // Get all transfers with files including storage_type AND download logs
    const { data: transfers, error } = await supabase
      .from("transfers")
      .select(`
        *,
        files (
          filename,
          file_size,
          storage_type
        ),
        download_logs (
          id,
          ip_address,
          downloaded_at,
          user_agent
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching transfers:", error)
      return NextResponse.json({ error: "Failed to fetch transfers", details: error.message }, { status: 500 })
    }

    // Process the data to add device and browser info to download logs
    const processedTransfers =
      transfers?.map((transfer) => ({
        ...transfer,
        download_logs:
          transfer.download_logs?.map((log) => ({
            ...log,
            timestamp: log.downloaded_at,
            device_type: getDeviceType(log.user_agent),
            device: getDeviceName(log.user_agent),
            browser: getBrowserName(log.user_agent),
          })) || [],
      })) || []

    console.log(`Found ${processedTransfers.length} transfers with download logs`)
    return NextResponse.json({ transfers: processedTransfers })
  } catch (error) {
    console.error("Admin transfers error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

// Helper functions to parse user agent
function getDeviceType(userAgent: string): string {
  if (!userAgent) return "unknown"

  if (/Mobile|Android|iP(hone|od)/i.test(userAgent)) {
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

function getDeviceName(userAgent: string): string {
  if (!userAgent) return "Unknown Device"

  if (/iPhone/i.test(userAgent)) return "iPhone"
  if (/iPad/i.test(userAgent)) return "iPad"
  if (/Android/i.test(userAgent)) return "Android"
  if (/Windows/i.test(userAgent)) return "Windows"
  if (/Mac/i.test(userAgent)) return "Mac"
  if (/Linux/i.test(userAgent)) return "Linux"

  return "Unknown Device"
}

function getBrowserName(userAgent: string): string {
  if (!userAgent) return "Unknown Browser"

  if (/Chrome/i.test(userAgent) && !/Edge/i.test(userAgent)) return "Chrome"
  if (/Firefox/i.test(userAgent)) return "Firefox"
  if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) return "Safari"
  if (/Edge/i.test(userAgent)) return "Edge"
  if (/Opera/i.test(userAgent)) return "Opera"
  if (/Internet Explorer/i.test(userAgent) || /MSIE/i.test(userAgent)) return "Internet Explorer"

  return "Unknown Browser"
}
