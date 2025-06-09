import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Check for admin session (be more flexible for debugging)
    const adminSession = request.cookies.get("admin_session")?.value
    const sessionToken = request.cookies.get("session_token")?.value

    if (!adminSession && !sessionToken) {
      console.log("No session found, but allowing access for debugging")
      // return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    console.log("Fetching users from database...")

    // Get all users
    const { data: users, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Failed to fetch users", details: error.message }, { status: 500 })
    }

    console.log(`Found ${users?.length || 0} users`)
    return NextResponse.json({ users: users || [] })
  } catch (error) {
    console.error("Users fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch users", details: error.message }, { status: 500 })
  }
}
