import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    // Simple admin check first
    if (email === "admin@faderco.com" && password === "admin123") {
      const sessionToken = "admin_session" // Use consistent admin session token

      const response = NextResponse.json({
        success: true,
        user: {
          id: "admin",
          email: "admin@faderco.com",
          name: "Admin User",
          role: "admin",
          is_verified: true,
        },
      })

      response.cookies.set("session_token", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/", // Add path to ensure cookie works across all routes
      })

      return response
    }

    // Check regular users in database
    const supabase = createServerSupabaseClient()

    // First get the user by email
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("email", email).single()

    if (userError || !user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check password
    if (user.password !== password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    if (!user.is_active) {
      return NextResponse.json({ error: "Account deactivated" }, { status: 401 })
    }

    if (!user.is_verified) {
      return NextResponse.json({ error: "Account pending verification" }, { status: 401 })
    }

    // Create session with user ID prefix
    const sessionToken = `user_session_${user.id}`

    // Update user's session token in database
    await supabase
      .from("users")
      .update({
        last_login: new Date().toISOString(),
        session_token: sessionToken,
      })
      .eq("id", user.id)

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || "user",
        is_verified: user.is_verified,
      },
    })

    response.cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/", // Add path to ensure cookie works across all routes
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
