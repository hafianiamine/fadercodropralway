import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Get active video settings
    const { data: videoSettings, error } = await supabase
      .from("video_settings")
      .select("*")
      .eq("is_active", true)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      console.error("Error fetching video settings:", error)
      return NextResponse.json({ error: "Failed to fetch video settings" }, { status: 500 })
    }

    // Return default settings if none found
    const defaultSettings = {
      video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      video_title: "How to use Faderco Drop",
    }

    return NextResponse.json({
      settings: videoSettings || defaultSettings,
    })
  } catch (error) {
    console.error("Video settings fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { video_url, video_title } = body

    if (!video_url || !video_title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Deactivate existing settings
    await supabase.from("video_settings").update({ is_active: false }).eq("is_active", true)

    // Insert new settings
    const { error } = await supabase.from("video_settings").insert({
      video_url,
      video_title,
      is_active: true,
      updated_by: "admin",
    })

    if (error) {
      console.error("Error updating video settings:", error)
      return NextResponse.json({ error: "Failed to update video settings" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Video settings update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
