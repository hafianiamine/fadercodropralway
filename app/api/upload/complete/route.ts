import { type NextRequest, NextResponse } from "next/server"
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2"
import { CompleteMultipartUploadCommand } from "@aws-sdk/client-s3"
import { createServerSupabaseClient } from "@/lib/supabase"
import { generateShareLink } from "@/lib/crypto"
import { sendTransferEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const { uploadId, key, parts, transferData } = await request.json()

    // Complete the multipart upload
    const command = new CompleteMultipartUploadCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    })

    await r2Client.send(command)

    // If transferData is provided, create the transfer record
    if (transferData) {
      const supabase = createServerSupabaseClient()

      // Get user session
      const sessionToken = request.cookies.get("session_token")?.value
      let userEmail = null
      let userId = null

      if (sessionToken === "admin_session") {
        userEmail = "admin@faderco.com"
      } else if (sessionToken?.startsWith("user_session_")) {
        userId = sessionToken.replace("user_session_", "")
        const { data: user } = await supabase.from("users").select("email").eq("id", userId).single()
        userEmail = user?.email
      }

      if (!userEmail) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
      }

      const shareLink = generateShareLink()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + (transferData.expiryDays || 7))

      // Create transfer record
      const { data: transfer, error: transferError } = await supabase
        .from("transfers")
        .insert({
          title: transferData.title,
          message: transferData.message,
          sender_email: userEmail,
          recipient_emails: transferData.recipientEmails || [],
          password_hash: transferData.passwordHash,
          password_protected: !!transferData.passwordHash,
          expires_at: expiresAt.toISOString(),
          download_limit: transferData.downloadLimit || 0,
          auto_delete_enabled: transferData.autoDeleteEnabled !== false,
          end_to_end_encryption: transferData.endToEndEncryption !== false,
          share_link: shareLink,
          user_id: userId,
        })
        .select()
        .single()

      if (transferError) {
        console.error("Transfer creation error:", transferError)
        return NextResponse.json({ error: "Failed to create transfer" }, { status: 500 })
      }

      // Create file record
      const { error: fileError } = await supabase.from("files").insert({
        transfer_id: transfer.id,
        filename: key.split("/").pop(),
        original_filename: transferData.originalFilename,
        file_size: transferData.fileSize,
        file_type: transferData.contentType,
        file_path: key,
        storage_type: "r2",
      })

      if (fileError) {
        console.error("File record creation error:", fileError)
      }

      // Send email if recipients provided
      let emailResults = null
      if (transferData.recipientEmails && transferData.recipientEmails.length > 0) {
        try {
          const host = request.headers.get("host") || "localhost:3000"
          const protocol = request.headers.get("x-forwarded-proto") || "http"
          const siteUrl = `${protocol}://${host}`

          emailResults = await sendTransferEmail({
            to: transferData.recipientEmails,
            senderEmail: userEmail,
            title: transferData.title || "File Transfer",
            message: transferData.message,
            downloadLink: `${siteUrl}/download/${shareLink}`,
            fileCount: 1,
            expiresAt: transfer.expires_at,
            hasPassword: !!transferData.passwordHash,
            password: transferData.password,
          })
        } catch (emailError) {
          console.error("Email error:", emailError)
        }
      }

      return NextResponse.json({
        success: true,
        transfer: {
          id: transfer.id,
          shareLink: `${request.headers.get("x-forwarded-proto") || "http"}://${request.headers.get("host")}/download/${shareLink}`,
          expiresAt: transfer.expires_at,
        },
        email: emailResults,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Complete failed:", error)
    return NextResponse.json({ error: "Complete failed" }, { status: 500 })
  }
}
