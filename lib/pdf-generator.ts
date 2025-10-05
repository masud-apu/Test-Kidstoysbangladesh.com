/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { jsPDF } from 'jspdf'
import { applyPlugin } from 'jspdf-autotable'
import fs from 'fs'
import path from 'path'
import { OrderData } from './email'

// Apply the autotable plugin to jsPDF
applyPlugin(jsPDF)

// Extend jsPDF types to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export async function generatePDFBuffer(orderData: OrderData): Promise<Buffer> {
  // First try React PDF implementation (preferred for Bengali support and better formatting)
  try {
    const buffer = await tryGenerateWithReactPDF(orderData, false)
    if (buffer) return buffer
  } catch (e) {
    console.log('React PDF failed, using jsPDF fallback:', (e as Error).message)
  }
  
  // Fallback to jsPDF implementation (basic support, no Bengali)
  try {
    return await generateWithJsPDF(orderData, false)
  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error('Failed to generate PDF invoice')
  }
}

export async function generatePaidReceiptBuffer(orderData: OrderData): Promise<Buffer> {
  // First try React PDF implementation with receipt flag
  try {
    const buffer = await tryGenerateWithReactPDF(orderData, true)
    if (buffer) return buffer
  } catch (e) {
    console.log('React PDF failed, using jsPDF fallback:', (e as Error).message)
  }
  
  // Fallback to jsPDF implementation (basic support, no Bengali)
  try {
    return await generateWithJsPDF(orderData, true)
  } catch (error) {
    console.error('Paid receipt PDF generation error:', error)
    throw new Error('Failed to generate receipt PDF')
  }
}

async function generateWithJsPDF(orderData: OrderData, isPaidReceipt: boolean): Promise<Buffer> {
  try {
    const { customerName, customerPhone, customerAddress, items, itemsTotal, shippingCost, totalAmount, orderId, promoCode, promoCodeDiscount } = orderData
    
    const currentDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })

    // Create PDF document
    const doc = new jsPDF()
    
    // Fallback path: use core Helvetica to avoid TTF parsing errors
    // Note: This fallback has limited Bengali support
    const activeFont = 'helvetica'
    const setNormal = () => doc.setFont(activeFont, 'normal')
    const setBold = () => doc.setFont(activeFont, 'bold')
    
    // Helper function to handle mixed Bengali/English text
    const renderText = (text: string, x: number, y: number, options?: any) => {
      try {
        doc.text(text, x, y, options)
      } catch (e) {
        // If Bengali text fails, replace with English equivalent for critical info
        const fallbackText = text
          .replace(/[০-৯]/g, (match) => String.fromCharCode(match.charCodeAt(0) - '০'.charCodeAt(0) + '0'.charCodeAt(0)))
          .replace(/[া-ৗ]/g, '?') // Replace Bengali vowels with ?
          .replace(/[ক-হ]/g, '?') // Replace Bengali consonants with ?
        doc.text(fallbackText, x, y, options)
      }
    }

    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    let yPosition = margin

    // Currency formatter for BDT
    const formatBDT = (n: number) => {
      try {
        return `Tk ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      } catch {
        return `Tk ${n.toFixed(2)}`
      }
    }

    // Header - Logo + Company Info
    try {
      const logoPath = path.join(process.cwd(), 'public', 'main-logo.svg')
      const logoSvg = fs.readFileSync(logoPath, 'utf8')
      // jsPDF 3 can add inline SVG if plugin available; keep guarded.
      // If this fails, we gracefully fall back to text.
      doc.addImage(logoSvg as any, 'SVG', margin, yPosition - 2, 48, 18)
    } catch (e) {
      // Text fallback if SVG cannot be embedded
      doc.setFontSize(18)
      doc.setFont(activeFont, 'bold')
      doc.text('KidsToys Bangladesh', margin, yPosition + 10)
    }

    // Right-aligned brand info
    doc.setTextColor(55, 65, 81)
    doc.setFontSize(10)
    setNormal()
    const rightX = pageWidth - margin
    doc.text('KidsToys Bangladesh', rightX, yPosition + 2, { align: 'right' })
    doc.text('Your Kids Toy Destination', rightX, yPosition + 8, { align: 'right' })
    doc.text('www.kidstoysbangladesh.com', rightX, yPosition + 14, { align: 'right' })

    yPosition += 24
    // Divider
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.5)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    // Invoice and Customer Information
    doc.setTextColor(17, 24, 39)
    doc.setFillColor(248, 250, 252) // Light gray background
    doc.roundedRect(margin, yPosition, pageWidth - margin * 2, 50, 2, 2, 'F')
    
    // Invoice Details (Left side)
    doc.setFontSize(12)
    setBold()
    doc.text('Invoice Details', margin + 10, yPosition + 14)
    
    doc.setFontSize(10)
    setNormal()
    doc.text(`Invoice #: ${orderId}`, margin + 10, yPosition + 24)
    doc.text(`Date: ${currentDate}`, margin + 10, yPosition + 31)
    doc.text('Status: Order Placed', margin + 10, yPosition + 38)
    
    // Customer Information (Right side)
    const rightSide = pageWidth / 2 + 10
    doc.setFontSize(12)
    setBold()
    doc.text('Customer Information', rightSide, yPosition + 14)
    
    doc.setFontSize(10)
    setNormal()
    renderText(`Name: ${customerName}`, rightSide, yPosition + 24)
    renderText(`Phone: ${customerPhone}`, rightSide, yPosition + 31)
    
    // Handle long addresses
    try {
      const addressLines = doc.splitTextToSize(`Address: ${customerAddress}`, pageWidth / 2 - 30)
      doc.text(addressLines, rightSide, yPosition + 38)
    } catch (e) {
      // Fallback for Bengali addresses
      renderText(`Address: ${customerAddress}`, rightSide, yPosition + 38)
    }
    
    yPosition += 60

    // Order Items Table
    doc.setFontSize(14)
    setBold()
    doc.text('Order Items', margin, yPosition)
    yPosition += 10

    // Prepare table data with variant information
    const tableHeaders = ['Product Name', 'Quantity', 'Unit Price', 'Total']
    const tableData = items.map(item => {
      const price = item.variantPrice || item.price || '0'
      const productName = item.title || item.name

      // Build product name with variant info
      let displayName = productName
      if (item.variantTitle && item.variantTitle !== 'Default Title') {
        if (item.selectedOptions && item.selectedOptions.length > 0) {
          const optionsText = item.selectedOptions.map(opt => `${opt.optionName}: ${opt.valueName}`).join(' / ')
          displayName += `\n${optionsText}`
        } else {
          displayName += `\n${item.variantTitle}`
        }
      }

      return [
        displayName,
        String(item.quantity),
        `${formatBDT(parseFloat(price))}`,
        `${formatBDT(parseFloat(price) * item.quantity)}`
      ]
    })

    // Create table
    doc.autoTable({
      startY: yPosition,
      head: [tableHeaders],
      body: tableData,
      theme: 'grid',
      styles: {
        font: activeFont,
        fontSize: 10,
        textColor: [55, 65, 81],
      },
      headStyles: {
        fillColor: [241, 245, 249], // Light blue
        textColor: [55, 65, 81], // Dark gray
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: margin, right: margin }
    })

    // Get position after table
    yPosition = (doc as any).lastAutoTable.finalY + 20

    // Totals Section
    const hasPromoDiscount = promoCode && promoCodeDiscount && promoCodeDiscount > 0
    const totalsHeight = hasPromoDiscount ? 54 : 44

    doc.setFillColor(248, 250, 252)
    doc.roundedRect(pageWidth - 140, yPosition, 120, totalsHeight, 2, 2, 'F')

    doc.setFontSize(12)
    setBold()

    const totalsX = pageWidth - 130
    let currentY = yPosition + 12

    doc.text('Items Total:', totalsX, currentY)
    setNormal()
    doc.text(`${formatBDT(itemsTotal)}`, pageWidth - 30, currentY, { align: 'right' })
    currentY += 10

    // Promo code discount if applicable
    if (hasPromoDiscount) {
      setBold()
      doc.text(`Promo (${promoCode}):`, totalsX, currentY)
      doc.setTextColor(22, 163, 74) // Green color
      setNormal()
      doc.text(`-${formatBDT(promoCodeDiscount)}`, pageWidth - 30, currentY, { align: 'right' })
      doc.setTextColor(17, 24, 39) // Reset to default color
      currentY += 10
    }

    setBold()
    doc.text('Shipping Cost:', totalsX, currentY)
    setNormal()
    doc.text(`${formatBDT(shippingCost)}`, pageWidth - 30, currentY, { align: 'right' })
    currentY += 5

    // Draw line for final total
    doc.setLineWidth(0.5)
    doc.line(totalsX, currentY, pageWidth - 30, currentY)
    currentY += 8

    doc.setFontSize(14)
    setBold()
    doc.text('Grand Total:', totalsX, currentY)
    setBold()
    doc.text(`${formatBDT(totalAmount)}`, pageWidth - 30, currentY, { align: 'right' })
    
    yPosition += hasPromoDiscount ? 66 : 56

    // Add PAID stamp for receipts (image overlay)
    if (isPaidReceipt) {
      doc.saveGraphicsState()

      try {
        // Apply 30% opacity if supported
        try {
          const GStateCtor = (doc as any).GState
          if (GStateCtor && (doc as any).setGState) {
            const gs = new GStateCtor({ opacity: 0.3, strokeOpacity: 0.3 })
            ;(doc as any).setGState(gs)
          }
        } catch {}

        // Load paid-stamp asset if available
        const baseDir = path.join(process.cwd(), 'public')
        const explicit = ['paid-stamp.png', 'paid-stamp.jpg', 'paid-stamp.jpeg', 'paid-stamp.svg', 'paid-rectangle-stamp-1.png']
        const files = fs.existsSync(baseDir) ? fs.readdirSync(baseDir) : []
        const candidates = [...explicit, ...files.filter(f => /paid/i.test(f) && /\.(png|jpg|jpeg|svg)$/i.test(f))]
        let imgBuf: Buffer | null = null
        let ext: string | null = null
        for (const name of candidates) {
          const p = path.join(baseDir, name)
          if (fs.existsSync(p)) {
            imgBuf = fs.readFileSync(p)
            ext = path.extname(p).toLowerCase()
            break
          }
        }
        if (imgBuf) {
          let dataUrl: string | null = null
          if (ext === '.png') dataUrl = `data:image/png;base64,${imgBuf.toString('base64')}`
          else if (ext === '.jpg' || ext === '.jpeg') dataUrl = `data:image/jpeg;base64,${imgBuf.toString('base64')}`
          else if (ext === '.svg') {
            try {
              const sharp = (await import('sharp')).default
              const pngBuffer = await sharp(imgBuf).png({ quality: 90 }).toBuffer()
              dataUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`
            } catch {
              dataUrl = null
            }
          }
          if (dataUrl) {
            // Center image and draw it large; it’s already rotated art
            const targetW = 380
            const targetH = 380 * (1332 / 2185) // keep aspect ratio if using the provided size
            const x = (pageWidth - targetW) / 2
            const y = 120 // approx center vertically on A4
            doc.addImage(dataUrl, 'PNG', x, y, targetW, targetH, undefined, 'FAST')
          }
        }
      } catch {}

      doc.restoreGraphicsState()
    }

    // Footer
    doc.setFillColor(249, 250, 251)
    doc.roundedRect(margin, yPosition, pageWidth - margin * 2, 26, 2, 2, 'F')
    
    doc.setTextColor(55, 65, 81)
    doc.setFontSize(11)
    setNormal()
    doc.text('Thank you for choosing KidsToys Bangladesh!', pageWidth / 2, yPosition + 11, { align: 'center' })
    
    doc.setTextColor(99, 102, 241)
    setBold()
    doc.text('www.kidstoysbangladesh.com', pageWidth / 2, yPosition + 19, { align: 'center' })

    // Convert to buffer
    const pdfArrayBuffer = doc.output('arraybuffer')
    return Buffer.from(pdfArrayBuffer)
  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error('Failed to generate PDF invoice')
  }
}

async function tryGenerateWithReactPDF(orderData: OrderData, isPaidReceipt: boolean = false): Promise<Buffer | null> {
  try {
    // Dynamically import to keep fallback working without deps
    const { Font, renderToBuffer } = await import('@react-pdf/renderer')
    
    // Register fonts via data URLs to avoid fs/fetch quirks across runtimes
    try {
      const fs = await import('fs')
      const fontsDir = path.join(process.cwd(), 'lib', 'fonts')

      const latinRegular = fs.readFileSync(path.join(fontsDir, 'NotoSans-Regular.ttf'))
      const latinBold = fs.readFileSync(path.join(fontsDir, 'NotoSans-Bold.ttf'))
      const bnRegular = fs.readFileSync(path.join(fontsDir, 'NotoSansBengali-Regular.ttf'))
      const bnBold = fs.readFileSync(path.join(fontsDir, 'NotoSansBengali-Bold.ttf'))

      // Ensure atob exists for @react-pdf/font data URL decoding in Node
      if (typeof (globalThis as any).atob !== 'function') {
        ;(globalThis as any).atob = (str: string) => Buffer.from(str, 'base64').toString('binary')
      }

      const toDataUrl = (buf: Buffer) => `data:font/ttf;base64,${buf.toString('base64')}`

      console.log('📊 Font buffers loaded:', {
        latinRegular: latinRegular.length,
        latinBold: latinBold.length,
        bnRegular: bnRegular.length,
        bnBold: bnBold.length,
      })

      Font.register({
        family: 'NotoSans',
        fonts: [
          { src: toDataUrl(latinRegular), fontWeight: 'normal' },
          { src: toDataUrl(latinBold), fontWeight: 'bold' },
        ],
      })

      Font.register({
        family: 'NotoSansBengali',
        fonts: [
          { src: toDataUrl(bnRegular), fontWeight: 'normal' },
          { src: toDataUrl(bnBold), fontWeight: 'bold' },
        ],
      })

      console.log('✅ Fonts registered from data URLs')
    } catch (fontError) {
      console.log('❌ Font registration via data URLs failed:', (fontError as any)?.message)
    }
    
    const { InvoiceDocument } = await import('./invoice-pdf')
    const logoDataUrl = await tryConvertSvgLogoToPngDataUrl()
    const paidStampDataUrl = await tryLoadPaidStampDataUrl()
    const element = InvoiceDocument({ orderData, logoDataUrl, isPaidReceipt, paidStampDataUrl })
    
    const buf = await renderToBuffer(element)
    return buf
  } catch (e) {
    console.log('💥 React PDF error:', (e as any)?.message)
    if (e instanceof Error && e.stack) {
      console.log('📍 React PDF stack:', e.stack)
    }
    // If module not found or any error, return null to use fallback
    return null
  }
}

async function tryConvertSvgLogoToPngDataUrl(): Promise<string | null> {
  try {
    const baseDir = path.join(process.cwd(), 'public')
    const candidates = ['main-logo.png', 'main-logo-compact.png', 'main-logo.svg', 'main-logo-compact.svg']
    let svg: Buffer | null = null
    for (const name of candidates) {
      const p = path.join(baseDir, name)
      if (fs.existsSync(p)) {
        const ext = path.extname(p).toLowerCase()
        const buf = fs.readFileSync(p)
        if (ext === '.png') {
          return `data:image/png;base64,${buf.toString('base64')}`
        }
        svg = buf
        break
      }
    }
    if (!svg) return null
    let sharp: any
    try {
      sharp = (await import('sharp')).default
    } catch {
      return null
    }
    const pngBuffer = await sharp(svg).png({ quality: 90 }).toBuffer()
    const base64 = pngBuffer.toString('base64')
    return `data:image/png;base64,${base64}`
  } catch {
    return null
  }
}

async function tryLoadPaidStampDataUrl(): Promise<string | null> {
  try {
    const baseDir = path.join(process.cwd(), 'public')
    const explicit = [
      'paid-stamp.png',
      'paid-stamp.jpg',
      'paid-stamp.jpeg',
      'paid-stamp.svg',
      'paid-rectangle-stamp-1.png',
    ]
    const files = fs.readdirSync(baseDir)
    const candidates = [...explicit, ...files.filter(f => /paid/i.test(f) && /\.(png|jpg|jpeg|svg)$/i.test(f))]
    for (const name of candidates) {
      const p = path.join(baseDir, name)
      if (!fs.existsSync(p)) continue
      const ext = path.extname(p).toLowerCase()
      const buf = fs.readFileSync(p)
      if (ext === '.png') return `data:image/png;base64,${buf.toString('base64')}`
      if (ext === '.jpg' || ext === '.jpeg') return `data:image/jpeg;base64,${buf.toString('base64')}`
      if (ext === '.svg') {
        let sharp: any
        try {
          sharp = (await import('sharp')).default
        } catch {
          return null
        }
        const pngBuffer = await sharp(buf).png({ quality: 90 }).toBuffer()
        return `data:image/png;base64,${pngBuffer.toString('base64')}`
      }
    }
    return null
  } catch {
    return null
  }
}
