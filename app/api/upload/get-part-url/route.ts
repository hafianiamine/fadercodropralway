import { type NextRequest, NextResponse } from "next/server"
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2"
import { UploadPartCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

export async function POST(request: NextRequest) {
  try {
    const { uploadId, partNumber, key } = await request.json()

    const command = new UploadPartCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    })

    const url = await getSignedUrl(r2Client, command, { expiresIn: 300 })

    return NextResponse.json({ url })
  } catch (error) {
    console.error("❌ Failed to get part URL:", error)
    return NextResponse.json({ error: "Part URL failed" }, { status: 500 })
  }
}
