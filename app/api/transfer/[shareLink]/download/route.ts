import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2"
import AdmZip from "adm-zip"

export async function GET(request: NextRequest, { params }: { params: { shareLink: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const { shareLink } = params
    const url = new URL(request.url)
    const fileId = url.searchParams.get("fileId")

    console.log(`Download request for shareLink: ${shareLink}, fileId: ${fileId}`)

    // Get transfer with files
    const { data: transfer, error: transferError } = await supabase
      .from("transfers")
      .select(`
        *,
        files (*)
      `)
      .eq("share_link", shareLink)
      .single()

    if (transferError || !transfer) {
      console.error("Transfer not found:", transferError)
      return NextResponse.json({ error: "Transfer not found" }, { status: 404 })
    }

    // Check if expired
    const now = new Date()
    const expiresAt = new Date(transfer.expires_at)
    if (now > expiresAt) {
      return NextResponse.json({ error: "Transfer expired" }, { status: 410 })
    }

    if (fileId) {
      // Download specific file
      const file = transfer.files.find((f: any) => f.id === fileId)
      if (!file) {
        return NextResponse.json({ error: "File not found" }, { status: 404 })
      }

      console.log(
        `Downloading file: ${file.original_filename} (${file.file_size} bytes, storage: ${file.storage_type})`,
      )

      try {
        let fileData: Uint8Array

        if (file.storage_type === "r2") {
          // Download from R2
          const getCommand = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: file.file_path,
          })

          const response = await r2Client.send(getCommand)
          if (!response.Body) {
            throw new Error("No file data received from R2")
          }

          fileData = new Uint8Array(await response.Body.transformToByteArray())
        } else if (file.storage_type === "supabase") {
          // Download from Supabase Storage (legacy)
          const { data: storageData, error: storageError } = await supabase.storage
            .from("files")
            .download(file.file_path)

          if (storageError) {
            console.error(`Storage download failed for ${file.original_filename}:`, storageError)
            throw new Error(`Storage download failed: ${storageError.message}`)
          }

          fileData = new Uint8Array(await storageData.arrayBuffer())
        } else {
          // Get from database (base64)
          if (!file.file_data) {
            throw new Error("File data not found in database")
          }

          const buffer = Buffer.from(file.file_data, "base64")
          fileData = new Uint8Array(buffer)
        }

        console.log(`Successfully retrieved file data: ${fileData.length} bytes`)

        // Return file with proper headers
        return new NextResponse(fileData, {
          headers: {
            "Content-Type": file.file_type || "application/octet-stream",
            "Content-Disposition": `attachment; filename="${encodeURIComponent(file.original_filename)}"`,
            "Content-Length": fileData.length.toString(),
            "Cache-Control": "no-cache",
          },
        })
      } catch (error) {
        console.error("File download error:", error)
        return NextResponse.json({ error: "Failed to download file" }, { status: 500 })
      }
    } else {
      // Download all files
      console.log(`Downloading all files for transfer: ${transfer.id}`)
      return await downloadAllFiles(transfer.files, transfer.title || "files", supabase)
    }
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ error: "Download failed" }, { status: 500 })
  }
}

async function downloadAllFiles(files: any[], transferTitle: string, supabase: any) {
  try {
    if (files.length === 1) {
      // Single file, download directly
      const file = files[0]
      console.log(`Single file download: ${file.original_filename}`)

      let fileData: Uint8Array

      if (file.storage_type === "r2") {
        const getCommand = new GetObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: file.file_path,
        })

        const response = await r2Client.send(getCommand)
        if (!response.Body) {
          throw new Error("No file data received from R2")
        }

        fileData = new Uint8Array(await response.Body.transformToByteArray())
      } else if (file.storage_type === "supabase") {
        const { data: storageData, error: storageError } = await supabase.storage.from("files").download(file.file_path)

        if (storageError) {
          throw new Error(`Storage download failed: ${storageError.message}`)
        }

        fileData = new Uint8Array(await storageData.arrayBuffer())
      } else {
        if (!file.file_data) {
          throw new Error("File data not found")
        }

        const buffer = Buffer.from(file.file_data, "base64")
        fileData = new Uint8Array(buffer)
      }

      return new NextResponse(fileData, {
        headers: {
          "Content-Type": file.file_type || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(file.original_filename)}"`,
          "Content-Length": fileData.length.toString(),
        },
      })
    }

    // Multiple files - create ZIP archive
    console.log(`Creating ZIP archive for ${files.length} files`)

    const zip = new AdmZip()
    let totalSize = 0

    // Add each file to the ZIP
    for (const file of files) {
      try {
        let fileData: Buffer

        if (file.storage_type === "r2") {
          // Download from R2
          const getCommand = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: file.file_path,
          })

          const response = await r2Client.send(getCommand)
          if (!response.Body) {
            console.error(`No file data received from R2 for ${file.original_filename}`)
            continue
          }

          fileData = Buffer.from(await response.Body.transformToByteArray())
        } else if (file.storage_type === "supabase") {
          // Download from Supabase Storage (legacy)
          const { data: storageData, error: storageError } = await supabase.storage
            .from("files")
            .download(file.file_path)

          if (storageError) {
            console.error(`Storage download failed for ${file.original_filename}:`, storageError)
            continue // Skip this file and continue with others
          }

          fileData = Buffer.from(await storageData.arrayBuffer())
        } else {
          // Get from database (base64)
          if (!file.file_data) {
            console.error(`File data not found for ${file.original_filename}`)
            continue // Skip this file and continue with others
          }

          fileData = Buffer.from(file.file_data, "base64")
        }

        // Add file to ZIP with original filename
        zip.addFile(file.original_filename, fileData)
        totalSize += fileData.length
        console.log(`Added ${file.original_filename} to ZIP (${formatFileSize(fileData.length)})`)
      } catch (error) {
        console.error(`Error adding file ${file.original_filename} to ZIP:`, error)
        // Continue with other files even if one fails
      }
    }

    // Generate ZIP buffer
    const zipBuffer = zip.toBuffer()
    console.log(`ZIP archive created: ${formatFileSize(zipBuffer.length)} (${files.length} files)`)

    // Clean filename for ZIP
    const cleanTitle = transferTitle.replace(/[^a-zA-Z0-9\-_\s]/g, "").trim() || "files"
    const zipFilename = `${cleanTitle}.zip`

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(zipFilename)}"`,
        "Content-Length": zipBuffer.length.toString(),
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("ZIP creation error:", error)
    return NextResponse.json({ error: "Failed to create ZIP archive" }, { status: 500 })
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
