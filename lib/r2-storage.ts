import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

// R2 Configuration
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export class R2StorageService {
  private static bucketName = process.env.R2_BUCKET_NAME!
  private static publicUrl = process.env.PUBLIC_R2_DEV_BUCKET_URL!

  static async uploadPDF(
    buffer: Buffer, 
    fileName: string, 
    contentType: string = 'application/pdf'
  ): Promise<string> {
    try {
      const key = `invoices/${fileName}`
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ContentDisposition: `attachment; filename="${fileName}"`,
        // Make the object publicly readable
        ACL: 'public-read',
      })

      await r2Client.send(command)
      
      // Return the public URL
      const publicUrl = `${this.publicUrl}/${key}`
      return publicUrl
    } catch (error) {
      console.error('R2 upload error:', error)
      throw new Error('Failed to upload PDF to R2 storage')
    }
  }

  static async downloadPDF(fileName: string): Promise<Buffer> {
    try {
      const key = `invoices/${fileName}`
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      const response = await r2Client.send(command)
      
      if (!response.Body) {
        throw new Error('PDF not found')
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = []
      const reader = response.Body.transformToWebStream().getReader()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }
      
      return Buffer.concat(chunks)
    } catch (error) {
      console.error('R2 download error:', error)
      throw new Error('Failed to download PDF from R2 storage')
    }
  }

  static generateFileName(orderId: string): string {
    const timestamp = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    return `invoice-${orderId}-${timestamp}.pdf`
  }

  static generatePaidReceiptFileName(orderId: string): string {
    const timestamp = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    return `receipt-${orderId}-paid-${timestamp}.pdf`
  }
}