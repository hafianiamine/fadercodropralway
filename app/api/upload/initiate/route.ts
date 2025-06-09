import { type NextRequest, NextResponse } from "next/server"
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2"
import { CreateMultipartUploadCommand } from "@aws-sdk/client-s3"

export async function POST(request: NextRequest) {
  try {
    const { filename, contentType } = await request.json()

    const key = `uploads/${Date.now()}-${filename}`

    const command = new CreateMultipartUploadCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    })

    const result = await r2Client.send(command)

    return NextResponse.json({
      uploadId: result.UploadId,
      key,
    })
  } catch (error) {
    console.error("❌ Failed to initiate:", error)
    return NextResponse.json({ error: "Initiate failed" }, { status: 500 })
  }
}
