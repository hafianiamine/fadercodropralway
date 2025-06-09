import { NextResponse } from "next/server"

export async function POST() {
  try {
    console.log("Logout request received")

    const response = NextResponse.json({ success: true })

    // Clear the session cookie
    response.cookies.set("session_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expire immediately
      path: "/",
    })

    console.log("Session cookie cleared")
    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
