// QR Code generation utility using qrcode library
export async function generateQRCodeSVG(text: string, size = 256): Promise<string> {
  try {
    // Use the qrcode library to generate a proper QR code
    const QRCode = await import("qrcode")

    // Generate QR code as SVG string
    const qrCodeSvg = await QRCode.toString(text, {
      type: "svg",
      width: size,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    })

    return qrCodeSvg
  } catch (error) {
    console.error("QR code generation failed:", error)

    // Fallback: Generate a simple placeholder
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <rect width="100%" height="100%" fill="white"/>
        <rect x="20" y="20" width="${size - 40}" height="${size - 40}" fill="none" stroke="black" stroke-width="2"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="14" fill="black">
          QR Code Error
        </text>
      </svg>
    `
  }
}

// Alternative function for generating QR code as data URL
export async function generateQRCodeDataURL(text: string, size = 256): Promise<string> {
  try {
    const QRCode = await import("qrcode")

    const qrCodeDataURL = await QRCode.toDataURL(text, {
      width: size,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    })

    return qrCodeDataURL
  } catch (error) {
    console.error("QR code generation failed:", error)
    return ""
  }
}
