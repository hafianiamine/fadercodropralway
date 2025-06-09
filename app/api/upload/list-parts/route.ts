import { type NextRequest, NextResponse } from "next/server"
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2"
import { ListPartsCommand } from "@aws-sdk/client-s3"

export async function POST(request: NextRequest) {
  try {
    const { uploadId, key } = await request.json()

    const command = new ListPartsCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
    })

    const data = await r2Client.send(command)

    const uploadedParts =
      data.Parts?.map((p) => ({
        PartNumber: p.PartNumber,
        ETag: p.ETag,
      })) || []

    return NextResponse.json({ uploadedParts })
  } catch (error) {
    console.error("❌ List parts failed:", error)
    return NextResponse.json({ error: "List failed" }, { status: 500 })
  }
}
