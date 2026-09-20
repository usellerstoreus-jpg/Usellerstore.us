'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  Check,
  X,
  Sparkles,
  Users,
  Search,
  LogIn,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  CalendarDays,
  Store,
  ArrowUpRight,
  Copy,
  Pencil,
  RefreshCw,
  ShoppingBag,
  ShieldCheck,
  HeartPulse,
  MessageSquare,
  WalletCards,
  Activity,
  Grid2X2,
  Lock,
  Building2,
  TrendingUp,
  CircleDollarSign,
  ShieldAlert,
  ArrowRight,
  KeyRound,
  FileCheck,
  CheckCircle,
  Eye,
  EyeOff,
  Mail,
  ArrowLeft,
  Box,
  Wallet,
  Menu,
  LayoutDashboard,
  Package,
  Bell,
  Volume2,
  User,
  LogOut,
  FileText
} from 'lucide-react'
import {
  initialProducts,
  initialOrders,
  initialNotifications,
  initialSellerProfile,
  Product,
  Order,
  NotificationItem,
  SellerProfile
} from '@/lib/mock-data'
import { SellerSidebar } from '@/components/seller/SellerSidebar'
import { DashboardView } from '@/components/seller/DashboardView'
import { ProductsView } from '@/components/seller/ProductsView'
import { OrdersView } from '@/components/seller/OrdersView'
import { NotificationsView } from '@/components/seller/NotificationsView'
import { ProfileView } from '@/components/seller/ProfileView'
import { BalanceModal } from '@/components/seller/BalanceModal'
import { WithdrawView } from '@/components/seller/WithdrawView'
import { SupportChatModal } from '@/components/seller/SupportChatModal'
import { ShoppingDashboard } from '@/components/shop/ShoppingDashboard'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { AdminOrdersView } from '@/components/admin/AdminOrdersView'
import { AdminSellersView } from '@/components/admin/AdminSellersView'
import { AdminSupportView } from '@/components/admin/AdminSupportView'
import { AdminWithdrawalsView } from '@/components/admin/AdminWithdrawalsView'
import { KycBanner } from '@/components/seller/KycBanner'
import { KycSubmitModal } from '@/components/seller/KycSubmitModal'
import { AdminKycModal } from '@/components/admin/AdminKycModal'
import { AdminActivityView } from '@/components/admin/AdminActivityView'
import { recordActivityLog, getDeviceDetails, getLocationDetails } from '@/lib/activity-logger'
import { playNotificationSound, initAudioUnlock } from '@/lib/notification-sound'
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  deleteAllOrders,
  fetchNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  fetchSellerProfile,
  fetchSellerProfiles,
  updateSellerProfile,
  signUpSeller,
  signInSeller,
  signOutSeller,
  resetPassword,
  AdminUser,
} from '@/lib/supabase/api'
import { isSupabaseConfigured } from '@/lib/supabase/client'

type Mode = 'seller' | 'admin' | 'login' | 'shop'
type SellerTab = 'Dashboard' | 'Products' | 'Orders' | 'Notifications' | 'Profile' | 'Withdraw'

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

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="toast" role="status">
      <Check size={16} />
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Close notification">
        <X size={15} />
      </button>
    </div>
  )
}

function SellerNotificationPopup({
  popup,
  onClose,
  onView,
}: {
  popup: {
    id?: string
    title: string
    description: string
    type?: 'new' | 'available'
    count?: number
  }
  onClose: () => void
  onView: () => void
}) {
  return (
    <aside
      aria-label="Notification alert"
      className="fixed top-4 right-4 sm:top-5 sm:right-6 z-50 max-w-sm sm:max-w-md w-[calc(100%-2rem)] p-4 bg-white/95 backdrop-blur-md border border-blue-200/90 rounded-2xl shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-4"
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md">
          <Bell size={20} className="animate-bounce" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full animate-ping" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase tracking-wider">
              <Volume2 size={11} className="text-blue-600" />
              {popup.type === 'available' ? 'Available Alert' : 'New Alert'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Just now</span>
          </div>
          <h4 className="text-sm font-bold text-slate-900 truncate">
            {popup.title}
          </h4>
          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
            {popup.description}
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={onView}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              View Notifications
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Close notification alert"
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  )
}

function AdminSidebar({
  active,
  onNavigate,
  onSignOut,
  isOpenOnMobile = false,
  onCloseMobile,
}: {
  active: string
  onNavigate: (label: string) => void
  onSignOut: () => void
  isOpenOnMobile?: boolean
  onCloseMobile?: () => void
}) {
  const handleNav = (label: string) => {
    onNavigate(label)
    if (onCloseMobile) onCloseMobile()
  }

  return (
    <>
      {isOpenOnMobile && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar admin-sidebar ${
          isOpenOnMobile
            ? 'fixed inset-y-0 left-0 z-50 flex shadow-2xl translate-x-0 transition-transform duration-300 ease-in-out w-[280px] bg-white'
            : 'hidden md:flex'
        }`}
      >
        <div className="brand flex items-center justify-between p-4 border-b border-slate-100">
          <BrandLogo size="md" subtitle="Management Console" />
          {isOpenOnMobile && (
            <button
              type="button"
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              onClick={onCloseMobile}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="admin-user">
          <div className="avatar admin-avatar">
            Z<span className="online-dot" />
          </div>
          <div>
            <strong>zain</strong>
            <span>Administrator</span>
          </div>
        </div>

        <div className="invite">
          <span>
            INVITE <b>MXSVHSDL</b>
          </span>
          <Copy size={16} className="cursor-pointer" />
          <Pencil size={16} className="cursor-pointer" />
          <RefreshCw size={16} className="cursor-pointer" />
        </div>

        <nav className="admin-nav flex-1 overflow-y-auto" aria-label="Admin navigation">
          {adminNav.map(({ label, icon: Icon, group }, index) => (
            <div key={label}>
              {(index === 0 || adminNav[index - 1].group !== group) && (
                <span className="nav-group">{group}</span>
              )}
              <button
                type="button"
                className={active === label ? 'active' : ''}
                onClick={() => handleNav(label)}
              >
                <Icon size={19} />
                <span>{label}</span>
              </button>
            </div>
          ))}
        </nav>

        <button
          type="button"
          className="sign-out mt-auto"
          onClick={() => {
            if (onCloseMobile) onCloseMobile()
            onSignOut()
          }}
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </aside>
    </>
  )
}

function AdminPanel({
  orders,
  products,
  sellerProfile,
  sellers = [],
  onUpdateOrderStatus,
  onDeleteOrder,
  onCreateOrder,
  onCreateDemoOrder,
  onToast,
  onSignOut,
  onSwitchToSeller,
  onDeleteSeller,
  initialTab = 'Dashboard',
}: {
  orders: Order[]
  products?: Product[]
  sellerProfile?: SellerProfile
  sellers?: SellerProfile[]
  onUpdateOrderStatus?: (orderId: string, newStatus: Order['status']) => void
  onDeleteOrder?: (orderId: string) => void
  onCreateOrder?: (newOrder: Order) => Promise<void> | void
  onCreateDemoOrder?: () => void
  onToast: (message: string) => void
  onSignOut: () => void
  onSwitchToSeller: (seller?: SellerProfile) => void
  onDeleteSeller?: (seller: SellerProfile) => void
  initialTab?: string
}) {
  const [active, setActive] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search)
      const tab = p.get('tab')
      if (tab) return tab
    }
    return initialTab
  })
  const [search, setSearch] = useState('')
  const [deleted, setDeleted] = useState(false)
  const [menu, setMenu] = useState(false)
  const [kycStatus, setKycStatus] = useState<'pending' | 'approved'>('approved')
  const [withdrawalStatus, setWithdrawalStatus] = useState<'pending' | 'completed'>('completed')
  const [isAdminMobileOpen, setIsAdminMobileOpen] = useState(false)

  // Real platform metrics from actual database data
  const totalGMV = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
  const deliveredOrdersCount = orders.filter((o) => o.status === 'delivered').length
  const inProgressOrdersCount = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled'
  ).length
  const effectiveSellers = sellers.filter((s) => !s.isDeleted)
  const activeSellersCount = effectiveSellers.filter((s) => !s.isSuspended).length
  const pendingKycCount = effectiveSellers.filter((s) => !s.verified).length

  return (
    <div className="app-shell admin-shell">
      <AdminSidebar
        active={active}
        onNavigate={(label) => {
          if (label === 'KYC') {
            window.location.href = '/admin/kyc'
            return
          } else if (label === 'Sellers') {
            window.location.href = '/admin/sellers'
            return
          } else if (label === 'Orders') {
            window.location.href = '/admin/orders'
            return
          } else if (label === 'Dashboard') {
            window.location.href = '/admin/dashboard'
            return
          } else if (label === 'Withdrawals') {
            window.location.href = '/admin/withdrawals'
            return
          }
          setActive(label)
          onToast(`${label} view selected`)
        }}
        onSignOut={onSignOut}
        isOpenOnMobile={isAdminMobileOpen}
        onCloseMobile={() => setIsAdminMobileOpen(false)}
      />
      <main className="admin-main">
        {/* Admin Mobile Top Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="p-1.5 -ml-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              onClick={() => setIsAdminMobileOpen(true)}
              aria-label="Open admin menu"
            >
              <Menu size={22} />
            </button>
            <BrandLogo size="sm" variant="light" showText={false} />
            <div>
              <strong className="text-xs font-bold text-white block leading-tight">Admin Console</strong>
              <span className="text-[10px] text-purple-300 font-semibold">{active}</span>
            </div>
          </div>
        </div>

        {active !== 'Orders' && active !== 'Withdrawals' && (
          <div className="admin-topbar hidden md:flex">
            <div className="admin-heading">
              <span className="section-mark">
                <ShieldCheck size={22} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="m-0 text-xl font-bold text-slate-900">{active}</h1>
                  <span className="bg-purple-100 text-purple-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                    Management Console
                  </span>
                </div>
                <p className="m-0 text-xs text-slate-500 mt-0.5">
                  Full platform oversight, seller compliance, KYC reviews, and settlement controls.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 space-y-6">
          {active === 'Dashboard' && (
            <>
              {/* 4 Admin KPI Cards matching actual live data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="kpi-card">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Platform GMV
                    </span>
                    <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                      <CircleDollarSign size={18} />
                    </span>
                  </div>
                  <strong className="text-2xl font-black text-slate-900 block tabular-nums">
                    ${totalGMV.toFixed(2)}
                  </strong>
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                    <TrendingUp size={13} className="text-emerald-600" />
                    <span>Total order merchandise volume</span>
                  </span>
                </div>

                <div className="kpi-card">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Active Merchants
                    </span>
                    <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                      <Users size={18} />
                    </span>
                  </div>
                  <strong className="text-2xl font-black text-slate-900 block tabular-nums">
                    {effectiveSellers.length} {effectiveSellers.length === 1 ? 'Store' : 'Stores'}
                  </strong>
                  <span className="text-xs text-emerald-600 font-semibold mt-1 block">
                    {activeSellersCount} active · 100% operational
                  </span>
                </div>

                <div className="kpi-card">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Total Orders
                    </span>
                    <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                      <ShoppingBag size={18} />
                    </span>
                  </div>
                  <strong className="text-2xl font-black text-slate-900 block tabular-nums">
                    {orders.length}
                  </strong>
                  <span className="text-xs text-purple-600 font-semibold mt-1 block">
                    {deliveredOrdersCount} delivered · {inProgressOrdersCount} in progress
                  </span>
                </div>

                <div className="kpi-card">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      KYC Compliance
                    </span>
                    <span className={`p-2 rounded-xl ${pendingKycCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      <ShieldAlert size={18} />
                    </span>
                  </div>
                  <strong className="text-2xl font-black text-slate-900 block tabular-nums">
                    {pendingKycCount === 0 ? '0 Pending' : `${pendingKycCount} Pending`}
                  </strong>
                  <span className={`text-xs font-semibold mt-1 block ${pendingKycCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {pendingKycCount === 0 ? '100% sellers verified' : 'Requires review'}
                  </span>
                </div>
              </div>


              {/* Platform Overview Table */}
              <div className="panel p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 m-0">Recent Merchant Activity</h2>
                    <p className="text-xs text-slate-500 mt-0.5 m-0">Stores onboarded on the platform</p>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                    onClick={() => setActive('Sellers')}
                  >
                    View All Sellers →
                  </button>
                </div>

                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <table className="w-full text-left text-xs min-w-[550px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                        <th className="pb-3">Merchant</th>
                        <th className="pb-3">Owner</th>
                        <th className="pb-3">Tier</th>
                        <th className="pb-3">Balance</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {sellers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-xs text-slate-400 font-normal">
                            No registered sellers found in the database.
                          </td>
                        </tr>
                      ) : (
                        sellers.map((s) => (
                          <tr key={s.id || s.email} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5">
                              <div className="font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-md bg-blue-600 text-white grid place-items-center text-[10px] font-bold">
                                  {(s.shopName || 'S')[0]?.toUpperCase()}
                                </span>
                                {s.shopName}
                              </div>
                              <span className="text-slate-400 text-[10px]">{s.email}</span>
                            </td>
                            <td className="py-3.5 text-slate-700">{s.ownerName || s.shopName}</td>
                            <td className="py-3.5">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
                                {s.isSuspended ? 'SUSPENDED' : 'VERIFIED'}
                              </span>
                            </td>
                            <td className="py-3.5 font-bold text-slate-900">${(s.balance || 0).toFixed(2)}</td>
                            <td className="py-3.5">
                              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                              </span>
                            </td>
                            <td className="py-3.5 text-right">
                              <button
                                type="button"
                                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-[11px] cursor-pointer"
                                onClick={() => {
                                  onSwitchToSeller(s)
                                  onToast(`Switched to ${s.shopName}`)
                                }}
                              >
                                Login as Seller
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {active === 'Sellers' && (
            <AdminSellersView
              initialSeller={sellerProfile || initialSellerProfile}
              sellers={sellers}
              products={products || initialProducts}
              orders={orders || initialOrders}
              onToast={onToast}
              onSwitchToSeller={onSwitchToSeller}
              onDeleteSeller={onDeleteSeller}
            />
          )}

          {active === 'KYC' && (
            <div className="panel p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 m-0">KYC Verification Review Queue</h2>
                  <p className="text-xs text-slate-500 mt-1 m-0">Inspect identity submissions and business verification documents</p>
                </div>
                <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full">
                  {kycStatus === 'pending' ? '1 Pending Submission' : 'All Clear'}
                </span>
              </div>

              {kycStatus === 'pending' ? (
                <div className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 grid place-items-center font-bold">
                      <FileCheck size={20} />
                    </div>
                    <div>
                      <strong className="text-sm font-bold text-slate-900 block">{sellerProfile?.ownerName || 'Merchant'} ({sellerProfile?.shopName || 'Store'})</strong>
                      <span className="text-xs text-slate-500">Document: Passport & Proof of Address</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                      onClick={() => onToast('Document preview opened')}
                    >
                      Inspect Document
                    </button>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold cursor-pointer shadow-xs"
                      onClick={() => {
                        setKycStatus('approved')
                        onToast(`KYC verified and approved for ${sellerProfile?.ownerName || 'Merchant'}!`)
                      }}
                    >
                      Approve Verification
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle size={36} className="mx-auto mb-2 text-emerald-500" />
                  <p className="font-bold text-slate-700 text-sm">All KYC submissions have been verified!</p>
                  <p className="text-xs text-slate-400">New submissions from sellers will automatically appear in this queue.</p>
                </div>
              )}
            </div>
          )}

          {active === 'Withdrawals' && (
            <AdminWithdrawalsView
              sellers={sellers}
              onToast={onToast}
              onOpenMobileMenu={() => setIsAdminMobileOpen(true)}
            />
          )}

          {active === 'Orders' && (
            <AdminOrdersView
              orders={orders}
              products={products || initialProducts}
              sellerProfile={sellerProfile || initialSellerProfile}
              sellers={sellers}
              onUpdateOrderStatus={onUpdateOrderStatus || (() => {})}
              onDeleteOrder={onDeleteOrder || (() => {})}
              onCreateOrder={onCreateOrder || (() => {})}
              onToast={onToast}
              onSwitchToSeller={onSwitchToSeller}
            />
          )}

          {(active === 'Recent Actions' || active === 'My Logs') && (
            <AdminActivityView
              sellers={sellers}
              products={products}
              activeTab={active}
              onOpenMobileMenu={() => setIsAdminMobileOpen(true)}
              onToast={onToast}
              onSwitchToSeller={onSwitchToSeller}
            />
          )}

          {active === 'Support' && (
            <AdminSupportView
              sellers={sellers}
              activeSeller={sellerProfile}
              onToast={onToast}
              onSwitchToSeller={onSwitchToSeller}
            />
          )}
        </div>
      </main>
    </div>
  )
}

function AuthScreen({
  onLoginSuccess,
  onAdminSuccess,
  onToast,
}: {
  onLoginSuccess: (profile: SellerProfile) => void
  onAdminSuccess?: (admin: AdminUser) => void
  onToast: (msg: string) => void
}) {
  // Seller sub-mode: 'signin' | 'signup' | 'forgot'
  const [sellerAuthMode, setSellerAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin')

  // Seller Sign In fields
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [showSignInPassword, setShowSignInPassword] = useState(false)

  // Seller Sign Up fields
  const [fullName, setFullName] = useState('')
  const [shopName, setShopName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)

  // Password Recovery fields
  const [forgotEmail, setForgotEmail] = useState('')
  const [isForgotSubmitted, setIsForgotSubmitted] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Seller Sign In Handler
  const handleSellerSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!signInEmail.trim()) {
      setErrorMessage('Please enter your email address')
      return
    }
    if (!signInPassword) {
      setErrorMessage('Please enter your password')
      return
    }

    setIsLoading(true)
    try {
      const res = await signInSeller({
        email: signInEmail,
        password: signInPassword,
      })

      if (res.success && res.profile) {
        onToast(`Welcome back, ${res.profile.ownerName || res.profile.shopName}!`)
        // Record real seller login activity log
        try {
          const [device, location] = await Promise.all([
            Promise.resolve(getDeviceDetails()),
            getLocationDetails(),
          ])
          await recordActivityLog({
            action: 'seller_login',
            category: 'seller_logins',
            logType: 'login',
            title: 'Signed in',
            description: `Merchant "${res.profile.ownerName || res.profile.shopName}" (${res.profile.email}) signed in from ${location.formatted}.`,
            user: {
              name: res.profile.ownerName || res.profile.shopName,
              email: res.profile.email,
              role: 'seller',
              shopName: res.profile.shopName,
              avatar: res.profile.avatarLetter,
            },
            location,
            device,
            status: 'success',
            isThisDevice: true,
          })

          // Record directly into seller's login history
          try {
            const historyKey = `u_seller_login_history_${res.profile.id}`
            const stored = localStorage.getItem(historyKey)
            const existing = stored ? JSON.parse(stored) : []
            const now = new Date()
            const pad = (n: number) => String(n).padStart(2, '0')
            const timestamp = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}, ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
            const session = {
              id: `sess-${Date.now()}`,
              timestamp,
              rawDate: now.toISOString(),
              ip: location.ip || '154.192.21.105',
              device: `${device.type} • ${device.os.replace(' 10/11', '')} • ${device.browser.split(' ')[0]}`,
              location: location.formatted || `${location.city}, ${location.region || location.city}, ${location.country}`,
              countryCode: location.countryCode || 'PK',
              userAgent: device.userAgent,
              status: 'Success',
            }
            localStorage.setItem(historyKey, JSON.stringify([session, ...existing.filter((s: any) => s.id !== session.id)].slice(0, 50)))
          } catch {}
        } catch {}
        onLoginSuccess(res.profile)
      } else {
        setErrorMessage(res.error || 'Invalid credentials. Please check your email and password.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error signing in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Seller Sign Up Handler
  const handleSellerSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name')
      return
    }
    if (!shopName.trim()) {
      setErrorMessage('Please enter your shop or store name')
      return
    }
    if (!signUpEmail.trim() || !signUpEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address')
      return
    }
    if (signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)
    try {
      const [deviceInfo, locationInfo] = await Promise.all([
        Promise.resolve(getDeviceDetails()),
        getLocationDetails(),
      ])

      const res = await signUpSeller({
        email: signUpEmail,
        password: signUpPassword,
        shopName,
        ownerName: fullName,
        metadata: {
          device: deviceInfo,
          location: locationInfo,
        },
      })

      if (res.success && res.profile) {
        // Record user sign up activity log with device, location and timestamp
        await recordActivityLog({
          action: 'user_signup',
          title: 'User Sign Up',
          description: `Merchant "${fullName}" (${signUpEmail}) registered store "${shopName}".`,
          user: {
            name: fullName,
            email: signUpEmail,
            role: 'seller',
            shopName,
            avatar: shopName.charAt(0).toUpperCase() || 'S',
          },
          location: locationInfo,
          device: deviceInfo,
          status: 'success',
          metadata: {
            ownerName: fullName,
            shopName,
            registeredAt: new Date().toISOString(),
          },
        })

        if (res.needsEmailConfirmation) {
          setSuccessMessage('Registration successful! Please check your email inbox to confirm your account.')
          onToast('Account created! Please verify your email.')
        } else {
          onToast(`Store created! Welcome to U Seller Store, ${res.profile.ownerName}`)
          onLoginSuccess(res.profile)
        }
      } else {
        setErrorMessage(res.error || 'Failed to create store account. Please try again.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error creating account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Password Recovery Handler
  const handleForgotPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const targetEmail = (forgotEmail || signInEmail).trim()
    if (!targetEmail || !targetEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    try {
      const res = await resetPassword(targetEmail)
      if (res.success) {
        setIsForgotSubmitted(true)
        setSuccessMessage(res.message || `Password reset instructions sent to ${targetEmail}`)
        onToast('Password reset link sent! Check your inbox.')
      } else {
        setErrorMessage(res.error || 'Failed to send reset instructions. Please try again.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error sending password reset email.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-visual">
        <div className="brand" style={{ padding: 0, border: 0 }}>
          <BrandLogo size="lg" variant="light" />
        </div>
        <div className="login-copy">
          <span className="eyebrow">THE SIMPLE WAY TO SELL ONLINE</span>
          <h1>
            Build your store.
            <br />
            <em>Grow your business.</em>
          </h1>
          <p>
            Everything you need to find products, manage orders, track payouts, and turn your ideas into a thriving
            online business.
          </p>
          <div className="login-features">
            <span>
              <Check size={16} /> Multi-user authentication
            </span>
            <span>
              <Check size={16} /> Verified merchant portal
            </span>
            <span>
              <Check size={16} /> Real-time database
            </span>
          </div>
        </div>
        <div className="visual-orbit">
          <Store size={70} />
          <span>U</span>
        </div>
      </div>

      <div className="login-form-wrap">
        <div className="login-form">
          {/* Brand Logo for Mobile Auth */}
          <div className="flex md:hidden justify-center mb-5">
            <BrandLogo size="md" />
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="auth-error-banner" role="alert">
              <AlertCircle size={17} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && !isForgotSubmitted && (
            <div className="auth-success-banner" role="alert">
              <CheckCircle2 size={17} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* SELLER PORTAL */}
              {sellerAuthMode === 'forgot' ? (
                /* FORGOT PASSWORD FORM */
                <form onSubmit={handleForgotPassword}>
                  <button
                    type="button"
                    className="auth-back-link"
                    onClick={() => {
                      setSellerAuthMode('signin')
                      setErrorMessage('')
                      setSuccessMessage('')
                      setIsForgotSubmitted(false)
                    }}
                  >
                    <ArrowLeft size={15} /> Back to Sign In
                  </button>

                  <div className="form-intro">
                    <span className="form-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                      <KeyRound size={20} />
                    </span>
                    <span className="eyebrow">PASSWORD RECOVERY</span>
                    <h2>Reset your password</h2>
                    <p>Enter your store account email address to receive password reset instructions.</p>
                  </div>

                  {isForgotSubmitted ? (
                    <div className="forgot-success-card">
                      <div className="forgot-success-icon">
                        <CheckCircle2 size={28} />
                      </div>
                      <h3>Check your email</h3>
                      <p>
                        We have dispatched instructions and a password recovery link to{' '}
                        <strong className="text-slate-900">{forgotEmail}</strong>.
                      </p>
                      <div className="forgot-success-actions">
                        <button
                          type="button"
                          className="login-submit"
                          onClick={() => {
                            setSellerAuthMode('signin')
                            setErrorMessage('')
                            setSuccessMessage('')
                            setIsForgotSubmitted(false)
                          }}
                        >
                          <span>Back to Sign In</span> <ArrowRight size={17} />
                        </button>
                        <button
                          type="button"
                          className="forgot-resend-btn"
                          disabled={isLoading}
                          onClick={handleForgotPassword}
                        >
                          {isLoading ? 'Resending...' : "Didn't receive email? Send again"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="auth-field-group">
                        <label className="auth-label" htmlFor="forgot-email">Account Email Address</label>
                        <div className="auth-input-box">
                          <Mail size={17} className="auth-input-icon" />
                          <input
                            id="forgot-email"
                            type="email"
                            className="auth-input"
                            placeholder="you@yourstore.com"
                            required
                            autoFocus
                            autoComplete="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <button type="submit" className="login-submit" disabled={isLoading} style={{ marginTop: '10px' }}>
                        {isLoading ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Sending recovery link...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Reset Instructions</span> <ArrowUpRight size={17} />
                          </>
                        )}
                      </button>

                      <p className="login-foot">
                        Remember your password?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setSellerAuthMode('signin')
                            setErrorMessage('')
                            setSuccessMessage('')
                          }}
                        >
                          Sign in here
                        </button>
                      </p>
                    </>
                  )}
                </form>
              ) : (
                <>
                  {/* Seller Mode Toggle: Sign In vs Create Account */}
                  <div className="auth-tabs" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={sellerAuthMode === 'signin'}
                      className={`auth-tab-btn ${sellerAuthMode === 'signin' ? 'active' : ''}`}
                      onClick={() => {
                        setSellerAuthMode('signin')
                        setErrorMessage('')
                        setSuccessMessage('')
                      }}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={sellerAuthMode === 'signup'}
                      className={`auth-tab-btn ${sellerAuthMode === 'signup' ? 'active' : ''}`}
                      onClick={() => {
                        setSellerAuthMode('signup')
                        setErrorMessage('')
                        setSuccessMessage('')
                      }}
                    >
                      Create Account
                    </button>
                  </div>

                  {sellerAuthMode === 'signin' ? (
                    <form onSubmit={handleSellerSignIn}>
                      <div className="form-intro">
                        <span className="form-icon">
                          <LogIn size={20} />
                        </span>
                        <span className="eyebrow">WELCOME BACK</span>
                        <h2>Sign in to your store</h2>
                        <p>Enter your credentials to access your merchant dashboard.</p>
                      </div>

                      <div className="auth-field-group">
                        <label className="auth-label" htmlFor="seller-email">Email address</label>
                        <div className="auth-input-box">
                          <Mail size={17} className="auth-input-icon" />
                          <input
                            id="seller-email"
                            type="email"
                            className="auth-input"
                            placeholder="you@yourstore.com"
                            required
                            autoComplete="email"
                            value={signInEmail}
                            onChange={(e) => setSignInEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="auth-field-group">
                        <label className="auth-label" htmlFor="seller-password">Password</label>
                        <div className="auth-input-box">
                          <Lock size={17} className="auth-input-icon" />
                          <input
                            id="seller-password"
                            type={showSignInPassword ? 'text' : 'password'}
                            className="auth-input"
                            placeholder="Enter your password"
                            required
                            autoComplete="current-password"
                            value={signInPassword}
                            onChange={(e) => setSignInPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            className="auth-toggle-visibility"
                            onClick={() => setShowSignInPassword(!showSignInPassword)}
                            aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
                            title={showSignInPassword ? 'Hide password' : 'Show password'}
                          >
                            {showSignInPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="form-row">
                        <label className="remember">
                          <input type="checkbox" defaultChecked /> Remember me
                        </label>
                        <button
                          type="button"
                          className="forgot"
                          onClick={() => {
                            setForgotEmail(signInEmail)
                            setIsForgotSubmitted(false)
                            setErrorMessage('')
                            setSuccessMessage('')
                            setSellerAuthMode('forgot')
                          }}
                        >
                          Forgot password?
                        </button>
                      </div>

                      <button type="submit" className="login-submit" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Signing in...</span>
                          </>
                        ) : (
                          <>
                            <span>Sign in to Store</span> <ArrowUpRight size={17} />
                          </>
                        )}
                      </button>

                      <p className="login-foot">
                        Don&apos;t have a store yet?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setSellerAuthMode('signup')
                            setErrorMessage('')
                          }}
                        >
                          Create account
                        </button>
                      </p>
                    </form>
                  ) : (
                    <form onSubmit={handleSellerSignUp}>
                      <div className="form-intro">
                        <span className="form-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                          <UserPlus size={20} />
                        </span>
                        <span className="eyebrow">START SELLING TODAY</span>
                        <h2>Create store account</h2>
                        <p>Register your merchant profile and launch your online store.</p>
                      </div>

                      <div className="auth-field-group">
                        <label className="auth-label" htmlFor="signup-name">Your Full Name</label>
                        <div className="auth-input-box">
                          <User size={17} className="auth-input-icon" />
                          <input
                            id="signup-name"
                            type="text"
                            className="auth-input"
                            placeholder="e.g. Alex Miller"
                            required
                            autoComplete="name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="auth-field-group">
                        <label className="auth-label" htmlFor="signup-shop">Shop / Store Name</label>
                        <div className="auth-input-box">
                          <Store size={17} className="auth-input-icon" />
                          <input
                            id="signup-shop"
                            type="text"
                            className="auth-input"
                            placeholder="e.g. Apex Trends Store"
                            required
                            autoComplete="organization"
                            value={shopName}
                            onChange={(e) => setShopName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="auth-field-group">
                        <label className="auth-label" htmlFor="signup-email">Email address</label>
                        <div className="auth-input-box">
                          <Mail size={17} className="auth-input-icon" />
                          <input
                            id="signup-email"
                            type="email"
                            className="auth-input"
                            placeholder="alex@yourstore.com"
                            required
                            autoComplete="email"
                            value={signUpEmail}
                            onChange={(e) => setSignUpEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="auth-field-group">
                        <label className="auth-label" htmlFor="signup-password">Password</label>
                        <div className="auth-input-box">
                          <Lock size={17} className="auth-input-icon" />
                          <input
                            id="signup-password"
                            type={showSignUpPassword ? 'text' : 'password'}
                            className="auth-input"
                            placeholder="At least 6 characters"
                            required
                            minLength={6}
                            autoComplete="new-password"
                            value={signUpPassword}
                            onChange={(e) => setSignUpPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            className="auth-toggle-visibility"
                            onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                            aria-label={showSignUpPassword ? 'Hide password' : 'Show password'}
                            title={showSignUpPassword ? 'Hide password' : 'Show password'}
                          >
                            {showSignUpPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <button type="submit" className="login-submit" disabled={isLoading} style={{ marginTop: '8px' }}>
                        {isLoading ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Creating store...</span>
                          </>
                        ) : (
                          <>
                            <span>Create Store & Account</span> <ArrowUpRight size={17} />
                          </>
                        )}
                      </button>

                      <p className="login-foot">
                        Already have a store account?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setSellerAuthMode('signin')
                            setErrorMessage('')
                          }}
                        >
                          Sign in
                        </button>
                      </p>
                    </form>
                  )}
                </>
              )}

        </div>
      </div>
    </main>
  )
}

export default function Page() {
  const [mode, setMode] = useState<Mode>('seller')
  const [sellerTab, setSellerTab] = useState<SellerTab>('Dashboard')
  const [toast, setToast] = useState('')
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isKycModalOpen, setIsKycModalOpen] = useState(false)
  const [isKycViewModalOpen, setIsKycViewModalOpen] = useState(false)
  const [notificationPopup, setNotificationPopup] = useState<{
    id?: string
    title: string
    description: string
    type?: 'new' | 'available'
    count?: number
  } | null>(null)

  const prevModeRef = useRef<Mode | null>(null)
  const knownNotifIdsRef = useRef<Set<string>>(new Set())
  const hasAlertedOpenRef = useRef<boolean>(false)
  const isDataLoadedRef = useRef<boolean>(false)

  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications)
  const [profile, setProfile] = useState<SellerProfile>(initialSellerProfile)
  const [sellers, setSellers] = useState<SellerProfile[]>([])

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  const loadSupabaseData = async () => {
    try {
      if (typeof window !== 'undefined') {
        const savedSession = localStorage.getItem('u_auth_session')
        if (savedSession) {
          const session = JSON.parse(savedSession)
          if (session.role === 'admin') {
            setMode('admin')
          } else if (session.role === 'seller' && session.profile) {
            setProfile(session.profile)
            setMode('seller')
          }
        }

        // Support URL parameter override e.g. ?mode=admin or ?tab=Withdraw
        const urlParams = new URLSearchParams(window.location.search)
        if (urlParams.get('mode') === 'admin') {
          setMode('admin')
        }
        if (urlParams.get('tab') === 'Withdraw' || urlParams.get('tab') === 'withdraw') {
          setSellerTab('Withdraw')
        }

        const storedProds = localStorage.getItem('u_seller_products')
        if (storedProds) {
          const parsed = JSON.parse(storedProds)
          if (Array.isArray(parsed)) {
            setProducts(parsed)
          }
        }

        const storedOrders = localStorage.getItem('u_seller_orders')
        if (storedOrders) {
          const parsed = JSON.parse(storedOrders)
          if (Array.isArray(parsed)) setOrders(parsed)
        }

        const storedNotifs = localStorage.getItem('u_seller_notifications')
        if (storedNotifs) {
          const parsed = JSON.parse(storedNotifs)
          if (Array.isArray(parsed)) setNotifications(parsed)
        }

        const storedSellers = localStorage.getItem('u_all_sellers')
        if (storedSellers) {
          const parsed = JSON.parse(storedSellers)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSellers(parsed.filter((s: SellerProfile) => !s.isDeleted))
          }
        }
        isDataLoadedRef.current = true
      }
    } catch {}

    if (!isSupabaseConfigured()) return
    try {
      const [supaProds, supaOrders, supaNotifs, supaProfile, supaSellers] = await Promise.all([
        fetchProducts(),
        fetchOrders(),
        fetchNotifications(),
        fetchSellerProfile(),
        fetchSellerProfiles(),
      ])
      if (supaProds !== null) {
        setProducts(supaProds)
      }
      if (supaOrders !== null) {
        setOrders(supaOrders)
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('u_seller_orders', JSON.stringify(supaOrders))
          }
        } catch {}
      }
      if (supaNotifs !== null) {
        setNotifications(supaNotifs)
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('u_seller_notifications', JSON.stringify(supaNotifs))
          }
        } catch {}
      }
      if (supaProfile) setProfile(supaProfile)
      if (supaSellers && supaSellers.length > 0) {
        setSellers(supaSellers.filter((s) => !s.isDeleted))
      }
    } catch (err) {
      console.warn('[Supabase] Sync error:', err)
    } finally {
      isDataLoadedRef.current = true
    }
  }

  useEffect(() => {
    loadSupabaseData()
    initAudioUnlock()
  }, [])

  // Auto-dismiss notification popup after 6 seconds
  useEffect(() => {
    if (!notificationPopup) return
    const timer = setTimeout(() => {
      setNotificationPopup(null)
    }, 6000)
    return () => clearTimeout(timer)
  }, [notificationPopup])

  // Cross-tab and live notification event listener
  useEffect(() => {
    const handleNotifUpdate = (e: Event) => {
      const customEvent = e as CustomEvent
      const newNotif = customEvent.detail?.notification as NotificationItem | undefined
      if (newNotif) {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === newNotif.id)) return prev
          return [newNotif, ...prev]
        })
      } else {
        try {
          const stored = localStorage.getItem('u_seller_notifications')
          if (stored) {
            const parsed = JSON.parse(stored)
            if (Array.isArray(parsed)) setNotifications(parsed)
          }
        } catch {}
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'u_seller_notifications' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (Array.isArray(parsed)) setNotifications(parsed)
        } catch {}
      }
    }

    window.addEventListener('u_seller_notifications_update', handleNotifUpdate)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener('u_seller_notifications_update', handleNotifUpdate)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  // Real-time synchronization when a merchant or store is removed from Admin
  useEffect(() => {
    const handleSellerRemovedAction = (detail: any) => {
      const removedId = (detail?.id || '').toLowerCase()
      const removedEmail = (detail?.email || '').toLowerCase()
      const removedShop = (detail?.shopName || '').toLowerCase()

      // 1. If currently logged in as this seller, immediately terminate session and kick to login
      setProfile((currentProf) => {
        const cId = (currentProf.id || '').toLowerCase()
        const cEmail = (currentProf.email || '').toLowerCase()
        const cShop = (currentProf.shopName || '').toLowerCase()

        const isCurrentTarget =
          (removedId && cId === removedId) ||
          (removedEmail && cEmail === removedEmail) ||
          (removedShop && cShop === removedShop)

        if (isCurrentTarget) {
          try {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('u_auth_session')
              localStorage.removeItem('u_seller_active_profile')
            }
          } catch {}
          setMode('login')
          showToast('Your merchant store has been permanently removed by administration.')
          return initialSellerProfile
        }
        return currentProf
      })

      // 2. Remove seller from local sellers list
      setSellers((prev) =>
        prev.filter((s) => {
          const sId = (s.id || '').toLowerCase()
          const sEmail = (s.email || '').toLowerCase()
          const sShop = (s.shopName || '').toLowerCase()
          if (removedId && sId === removedId) return false
          if (removedEmail && sEmail === removedEmail) return false
          if (removedShop && sShop === removedShop) return false
          return true
        })
      )

      // 3. Remove orders associated with this seller
      setOrders((prev) =>
        prev.filter((o) => {
          const oSellerId = (o.sellerId || (o.items && o.items[0]?.sellerId) || '').toLowerCase()
          if (removedId && oSellerId === removedId) return false
          if (removedEmail && oSellerId === removedEmail) return false
          return true
        })
      )

      // 4. Remove products associated with this seller
      setProducts((prev) =>
        prev.filter((p: any) => {
          if (removedId && (p.sellerId === removedId || p.id?.includes(removedId))) return false
          if (removedEmail && p.sellerId === removedEmail) return false
          if (removedShop && p.sku?.toLowerCase().includes(removedShop)) return false
          return true
        })
      )
    }

    const handleCustomEvent = (e: any) => {
      handleSellerRemovedAction(e.detail)
    }

    window.addEventListener('u_seller_removed', handleCustomEvent)

    let channel: BroadcastChannel | null = null
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('u_system_sync')
        channel.onmessage = (event) => {
          if (event.data?.type === 'SELLER_REMOVED') {
            handleSellerRemovedAction(event.data.payload)
          }
        }
      }
    } catch {}

    return () => {
      window.removeEventListener('u_seller_removed', handleCustomEvent)
      if (channel) channel.close()
    }
  }, [])

  // Listen for real-time support chat messages from Admin to notify seller
  useEffect(() => {
    const handleSupportChatUpdate = (e: Event) => {
      const customEvent = e as CustomEvent
      const detail = customEvent.detail
      if (!detail) return

      const { sellerEmail, message, sender } = detail
      if (sender === 'admin' && message) {
        const currentActiveEmail = profile.email || ''
        if (!sellerEmail || (currentActiveEmail && sellerEmail.toLowerCase() === currentActiveEmail.toLowerCase())) {
          // 1. Play chime audio
          playNotificationSound()

          // 2. Show live toast alert
          const preview = message.text.length > 45 ? message.text.slice(0, 45) + '...' : message.text
          showToast(`💬 Support Agent: "${preview}"`)

          // 3. Add to notifications state and local storage
          const newNotif: NotificationItem = {
            id: 'support-notif-' + message.id,
            title: 'New Support Message',
            description: `Support Agent: "${message.text}"`,
            date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(),
            timeAgo: 'Just now',
            refCode: 'SUPPORT',
            type: 'system',
            read: false,
            details: `Message received at ${message.time}: "${message.text}". Open Support Chat to reply.`,
          }

          // Mark ID so the seller notification effect doesn't double-chime
          knownNotifIdsRef.current.add(newNotif.id)

          setNotifications((prev) => {
            if (prev.some((n) => n.id === newNotif.id)) return prev
            const updated = [newNotif, ...prev]
            try {
              if (typeof window !== 'undefined') {
                localStorage.setItem('u_seller_notifications', JSON.stringify(updated))
              }
            } catch {}
            return updated
          })
        }
      }
    }

    window.addEventListener('u_support_chat_update', handleSupportChatUpdate)
    return () => window.removeEventListener('u_support_chat_update', handleSupportChatUpdate)
  }, [profile.email])

  // Real-time synchronization when Admin updates seller settings (like product upload limit)
  useEffect(() => {
    const handleProfileUpdateAction = (updated: SellerProfile) => {
      if (!updated) return
      setSellers((prev) =>
        prev.map((s) =>
          (s.id && updated.id && s.id === updated.id) ||
          (s.email && updated.email && s.email.toLowerCase() === updated.email.toLowerCase())
            ? { ...s, ...updated }
            : s
        )
      )
      setProfile((curr) => {
        const isTarget =
          (curr.id && updated.id && curr.id === updated.id) ||
          (curr.email && updated.email && curr.email.toLowerCase() === updated.email.toLowerCase())
        if (isTarget) {
          const merged = { ...curr, ...updated }
          if (updated.productLimit !== undefined && updated.productLimit !== curr.productLimit) {
            showToast(
              updated.productLimit === 'unlimited'
                ? '📢 Administrator updated your product limit to Unlimited!'
                : `📢 Administrator updated your product upload limit to ${updated.productLimit} products.`
            )
          }
          return merged
        }
        return curr
      })
    }

    const handleCustomEvent = (e: any) => {
      if (e.detail) handleProfileUpdateAction(e.detail)
    }

    window.addEventListener('u_seller_profile_updated', handleCustomEvent)

    let channel: BroadcastChannel | null = null
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('u_system_sync')
        channel.onmessage = (event) => {
          if (event.data?.type === 'SELLER_PROFILE_UPDATED') {
            handleProfileUpdateAction(event.data.payload)
          }
        }
      }
    } catch {}

    return () => {
      window.removeEventListener('u_seller_profile_updated', handleCustomEvent)
      if (channel) channel.close()
    }
  }, [])

  const signOut = async () => {
    await signOutSeller()
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('u_auth_session')
        localStorage.removeItem('u_seller_active_profile')
        localStorage.removeItem('u_seller_notifications')
        localStorage.removeItem('u_seller_orders')
      }
    } catch {}
    setOrders([])
    setNotifications([])
    setMode('login')
    showToast('You have been signed out')
  }

  const handleSellerSuccess = (newProfile: SellerProfile) => {
    setProfile(newProfile)
    setSellers((prev) => {
      const idx = prev.findIndex((s) => s.email === newProfile.email || s.id === newProfile.id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = newProfile
        return copy
      }
      return [newProfile, ...prev]
    })
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('u_auth_session', JSON.stringify({ role: 'seller', profile: newProfile }))
        localStorage.setItem('u_seller_active_profile', JSON.stringify(newProfile))
      }
    } catch {}
    setMode('seller')
    setSellerTab('Dashboard')
  }

  const handleAdminSuccess = (adminUser: AdminUser) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('u_auth_session', JSON.stringify({ role: 'admin', adminEmail: adminUser.email }))
      }
    } catch {}
    setMode('admin')
    showToast(`Welcome Administrator (${adminUser.name})`)
  }

  const handleAddProduct = async (newProd: Omit<Product, 'id'>) => {
    if (!profile.verified) {
      showToast('⚠️ KYC Verification Required: Your store is in View-Only mode until approved.')
      setIsKycModalOpen(true)
      return
    }

    // Only Admin decides product upload capacity
    const currentLimit = profile.productLimit
    if (currentLimit !== undefined && currentLimit !== 'unlimited' && typeof currentLimit === 'number') {
      if (products.length >= currentLimit) {
        showToast(`⚠️ Upload Limit Reached: Administrator has set your store upload limit to ${currentLimit} products. Contact Admin to increase your limit.`)
        return
      }
    }

    const fallbackImage =
      newProd.image ||
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=500&q=80'

    const fullProd = {
      ...newProd,
      image: fallbackImage,
    }

    const created = await createProduct(fullProd)
    const productToAdd: Product = created || {
      ...fullProd,
      id: 'prod-' + Date.now(),
      cost: Number(fullProd.cost),
      sell: Number(fullProd.sell),
      profit: Number(fullProd.profit),
      stock: Number(fullProd.stock),
      sku: fullProd.sku || 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      status: 'active',
    }

    // Immediately update store products state so it appears in both Seller & Customer Storefront
    setProducts((prev) => {
      const updated = [productToAdd, ...prev.filter((p) => p.id !== productToAdd.id)]
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('u_seller_products', JSON.stringify(updated))
        }
      } catch {}
      return updated
    })

    // Update active catalog items count in seller profile
    setProfile((prev) => {
      const updated = {
        ...prev,
        activeItemsCount: (prev.activeItemsCount || 0) + 1,
      }
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('u_seller_active_profile', JSON.stringify(updated))
        }
      } catch {}
      return updated
    })

    // Record real product addition activity log
    try {
      const [device, location] = await Promise.all([
        Promise.resolve(getDeviceDetails()),
        getLocationDetails(),
      ])
      await recordActivityLog({
        action: 'product_added',
        category: 'products',
        logType: 'action',
        title: 'Added a product',
        description: `Added "${productToAdd.title}" priced at $${productToAdd.sell.toFixed(2)}.`,
        user: {
          name: profile.ownerName || profile.shopName || 'Store Owner',
          email: profile.email || 'zain55@gmail.com',
          role: 'seller',
          shopName: profile.shopName,
          avatar: profile.avatarLetter,
        },
        product: {
          id: productToAdd.id,
          title: productToAdd.title,
          price: productToAdd.sell,
          image: productToAdd.image,
        },
        location,
        device,
        status: 'success',
      })
    } catch {}

    showToast(`Product "${productToAdd.title.slice(0, 24)}..." added to store!`)
  }

  const handleUpdateProduct = async (updated: Product) => {
    if (!profile.verified) {
      showToast('⚠️ View-Only Mode: Account must be approved to edit products.')
      setIsKycModalOpen(true)
      return
    }
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    const success = await updateProduct(updated)
    if (success) {
      showToast(`Product updated in database`)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!profile.verified) {
      showToast('⚠️ View-Only Mode: Account must be approved to delete products.')
      setIsKycModalOpen(true)
      return
    }
    const toDelete = products.find((p) => p.id === id)
    // Update local state immediately
    setProducts((prev) => prev.filter((p) => p.id !== id))
    const success = await deleteProduct(id)
    if (success) {
      // Record real product deletion activity log
      try {
        const [device, location] = await Promise.all([
          Promise.resolve(getDeviceDetails()),
          getLocationDetails(),
        ])
        await recordActivityLog({
          action: 'product_deleted',
          category: 'products',
          logType: 'action',
          title: 'Deleted a product',
          description: `Deleted "${toDelete?.title || id}".`,
          user: {
            name: profile.ownerName || profile.shopName || 'Store Owner',
            email: profile.email || 'zain55@gmail.com',
            role: 'seller',
            shopName: profile.shopName,
            avatar: profile.avatarLetter,
          },
          location,
          device,
          status: 'info',
        })
      } catch {}
      showToast(`Product "${toDelete?.title?.slice(0, 24) || id}..." permanently deleted from database`)
    } else {
      showToast('Error deleting product from database')
      // Roll back if deletion failed
      if (toDelete) {
        setProducts((prev) => [toDelete, ...prev])
      }
    }
  }



  const handleCreateOrderFromShop = async (newOrder: Order) => {
    const saved = await createOrder(newOrder)
    const activeOrder = saved || newOrder

    // Decrement local product stock
    setProducts((prev) =>
      prev.map((p) => {
        const item = newOrder.items.find((i) => i.productTitle.toLowerCase().includes(p.title.slice(0, 25).toLowerCase()))
        if (item) {
          const newStock = Math.max(0, p.stock - item.quantity)
          return { ...p, stock: newStock, status: newStock === 0 ? 'out_of_stock' : p.status }
        }
        return p
      })
    )

    // Update orders list
    setOrders((prev) => [activeOrder, ...prev.filter((o) => o.id !== activeOrder.id)])

    // Update seller balance & total orders: ONLY credit profit if the order is delivered
    const isDelivered = activeOrder.status === 'delivered'
    const profitToAdd = isDelivered ? (Number(activeOrder.profit) || 0) : 0
    const newBalance = Number((profile.balance + profitToAdd).toFixed(2))
    const newTotalOrders = profile.totalOrders + 1
    const updatedProfile = {
      ...profile,
      balance: newBalance,
      totalOrders: newTotalOrders,
    }
    setProfile(updatedProfile)
    await updateSellerProfile({ balance: newBalance, totalOrders: newTotalOrders })

    // Add a live notification
    const newNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      title: 'New Customer Order',
      description: `Order ${activeOrder.orderNumber} for $${Number(activeOrder.totalAmount).toFixed(2)} received from ${activeOrder.customerName}`,
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(),
      timeAgo: 'Just now',
      refCode: activeOrder.orderNumber,
      type: 'order',
      read: false,
      details: `Customer ${activeOrder.customerName} (${activeOrder.customerEmail}) purchased ${activeOrder.items?.length || 0} item(s) totaling $${Number(activeOrder.totalAmount).toFixed(2)}. Profit: $${Number(activeOrder.profit).toFixed(2)}. Delivery to: ${activeOrder.shippingAddress}.`,
    }
    setNotifications((prev) => {
      const updated = [newNotif, ...prev]
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('u_seller_notifications', JSON.stringify(updated))
          window.dispatchEvent(new CustomEvent('u_seller_notifications_update', { detail: { notification: newNotif } }))
        }
      } catch {}
      return updated
    })
    createNotification(newNotif).catch(() => {})

    if (isDelivered) {
      showToast(`Order ${activeOrder.orderNumber} recorded and delivered! (+$${profitToAdd.toFixed(2)} profit)`)
    } else {
      showToast(`Order ${activeOrder.orderNumber} recorded in Pending stage! Profit will be added on Delivery.`)
    }
  }

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: Order['status'],
    targetSellerId?: string
  ) => {
    if (!profile.verified) {
      showToast('⚠️ Verification Required: Your store is in View-Only mode until KYC is approved.')
      setIsKycModalOpen(true)
      return
    }
    const order = orders.find((o) => o.id === orderId)
    if (!order) return

    const oldStatus = order.status
    if (oldStatus === newStatus) return

    // Enforce stage progression: direct transition to delivered without passing stages is blocked
    if (newStatus === 'delivered') {
      const normStatus = oldStatus === 'unpaid' ? 'paid' : oldStatus
      if (normStatus !== 'out_for_delivery') {
        showToast('Order must be paid to process before it can be completed.')
        return
      }
    }

    // Find the target seller to credit or debit
    const sellerToUpdate = sellers.find((s) => s.id === (targetSellerId || order.sellerId)) || profile
    let updatedBalance = sellerToUpdate.balance
    const profit = Number(order.profit) || 0

    // Moving to DELIVERED from non-delivered: CREDIT PROFIT
    if (newStatus === 'delivered' && oldStatus !== 'delivered') {
      updatedBalance = Number((sellerToUpdate.balance + profit).toFixed(2))
      if (sellerToUpdate.id === profile.id || !sellerToUpdate.id) {
        setProfile((prev) => ({ ...prev, balance: updatedBalance }))
      }
      setSellers((prev) =>
        prev.map((s) => (s.id === sellerToUpdate.id ? { ...s, balance: updatedBalance } : s))
      )
      await updateSellerProfile({ balance: updatedBalance }, sellerToUpdate.id)
      showToast(`🎉 Order ${order.orderNumber} DELIVERED! +$${profit.toFixed(2)} profit added to dashboard`)
    }
    // Moving from DELIVERED to CANCELLED: REVERSE PROFIT
    else if (oldStatus === 'delivered' && newStatus === 'cancelled') {
      updatedBalance = Number(Math.max(0, sellerToUpdate.balance - profit).toFixed(2))
      if (sellerToUpdate.id === profile.id || !sellerToUpdate.id) {
        setProfile((prev) => ({ ...prev, balance: updatedBalance }))
      }
      setSellers((prev) =>
        prev.map((s) => (s.id === sellerToUpdate.id ? { ...s, balance: updatedBalance } : s))
      )
      await updateSellerProfile({ balance: updatedBalance }, sellerToUpdate.id)
      showToast(`Order ${order.orderNumber} cancelled. Profit reversed from dashboard`)
    } else {
      showToast(`Order ${order.orderNumber} status updated to ${newStatus.replace(/_/g, ' ')}`)
    }

    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
    await updateOrderStatus(orderId, newStatus, sellerToUpdate.id)
  }

  const handleDeleteOrder = async (orderId: string) => {
    const orderToDelete = orders.find((o) => o.id === orderId)
    if (!orderToDelete) return

    setOrders((prev) => prev.filter((o) => o.id !== orderId))

    // Rebalance seller profile only if profit was actually credited upon delivery
    let newBalance = profile.balance
    if (orderToDelete.status === 'delivered') {
      const profitToDeduct = Number(orderToDelete.profit) || 0
      newBalance = Number(Math.max(0, profile.balance - profitToDeduct).toFixed(2))
    }
    const newTotalOrders = Math.max(0, profile.totalOrders - 1)

    setProfile((prev) => ({
      ...prev,
      balance: newBalance,
      totalOrders: newTotalOrders,
    }))

    await Promise.all([
      deleteOrder(orderId, orderToDelete.orderNumber),
      updateSellerProfile({ balance: newBalance, totalOrders: newTotalOrders }),
    ])

    showToast(`Order ${orderToDelete.orderNumber} permanently deleted`)
  }

  const handleDeleteAllOrders = async () => {
    if (orders.length === 0) return
    const orderCount = orders.length
    const idsToDelete = orders.map((o) => o.id)

    setOrders([])

    // Rebalance seller profile: deduct profits of active orders
    const profitsToDeduct = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (Number(o.profit) || 0), 0)
    const newBalance = Number(Math.max(0, profile.balance - profitsToDeduct).toFixed(2))
    const newTotalOrders = 0

    setProfile((prev) => ({
      ...prev,
      balance: newBalance,
      totalOrders: newTotalOrders,
    }))

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('u_seller_orders', JSON.stringify([]))
      } catch {}
    }

    await Promise.all([
      deleteAllOrders(idsToDelete),
      updateSellerProfile({ balance: newBalance, totalOrders: newTotalOrders }),
    ])

    showToast(`All ${orderCount} order(s) permanently deleted from console and database`)
  }

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    await markNotificationAsRead(id)
  }

  const handleMarkAllAsRead = async (silent = false) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }))
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('u_seller_notifications', JSON.stringify(updated))
        }
      } catch {}
      return updated
    })
    if (!silent) {
      showToast('All notifications marked as read')
    }
    await markAllNotificationsAsRead()
  }

  // Filter notifications strictly for the active seller
  const sellerNotifications = useMemo(() => {
    const cleanEmail = (profile?.email || '').trim().toLowerCase()
    const cleanShop = (profile?.shopName || '').trim().toLowerCase()
    const sellerOrderNumbers = new Set(orders.map((o) => (o.orderNumber || '').toLowerCase()))

    return notifications.filter((notif) => {
      // 1. Order notifications must belong to this seller's actual orders
      if (notif.type === 'order') {
        const ref = (notif.refCode || '').toLowerCase()
        return sellerOrderNumbers.has(ref)
      }

      // 2. KYC notifications must not be for mock stores like "tester"
      if (notif.type === 'kyc') {
        const text = `${notif.description} ${notif.details || ''}`.toLowerCase()
        if (text.includes('tester')) return false
        if (cleanShop && text.includes('store "') && !text.includes(`store "${cleanShop}"`)) return false
        return true
      }

      // 3. Merchant onboarding system notifications: only show for THIS seller's store registration
      if (notif.type === 'system') {
        const text = `${notif.description} ${notif.details || ''}`.toLowerCase()
        if (notif.title === 'New Merchant Onboarded') {
          if (!cleanEmail && !cleanShop) return false
          return (cleanEmail && text.includes(cleanEmail)) || (cleanShop && text.includes(cleanShop))
        }
        return true
      }

      // 4. Payout notifications: exclude any referencing tester
      if (notif.type === 'payout') {
        const text = `${notif.description} ${notif.details || ''}`.toLowerCase()
        if (text.includes('tester')) return false
        return true
      }

      return true
    })
  }, [notifications, orders, profile])

  // When the Notifications page/tab is visited, mark all notifications as read so the numbering becomes zero
  useEffect(() => {
    if (sellerTab === 'Notifications') {
      const hasUnread = sellerNotifications.some((n) => !n.read)
      if (hasUnread) {
        handleMarkAllAsRead(true)
      }
    }
  }, [sellerTab, sellerNotifications])

  const handleDeleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    await deleteNotification(id)
  }

  const handleUpdateProfile = async (updates: Partial<SellerProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }))
    await updateSellerProfile(updates)
  }

  const handleWithdraw = async (amount: number) => {
    if (!profile.verified) {
      showToast('⚠️ Verification Required: Complete KYC verification to request withdrawals.')
      setIsKycModalOpen(true)
      return
    }
    const newBal = Number(Math.max(0, profile.balance - amount).toFixed(2))
    setProfile((prev) => ({
      ...prev,
      balance: newBal,
    }))
    await updateSellerProfile({ balance: newBal })

    // Record real withdrawal activity log
    try {
      const [device, location] = await Promise.all([
        Promise.resolve(getDeviceDetails()),
        getLocationDetails(),
      ])
      await recordActivityLog({
        action: 'withdrawal_requested',
        category: 'withdrawals_requested',
        logType: 'balance',
        title: 'Withdrawal Requested',
        description: `Requested withdrawal of $${amount.toFixed(2)}.`,
        amount,
        user: {
          name: profile.ownerName || profile.shopName || 'Store Owner',
          email: profile.email || 'zain55@gmail.com',
          role: 'seller',
          shopName: profile.shopName,
          avatar: profile.avatarLetter,
        },
        location,
        device,
        status: 'info',
      })
    } catch {}

    // Push withdrawal record into admin settlement list
    try {
      if (typeof window !== 'undefined') {
        const now = new Date()
        const requestedDate = now.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
        const newWd = {
          id: `wd-${Date.now()}`,
          sellerId: profile.id || 'seller-tester',
          shopName: profile.shopName || 'tester',
          ownerName: profile.ownerName || 'Zain',
          email: profile.email || 'zain55@gmail.com',
          avatar: (profile.shopName?.[0] || profile.ownerName?.[0] || 'T').toUpperCase(),
          status: 'pending' as const,
          amount,
          requestedDate,
          timestamp: Date.now(),
          destinationMethod: 'Registered Settlement Account',
          destinationDetails: 'Direct Bank / Card Settlement',
        }
        const stored = localStorage.getItem('u_admin_withdrawals_v1')
        const list = stored ? JSON.parse(stored) : []
        const updatedList = [newWd, ...(Array.isArray(list) ? list : [])]
        localStorage.setItem('u_admin_withdrawals_v1', JSON.stringify(updatedList))
        window.dispatchEvent(new CustomEvent('u_withdrawals_updated', { detail: updatedList }))
      }
    } catch {}
  }

  const currentSellerOrders = useMemo(() => {
    if (!profile || !profile.id) return orders
    return orders.filter((o) => {
      if (o.sellerId) {
        return o.sellerId === profile.id || o.sellerId === profile.email
      }
      return profile.id === 'seller-unverified-demo' || profile.id === 'seller-1'
    })
  }, [orders, profile])

  const unreadNotifCount = sellerNotifications.filter((n) => !n.read).length

  // Seller notification audio and pop-up trigger:
  // 1. Plays sound and pops up alert when the seller account is opened if unread notifications are available
  // 2. Plays sound and pops up alert whenever any new unread notification arrives while seller account is open
  useEffect(() => {
    if (mode !== 'seller') {
      prevModeRef.current = mode
      hasAlertedOpenRef.current = false
      return
    }

    const currentIds = new Set(sellerNotifications.map((n) => n.id))
    const unreadNotifs = sellerNotifications.filter((n) => !n.read)

    // A. Seller account just opened (initial load or mode switch to seller)
    if (!hasAlertedOpenRef.current || prevModeRef.current !== 'seller') {
      // If data is still loading and notifications are empty, defer until populated
      if (!isDataLoadedRef.current && sellerNotifications.length === 0) {
        return
      }

      hasAlertedOpenRef.current = true
      prevModeRef.current = 'seller'
      knownNotifIdsRef.current = currentIds

      if (unreadNotifs.length > 0) {
        // Sound chime for available unread notifications upon opening seller console
        playNotificationSound({ volume: 0.25, tone: 'chime' })

        const count = unreadNotifs.length
        const preview = unreadNotifs[0]
        setNotificationPopup({
          title: `${count} Unread Notification${count > 1 ? 's' : ''}`,
          description: preview.title
            ? `${preview.title}: ${preview.description || preview.details || ''}`
            : `You have ${count} unread alert${count > 1 ? 's' : ''} available in your seller account.`,
          type: 'available',
          count,
        })
      }
      return
    }

    // B. Seller account is ALREADY open: check for new unread notifications that arrived
    const newArrivals = sellerNotifications.filter(
      (n) => !n.read && !knownNotifIdsRef.current.has(n.id)
    )

    if (newArrivals.length > 0) {
      const latest = newArrivals[0]
      playNotificationSound({
        volume: 0.28,
        tone: latest.type === 'order' ? 'order' : 'chime',
      })

      setNotificationPopup({
        id: latest.id,
        title: latest.title,
        description: latest.description || latest.details || 'New notification received.',
        type: 'new',
      })
    }

    knownNotifIdsRef.current = currentIds
    prevModeRef.current = 'seller'
  }, [mode, sellerNotifications])

  // Periodic poll or visibilitychange sync for notifications when in seller mode
  useEffect(() => {
    if (mode !== 'seller') return

    const syncSellerNotifs = async () => {
      try {
        if (isSupabaseConfigured()) {
          const supaNotifs = await fetchNotifications()
          if (supaNotifs) {
            setNotifications((prev) => {
              const prevIds = new Set(prev.map((n) => n.id))
              const newItems = supaNotifs.filter((n) => !prevIds.has(n.id))
              if (newItems.length > 0) {
                return [...newItems, ...prev]
              }
              return prev
            })
          }
        } else {
          const stored = localStorage.getItem('u_seller_notifications')
          if (stored) {
            const parsed = JSON.parse(stored)
            if (Array.isArray(parsed)) {
              setNotifications((prev) => {
                const prevIds = new Set(prev.map((n) => n.id))
                const newItems = parsed.filter((n: NotificationItem) => !prevIds.has(n.id))
                if (newItems.length > 0) {
                  return [...newItems, ...prev]
                }
                return prev
              })
            }
          }
        }
      } catch {}
    }

    const interval = setInterval(syncSellerNotifs, 8000)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncSellerNotifs()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [mode])

  return (
    <>
      {mode === 'shop' ? (
        <ShoppingDashboard
          products={products}
          sellerProfile={profile}
          initialNavTab="shop"
          onPlaceOrder={handleCreateOrderFromShop}
          onSwitchToSeller={() => setMode('seller')}
          onSwitchToAdmin={() => setMode('admin')}
          onToast={showToast}
        />
      ) : mode === 'seller' ? (
        <div className="app-shell seller-shell flex flex-col md:flex-row min-h-screen bg-[#F8FAFC]">
          {/* Mobile Top Header */}
          {sellerTab !== 'Withdraw' && (
            <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
                  onClick={() => setIsMobileMenuOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu size={22} />
                </button>
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSellerTab('Dashboard')}>
                  <BrandLogo size="sm" showText={false} />
                  <div>
                    <strong suppressHydrationWarning className="text-xs text-slate-900 block font-bold leading-tight truncate max-w-[140px]">
                      {profile.shopName}
                    </strong>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Store
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold shadow-2xs hover:bg-blue-100 transition-colors cursor-pointer"
                  onClick={() => setSellerTab('Withdraw')}
                  title="Click to withdraw funds"
                >
                  <Wallet size={12} />
                  <span suppressHydrationWarning>${profile.balance.toFixed(2)}</span>
                </button>
              </div>
            </div>
          )}

          {sellerTab !== 'Withdraw' && (
            <SellerSidebar
              activeTab={sellerTab}
              onSelectTab={(tab) => {
                setSellerTab(tab)
                if (tab === 'Notifications') {
                  handleMarkAllAsRead(true)
                } else {
                  showToast(`${tab} opened`)
                }
              }}
              onSignOutClick={signOut}
              onBalanceClick={() => setSellerTab('Withdraw')}
              onOpenStorefront={() => setMode('shop')}
              unreadNotificationsCount={unreadNotifCount}
              shopName={profile.shopName}
              ownerName={profile.ownerName}
              balance={profile.balance}
              guarantee={profile.guarantee}
              isOpenOnMobile={isMobileMenuOpen}
              onCloseMobile={() => setIsMobileMenuOpen(false)}
            />
          )}

          <main className={sellerTab === 'Withdraw' ? 'flex-1 overflow-y-auto w-full bg-[#F8FAFC]' : 'seller-main flex-1 overflow-y-auto pb-24 md:pb-12'}>
            {/* KYC Identity Verification Banner */}
            {sellerTab !== 'Withdraw' && (
              <KycBanner
                profile={profile}
                onOpenSubmitModal={() => setIsKycModalOpen(true)}
                onOpenViewModal={() => setIsKycViewModalOpen(true)}
              />
            )}

            {sellerTab === 'Dashboard' && (
              <DashboardView
                profile={profile}
                products={products}
                orders={currentSellerOrders}
                onNavigate={(tab) => {
                  setSellerTab(tab)
                  showToast(`${tab} opened`)
                }}
                onOpenBalanceModal={() => setSellerTab('Withdraw')}
                onOpenStorefront={() => setMode('shop')}
                onToast={showToast}
              />
            )}

            {sellerTab === 'Products' && (
              <ProductsView
                products={products}
                maxSlots={profile.productLimit ?? 'unlimited'}
                isVerified={Boolean(profile.verified)}
                onRequireKyc={() => setIsKycModalOpen(true)}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onToast={showToast}
              />
            )}

            {sellerTab === 'Orders' && (
              <OrdersView
                orders={currentSellerOrders}
                isVerified={Boolean(profile.verified)}
                onRequireKyc={() => setIsKycModalOpen(true)}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onDeleteOrder={handleDeleteOrder}
                onDeleteAllOrders={handleDeleteAllOrders}
                onToast={showToast}
              />
            )}

            {sellerTab === 'Notifications' && (
              <NotificationsView
                notifications={sellerNotifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                onDeleteNotification={handleDeleteNotification}
                onToast={showToast}
              />
            )}

            {sellerTab === 'Profile' && (
              <ProfileView
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                onSignOut={signOut}
                onOpenBalanceModal={() => setSellerTab('Withdraw')}
                onToast={showToast}
              />
            )}

            {sellerTab === 'Withdraw' && (
              <WithdrawView
                profile={profile}
                onBack={() => setSellerTab('Dashboard')}
                onUpdateProfile={handleUpdateProfile}
                onToast={showToast}
                onRequireKyc={() => setIsKycModalOpen(true)}
              />
            )}
          </main>

          {/* Mobile Bottom Navigation Bar */}
          {sellerTab !== 'Withdraw' && (
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1 shadow-lg flex justify-around items-center">
              {[
                { id: 'Dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
                { id: 'Products' as const, label: 'Products', icon: Package },
                { id: 'Orders' as const, label: 'Orders', icon: ShoppingBag },
                { id: 'Notifications' as const, label: 'Notifications', icon: Bell, badge: unreadNotifCount },
                { id: 'Profile' as const, label: 'Profile', icon: User },
              ].map(({ id, label, icon: Icon, badge }) => {
                const isActive = sellerTab === id
                return (
                  <button
                    key={id}
                    type="button"
                    className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative cursor-pointer min-w-[56px] ${
                      isActive
                        ? 'text-blue-600 font-bold'
                        : 'text-slate-500 hover:text-slate-800 font-medium'
                    }`}
                    onClick={() => {
                      setSellerTab(id)
                      if (id === 'Notifications') {
                        handleMarkAllAsRead(true)
                      }
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  >
                    <div className="relative">
                      <Icon size={20} className={isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'} />
                      {Boolean(badge && badge > 0) && (
                        <span className="absolute -top-1 -right-2 bg-blue-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                          {badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] mt-0.5 tracking-tight">{label}</span>
                    {isActive && (
                      <span className="w-1 h-1 rounded-full bg-blue-600 mt-0.5" />
                    )}
                  </button>
                )
              })}
            </nav>
          )}

          <SupportChatModal sellerProfile={profile} onToast={showToast} />

          <BalanceModal
            isOpen={isBalanceModalOpen}
            profile={profile}
            onClose={() => setIsBalanceModalOpen(false)}
            onWithdraw={handleWithdraw}
            onToast={showToast}
          />
        </div>
      ) : mode === 'admin' ? (
        <AdminPanel
          orders={orders}
          products={products}
          sellerProfile={profile}
          sellers={sellers}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onDeleteOrder={handleDeleteOrder}
          onCreateOrder={handleCreateOrderFromShop}
          onToast={showToast}
          onSignOut={signOut}
          onDeleteSeller={(s) => {
            setSellers((prev) => prev.filter((item) => item.id !== s.id && item.email?.toLowerCase() !== s.email?.toLowerCase()))
          }}
          onSwitchToSeller={(targetSeller) => {
            if (targetSeller) {
              setProfile(targetSeller)
              try {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('u_seller_active_profile', JSON.stringify(targetSeller))
                  localStorage.setItem(
                    'u_auth_session',
                    JSON.stringify({
                      role: 'seller',
                      profile: targetSeller,
                      email: targetSeller.email,
                      shopName: targetSeller.shopName,
                      ownerName: targetSeller.ownerName,
                    })
                  )
                }
              } catch {}
            }
            setMode('seller')
            setSellerTab('Dashboard')
          }}
        />
      ) : (
        <AuthScreen
          onLoginSuccess={handleSellerSuccess}
          onAdminSuccess={handleAdminSuccess}
          onToast={showToast}
        />
      )}

      {/* Seller KYC Submission Modal */}
      <KycSubmitModal
        isOpen={isKycModalOpen}
        onClose={() => setIsKycModalOpen(false)}
        profile={profile}
        onSubmitted={(updated) => {
          setProfile(updated)
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem('u_seller_active_profile', JSON.stringify(updated))
            }
          } catch {}
        }}
        onToast={showToast}
      />

      {/* Seller KYC View/Inspect Modal */}
      <AdminKycModal
        isOpen={isKycViewModalOpen}
        onClose={() => setIsKycViewModalOpen(false)}
        seller={profile}
        isAdmin={false}
        onToast={showToast}
      />

      {toast && <Toast message={toast} onClose={() => setToast('')} />}

      {/* Seller Real-Time / Available Notification Pop-Up Alert */}
      {mode === 'seller' && notificationPopup && (
        <SellerNotificationPopup
          popup={notificationPopup}
          onClose={() => setNotificationPopup(null)}
          onView={() => {
            setNotificationPopup(null)
            setSellerTab('Notifications')
            handleMarkAllAsRead(true)
          }}
        />
      )}
    </>
  )
}
