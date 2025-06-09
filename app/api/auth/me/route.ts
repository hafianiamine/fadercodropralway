import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Debug: Log all cookies
    console.log("=== AUTH DEBUG ===")
    console.log("All cookies:", request.cookies.getAll())
    console.log("Headers:", Object.fromEntries(request.headers.entries()))

    const sessionToken = request.cookies.get("session_token")?.value
    console.log("Session token:", sessionToken)

    if (!sessionToken || sessionToken === "") {
      console.log("No session token found - returning 401")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Create Supabase client
    const supabase = createServerSupabaseClient()

    // Check if it's admin session (simple check for demo)
    if (sessionToken === "admin_session") {
      return NextResponse.json({
        user: {
          id: "admin",
          email: "admin@faderco.com",
          name: "Admin User",
          role: "admin",
          is_verified: true,
        },
      })
    }

    // For regular users, check the session in the database
    if (sessionToken.startsWith("user_session_")) {
      const userId = sessionToken.replace("user_session_", "")

      // Get user from database and verify session token matches
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .eq("session_token", sessionToken) // Verify session token matches
        .single()

      if (error || !user) {
        console.error("User lookup error:", error)
        return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
      }

      if (!user.is_active) {
        return NextResponse.json({ error: "Account deactivated" }, { status: 401 })
      }

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          is_verified: user.is_verified,
        },
      })
    }

    return NextResponse.json({ error: "Invalid session" }, { status: 401 })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
