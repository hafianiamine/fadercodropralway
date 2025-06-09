import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Get user from session
    const { data: sessionData } = await supabase
      .from("user_sessions")
      .select("user_id")
      .eq("session_token", sessionToken)
      .single()

    if (!sessionData) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    // Get current transfer status
    const { data: transfer } = await supabase
      .from("transfers")
      .select("is_active")
      .eq("id", params.id)
      .eq("user_id", sessionData.user_id)
      .single()

    if (!transfer) {
      return NextResponse.json({ error: "Transfer not found" }, { status: 404 })
    }

    // Toggle the status
    const { error } = await supabase
      .from("transfers")
      .update({ is_active: !transfer.is_active })
      .eq("id", params.id)
      .eq("user_id", sessionData.user_id)

    if (error) {
      console.error("Error toggling transfer:", error)
      return NextResponse.json({ error: "Failed to toggle transfer" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Toggle transfer error:", error)
    return NextResponse.json({ error: "Failed to toggle transfer" }, { status: 500 })
  }
}
