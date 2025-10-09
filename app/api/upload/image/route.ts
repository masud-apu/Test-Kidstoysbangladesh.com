import { NextRequest, NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Determine if the file is a video based on MIME type
    const isVideo = file.type.startsWith('video/')

    const response = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'products',
          resource_type: isVideo ? 'video' : 'image',
          // For videos, ensure web-compatible format and generate thumbnail
          ...(isVideo && {
            format: 'mp4',
            quality: 'auto',
            eager: [
              { width: 400, height: 400, crop: 'fill', format: 'jpg' }
            ],
            eager_async: true,
          })
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else {
            resolve(result)
          }
        }
      ).end(buffer)
    })

    const result = response as {
      secure_url: string;
      resource_type: string;
      public_id: string;
      eager?: Array<{ secure_url: string }>;
    }

    // For videos, build a guaranteed MP4 URL using public_id
    const url = (result.resource_type === 'video')
      ? cloudinary.url(result.public_id, { resource_type: 'video', format: 'mp4', secure: true })
      : result.secure_url

    // Return media item object with type information
    return NextResponse.json({
      success: true,
      url,
      type: result.resource_type === 'video' ? 'video' : 'image',
      thumbnail: result.eager?.[0]?.secure_url,
    })
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error)
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    )
  }
}