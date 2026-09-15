'use client'

import React, { useState, useRef } from 'react'
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Link as LinkIcon,
  RefreshCw
} from 'lucide-react'

interface ProductImageUploaderProps {
  value: string
  onChange: (url: string) => void
  onToast?: (msg: string) => void
}

export function ProductImageUploader({
  value,
  onChange,
  onToast,
}: ProductImageUploaderProps) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      const msg = 'Please select a valid image file (PNG, JPG, WEBP, etc.)'
      setUploadError(msg)
      onToast?.(msg)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      const msg = 'Image file must be smaller than 10MB'
      setUploadError(msg)
      onToast?.(msg)
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload image')
      }

      onChange(data.url)
      onToast?.('Image successfully uploaded to Supabase Storage!')
    } catch (err: any) {
      console.error('[Upload error]:', err)
      const errorMsg = err.message || 'Error uploading image'
      setUploadError(errorMsg)
      onToast?.(errorMsg)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

  const isSupabaseStorage =
    value && (value.includes('supabase.co/storage') || value.startsWith('https://'))

  return (
    <div className="product-image-uploader space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">
          PRODUCT IMAGE
        </label>
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              mode === 'upload'
                ? 'bg-white text-blue-600 font-bold shadow-2xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              mode === 'url'
                ? 'bg-white text-blue-600 font-bold shadow-2xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Image URL
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {value ? (
            /* Image Preview & Change State */
            <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 p-3 flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 relative flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={value}
                  alt="Product preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 mb-1">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span className="truncate">
                    {value.includes('supabase.co/storage')
                      ? 'Saved in Supabase Storage'
                      : 'Image Attached'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-full font-mono mb-2">
                  {value}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isUploading ? (
                      <Loader2 size={12} className="animate-spin text-blue-600" />
                    ) : (
                      <RefreshCw size={12} />
                    )}
                    <span>{isUploading ? 'Uploading...' : 'Replace Image'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange('')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={13} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Dropzone Empty State matching screenshot */
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-7 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                  : 'border-blue-200 hover:border-blue-300 bg-white'
              } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50/80 text-blue-600 flex items-center justify-center shadow-2xs mb-1">
                {isUploading ? (
                  <Loader2 size={24} className="animate-spin text-blue-600" />
                ) : (
                  <UploadCloud size={24} className="stroke-[2.2]" />
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-slate-800">
                  {isUploading
                    ? 'Uploading to Supabase Storage...'
                    : 'Click or drag image file here to upload'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                  Supports PNG, JPG, JPEG, WEBP (up to 10MB)
                </p>
              </div>

              <span className="mt-2.5 px-4 py-1.5 bg-white border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors">
                Browse Files
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Image URL Input Mode */
        <div className="space-y-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <LinkIcon size={14} />
            </div>
            <input
              type="url"
              placeholder="https://images.unsplash.com/... or Supabase public URL"
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
          {value && (
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={value}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs text-slate-600 truncate font-mono">{value}</span>
            </div>
          )}
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-xl">
          <AlertCircle size={14} className="shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  )
}
