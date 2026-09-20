'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  initialProducts,
  initialOrders,
  initialSellerProfile,
  Product,
  Order,
  SellerProfile
} from '@/lib/mock-data'
import {
  fetchProducts,
  fetchOrders,
  fetchSellerProfile,
  fetchSellerProfiles,
} from '@/lib/supabase/api'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { AdminSellersView } from '@/components/admin/AdminSellersView'
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

export default function AdminSellersPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [profile, setProfile] = useState<SellerProfile>(initialSellerProfile)
  const [sellers, setSellers] = useState<SellerProfile[]>([])
  const [activeTab, setActiveTab] = useState('Sellers')
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
        const storedOrders = localStorage.getItem('u_seller_orders')
        if (storedOrders) {
          const parsed = JSON.parse(storedOrders)
          if (Array.isArray(parsed)) setOrders(parsed)
        }
        const storedProducts = localStorage.getItem('u_seller_products')
        if (storedProducts) {
          const parsed = JSON.parse(storedProducts)
          if (Array.isArray(parsed)) {
            setProducts(parsed)
          }
        }
        const storedProfile = localStorage.getItem('u_seller_active_profile')
        if (storedProfile) setProfile(JSON.parse(storedProfile))

        const storedSellers = localStorage.getItem('u_all_sellers')
        if (storedSellers) {
          const parsed = JSON.parse(storedSellers)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSellers(parsed.filter((s: SellerProfile) => !s.isDeleted))
          }
        }
      }
    } catch {}

    async function syncSupabase() {
      if (!isSupabaseConfigured()) return
      try {
        const [supaOrders, supaProds, supaProfile, supaSellers] = await Promise.all([
          fetchOrders(),
          fetchProducts(),
          fetchSellerProfile(),
          fetchSellerProfiles(),
        ])
        if (supaOrders) setOrders(supaOrders)
        if (supaProds) setProducts(supaProds)
        if (supaProfile) setProfile(supaProfile)
        if (supaSellers && supaSellers.length > 0) {
          setSellers(supaSellers.filter((s) => !s.isDeleted))
        }
      } catch (err) {
        console.warn('[AdminSellers] Sync error:', err)
      }
    }
    syncSupabase()

    const handleSellerRemovedAction = (e: any) => {
      const removed = e.detail || {}
      if (removed.id || removed.email) {
        setSellers((prev) =>
          prev.filter(
            (s) =>
              s.id !== removed.id &&
              s.email?.toLowerCase() !== (removed.email || '').toLowerCase()
          )
        )
      }
    }

    window.addEventListener('u_seller_removed', handleSellerRemovedAction)
    window.addEventListener('u_all_sellers_updated', handleSellerRemovedAction)
    return () => {
      window.removeEventListener('u_seller_removed', handleSellerRemovedAction)
      window.removeEventListener('u_all_sellers_updated', handleSellerRemovedAction)
    }
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

      {/* Admin Sidebar matching screenshot */}
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
            const isActive = activeTab === label
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
                    setActiveTab(label)
                    if (label === 'Dashboard') {
                      router.push('/admin/dashboard')
                    } else if (label === 'Orders') {
                      router.push('/admin/orders')
                    } else if (label === 'Sellers') {
                      // Already here
                    } else if (label === 'KYC') {
                      router.push('/admin/kyc')
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

      {/* Main Content Area */}
      <main className="admin-main flex-1 overflow-y-auto pb-16">
        {/* Mobile Top Header */}
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
              <span className="text-[10px] text-purple-300 font-semibold">Sellers</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
          {mounted ? (
            <AdminSellersView
              initialSeller={profile}
              sellers={sellers}
              products={products}
              orders={orders}
              onToast={showToast}
              onDeleteSeller={(s) => {
                setSellers((prev) => prev.filter((item) => item.id !== s.id && item.email !== s.email))
              }}
              onSwitchToSeller={(s) => {
                if (s) {
                  try {
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('u_seller_active_profile', JSON.stringify(s))
                      localStorage.setItem(
                        'u_auth_session',
                        JSON.stringify({
                          role: 'seller',
                          profile: s,
                          email: s.email,
                          shopName: s.shopName,
                          ownerName: s.ownerName,
                        })
                      )
                    }
                  } catch {}
                }
                router.push('/?mode=seller')
              }}
            />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 animate-pulse" />
                  <div className="h-6 w-32 bg-slate-200 rounded-lg animate-pulse" />
                </div>
                <div className="h-9 w-64 bg-slate-100 rounded-xl animate-pulse" />
              </div>
              <div className="h-28 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs animate-pulse" />
            </div>
          )}
        </div>
      </main>

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
