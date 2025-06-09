import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { verifyPassword } from "@/lib/crypto"

export async function GET(request: NextRequest, { params }: { params: { shareLink: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const { shareLink } = params

    // Get transfer with files
    const { data: transfer, error: transferError } = await supabase
      .from("transfers")
      .select(`
        *,
        files (*)
      `)
      .eq("share_link", shareLink)
      .single()

    if (transferError || !transfer) {
      return NextResponse.json({ error: "Transfer not found" }, { status: 404 })
    }

    // Check if expired
    const now = new Date()
    const expiresAt = new Date(transfer.expires_at)
    if (now > expiresAt) {
      return NextResponse.json({ error: "Transfer expired" }, { status: 410 })
    }

    // Check download limit
    if (transfer.download_limit > 0 && transfer.download_count >= transfer.download_limit) {
      return NextResponse.json({ error: "Download limit reached" }, { status: 403 })
    }

    // Return transfer info (without password hash)
    const { password_hash, ...transferData } = transfer

    return NextResponse.json({
      success: true,
      transfer: transferData,
    })
  } catch (error) {
    console.error("Transfer fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch transfer" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { shareLink: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const { shareLink } = params
    const { password } = await request.json()

    // Get transfer
    const { data: transfer, error: transferError } = await supabase
      .from("transfers")
      .select("*")
      .eq("share_link", shareLink)
      .single()

    if (transferError || !transfer) {
      return NextResponse.json({ error: "Transfer not found" }, { status: 404 })
    }

    // Verify password if required
    if (transfer.password_protected) {
      if (!password) {
        return NextResponse.json({ error: "Password required" }, { status: 401 })
      }

      const isValidPassword = await verifyPassword(password, transfer.password_hash)
      if (!isValidPassword) {
        return NextResponse.json({ error: "Invalid password" }, { status: 401 })
      }
    }

    // Increment download count
    const { error: updateError } = await supabase
      .from("transfers")
      .update({
        download_count: transfer.download_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transfer.id)

    if (updateError) {
      console.error("Download count update error:", updateError)
    }

    // Log download
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1"
    const userAgent = request.headers.get("user-agent") || ""

    await supabase.from("download_logs").insert({
      transfer_id: transfer.id,
      ip_address: clientIP,
      user_agent: userAgent,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Download verification error:", error)
    return NextResponse.json({ error: "Download verification failed" }, { status: 500 })
  }
}
