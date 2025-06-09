import nodemailer from "nodemailer"
import { createServerSupabaseClient } from "@/lib/supabase"

// Get SMTP configuration from database or environment
async function getSMTPConfig() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: settings, error } = await supabase.from("smtp_settings").select("*").eq("is_active", true).single()

    if (settings && !error) {
      // Use database settings
      return {
        host: settings.smtp_host,
        port: settings.smtp_port,
        secure: settings.smtp_secure,
        auth: {
          user: settings.smtp_user,
          pass: settings.smtp_password,
        },
        from: settings.smtp_from,
        source: "database",
      }
    }
  } catch (error) {
    console.log("Database SMTP settings not available, using environment variables")
  }

  // Fallback to environment variables
  return {
    host: process.env.SMTP_HOST || "mail.faderco.dz",
    port: Number.parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || "fadercodrop@faderco.dz",
      pass: process.env.SMTP_PASSWORD || "Alger@3535++",
    },
    from: process.env.SMTP_FROM || "fadercodrop@faderco.dz",
    source: "environment",
  }
}

// Email configuration
const createTransporter = async () => {
  const config = await getSMTPConfig()
  return {
    transporter: nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    }),
    from: config.from,
    source: config.source,
  }
}

// Email templates
export const emailTemplates = {
  transferNotification: (data: {
    recipientName?: string
    senderEmail: string
    title: string
    message?: string
    downloadLink: string
    fileCount: number
    expiresAt: string
    hasPassword: boolean
    password?: string
  }) => {
    const expiryDate = new Date(data.expiresAt).toLocaleDateString()

    return {
      subject: `📁 ${data.senderEmail} sent you ${data.fileCount} file${data.fileCount > 1 ? "s" : ""} - Faderco Drop`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>File Transfer</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .download-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .info-box { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .password-box { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { background-color: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; font-size: 14px; }
            .file-icon { font-size: 48px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="file-icon">📁</div>
              <h1>You've received files!</h1>
              <p>From: ${data.senderEmail}</p>
            </div>
            
            <div class="content">
              <h2>${data.title || "File Transfer"}</h2>
              
              ${
                data.message
                  ? `
                <div class="info-box">
                  <h3>📝 Message from sender:</h3>
                  <p>${data.message}</p>
                </div>
              `
                  : ""
              }
              
              <div class="info-box">
                <h3>📊 Transfer Details:</h3>
                <ul>
                  <li><strong>Files:</strong> ${data.fileCount} file${data.fileCount > 1 ? "s" : ""}</li>
                  <li><strong>Expires:</strong> ${expiryDate}</li>
                  <li><strong>Sender:</strong> ${data.senderEmail}</li>
                </ul>
              </div>
              
              ${
                data.hasPassword
                  ? `
                <div class="password-box">
                  <h3>🔒 Password Protected</h3>
                  <p>This transfer is password protected. Use this password to access your files:</p>
                  <p><strong>Password:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${data.password}</code></p>
                </div>
              `
                  : ""
              }
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.downloadLink}" class="download-button">
                  📥 Download Files
                </a>
              </div>
              
              <p style="color: #6c757d; font-size: 14px;">
                <strong>Security Note:</strong> This link will expire on ${expiryDate}. 
                ${data.hasPassword ? "The transfer is password protected for your security." : ""}
              </p>
            </div>
            
            <div class="footer">
              <p>This email was sent from a secure file transfer service.</p>
              <p>If you didn't expect this email, you can safely ignore it.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
You've received ${data.fileCount} file${data.fileCount > 1 ? "s" : ""} from ${data.senderEmail}

Title: ${data.title || "File Transfer"}
${data.message ? `Message: ${data.message}` : ""}

Download Link: ${data.downloadLink}
Expires: ${expiryDate}

${data.hasPassword ? `Password: ${data.password}` : ""}

This link will expire on ${expiryDate}.
      `,
    }
  },
}

// Send email function
export async function sendTransferEmail(data: {
  to: string[]
  senderEmail: string
  title: string
  message?: string
  downloadLink: string
  fileCount: number
  expiresAt: string
  hasPassword: boolean
  password?: string
}) {
  try {
    const { transporter, from, source } = await createTransporter()

    // Verify SMTP connection
    await transporter.verify()
    console.log(`SMTP connection verified (source: ${source})`)

    const emailContent = emailTemplates.transferNotification(data)

    // Send to each recipient
    const emailPromises = data.to.map(async (email) => {
      try {
        const info = await transporter.sendMail({
          from: `"File Transfer" <${from}>`,
          to: email.trim(),
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html,
        })

        console.log(`Email sent to ${email}:`, info.messageId)
        return { email, success: true, messageId: info.messageId }
      } catch (error) {
        console.error(`Failed to send email to ${email}:`, error)
        return { email, success: false, error: error instanceof Error ? error.message : "Unknown error" }
      }
    })

    const results = await Promise.all(emailPromises)

    return {
      success: true,
      results,
      totalSent: results.filter((r) => r.success).length,
      totalFailed: results.filter((r) => !r.success).length,
      source,
    }
  } catch (error) {
    console.error("SMTP Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown SMTP error",
      results: [],
    }
  }
}

// Test email configuration
export async function testEmailConfig() {
  try {
    const { transporter, source } = await createTransporter()
    await transporter.verify()
    return { success: true, message: `SMTP configuration is valid (source: ${source})` }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "SMTP configuration failed",
    }
  }
}
