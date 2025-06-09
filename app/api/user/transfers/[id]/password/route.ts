import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { password } = await request.json()

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

    // Update transfer password
    const { error } = await supabase
      .from("transfers")
      .update({ password: password || null })
      .eq("id", params.id)
      .eq("user_id", sessionData.user_id)

    if (error) {
      console.error("Error updating password:", error)
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update password error:", error)
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
  }
}
