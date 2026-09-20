'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  initialSellerProfile,
  SellerProfile,
} from '@/lib/mock-data'
import {
  fetchSellerProfile,
  fetchSellerProfiles,
} from '@/lib/supabase/api'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { AdminWithdrawalsView } from '@/components/admin/AdminWithdrawalsView'
import { BrandLogo } from '@/components/ui/BrandLogo'
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
  Check
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

export default function AdminWithdrawalsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<SellerProfile>(initialSellerProfile)
  const [sellers, setSellers] = useState<SellerProfile[]>([])
  const [activeTab, setActiveTab] = useState('Withdrawals')
  const [toast, setToast] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const storedProfile = localStorage.getItem('u_seller_active_profile')
        if (storedProfile) {
          const parsed = JSON.parse(storedProfile)
          if (parsed && parsed.email) setProfile(parsed)
        }

        const storedSellers = localStorage.getItem('u_all_sellers')
        if (storedSellers) {
          const parsed = JSON.parse(storedSellers)
          if (Array.isArray(parsed) && parsed.length > 0) setSellers(parsed)
        }
      }
    } catch {}

    async function syncSupabase() {
      if (!isSupabaseConfigured()) return
      try {
        const [supaProfile, supaSellers] = await Promise.all([
          fetchSellerProfile(),
          fetchSellerProfiles(),
        ])
        if (supaProfile) setProfile(supaProfile)
        if (supaSellers && supaSellers.length > 0) setSellers(supaSellers)
      } catch (err) {
        console.warn('[AdminWithdrawals] Sync error:', err)
      }
    }
    syncSupabase()
  }, [])

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

        {/* Invite Code Widget */}
        <div className="invite mx-4 my-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span>
            INVITE <b className="text-slate-900 font-bold ml-1">MXSVHSDL</b>
          </span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Copy size={14} className="hover:text-slate-700 cursor-pointer" onClick={() => showToast('Invite code copied')} />
            <Pencil size={14} className="hover:text-slate-700 cursor-pointer" onClick={() => showToast('Edit invite code')} />
            <RefreshCw size={14} className="hover:text-slate-700 cursor-pointer" onClick={() => showToast('Refreshed invite code')} />
          </div>
        </div>

        {/* Nav Links */}
        <nav className="admin-nav flex-1 overflow-y-auto p-3 space-y-1" aria-label="Admin navigation">
          {adminNav.map(({ label, icon: Icon, group }, index) => {
            const isFirstInGroup = index === 0 || adminNav[index - 1].group !== group
            const isActive = activeTab === label
            return (
              <div key={label}>
                {isFirstInGroup && (
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-3 pb-1">
                    {group}
                  </div>
                )}
                <button
                  type="button"
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#EEF2FF] text-indigo-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  onClick={() => {
                    setActiveTab(label)
                    if (label === 'Dashboard') {
                      router.push('/admin/dashboard')
                    } else if (label === 'Orders') {
                      router.push('/admin/orders')
                    } else if (label === 'Sellers') {
                      router.push('/admin/sellers')
                    } else if (label === 'KYC') {
                      router.push('/admin/kyc')
                    } else if (label === 'Support') {
                      router.push('/admin/support')
                    } else if (label === 'Recent Actions' || label === 'My Logs') {
                      router.push(`/admin/activity?tab=${encodeURIComponent(label)}`)
                    } else if (label === 'Withdrawals') {
                      router.push('/admin/withdrawals')
                    } else {
                      router.push(`/?mode=admin&tab=${label}`)
                    }
                  }}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              </div>
            )
          })}
        </nav>

        {/* Admin Footer Profile */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
              A
            </div>
            <div>
              <strong className="text-xs text-slate-900 block font-bold leading-tight">Admin Console</strong>
              <span className="text-[10px] text-slate-400">Master Operations</span>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
            onClick={() => router.push('/')}
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <AdminWithdrawalsView
          sellers={sellers}
          onToast={showToast}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />
      </main>

      {/* Toast popup */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check size={16} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}
