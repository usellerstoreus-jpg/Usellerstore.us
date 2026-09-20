'use client'

import React from 'react'
import { SellerProfile } from '@/lib/mock-data'
import { ShieldAlert, Clock, AlertCircle, CheckCircle, ArrowRight, FileCheck, Eye } from 'lucide-react'

interface KycBannerProps {
  profile: SellerProfile
  onOpenSubmitModal: () => void
  onOpenViewModal?: () => void
}

export function KycBanner({
  profile,
  onOpenSubmitModal,
  onOpenViewModal,
}: KycBannerProps) {
  const kyc = profile.kyc
  const isApproved = Boolean(profile.verified)
  const isPending = !isApproved && kyc?.status === 'pending'
  const isRejected = !isApproved && kyc?.status === 'rejected'
  const isUnsubmitted = !isApproved && !isPending && !isRejected

  // If approved, we can render a sleek verified indicator or null
  if (isApproved) {
    return null
  }

  if (isPending) {
    return (
      <div className="mx-4 sm:mx-6 mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Clock size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-sm font-bold text-slate-900">
                KYC Verification Under Review
              </strong>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-extrabold uppercase">
                In Review
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
              Your identity report was submitted to the platform administrator on{' '}
              <span className="font-semibold text-slate-800">{kyc?.submittedAt || 'recently'}</span>.
              Full selling, order fulfillment, and withdrawal capabilities will unlock immediately upon approval.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            type="button"
            className="px-3.5 py-2 rounded-xl bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            onClick={onOpenViewModal || onOpenSubmitModal}
          >
            <Eye size={14} />
            <span>View Submitted Documents</span>
          </button>
        </div>
      </div>
    )
  }

  if (isRejected) {
    return (
      <div className="mx-4 sm:mx-6 mt-4 p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <AlertCircle size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-sm font-bold text-slate-900">
                KYC Verification Rejected
              </strong>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold uppercase">
                Action Required
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
              {kyc?.rejectionReason
                ? `Administrator feedback: "${kyc.rejectionReason}". `
                : 'Your documents could not be verified by the administrator. '}
              Please re-submit clear images of your Identity Card/Passport and Business License.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            onClick={onOpenSubmitModal}
          >
            <span>Re-submit KYC Report</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    )
  }

  // Unsubmitted (Default state for new seller)
  return (
    <div className="mx-4 sm:mx-6 mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <ShieldAlert size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <strong className="text-sm font-bold text-slate-900">
              Identity Verification Required (KYC Report)
            </strong>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wide">
              View-Only Mode
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
            Welcome to U Seller Store! Your store is currently in <b className="text-slate-800">View-Only</b> mode. You can browse products and your storefront, but must submit a KYC verification report for administrator approval before publishing products, managing orders, or requesting payouts.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
        <button
          type="button"
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          onClick={onOpenSubmitModal}
        >
          <FileCheck size={15} />
          <span>Submit KYC Report</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
