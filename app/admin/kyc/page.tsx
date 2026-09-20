'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  SellerProfile,
  initialSellerProfile,
} from '@/lib/mock-data'
import {
  fetchSellerProfiles,
  reviewKycSubmission,
} from '@/lib/supabase/api'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { AdminKycModal } from '@/components/admin/AdminKycModal'
import {
  Grid2X2,
  Users,
  ShieldCheck,
  ShoppingBag,
  MessageSquare,
  WalletCards,
  Activity,
  FileText,
  LogOut,
  Copy,
  Pencil,
  RefreshCw,
  Menu,
  X,
  Check,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  ExternalLink,
  CreditCard,
  Building2,
  ShieldAlert
} from 'lucide-react'

const adminNav = [
  { label: 'Dashboard', icon: Grid2X2, group: 'Manage' },
  { label: 'Sellers', icon: Users, group: 'Manage' },
  { label: 'KYC', icon: ShieldCheck, group: 'Manage' },
  { label: 'Orders', icon: ShoppingBag, group: 'Manage' },
  { label: 'Support', icon: MessageSquare, group: 'Communication' },
  { label: 'Withdrawals', icon: WalletCards, group: 'Finance' },
  { label: 'Recent Actions', icon: Activity, group: 'Activity' },
  { label: 'My Logs', icon: FileText, group: 'Activity' },
]

export default function AdminKycPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [sellers, setSellers] = useState<SellerProfile[]>([])
  const [selectedSeller, setSelectedSeller] = useState<SellerProfile | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [toast, setToast] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(''), 2800)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const storedSellers = localStorage.getItem('u_all_sellers')
        if (storedSellers) {
          const parsed = JSON.parse(storedSellers)
          if (Array.isArray(parsed) && parsed.length > 0) setSellers(parsed)
        }
      }
    } catch {}

    async function syncSupabase() {
      try {
        const supaSellers = await fetchSellerProfiles()
        if (supaSellers && supaSellers.length > 0) {
          setSellers(supaSellers)
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem('u_all_sellers', JSON.stringify(supaSellers))
            }
          } catch {}
        }
      } catch (err) {
        console.warn('[AdminKycPage] Sync error:', err)
      }
    }
    syncSupabase()
  }, [])

  const handleApprove = async (sellerId: string) => {
    const target = sellers.find((s) => s.id === sellerId)
    const success = await reviewKycSubmission(sellerId, 'approved', undefined, target?.email)
    if (success) {
      setSellers((prev) =>
        prev.map((s) =>
          s.id === sellerId
            ? {
                ...s,
                verified: true,
                kyc: {
                  ...(s.kyc || {
                    status: 'approved',
                    documentType: 'national_id',
                    submittedAt: 'Today',
                  }),
                  status: 'approved',
                },
              }
            : s
        )
      )
      // Update active profile if it matches
      try {
        if (typeof window !== 'undefined') {
          const active = localStorage.getItem('u_seller_active_profile')
          if (active) {
            const parsed = JSON.parse(active)
            if (parsed.id === sellerId) {
              parsed.verified = true
              if (parsed.kyc) parsed.kyc.status = 'approved'
              localStorage.setItem('u_seller_active_profile', JSON.stringify(parsed))
            }
          }
        }
      } catch {}
    } else {
      throw new Error('Database update failed')
    }
  }

  const handleReject = async (sellerId: string, reason?: string) => {
    const target = sellers.find((s) => s.id === sellerId)
    const success = await reviewKycSubmission(sellerId, 'rejected', reason, target?.email)
    if (success) {
      setSellers((prev) =>
        prev.map((s) =>
          s.id === sellerId
            ? {
                ...s,
                verified: false,
                kyc: {
                  ...(s.kyc || {
                    status: 'rejected',
                    documentType: 'national_id',
                    submittedAt: 'Today',
                  }),
                  status: 'rejected',
                  rejectionReason: reason || 'Information does not match criteria.',
                },
              }
            : s
        )
      )
      try {
        if (typeof window !== 'undefined') {
          const active = localStorage.getItem('u_seller_active_profile')
          if (active) {
            const parsed = JSON.parse(active)
            if (parsed.id === sellerId) {
              parsed.verified = false
              if (parsed.kyc) {
                parsed.kyc.status = 'rejected'
                parsed.kyc.rejectionReason = reason
              }
              localStorage.setItem('u_seller_active_profile', JSON.stringify(parsed))
            }
          }
        }
      } catch {}
    } else {
      throw new Error('Database update failed')
    }
  }

  // Filter sellers
  const filteredSellers = sellers.filter((s) => {
    const isApproved = Boolean(s.verified)
    const isPending = !isApproved && s.kyc?.status === 'pending'
    const isRejected = !isApproved && s.kyc?.status === 'rejected'

    if (statusFilter === 'pending' && !isPending) return false
    if (statusFilter === 'approved' && !isApproved) return false
    if (statusFilter === 'rejected' && !isRejected) return false

    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (s.shopName || '').toLowerCase().includes(q) ||
      (s.ownerName || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    )
  })

  // Summary counts
  const totalCount = sellers.length
  const pendingCount = sellers.filter((s) => !s.verified && s.kyc?.status === 'pending').length
  const approvedCount = sellers.filter((s) => s.verified).length
  const rejectedCount = sellers.filter((s) => !s.verified && s.kyc?.status === 'rejected').length

  return (
    <div className="app-shell admin-shell min-h-screen flex flex-col md:flex-row bg-[#F8FAFC]">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`sidebar admin-sidebar ${
          isMobileMenuOpen
            ? 'fixed inset-y-0 left-0 z-50 flex flex-col shadow-2xl translate-x-0 w-[270px] bg-white border-r border-slate-100'
            : 'hidden md:flex flex-col w-[270px] bg-white border-r border-slate-100 min-h-screen shrink-0'
        }`}
      >
        <div className="brand flex items-center justify-between p-4 border-b border-slate-100">
          <BrandLogo size="md" subtitle="Management Console" />
          {isMobileMenuOpen && (
            <button
              type="button"
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Administrator User Card */}
        <div className="admin-user p-4 flex items-center gap-3">
          <div className="avatar admin-avatar relative w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            z<span className="online-dot absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
          </div>
          <div>
            <strong className="text-sm font-bold text-slate-900 block leading-tight">zain</strong>
            <span className="text-xs text-slate-400 font-normal block leading-tight mt-0.5">Administrator</span>
          </div>
        </div>

        {/* Invite Code Widget */}
        <div className="invite mx-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span className="text-[11px] text-slate-400 font-semibold tracking-wider">
            INVITE <b className="text-slate-900 font-bold ml-1.5 text-xs">MXSVHSDL</b>
          </span>
          <div className="flex items-center gap-2 text-slate-400">
            <Copy size={13} className="hover:text-slate-700 cursor-pointer transition-colors" onClick={() => showToast('Invite code copied')} />
            <Pencil size={13} className="hover:text-slate-700 cursor-pointer transition-colors" onClick={() => showToast('Edit invite code')} />
            <RefreshCw size={13} className="hover:text-slate-700 cursor-pointer transition-colors" onClick={() => showToast('Refreshed invite code')} />
          </div>
        </div>

        {/* Nav Links */}
        <nav className="admin-nav flex-1 overflow-y-auto p-3 space-y-1" aria-label="Admin navigation">
          {adminNav.map(({ label, icon: Icon, group }, index) => {
            const isFirstInGroup = index === 0 || adminNav[index - 1].group !== group
            const isActive = label === 'KYC'
            return (
              <div key={label} className="relative">
                {isFirstInGroup && (
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-3 pb-1">
                    {group}
                  </div>
                )}
                <button
                  type="button"
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-[#EEF2FF] text-indigo-600 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  onClick={() => {
                    if (label === 'Dashboard') {
                      router.push('/admin/dashboard')
                    } else if (label === 'Orders') {
                      router.push('/admin/orders')
                    } else if (label === 'Sellers') {
                      router.push('/admin/sellers')
                    } else if (label === 'KYC') {
                      // already here
                    } else if (label === 'Support') {
                      router.push('/admin/support')
                    } else if (label === 'Recent Actions' || label === 'My Logs') {
                      router.push(`/admin/activity?tab=${encodeURIComponent(label)}`)
                    } else {
                      router.push(`/?mode=admin&tab=${label}`)
                    }
                  }}
                >
                  {isActive && (
                    <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />
                  )}
                  <Icon size={17} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                  <span>{label}</span>
                </button>
              </div>
            )
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-3 border-t border-slate-100 mt-auto">
          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
            onClick={() => router.push('/')}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main flex-1 overflow-y-auto pb-16">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="p-1.5 -ml-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
            <BrandLogo size="sm" variant="light" showText={false} />
            <div>
              <strong className="text-xs font-bold text-white block leading-tight">Admin Console</strong>
              <span className="text-[10px] text-purple-300 font-semibold">KYC Verification</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 max-w-[1400px] mx-auto space-y-6">
          {/* Header Title Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-7 bg-blue-600 rounded-r-md -ml-4 sm:-ml-6 shrink-0 hidden sm:block" />
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} className="stroke-[2.2]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">KYC Verification</h1>
                <p className="text-xs text-slate-400 font-normal m-0 mt-0.5">
                  Review identity reports, national IDs, and business licenses submitted to the database bucket.
                </p>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[260px] sm:min-w-[320px]">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search merchant, owner, or email..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => setStatusFilter('all')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-50'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Merchants
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {totalCount}
              </div>
            </div>

            <div
              onClick={() => setStatusFilter('pending')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-50/40 border-amber-500 shadow-md ring-2 ring-amber-50'
                  : 'bg-white border-slate-200/80 hover:border-amber-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                  Pending Review
                </span>
                <Clock size={14} className="text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-amber-900 mt-1">
                {pendingCount}
              </div>
            </div>

            <div
              onClick={() => setStatusFilter('approved')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-emerald-50/40 border-emerald-500 shadow-md ring-2 ring-emerald-50'
                  : 'bg-white border-slate-200/80 hover:border-emerald-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Approved & Verified
                </span>
                <CheckCircle2 size={14} className="text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-900 mt-1">
                {approvedCount}
              </div>
            </div>

            <div
              onClick={() => setStatusFilter('rejected')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                statusFilter === 'rejected'
                  ? 'bg-rose-50/40 border-rose-500 shadow-md ring-2 ring-rose-50'
                  : 'bg-white border-slate-200/80 hover:border-rose-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                  Rejected / Action Req.
                </span>
                <AlertCircle size={14} className="text-rose-500" />
              </div>
              <div className="text-2xl font-bold text-rose-900 mt-1">
                {rejectedCount}
              </div>
            </div>
          </div>

          {/* List of KYC Verification Requests */}
          <div className="space-y-3.5">
            {filteredSellers.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 grid place-items-center mx-auto mb-3">
                  <ShieldAlert size={22} />
                </div>
                <h3 className="text-sm font-bold text-slate-800 m-0">No verification reports found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {statusFilter !== 'all'
                    ? `No merchants currently match the "${statusFilter}" status filter.`
                    : 'There are no merchant KYC submissions in the database.'}
                </p>
                {statusFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer shadow-xs"
                  >
                    View All Verification Reports
                  </button>
                )}
              </div>
            ) : (
              filteredSellers.map((s) => {
                const isApproved = Boolean(s.verified)
                const isPending = !isApproved && s.kyc?.status === 'pending'
                const isRejected = !isApproved && s.kyc?.status === 'rejected'
                const docType = s.kyc?.documentType || 'national_id'
                const hasDocuments = Boolean(s.kyc?.idCardUrl || s.kyc?.businessLicenseUrl)

                return (
                  <div
                    key={s.id || s.email}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* Seller Identity & Avatar */}
                    <div className="flex items-center gap-3.5 min-w-[280px]">
                      <div className="w-12 h-12 rounded-2xl bg-[#f3e8ff] text-purple-700 font-bold text-lg flex items-center justify-center shrink-0">
                        {s.shopName ? s.shopName.charAt(0).toUpperCase() : 'T'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-bold text-slate-900">
                            {s.shopName}
                          </strong>
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
                              <Check size={11} className="stroke-[3]" />
                              Approved
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300">
                              <X size={11} className="stroke-[3]" />
                              Rejected
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300">
                              <Clock size={11} />
                              Pending Review
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-500 border border-slate-200">
                              Not Submitted
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Owner: <span className="font-semibold text-slate-700">{s.ownerName || s.shopName}</span> · {s.email}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Document Type: <span className="font-semibold text-slate-600">{docType}</span> · Submitted {s.kyc?.submittedAt || s.memberSince || 'Recently'}
                        </div>
                      </div>
                    </div>

                    {/* Document Previews */}
                    <div className="flex items-center gap-3 py-2 lg:py-0 border-t lg:border-t-0 border-slate-100">
                      {/* ID Card preview thumbnail */}
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80">
                        <CreditCard size={16} className="text-slate-500" />
                        <span className="text-xs font-semibold text-slate-700">Identity:</span>
                        {s.kyc?.idCardUrl ? (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <Check size={12} className="stroke-[3]" /> Uploaded
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">None</span>
                        )}
                      </div>

                      {/* Business License preview thumbnail */}
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80">
                        <Building2 size={16} className="text-slate-500" />
                        <span className="text-xs font-semibold text-slate-700">License:</span>
                        {s.kyc?.businessLicenseUrl ? (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <Check size={12} className="stroke-[3]" /> Uploaded
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">None</span>
                        )}
                      </div>
                    </div>

                    {/* Action Button: Open exact inspect modal */}
                    <div className="flex items-center gap-2 self-start lg:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSeller(s)
                          setIsModalOpen(true)
                        }}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye size={14} />
                        <span>Inspect & Review</span>
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </main>

      {/* Admin KYC Modal matching user reference screenshot */}
      <AdminKycModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        seller={selectedSeller}
        onApprove={handleApprove}
        onReject={handleReject}
        onToast={showToast}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check size={16} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}
