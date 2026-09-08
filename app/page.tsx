'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Check,
  X,
  ChevronDown,
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
  User,
  LogOut
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
import { SupportChatModal } from '@/components/seller/SupportChatModal'
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  fetchSellerProfile,
  updateSellerProfile,
  signUpSeller,
  signInSeller,
  signOutSeller,
  signInAdmin,
  resetPassword,
  AdminUser,
} from '@/lib/supabase/api'
import { isSupabaseConfigured } from '@/lib/supabase/client'

type Mode = 'seller' | 'admin' | 'login'
type SellerTab = 'Dashboard' | 'Products' | 'Orders' | 'Notifications' | 'Profile'

const adminNav = [
  { label: 'Dashboard', icon: Grid2X2, group: 'Manage' },
  { label: 'Sellers', icon: Users, group: 'Manage' },
  { label: 'KYC', icon: ShieldCheck, group: 'Manage' },
  { label: 'Orders', icon: ShoppingBag, group: 'Manage' },
  { label: 'Support', icon: HeartPulse, group: 'Communication' },
  { label: 'Withdrawals', icon: WalletCards, group: 'Finance' },
  { label: 'Recent Actions', icon: Activity, group: 'Activity' },
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
        <div className="brand flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="brand-mark shrink-0">
              <Grid2X2 size={22} strokeWidth={2.4} />
            </div>
            <div className="brand-info truncate">
              <strong>U Seller Store</strong>
              <span>Management Console</span>
            </div>
          </div>
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
  onUpdateOrderStatus,
  onDeleteOrder,
  onCreateDemoOrder,
  onToast,
  onSignOut,
  onSwitchToSeller,
}: {
  orders: Order[]
  onUpdateOrderStatus?: (orderId: string, newStatus: Order['status']) => void
  onDeleteOrder?: (orderId: string) => void
  onCreateDemoOrder?: () => void
  onToast: (message: string) => void
  onSignOut: () => void
  onSwitchToSeller: () => void
}) {
  const [active, setActive] = useState('Dashboard')
  const [search, setSearch] = useState('')
  const [deleted, setDeleted] = useState(false)
  const [menu, setMenu] = useState(false)
  const [kycStatus, setKycStatus] = useState<'pending' | 'approved'>('pending')
  const [withdrawalStatus, setWithdrawalStatus] = useState<'pending' | 'completed'>('pending')
  const [isAdminMobileOpen, setIsAdminMobileOpen] = useState(false)

  const sellerVisible = useMemo(() => 'tester'.includes(search.toLowerCase()) || 'zain'.includes(search.toLowerCase()), [search])

  return (
    <div className="app-shell admin-shell">
      <AdminSidebar
        active={active}
        onNavigate={(label) => {
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
            <div>
              <strong className="text-xs font-bold text-white block leading-tight">Admin Console</strong>
              <span className="text-[10px] text-purple-300 font-semibold">{active}</span>
            </div>
          </div>
          <button
            type="button"
            className="px-2.5 py-1 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors flex items-center gap-1 cursor-pointer"
            onClick={() => {
              onSwitchToSeller()
              onToast('Switched to Seller Storefront view')
            }}
          >
            <Store size={13} /> Storefront
          </button>
        </div>

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
          <div className="admin-tools">
            <button
              type="button"
              className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              onClick={() => {
                onSwitchToSeller()
                onToast('Switched to Seller Storefront view')
              }}
            >
              <Store size={14} /> Open Storefront
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {active === 'Dashboard' && (
            <>
              {/* 4 Admin KPI Cards */}
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
                  <strong className="text-2xl font-black text-slate-900 block">$48,250.00</strong>
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                    <TrendingUp size={13} /> +24.8% this month
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
                  <strong className="text-2xl font-black text-slate-900 block">14 Stores</strong>
                  <span className="text-xs text-slate-400 mt-1 block">100% operational</span>
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
                  <strong className="text-2xl font-black text-slate-900 block">382</strong>
                  <span className="text-xs text-purple-600 font-semibold mt-1 block">99.4% fulfillment</span>
                </div>

                <div className="kpi-card">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      KYC Compliance
                    </span>
                    <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                      <ShieldAlert size={18} />
                    </span>
                  </div>
                  <strong className="text-2xl font-black text-slate-900 block">
                    {kycStatus === 'pending' ? '1 Pending' : '0 Pending'}
                  </strong>
                  <span className="text-xs text-amber-600 font-semibold mt-1 block">Requires review</span>
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
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-blue-600 text-white grid place-items-center text-[10px]">T</span>
                            tester Official Store
                          </div>
                          <span className="text-slate-400 text-[10px]">zain55@gmail.com</span>
                        </td>
                        <td className="py-3.5 text-slate-700">Zain</td>
                        <td className="py-3.5"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">VERIFIED</span></td>
                        <td className="py-3.5 font-bold text-slate-900">$0.00</td>
                        <td className="py-3.5"><span className="text-emerald-600 font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online</span></td>
                        <td className="py-3.5 text-right">
                          <button
                            type="button"
                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-[11px] cursor-pointer"
                            onClick={() => {
                              onSwitchToSeller()
                              onToast('Viewing tester store dashboard')
                            }}
                          >
                            Login as Seller
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-purple-600 text-white grid place-items-center text-[10px]">A</span>
                            Apex Trends Retail
                          </div>
                          <span className="text-slate-400 text-[10px]">alex@apextrends.com</span>
                        </td>
                        <td className="py-3.5 text-slate-700">Alex Miller</td>
                        <td className="py-3.5"><span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200 text-[10px]">TIER 1</span></td>
                        <td className="py-3.5 font-bold text-slate-900">$1,420.50</td>
                        <td className="py-3.5"><span className="text-emerald-600 font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online</span></td>
                        <td className="py-3.5 text-right">
                          <button
                            type="button"
                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-[11px] cursor-pointer"
                            onClick={() => onToast('Apex Trends details opened')}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {active === 'Sellers' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <label className="search-box flex-1 max-w-md w-full">
                  <Search size={16} />
                  <input
                    aria-label="Search sellers"
                    placeholder="Search merchant, owner, or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className={`toggle ${deleted ? 'on' : ''}`}
                  onClick={() => setDeleted(!deleted)}
                >
                  <span>Show Suspended</span> <i />
                </button>
              </div>

              <section className="seller-list p-0">
                {sellerVisible && !deleted ? (
                  <div className="seller-row">
                    <div className="row-identity">
                      <div className="avatar seller-avatar">
                        T<span className="online-dot" />
                      </div>
                      <div>
                        <strong>
                          tester <em>Online</em>
                        </strong>
                        <span>zain55@gmail.com</span>
                        <small>
                          <CalendarDays size={13} /> Joined 7 Aug 2026
                        </small>
                      </div>
                    </div>
                    <div className="seller-rating">
                      <b>★ 5.00</b>
                      <span>500 Active Items</span>
                    </div>
                    <div className="seller-verification">
                      <b>VERIFIED</b>
                      <span>ACCOUNT TIER</span>
                    </div>
                    <div className="row-actions">
                      <button
                        type="button"
                        onClick={() => {
                          onSwitchToSeller()
                          onToast('Switched to seller account dashboard')
                        }}
                      >
                        <LogIn size={16} /> Login
                      </button>
                      <button
                        type="button"
                        className="more"
                        onClick={() => setMenu(!menu)}
                        aria-label="More seller actions"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {menu && (
                        <div className="more-menu">
                          <button
                            type="button"
                            onClick={() => {
                              onToast('Seller details opened')
                              setMenu(false)
                            }}
                          >
                            View details
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onToast('Seller status updated')
                              setMenu(false)
                            }}
                          >
                            Suspend seller
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="seller-balance">
                      <span>BALANCE</span>
                      <b>$0.00</b>
                      <small>Guarantee $0.00</small>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <Search size={30} />
                    <strong>No sellers found</strong>
                    <span>Try adjusting your search criteria.</span>
                  </div>
                )}
              </section>
            </div>
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
                      <strong className="text-sm font-bold text-slate-900 block">Zain (tester Official Store)</strong>
                      <span className="text-xs text-slate-500">Document: Passport & Proof of Address (Ref: #6bc54j84)</span>
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
                        onToast('KYC verified and approved for Zain (tester)!')
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
            <div className="panel p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 m-0">Merchant Settlement Requests</h2>
                  <p className="text-xs text-slate-500 mt-1 m-0">Review and authorize store payout withdrawals</p>
                </div>
              </div>

              {withdrawalStatus === 'pending' ? (
                <div className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <strong className="text-sm font-bold text-slate-900 block">Zain (Store: tester) — $142.50 USD</strong>
                    <span className="text-xs text-slate-500">Destination: Chase Bank USA (Account: •••• 8842)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold cursor-pointer shadow-xs"
                      onClick={() => {
                        setWithdrawalStatus('completed')
                        onToast('Payout of $142.50 approved & settled!')
                      }}
                    >
                      Approve Payout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center text-slate-400">
                  <CheckCircle size={36} className="mx-auto mb-2 text-emerald-500" />
                  <p className="font-bold text-slate-700 text-sm">All withdrawal requests processed!</p>
                </div>
              )}
            </div>
          )}

          {active === 'Orders' && (
            <div className="panel p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-900 m-0">Platform Orders & False Order Control</h2>
                <p className="text-xs text-slate-500 mt-1 m-0">Review merchant transactions, cancel suspicious orders, and permanently delete false test orders.</p>
              </div>
              <OrdersView
                orders={orders}
                onCreateDemoOrder={onCreateDemoOrder}
                onUpdateOrderStatus={onUpdateOrderStatus}
                onDeleteOrder={onDeleteOrder}
                onToast={onToast}
              />
            </div>
          )}

          {(active === 'Support' || active === 'Recent Actions') && (
            <div className="admin-placeholder">
              <Sparkles size={28} />
              <h2>{active} Management</h2>
              <p>This workspace is active and monitoring platform activity in real-time.</p>
            </div>
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
  onAdminSuccess: (admin: AdminUser) => void
  onToast: (msg: string) => void
}) {
  // Top level role portal: 'seller' | 'admin'
  const [rolePortal, setRolePortal] = useState<'seller' | 'admin'>('seller')

  // Seller sub-mode: 'signin' | 'signup' | 'forgot'
  const [sellerAuthMode, setSellerAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin')

  // Seller Sign In fields
  const [signInEmail, setSignInEmail] = useState('zain55@gmail.com')
  const [signInPassword, setSignInPassword] = useState('••••••••')
  const [showSignInPassword, setShowSignInPassword] = useState(false)

  // Seller Sign Up fields
  const [fullName, setFullName] = useState('')
  const [shopName, setShopName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)

  // Admin Login fields
  const [adminEmail, setAdminEmail] = useState('admin@usellerstore.com')
  const [adminPassword, setAdminPassword] = useState('admin123')
  const [showAdminPassword, setShowAdminPassword] = useState(false)

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
      const res = await signUpSeller({
        email: signUpEmail,
        password: signUpPassword,
        shopName,
        ownerName: fullName,
      })

      if (res.success && res.profile) {
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

  // Admin Sign In Handler
  const handleAdminSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!adminEmail.trim()) {
      setErrorMessage('Please enter administrator email address')
      return
    }
    if (!adminPassword) {
      setErrorMessage('Please enter administrator password')
      return
    }

    setIsLoading(true)
    try {
      const res = await signInAdmin({
        email: adminEmail,
        password: adminPassword,
      })

      if (res.success && res.admin) {
        onToast('Administrator authentication confirmed!')
        onAdminSuccess(res.admin)
      } else {
        setErrorMessage(res.error || 'Access denied: Invalid administrator credentials.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error connecting to admin authentication.')
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
          <div className="brand-mark" style={{ color: '#fff', borderColor: '#7197ad' }}>
            <Store size={22} />
          </div>
          <div className="brand-info">
            <strong style={{ color: '#fff' }}>U Seller Store</strong>
            <span style={{ color: '#adc9e4' }}>
              {rolePortal === 'admin' ? 'Administrator Gateway' : 'Merchant Portal'}
            </span>
          </div>
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
              <Check size={16} /> Admin oversight console
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
          {/* Main Role Selector Pill: Seller vs Admin */}
          <div className="flex bg-slate-200/80 p-1 rounded-xl mb-5 text-xs font-bold">
            <button
              type="button"
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                rolePortal === 'seller' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => {
                setRolePortal('seller')
                setErrorMessage('')
                setSuccessMessage('')
                if (sellerAuthMode === 'forgot') setSellerAuthMode('signin')
              }}
            >
              <Store size={14} /> Merchant Seller
            </button>
            <button
              type="button"
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                rolePortal === 'admin' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => {
                setRolePortal('admin')
                setErrorMessage('')
                setSuccessMessage('')
              }}
            >
              <ShieldCheck size={14} /> Admin Access
            </button>
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
          {rolePortal === 'seller' ? (
            <>
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

                      <p className="login-foot" style={{ marginTop: '10px' }}>
                        Demo prototype ·{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setSignInEmail('zain55@gmail.com')
                            setSignInPassword('password123')
                            onToast('Demo store access granted')
                            onLoginSuccess(initialSellerProfile)
                          }}
                        >
                          Continue as tester
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
            </>
          ) : (
            /* ADMINISTRATOR PORTAL */
            <form onSubmit={handleAdminSignIn}>
              <div className="form-intro">
                <span className="form-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                  <ShieldCheck size={20} />
                </span>
                <span className="eyebrow text-purple-600 font-bold">RESTRICTED ACCESS</span>
                <h2>Admin Management Portal</h2>
                <p>Sign in with your master credentials to manage sellers and transactions.</p>
              </div>

              <div className="auth-field-group">
                <label className="auth-label" htmlFor="admin-email">Administrator Email</label>
                <div className="auth-input-box">
                  <Mail size={17} className="auth-input-icon" />
                  <input
                    id="admin-email"
                    type="email"
                    className="auth-input"
                    placeholder="admin@usellerstore.com"
                    required
                    autoComplete="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-label" htmlFor="admin-password">Master Password</label>
                <div className="auth-input-box">
                  <Lock size={17} className="auth-input-icon" />
                  <input
                    id="admin-password"
                    type={showAdminPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Enter administrator password"
                    required
                    autoComplete="current-password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="auth-toggle-visibility"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                    title={showAdminPassword ? 'Hide password' : 'Show password'}
                  >
                    {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-row">
                <label className="remember">
                  <input type="checkbox" defaultChecked /> Remember admin session
                </label>
                <button
                  type="button"
                  className="forgot"
                  onClick={() => {
                    setForgotEmail(adminEmail)
                    setIsForgotSubmitted(false)
                    setErrorMessage('')
                    setSuccessMessage('')
                    setRolePortal('seller')
                    setSellerAuthMode('forgot')
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="login-submit"
                disabled={isLoading}
                style={{ background: '#1e1b4b', marginTop: '10px' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Verifying credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Management Console</span> <ArrowUpRight size={17} />
                  </>
                )}
              </button>

              <p className="login-foot" style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="text-purple-700 font-semibold"
                  onClick={() => {
                    setAdminEmail('admin@usellerstore.com')
                    setAdminPassword('admin123')
                    onToast('Admin credentials filled')
                  }}
                >
                  Fill Admin Demo Credentials (admin@usellerstore.com)
                </button>
              </p>
            </form>
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
  const [modeOpen, setModeOpen] = useState(false)
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('u_seller_products')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) return parsed
        }
      } catch {}
    }
    return initialProducts
  })
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications)
  const [profile, setProfile] = useState<SellerProfile>(initialSellerProfile)

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
      }
    } catch {}

    if (!isSupabaseConfigured()) return
    try {
      const [supaProds, supaOrders, supaNotifs, supaProfile] = await Promise.all([
        fetchProducts(),
        fetchOrders(),
        fetchNotifications(),
        fetchSellerProfile(),
      ])
      if (supaProds !== null) setProducts(supaProds)
      if (supaOrders !== null) setOrders(supaOrders)
      if (supaNotifs !== null) setNotifications(supaNotifs)
      if (supaProfile) setProfile(supaProfile)
    } catch (err) {
      console.warn('[Supabase] Sync error:', err)
    }
  }

  useEffect(() => {
    loadSupabaseData()
  }, [])

  const signOut = async () => {
    await signOutSeller()
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('u_auth_session')
        localStorage.removeItem('u_seller_active_profile')
      }
    } catch {}
    setMode('login')
    showToast('You have been signed out')
  }

  const handleSellerSuccess = (newProfile: SellerProfile) => {
    setProfile(newProfile)
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
    const created = await createProduct(newProd)
    if (created) {
      setProducts((prev) => [created, ...prev.filter((p) => p.id !== created.id)])
      showToast(`Product "${created.title.slice(0, 24)}..." added permanently`)
    } else {
      showToast('Failed to save product to database')
    }
  }

  const handleUpdateProduct = async (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    const success = await updateProduct(updated)
    if (success) {
      showToast(`Product updated in database`)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    const toDelete = products.find((p) => p.id === id)
    // Update local state immediately
    setProducts((prev) => prev.filter((p) => p.id !== id))
    const success = await deleteProduct(id)
    if (success) {
      showToast(`Product "${toDelete?.title?.slice(0, 24) || id}..." permanently deleted from database`)
    } else {
      showToast('Error deleting product from database')
      // Roll back if deletion failed
      if (toDelete) {
        setProducts((prev) => [toDelete, ...prev])
      }
    }
  }

  const handleCreateDemoOrder = async () => {
    const demoOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber: '#ORD-' + Math.floor(10000 + Math.random() * 90000),
      customerName: 'Sarah Jenkins',
      customerEmail: 'sarah.j@example.com',
      shippingAddress: '742 Evergreen Terrace, Springfield, OR',
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'paid',
      totalAmount: 59.95,
      profit: 12.42,
      items: [
        {
          productTitle: 'Superfeet All-Purpose Support Medium Arch Insoles',
          quantity: 1,
          price: 59.95,
          image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=500&q=80',
        },
      ],
    }
    const saved = await createOrder(demoOrder)
    setOrders((prev) => [saved || demoOrder, ...prev])
    const newBalance = Number((profile.balance + 12.42).toFixed(2))
    const newTotalOrders = profile.totalOrders + 1
    setProfile((prev) => ({
      ...prev,
      balance: newBalance,
      totalOrders: newTotalOrders,
    }))
    await updateSellerProfile({ balance: newBalance, totalOrders: newTotalOrders })
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return

    // If order is moved to cancelled, reverse profit from seller balance
    if (newStatus === 'cancelled' && order.status !== 'cancelled') {
      const profitToDeduct = Number(order.profit) || 0
      const newBalance = Number(Math.max(0, profile.balance - profitToDeduct).toFixed(2))
      setProfile((prev) => ({ ...prev, balance: newBalance }))
      await updateSellerProfile({ balance: newBalance })
    } else if (order.status === 'cancelled' && newStatus !== 'cancelled') {
      // If restoring an order from cancelled back to active
      const profitToAdd = Number(order.profit) || 0
      const newBalance = Number((profile.balance + profitToAdd).toFixed(2))
      setProfile((prev) => ({ ...prev, balance: newBalance }))
      await updateSellerProfile({ balance: newBalance })
    }

    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
    await updateOrderStatus(orderId, newStatus)
    showToast(`Order ${order.orderNumber} status updated to ${newStatus.replace(/_/g, ' ')}`)
  }

  const handleDeleteOrder = async (orderId: string) => {
    const orderToDelete = orders.find((o) => o.id === orderId)
    if (!orderToDelete) return

    setOrders((prev) => prev.filter((o) => o.id !== orderId))

    // Rebalance seller profile if profit was attached and not yet cancelled
    let newBalance = profile.balance
    if (orderToDelete.status !== 'cancelled') {
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
      deleteOrder(orderId),
      updateSellerProfile({ balance: newBalance, totalOrders: newTotalOrders }),
    ])

    showToast(`Order ${orderToDelete.orderNumber} permanently deleted`)
  }

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    await markNotificationAsRead(id)
  }

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    showToast('All notifications marked as read')
    await markAllNotificationsAsRead()
  }

  const handleDeleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    await deleteNotification(id)
  }

  const handleUpdateProfile = async (updates: Partial<SellerProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }))
    await updateSellerProfile(updates)
  }

  const handleWithdraw = async (amount: number) => {
    const newBal = Number(Math.max(0, profile.balance - amount).toFixed(2))
    setProfile((prev) => ({
      ...prev,
      balance: newBal,
    }))
    await updateSellerProfile({ balance: newBal })
  }

  const unreadNotifCount = notifications.filter((n) => !n.read).length

  return (
    <>
      {mode !== 'login' && (
        <header className="mode-switcher flex items-center gap-2">
          <button
            type="button"
            className="mode-trigger"
            onClick={() => setModeOpen(!modeOpen)}
          >
            <span className="mode-dot" />
            <span>U Seller Store ({mode.toUpperCase()})</span>
            <ChevronDown size={15} />
          </button>
          {modeOpen && (
            <div className="mode-menu">
              <button
                type="button"
                onClick={() => {
                  setMode('seller')
                  setModeOpen(false)
                }}
              >
                Seller account
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('admin')
                  setModeOpen(false)
                }}
              >
                Admin panel
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setModeOpen(false)
                }}
              >
                Sign out / Switch account
              </button>
            </div>
          )}
        </header>
      )}

      {mode === 'seller' ? (
        <div className="app-shell seller-shell flex flex-col md:flex-row min-h-screen">
          {/* Mobile Top Header */}
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
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {profile.avatarLetter || 'U'}
                </div>
                <div>
                  <strong className="text-xs text-slate-900 block font-bold leading-tight truncate max-w-[140px]">
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
                onClick={() => setIsBalanceModalOpen(true)}
                title="Click to view balance details"
              >
                <Wallet size={12} />
                <span>${profile.balance.toFixed(2)}</span>
              </button>
            </div>
          </div>

          <SellerSidebar
            activeTab={sellerTab}
            onSelectTab={(tab) => {
              setSellerTab(tab)
              showToast(`${tab} opened`)
            }}
            onSignOutClick={signOut}
            onBalanceClick={() => setIsBalanceModalOpen(true)}
            unreadNotificationsCount={unreadNotifCount}
            shopName={profile.shopName}
            ownerName={profile.ownerName}
            balance={profile.balance}
            guarantee={profile.guarantee}
            isOpenOnMobile={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />

          <main className="seller-main flex-1 overflow-y-auto pb-24 md:pb-12">
            {sellerTab === 'Dashboard' && (
              <DashboardView
                profile={profile}
                products={products}
                orders={orders}
                onNavigate={(tab) => {
                  setSellerTab(tab)
                  showToast(`${tab} opened`)
                }}
                onOpenBalanceModal={() => setIsBalanceModalOpen(true)}
                onCreateDemoOrder={handleCreateDemoOrder}
                onToast={showToast}
              />
            )}

            {sellerTab === 'Products' && (
              <ProductsView
                products={products}
                maxSlots={500}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onToast={showToast}
              />
            )}

            {sellerTab === 'Orders' && (
              <OrdersView
                orders={orders}
                onCreateDemoOrder={handleCreateDemoOrder}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onDeleteOrder={handleDeleteOrder}
                onToast={showToast}
              />
            )}

            {sellerTab === 'Notifications' && (
              <NotificationsView
                notifications={notifications}
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
                onOpenBalanceModal={() => setIsBalanceModalOpen(true)}
                onToast={showToast}
              />
            )}
          </main>

          {/* Mobile Bottom Navigation Bar */}
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

          <SupportChatModal onToast={showToast} />

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
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onDeleteOrder={handleDeleteOrder}
          onCreateDemoOrder={handleCreateDemoOrder}
          onToast={showToast}
          onSignOut={signOut}
          onSwitchToSeller={() => {
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

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </>
  )
}
