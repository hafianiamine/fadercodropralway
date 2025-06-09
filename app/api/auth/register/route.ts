import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone, company, jobPosition } = await request.json()

    if (!name || !email || !password || !phone || !company || !jobPosition) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Check if user already exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).single()

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Create new user with additional fields
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        name,
        email,
        password, // Simple password storage
        phone,
        company,
        job_position: jobPosition,
        is_verified: false,
        is_active: true,
        role: "user", // All new users are regular users
      })
      .select()
      .single()

    if (error) {
      console.error("Registration error:", error)
      return NextResponse.json({ error: "Registration failed" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully. Please wait for admin verification.",
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
