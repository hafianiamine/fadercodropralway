import { S3Client } from "@aws-sdk/client-s3"

// R2 Configuration - Fixed endpoint format
const R2_ACCOUNT_ID = "3264e7768529493e49517b7036dd6555"
const R2_ACCESS_KEY = "9e78998337a5338fa7d6253b01cf8b32"
const R2_SECRET_KEY = "c712481d50348f2abdd02809d1ab1efc0aed39057773a8306ffe640bbb3c7898"
const R2_BUCKET = "file-transfer-prod"

// Correct R2 endpoint format
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

// Create R2 client
export const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
})

export const R2_BUCKET_NAME = R2_BUCKET
export const R2_ACCOUNT_ID_EXPORT = R2_ACCOUNT_ID

// Helper to get public URL for R2 files
export function getR2PublicUrl(key: string): string {
  return `https://pub-${R2_ACCOUNT_ID.slice(-8)}.r2.dev/${key}`
}

// Helper to check if R2 is properly configured
export async function testR2Connection() {
  try {
    const { HeadBucketCommand } = await import("@aws-sdk/client-s3")
    const command = new HeadBucketCommand({ Bucket: R2_BUCKET })
    await r2Client.send(command)
    return { success: true, message: "R2 connection successful" }
  } catch (error) {
    return {
      success: false,
      message: `R2 connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
