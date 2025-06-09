import { NextResponse } from "next/server"
import { ListObjectsV2Command } from "@aws-sdk/client-s3"
import { r2Client, R2_BUCKET_NAME } from "@/lib/r2"

export async function GET() {
  try {
    console.log("=== R2 CONNECTION TEST ===")
    console.log("Bucket:", R2_BUCKET_NAME)
    console.log("Endpoint:", r2Client.config.endpoint)
    console.log("Region:", r2Client.config.region)

    // Try to list objects in the bucket
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      MaxKeys: 1,
    })

    const response = await r2Client.send(command)

    return NextResponse.json({
      success: true,
      message: "R2 connection successful",
      bucket: R2_BUCKET_NAME,
      endpoint: r2Client.config.endpoint,
      objectCount: response.KeyCount || 0,
    })
  } catch (error) {
    console.error("R2 connection error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "R2 connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
        bucket: R2_BUCKET_NAME,
        endpoint: r2Client.config.endpoint,
      },
      { status: 500 },
    )
  }
}
