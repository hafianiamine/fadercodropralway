import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { hashPassword, generateShareLink } from "@/lib/crypto"
import { sendTransferEmail } from "@/lib/email"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2"

export async function POST(request: NextRequest) {
  try {
    console.log("Upload request received")

    // Get the session token from cookies
    const sessionToken = request.cookies.get("session_token")?.value

    if (!sessionToken) {
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

    console.log("Authenticated user email:", userEmail)

    // Check content length before processing
    const contentLength = request.headers.get("content-length")
    if (contentLength) {
      const sizeInMB = Number.parseInt(contentLength) / (1024 * 1024)
      console.log(`Upload size: ${sizeInMB.toFixed(2)} MB`)

      // Check if size exceeds reasonable limit (5GB)
      if (Number.parseInt(contentLength) > 5 * 1024 * 1024 * 1024) {
        return NextResponse.json({ error: "File too large. Maximum size is 5GB per upload." }, { status: 413 })
      }
    }

    const formData = await request.formData()

    // Extract form data
    const files = formData.getAll("files") as File[]
    const title = formData.get("title") as string
    const message = formData.get("message") as string
    // Use the authenticated user's email instead of the one from the form
    const recipientEmails = JSON.parse((formData.get("recipientEmails") as string) || "[]")
    const password = formData.get("password") as string
    const expiryDays = Number.parseInt((formData.get("expiryDays") as string) || "7")
    const downloadLimit = Number.parseInt((formData.get("downloadLimit") as string) || "0")
    const autoDeleteEnabled = formData.get("autoDeleteEnabled") === "true"
    const endToEndEncryption = formData.get("endToEndEncryption") === "true"

    console.log(`Processing upload with ${files.length} files`)

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    // Generate share link
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

    // Get the site URL from headers or use localhost as fallback
    const host = request.headers.get("host") || "localhost:3000"
    const protocol = request.headers.get("x-forwarded-proto") || "http"
    const siteUrl = `${protocol}://${host}`

    console.log("Creating transfer record with sender email:", userEmail)

    // Create transfer record
    const { data: transfer, error: transferError } = await supabase
      .from("transfers")
      .insert({
        title,
        message,
        sender_email: userEmail, // Use the authenticated user's email
        recipient_emails: recipientEmails,
        password_hash: passwordHash,
        password_protected: passwordProtected,
        expires_at: expiresAt.toISOString(),
        download_limit: downloadLimit,
        auto_delete_enabled: autoDeleteEnabled,
        end_to_end_encryption: endToEndEncryption,
        share_link: shareLink,
        user_id: userId, // Link the transfer to the user
      })
      .select()
      .single()

    if (transferError) {
      console.error("Transfer creation error:", transferError)
      return NextResponse.json({ error: "Failed to create transfer" }, { status: 500 })
    }

    console.log(`Transfer created with ID: ${transfer.id}`)

    // Process and store files
    const maxDatabaseSize = 50 * 1024 * 1024 // 50MB limit for database fallback

    const filePromises = files.map(async (file, i) => {
      console.log(`Processing file ${i + 1}/${files.length}: ${file.name} (${file.size} bytes)`)

      if (!(file instanceof File)) {
        console.warn(`Skipping invalid file at index ${i}`)
        return null
      }

      try {
        // Convert file to buffer
        const fileBuffer = await file.arrayBuffer()
        const fileBytes = new Uint8Array(fileBuffer)

        // Create unique filename
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        const fileExtension = file.name.split(".").pop() || ""
        const filename = `${timestamp}-${randomSuffix}.${fileExtension}`
        const filePath = `transfers/${transfer.id}/${filename}`

        let storageType = "r2"
        let fileData = null

        // Try R2 Storage first
        try {
          console.log(`Uploading ${file.name} to R2...`)

          const putCommand = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: filePath,
            Body: fileBytes,
            ContentType: file.type || "application/octet-stream",
            ContentLength: file.size,
          })

          await r2Client.send(putCommand)
          console.log(`Successfully uploaded ${file.name} to R2`)
          storageType = "r2"
        } catch (r2Error) {
          console.warn(`R2 upload failed for ${file.name}:`, r2Error)

          // Fallback to database storage for smaller files
          if (file.size <= maxDatabaseSize) {
            console.log(`Falling back to database storage for ${file.name}`)
            fileData = Buffer.from(fileBytes).toString("base64")
            storageType = "database"
          } else {
            console.error(`File ${file.name} too large for database fallback`)
            throw new Error(`Upload failed: File too large and R2 unavailable`)
          }
        }

        console.log(`Storing file metadata for ${file.name} (storage: ${storageType})`)

        // Store file metadata
        const { data: fileRecord, error: fileError } = await supabase
          .from("files")
          .insert({
            transfer_id: transfer.id,
            filename,
            original_filename: file.name,
            file_size: file.size,
            file_type: file.type || "application/octet-stream",
            file_path: filePath,
            file_data: fileData,
            storage_type: storageType,
          })
          .select()
          .single()

        if (fileError) {
          console.error(`File record creation error for ${file.name}:`, fileError)
          return null
        }

        console.log(`Successfully processed file: ${file.name}`)
        return fileRecord
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
        return null
      }
    })

    const fileRecords = (await Promise.all(filePromises)).filter(Boolean)

    if (fileRecords.length === 0) {
      console.error("No files were successfully processed")
      return NextResponse.json({ error: "No files were successfully uploaded" }, { status: 500 })
    }

    console.log(`Upload completed successfully. ${fileRecords.length} files processed.`)

    // Send email notifications if recipients are provided
    let emailResults = null
    if (recipientEmails && recipientEmails.length > 0) {
      console.log(`Sending email notifications to ${recipientEmails.length} recipients`)

      try {
        emailResults = await sendTransferEmail({
          to: recipientEmails,
          senderEmail: userEmail, // Use the authenticated user's email
          title: title || "File Transfer",
          message,
          downloadLink: `${siteUrl}/download/${shareLink}`,
          fileCount: fileRecords.length,
          expiresAt: transfer.expires_at,
          hasPassword: passwordProtected,
          password: passwordProtected ? password : undefined,
        })

        console.log(`Email notification results:`, emailResults)
      } catch (emailError) {
        console.error("Failed to send email notifications:", emailError)
        // Don't fail the upload if email fails
      }
    }

    return NextResponse.json({
      success: true,
      transfer: {
        id: transfer.id,
        shareLink: `${siteUrl}/download/${shareLink}`,
        expiresAt: transfer.expires_at,
        fileCount: fileRecords.length,
      },
      email: emailResults
        ? {
            sent: emailResults.totalSent,
            failed: emailResults.totalFailed,
            success: emailResults.success,
          }
        : null,
    })
  } catch (error) {
    console.error("Upload error:", error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("413") || error.message.includes("too large")) {
        return NextResponse.json(
          {
            error: "File too large",
            details:
              "The uploaded files exceed the maximum allowed size of 5GB. Please try uploading smaller files or fewer files at once.",
          },
          { status: 413 },
        )
      }
    }

    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
