'use client'

import React, { useState } from 'react'
import { SellerProfile } from '@/lib/mock-data'
import {
  X,
  Shield,
  FileText,
  Store,
  Calendar,
  Mail,
  Phone,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Building2,
  CreditCard,
  Loader2
} from 'lucide-react'

interface AdminKycModalProps {
  isOpen: boolean
  onClose: () => void
  seller: SellerProfile | null
  isAdmin?: boolean
  onApprove?: (sellerId: string) => Promise<void>
  onReject?: (sellerId: string, reason?: string) => Promise<void>
  onToast: (msg: string) => void
}

export function AdminKycModal({
  isOpen,
  onClose,
  seller,
  isAdmin = true,
  onApprove,
  onReject,
  onToast,
}: AdminKycModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showRejectReason, setShowRejectReason] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  if (!isOpen || !seller) return null

  const kyc = seller.kyc
  const isApproved = Boolean(seller.verified)
  const status = isApproved ? 'Approved' : kyc?.status === 'rejected' ? 'Rejected' : 'Pending'
  const docType = kyc?.documentType || 'national_id'
  const shopName = seller.shopName || 'Store'
  const ownerName = seller.ownerName || seller.shopName || 'Owner'
  const sellerId = seller.id || seller.email || 'seller-1'
  const initial = shopName.charAt(0).toUpperCase() || 'T'
  const submittedDate = kyc?.submittedAt || seller.memberSince || 'Today'
  const joinedDate = seller.memberSince || '07/08/2026'

  const handleApproveClick = async () => {
    if (!onApprove) return
    try {
      setIsProcessing(true)
      await onApprove(sellerId)
      onToast(`✔ Seller "${shopName}" KYC verified successfully!`)
      onClose()
    } catch (err: any) {
      onToast(`Failed to approve: ${err?.message || 'Error occurred'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectClick = async () => {
    if (!onReject) return
    if (!showRejectReason) {
      setShowRejectReason(true)
      return
    }
    try {
      setIsProcessing(true)
      await onReject(sellerId, rejectReason || 'Document details not clear or invalid.')
      onToast(`Seller "${shopName}" KYC rejected.`)
      setShowRejectReason(false)
      onClose()
    } catch (err: any) {
      onToast(`Failed to reject: ${err?.message || 'Error occurred'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6">
        
        {/* Top Header matching reference image */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              {/* Avatar Circle in light lavender with initial */}
              <div className="w-14 h-14 rounded-full bg-[#f3e8ff] flex items-center justify-center text-purple-700 text-2xl font-bold shrink-0">
                {initial}
              </div>

              {/* Store & Owner Meta */}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    {shopName}
                  </h3>
                  {/* Status Pill */}
                  {status === 'Approved' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
                      <Check size={12} className="stroke-[3]" />
                      Approved
                    </span>
                  ) : status === 'Rejected' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300">
                      <X size={12} className="stroke-[3]" />
                      Rejected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300">
                      Pending
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                  <Store size={13} className="text-slate-400" />
                  <span>{ownerName}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                  <Calendar size={13} className="text-slate-400" />
                  <span>Submitted {submittedDate}</span>
                </div>
              </div>
            </div>

            {/* Circular Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-slate-300 text-slate-500 hover:text-slate-800 hover:border-slate-400 flex items-center justify-center transition-colors cursor-pointer"
              title="Close modal"
            >
              <X size={16} className="stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-b border-slate-100" />

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* 🛡 IDENTITY SECTION */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider mb-3.5">
              <Shield size={14} className="text-slate-700 stroke-[2.2]" />
              <span>IDENTITY</span>
            </div>

            <div className="grid grid-cols-3 gap-y-4 gap-x-4">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  SHOP NAME
                </span>
                <span className="text-sm font-semibold text-slate-900 block truncate">
                  {shopName}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  OWNER
                </span>
                <span className="text-sm font-semibold text-slate-900 block truncate">
                  {ownerName}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  EMAIL
                </span>
                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-800 truncate">
                  <Mail size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{seller.email || '—'}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  PHONE
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-800">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  <span>{seller.phone || '—'}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  JOINED
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-800">
                  <Calendar size={13} className="text-slate-400 shrink-0" />
                  <span>{joinedDate}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  DOCUMENT TYPE
                </span>
                <span className="text-xs font-semibold text-slate-900">
                  {docType}
                </span>
              </div>
            </div>
          </div>

          {/* 📄 SUBMITTED DOCUMENTS SECTION */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              <FileText size={14} className="text-slate-700 stroke-[2.2]" />
              <span>SUBMITTED DOCUMENTS</span>
              <span className="text-slate-400 font-normal lowercase tracking-normal">
                — Type: <span className="font-semibold text-slate-600">{docType}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Document 1: Identity Card / Passport Image */}
              <div className="border border-slate-200/80 rounded-2xl bg-white shadow-xs overflow-hidden flex flex-col">
                <div className="min-h-[190px] bg-[#f8fafc]/70 flex flex-col items-center justify-center p-4 text-center">
                  {kyc?.idCardUrl ? (
                    <a
                      href={kyc.idCardUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex flex-col items-center justify-center"
                    >
                      <img
                        src={kyc.idCardUrl}
                        alt="Identity Document"
                        className="max-h-36 max-w-full rounded-lg object-contain shadow-xs group-hover:opacity-90 transition-opacity"
                      />
                      <span className="mt-2 text-[11px] font-semibold text-blue-600 flex items-center gap-1 group-hover:underline">
                        <span>View Original</span>
                        <ExternalLink size={12} />
                      </span>
                    </a>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <svg
                        className="w-12 h-12 text-slate-300"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      <span className="text-xs font-medium text-slate-500 mt-2.5">
                        No document uploaded
                      </span>
                    </div>
                  )}
                </div>
                <div className="border-t border-slate-100 px-4 py-3 bg-white flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <CreditCard size={15} className="text-slate-500 shrink-0" />
                  <span className="truncate">Identity Card / Passport Image</span>
                </div>
              </div>

              {/* Document 2: Business License Document */}
              <div className="border border-slate-200/80 rounded-2xl bg-white shadow-xs overflow-hidden flex flex-col">
                <div className="min-h-[190px] bg-[#f8fafc]/70 flex flex-col items-center justify-center p-4 text-center">
                  {kyc?.businessLicenseUrl ? (
                    <a
                      href={kyc.businessLicenseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative flex flex-col items-center justify-center"
                    >
                      <img
                        src={kyc.businessLicenseUrl}
                        alt="Business License Document"
                        className="max-h-36 max-w-full rounded-lg object-contain shadow-xs group-hover:opacity-90 transition-opacity"
                      />
                      <span className="mt-2 text-[11px] font-semibold text-blue-600 flex items-center gap-1 group-hover:underline">
                        <span>View Original</span>
                        <ExternalLink size={12} />
                      </span>
                    </a>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <svg
                        className="w-12 h-12 text-slate-300"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      <span className="text-xs font-medium text-slate-500 mt-2.5">
                        No document uploaded
                      </span>
                    </div>
                  )}
                </div>
                <div className="border-t border-slate-100 px-4 py-3 bg-white flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <Building2 size={15} className="text-slate-500 shrink-0" />
                  <span className="truncate">Business License Document</span>
                </div>
              </div>
            </div>
          </div>

          {/* Optional Inline Rejection Reason Field (Admin only) */}
          {isAdmin && showRejectReason && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl animate-in fade-in">
              <label className="block text-xs font-bold text-rose-800 mb-1">
                Reason for Rejection (sent to seller)
              </label>
              <input
                type="text"
                placeholder="e.g. Identity photo is blurry, please provide a clear scan."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-rose-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 p-6 pt-5">
          {isAdmin ? (
            <>
              <div className="grid grid-cols-2 gap-3.5">
                {/* Approve Verification (Green Solid) */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleApproveClick}
                  className="py-3 px-6 rounded-xl bg-[#6ee7b7] hover:bg-[#5eead4] active:bg-[#34d399] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={18} className="stroke-[3]" />
                  )}
                  <span>Approve Verification</span>
                </button>

                {/* Reject Request (Soft Pastel Red) */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleRejectClick}
                  className="py-3 px-6 rounded-xl bg-[#fff1f2] hover:bg-[#ffe4e6] border border-[#fecdd3] text-[#e11d48] font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <X size={18} className="stroke-[2.5]" />
                  )}
                  <span>Reject Request</span>
                </button>
              </div>

              {/* Subtext below buttons */}
              <p className="text-[11px] text-slate-400 text-center mt-3 mb-0">
                Status: <span className="font-semibold text-slate-500">{status}</span> · use the seller&apos;s profile to reset.
              </p>
            </>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                Verification Status: <span className="font-bold text-slate-800">{status}</span>
                {status === 'Pending' && (
                  <span className="text-amber-600 block text-[11px] mt-0.5 font-medium">
                    Your verification documents are currently under review by our administrative team.
                  </span>
                )}
                {status === 'Approved' && (
                  <span className="text-emerald-600 block text-[11px] mt-0.5 font-medium">
                    Your store KYC verification is fully approved and active.
                  </span>
                )}
                {status === 'Rejected' && (
                  <span className="text-rose-600 block text-[11px] mt-0.5 font-medium">
                    Your submission requires changes. Please re-submit updated documents.
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0"
              >
                Close
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
