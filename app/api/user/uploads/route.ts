import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Get user's transfers with files
    const { data: transfers, error } = await supabase
      .from("transfers")
      .select(`
        *,
        files (*)
      `)
      .eq("sender_email", "admin@faderco.com") // For now, show admin uploads
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching uploads:", error)
      return NextResponse.json({ error: "Failed to fetch uploads" }, { status: 500 })
    }

    return NextResponse.json({ uploads: transfers || [] })
  } catch (error) {
    console.error("Uploads fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch uploads" }, { status: 500 })
  }
}
