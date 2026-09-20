'use client'

import React, { useState, useRef } from 'react'
import { SellerProfile, KycSubmission } from '@/lib/mock-data'
import { submitKycReport } from '@/lib/supabase/api'
import {
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Building2,
  Trash2,
  Loader2
} from 'lucide-react'

interface KycSubmitModalProps {
  isOpen: boolean
  onClose: () => void
  profile: SellerProfile
  onSubmitted: (updatedProfile: SellerProfile) => void
  onToast: (msg: string) => void
}

export function KycSubmitModal({
  isOpen,
  onClose,
  profile,
  onSubmitted,
  onToast,
}: KycSubmitModalProps) {
  const [docType, setDocType] = useState<'national_id' | 'passport' | 'driving_license' | 'business_license'>(
    (profile.kyc?.documentType as any) || 'national_id'
  )
  const [ownerName, setOwnerName] = useState(profile.ownerName || '')
  const [shopName, setShopName] = useState(profile.shopName || '')
  const [email, setEmail] = useState(profile.email || '')
  const [phone, setPhone] = useState(profile.phone || '')

  // File Upload State
  const [idCardFile, setIdCardFile] = useState<File | null>(null)
  const [idCardPreview, setIdCardPreview] = useState<string>(profile.kyc?.idCardUrl || '')
  const [businessFile, setBusinessFile] = useState<File | null>(null)
  const [businessPreview, setBusinessPreview] = useState<string>(profile.kyc?.businessLicenseUrl || '')

  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>('')

  const idCardInputRef = useRef<HTMLInputElement>(null)
  const businessInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  // Handle local file selection with preview
  const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIdCardFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      setIdCardPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusinessFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      setBusinessPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Upload file helper via /api/upload
  const uploadToStorage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'kyc-documents')

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to upload document to storage')
    }

    const json = await res.json()
    return json.url || ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!idCardPreview && !idCardFile) {
      onToast('Please provide an Identity Card / Passport document.')
      return
    }

    setIsUploading(true)
    setUploadStatus('Uploading documents to storage bucket...')

    try {
      let finalIdCardUrl = idCardPreview
      if (idCardFile) {
        setUploadStatus('Uploading Identity Card / Passport...')
        finalIdCardUrl = await uploadToStorage(idCardFile)
      }

      let finalBusinessUrl = businessPreview
      if (businessFile) {
        setUploadStatus('Uploading Business License Document...')
        finalBusinessUrl = await uploadToStorage(businessFile)
      }

      setUploadStatus('Saving KYC report for administrator review...')

      const kycData: Partial<KycSubmission> = {
        status: 'pending',
        documentType: docType,
        idCardUrl: finalIdCardUrl,
        businessLicenseUrl: finalBusinessUrl,
        shopName: shopName || profile.shopName,
        ownerName: ownerName || profile.ownerName,
        email: email || profile.email,
        phone: phone || profile.phone,
        joined: profile.memberSince || 'Aug 2026',
      }

      const success = await submitKycReport(profile.id || 'seller-1', kycData)

      if (success) {
        const updated: SellerProfile = {
          ...profile,
          verified: false,
          kyc: {
            status: 'pending',
            submittedAt: new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            documentType: docType,
            idCardUrl: finalIdCardUrl,
            businessLicenseUrl: finalBusinessUrl,
            shopName: shopName || profile.shopName,
            ownerName: ownerName || profile.ownerName,
            email: email || profile.email,
            phone: phone || profile.phone,
            joined: profile.memberSince || '07/08/2026',
          },
        }

        onSubmitted(updated)
        onToast('🎉 KYC Report submitted! Your verification is now under administrator review.')
        onClose()
      } else {
        throw new Error('Failed to save KYC report.')
      }
    } catch (err: any) {
      console.error('[KYC Submit Error]:', err)
      onToast(`Error submitting KYC: ${err.message || 'Please try again.'}`)
    } finally {
      setIsUploading(false)
      setUploadStatus('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header matching design */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 grid place-items-center font-bold">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 m-0">
                Submit KYC Verification Report
              </h2>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Upload your identity documents to unlock your seller workspace
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Identity Fields Preview / Edit */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              <ShieldCheck size={14} className="text-blue-600" />
              <span>Identity & Business Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Shop Name
                </label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Store Owner Full Name
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* Document Type Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Primary Document Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'national_id', label: 'National ID' },
                { id: 'passport', label: 'Passport' },
                { id: 'driving_license', label: 'Driver License' },
                { id: 'business_license', label: 'Business Reg.' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDocType(t.id as any)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    docType === t.id
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Two Upload Cards Matching Screenshot Layout */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              <FileText size={14} className="text-blue-600" />
              <span>Submitted Documents — Type: {docType}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Identity Card / Passport */}
              <div className="border border-slate-200/90 rounded-2xl p-4 bg-slate-50/50 flex flex-col items-center justify-between min-h-[220px] relative group">
                <input
                  type="file"
                  ref={idCardInputRef}
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleIdCardChange}
                />

                {idCardPreview ? (
                  <div className="w-full flex-1 flex flex-col items-center justify-center relative">
                    <img
                      src={idCardPreview}
                      alt="Identity Card"
                      className="max-h-36 max-w-full rounded-xl object-contain shadow-xs border border-slate-200"
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 p-1 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-100"
                      onClick={() => {
                        setIdCardPreview('')
                        setIdCardFile(null)
                      }}
                      title="Remove document"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    className="w-full flex-1 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-4 hover:border-blue-400 transition-colors cursor-pointer text-center"
                    onClick={() => idCardInputRef.current?.click()}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-xs grid place-items-center text-slate-400 mb-2">
                      <ImageIcon size={24} />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 block">
                      Click to upload Identity Card
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      JPG, PNG, or PDF up to 10MB
                    </span>
                  </div>
                )}

                <div className="w-full mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700 font-medium">
                  <span className="flex items-center gap-1.5 truncate">
                    <ImageIcon size={14} className="text-slate-400" />
                    <span>Identity Card / Passport Image</span>
                  </span>
                  {idCardPreview && <CheckCircle size={14} className="text-emerald-500 shrink-0" />}
                </div>
              </div>

              {/* Card 2: Business License Document */}
              <div className="border border-slate-200/90 rounded-2xl p-4 bg-slate-50/50 flex flex-col items-center justify-between min-h-[220px] relative group">
                <input
                  type="file"
                  ref={businessInputRef}
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleBusinessChange}
                />

                {businessPreview ? (
                  <div className="w-full flex-1 flex flex-col items-center justify-center relative">
                    <img
                      src={businessPreview}
                      alt="Business License"
                      className="max-h-36 max-w-full rounded-xl object-contain shadow-xs border border-slate-200"
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 p-1 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-100"
                      onClick={() => {
                        setBusinessPreview('')
                        setBusinessFile(null)
                      }}
                      title="Remove document"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    className="w-full flex-1 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-4 hover:border-blue-400 transition-colors cursor-pointer text-center"
                    onClick={() => businessInputRef.current?.click()}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-xs grid place-items-center text-slate-400 mb-2">
                      <Building2 size={24} />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 block">
                      Click to upload Business License
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Optional proof of registration / license
                    </span>
                  </div>
                )}

                <div className="w-full mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700 font-medium">
                  <span className="flex items-center gap-1.5 truncate">
                    <Building2 size={14} className="text-slate-400" />
                    <span>Business License Document</span>
                  </span>
                  {businessPreview && <CheckCircle size={14} className="text-emerald-500 shrink-0" />}
                </div>
              </div>
            </div>
          </div>

          {/* Uploading progress status */}
          {isUploading && (
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl text-xs flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-blue-600" />
              <span className="font-semibold">{uploadStatus}</span>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Submitting Report...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Submit KYC for Verification</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
