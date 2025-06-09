import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if admin is logged in
    const sessionToken = request.cookies.get("admin_session")?.value
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Deactivate the transfer
    const { error } = await supabase.from("transfers").update({ is_active: false }).eq("id", params.id)

    if (error) {
      console.error("Error deactivating transfer:", error)
      return NextResponse.json({ error: "Failed to deactivate transfer" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Deactivate transfer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
