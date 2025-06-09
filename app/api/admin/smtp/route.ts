import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: settings, error } = await supabase.from("smtp_settings").select("*").eq("is_active", true).single()

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: "Failed to fetch SMTP settings" }, { status: 500 })
    }

    // Return default settings if none found
    const defaultSettings = {
      smtp_host: "mail.faderco.dz",
      smtp_port: 587,
      smtp_user: "fadercodrop@faderco.dz",
      smtp_password: "",
      smtp_from: "fadercodrop@faderco.dz",
      smtp_secure: false,
    }

    return NextResponse.json({
      success: true,
      settings: settings || defaultSettings,
    })
  } catch (error) {
    console.error("Failed to fetch SMTP settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { smtp_host, smtp_port, smtp_user, smtp_password, smtp_from, smtp_secure } = body

    if (!smtp_host || !smtp_port || !smtp_user || !smtp_password || !smtp_from) {
      return NextResponse.json({ error: "All SMTP fields are required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // First, deactivate all existing settings
    await supabase.from("smtp_settings").update({ is_active: false }).eq("is_active", true)

    // Insert new settings
    const { data, error } = await supabase
      .from("smtp_settings")
      .insert({
        smtp_host,
        smtp_port: Number.parseInt(smtp_port.toString()),
        smtp_user,
        smtp_password,
        smtp_from,
        smtp_secure: Boolean(smtp_secure),
        is_active: true,
        updated_by: "admin",
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to save SMTP settings" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "SMTP settings updated successfully",
      settings: data,
    })
  } catch (error) {
    console.error("Failed to update SMTP settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
