import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      ''

    const authKey = serviceRoleKey || anonKey

    if (!supabaseUrl || !authKey) {
      return NextResponse.json(
        { error: 'Supabase credentials not configured on server' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided in form data' },
        { status: 400 }
      )
    }

    const bucketParam = (formData.get('bucket') as string) || 'product-images'
    const bucketName = bucketParam === 'kyc-documents' ? 'kyc-documents' : 'product-images'

    // Validate mime type: allow images, and also PDFs for kyc-documents
    const isImage = file.type.startsWith('image/')
    const isPdf = file.type === 'application/pdf'
    if (!isImage && !(bucketName === 'kyc-documents' && isPdf)) {
      return NextResponse.json(
        { error: 'Uploaded file must be an image (jpg, png, webp) or PDF document' },
        { status: 400 }
      )
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, authKey, {
      auth: { persistSession: false },
    })

    // Ensure bucket exists
    try {
      await supabase.storage.createBucket(bucketName, { public: true })
    } catch {
      // Bucket may already exist
    }

    // Sanitize extension and generate unique file name
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'pdf']
    const cleanExt = allowedExts.includes(ext) ? ext : (isPdf ? 'pdf' : 'jpg')
    const prefix = bucketName === 'kyc-documents' ? 'kyc' : 'prod'
    const uniqueName = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${cleanExt}`

    // Convert file to ArrayBuffer / Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(uniqueName, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      })

    if (error) {
      console.error('[Supabase Storage Upload Error]:', error)
      return NextResponse.json(
        { error: `Storage upload failed: ${error.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(uniqueName)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName: uniqueName,
      size: file.size,
      type: file.type,
    })
  } catch (err: any) {
    console.error('[Upload API Exception]:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error during upload' },
      { status: 500 }
    )
  }
}
