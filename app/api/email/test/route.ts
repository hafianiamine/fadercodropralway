import { NextResponse } from "next/server"
import { testEmailConfig, sendTransferEmail } from "@/lib/email"

export async function GET() {
  try {
    // Test SMTP configuration
    const configTest = await testEmailConfig()

    if (!configTest.success) {
      return NextResponse.json(
        {
          success: false,
          error: "SMTP Configuration Failed",
          details: configTest.error,
          config: {
            host: process.env.SMTP_HOST || "Not set",
            port: process.env.SMTP_PORT || "Not set",
            user: process.env.SMTP_USER || "Not set",
            from: process.env.SMTP_FROM || "Not set",
          },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "SMTP configuration is valid",
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        from: process.env.SMTP_FROM,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const { testEmail } = await request.json()

    if (!testEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Test email address is required",
        },
        { status: 400 },
      )
    }

    // Send a test email
    const result = await sendTransferEmail({
      to: [testEmail],
      senderEmail: "test@example.com",
      title: "Test Email - File Transfer System",
      message: "This is a test email to verify your SMTP configuration is working correctly.",
      downloadLink: "https://example.com/test-download",
      fileCount: 1,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      hasPassword: true,
      password: "test123",
    })

    return NextResponse.json({
      success: result.success,
      message: result.success ? "Test email sent successfully!" : "Failed to send test email",
      details: result,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Test email failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
