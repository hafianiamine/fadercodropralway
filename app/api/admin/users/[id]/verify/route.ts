import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { error } = await supabase.from("users").update({ is_verified: true }).eq("id", params.id)

    if (error) {
      console.error("Error verifying user:", error)
      return NextResponse.json({ error: "Failed to verify user" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Verify user error:", error)
    return NextResponse.json({ error: "Failed to verify user" }, { status: 500 })
  }
}
