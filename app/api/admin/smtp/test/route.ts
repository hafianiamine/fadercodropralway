import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testEmail, useDatabase = true } = body

    if (!testEmail) {
      return NextResponse.json({ error: "Test email is required" }, { status: 400 })
    }

    let smtpConfig

    if (useDatabase) {
      // Get SMTP settings from database
      const supabase = createServerSupabaseClient()
      const { data: settings, error } = await supabase.from("smtp_settings").select("*").eq("is_active", true).single()

      if (error || !settings) {
        return NextResponse.json({ error: "No active SMTP settings found in database" }, { status: 404 })
      }

      smtpConfig = {
        host: settings.smtp_host,
        port: settings.smtp_port,
        secure: settings.smtp_secure,
        auth: {
          user: settings.smtp_user,
          pass: settings.smtp_password,
        },
      }
    } else {
      // Use environment variables
      smtpConfig = {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number.parseInt(process.env.SMTP_PORT || "587"),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      }
    }

    // Create transporter and test
    const transporter = nodemailer.createTransport(smtpConfig)

    // Verify connection
    await transporter.verify()

    // Send test email
    const info = await transporter.sendMail({
      from: `"File Transfer Test" <${smtpConfig.auth.user}>`,
      to: testEmail,
      subject: "🧪 SMTP Test Email - Configuration Working!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px;">
            <h1>✅ SMTP Test Successful!</h1>
            <p>Your email configuration is working perfectly.</p>
          </div>
          <div style="padding: 20px; background: #f8f9fa; margin-top: 20px; border-radius: 8px;">
            <h3>📧 Configuration Details:</h3>
            <ul>
              <li><strong>Host:</strong> ${smtpConfig.host}</li>
              <li><strong>Port:</strong> ${smtpConfig.port}</li>
              <li><strong>User:</strong> ${smtpConfig.auth.user}</li>
              <li><strong>Source:</strong> ${useDatabase ? "Database Settings" : "Environment Variables"}</li>
            </ul>
          </div>
          <p style="color: #6c757d; font-size: 14px; margin-top: 20px;">
            This test email confirms that your file transfer service can send notifications successfully.
          </p>
        </div>
      `,
      text: `SMTP Test Successful! Your email configuration is working. Host: ${smtpConfig.host}, Port: ${smtpConfig.port}, User: ${smtpConfig.auth.user}`,
    })

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      messageId: info.messageId,
      config: {
        host: smtpConfig.host,
        port: smtpConfig.port,
        user: smtpConfig.auth.user,
        source: useDatabase ? "database" : "environment",
      },
    })
  } catch (error) {
    console.error("SMTP test error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "SMTP test failed",
    })
  }
}
