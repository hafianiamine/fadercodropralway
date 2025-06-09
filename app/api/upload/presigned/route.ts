import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { hashPassword, generateShareLink } from "@/lib/crypto"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2"

export async function POST(request: NextRequest) {
  try {
    console.log("=== PRESIGNED URL DEBUG ===")
    console.log("All cookies:", request.cookies.getAll())

    // Get the session token from cookies
    const sessionToken = request.cookies.get("session_token")?.value
    console.log("Session token from cookie:", sessionToken)

    if (!sessionToken) {
      console.log("No session token - returning 401")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Get user from session token
    let userId = null
    let userEmail = null

    if (sessionToken === "admin_session") {
      userEmail = "admin@faderco.com"
    } else if (sessionToken.startsWith("user_session_")) {
      userId = sessionToken.replace("user_session_", "")

      // Get user from database
      const { data: user, error } = await supabase.from("users").select("email").eq("id", userId).single()

      if (error || !user) {
        console.error("User lookup error:", error)
        return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
      }

      userEmail = user.email
    } else {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const body = await request.json()
    const {
      files,
      title,
      message,
      recipientEmails,
      password,
      expiryDays = 7,
      downloadLimit = 0,
      autoDeleteEnabled = true,
      endToEndEncryption = true,
    } = body

    console.log(`Creating presigned URLs for ${files.length} files`)

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    // Generate share link first
    const shareLink = generateShareLink()

    // Calculate expiry date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiryDays)

    // Hash password if provided
    let passwordHash = null
    const passwordProtected = !!password
    if (password) {
      passwordHash = await hashPassword(password)
    }

    // Get the site URL from headers
    const host = request.headers.get("host") || "localhost:3000"
    const protocol = request.headers.get("x-forwarded-proto") || "http"
    const siteUrl = `${protocol}://${host}`

    console.log("Creating transfer record with sender email:", userEmail)

    // Create transfer record FIRST
    const { data: transfer, error: transferError } = await supabase
      .from("transfers")
      .insert({
        title,
        message,
        sender_email: userEmail,
        recipient_emails: recipientEmails || [],
        password_hash: passwordHash,
        password_protected: passwordProtected,
        expires_at: expiresAt.toISOString(),
        download_limit: downloadLimit,
        auto_delete_enabled: autoDeleteEnabled,
        end_to_end_encryption: endToEndEncryption,
        share_link: shareLink,
        user_id: userId,
        upload_status: "uploading", // Mark as uploading
      })
      .select()
      .single()

    if (transferError) {
      console.error("Transfer creation error:", transferError)
      return NextResponse.json({ error: "Failed to create transfer" }, { status: 500 })
    }

    console.log(`Transfer created with ID: ${transfer.id}`)

    // Debug R2 configuration
    console.log("=== R2 DEBUG ===")
    console.log("R2_BUCKET_NAME:", R2_BUCKET_NAME)
    console.log("R2 Client config:", {
      region: r2Client.config.region,
      endpoint: r2Client.config.endpoint,
    })

    // Generate presigned URLs for each file
    const presignedUrls = await Promise.all(
      files.map(async (file: { name: string; size: number; type: string }, index: number) => {
        // Create unique filename
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        const fileExtension = file.name.split(".").pop() || ""
        const filename = `${timestamp}-${index}-${randomSuffix}.${fileExtension}`
        const filePath = `transfers/${transfer.id}/${filename}`

        console.log(`Generating presigned URL for file: ${file.name}`)
        console.log(`File path: ${filePath}`)

        // Create presigned URL for upload
        const putCommand = new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: filePath,
          ContentType: file.type || "application/octet-stream",
          ContentLength: file.size,
        })

        const presignedUrl = await getSignedUrl(r2Client, putCommand, { expiresIn: 3600 }) // 1 hour

        console.log(`Generated presigned URL: ${presignedUrl}`)

        // Create file record in database
        const { data: fileRecord, error: fileError } = await supabase
          .from("files")
          .insert({
            transfer_id: transfer.id,
            filename,
            original_filename: file.name,
            file_size: file.size,
            file_type: file.type || "application/octet-stream",
            file_path: filePath,
            storage_type: "r2",
            upload_status: "pending",
          })
          .select()
          .single()

        if (fileError) {
          console.error(`File record creation error for ${file.name}:`, fileError)
          throw new Error(`Failed to create file record for ${file.name}`)
        }

        return {
          fileId: fileRecord.id,
          filename: file.name,
          presignedUrl,
          filePath,
        }
      }),
    )

    console.log(`Generated ${presignedUrls.length} presigned URLs`)

    return NextResponse.json({
      success: true,
      transfer: {
        id: transfer.id,
        shareLink: `${siteUrl}/download/${shareLink}`,
        expiresAt: transfer.expires_at,
      },
      presignedUrls,
      uploadStatus: "ready",
    })
  } catch (error) {
    console.error("Presigned URL generation error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate presigned URLs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
