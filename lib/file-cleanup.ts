/**
 * Simulates a cron job that checks for expired files and deletes them
 * In a real application, this would be a server-side job
 */
export async function simulateFileCleanup(fileLink: string, expiryDays: number): Promise<number> {
  // This is a simulation - in a real app, this would query a database
  // and delete files that have passed their expiration date

  // For simulation purposes, we'll randomly determine if files were deleted
  const shouldDeleteFiles = Math.random() < 0.2 // 20% chance of deleting files

  if (shouldDeleteFiles) {
    // Simulate deleting 1-3 files
    const deletedCount = Math.floor(Math.random() * 3) + 1

    console.log(`[File Cleanup] Deleted ${deletedCount} expired files`)
    console.log(`[File Cleanup] Link: ${fileLink}, Expiry: ${expiryDays} days`)

    return deletedCount
  }

  return 0
}
