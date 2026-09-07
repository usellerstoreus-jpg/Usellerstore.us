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
  Box,
  Wallet
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
}: {
  active: string
  onNavigate: (label: string) => void
  onSignOut: () => void
}) {
  return (
    <aside className="sidebar admin-sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Grid2X2 size={22} strokeWidth={2.4} />
        </div>
        <div className="brand-info">
          <strong>U Seller Store</strong>
          <span>Management Console</span>
        </div>
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

      <nav className="admin-nav" aria-label="Admin navigation">
        {adminNav.map(({ label, icon: Icon, group }, index) => (
          <div key={label}>
            {(index === 0 || adminNav[index - 1].group !== group) && (
              <span className="nav-group">{group}</span>
            )}
            <button
              type="button"
              className={active === label ? 'active' : ''}
              onClick={() => onNavigate(label)}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          </div>
        ))}
      </nav>

      <button type="button" className="sign-out" onClick={onSignOut}>
        <span>Sign Out</span>
      </button>
    </aside>
  )
}

function AdminPanel({
  onToast,
  onSignOut,
  onSwitchToSeller,
}: {
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
      />
      <main className="admin-main">
        <div className="admin-topbar">
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

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
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
              <div className="flex items-center justify-between gap-4">
                <label className="search-box flex-1 max-w-md">
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
              <h2 className="text-lg font-bold text-slate-900 mb-2">Platform Orders Monitoring</h2>
              <p className="text-xs text-slate-500 mb-4">Real-time audit log of all transactions across every merchant storefront.</p>
              <div className="py-8 text-center text-slate-400">
                <ShoppingBag size={36} className="mx-auto mb-2 text-blue-500" />
                <p className="font-semibold text-slate-700 text-sm">382 total orders processed across all registered merchants.</p>
              </div>
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

  // Seller sub-mode
  const [sellerAuthMode, setSellerAuthMode] = useState<'signin' | 'signup'>('signin')

  // Seller Sign In fields
  const [signInEmail, setSignInEmail] = useState('zain55@gmail.com')
  const [signInPassword, setSignInPassword] = useState('••••••••')

  // Seller Sign Up fields
  const [fullName, setFullName] = useState('')
  const [shopName, setShopName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')

  // Admin Login fields
  const [adminEmail, setAdminEmail] = useState('admin@usellerstore.com')
  const [adminPassword, setAdminPassword] = useState('admin123')

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

          {successMessage && (
            <div className="auth-success-banner" role="alert">
              <CheckCircle2 size={17} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* SELLER PORTAL */}
          {rolePortal === 'seller' ? (
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

                  <label>
                    Email address
                    <input
                      type="email"
                      placeholder="you@yourstore.com"
                      required
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                    />
                  </label>

                  <label>
                    Password
                    <input
                      type="password"
                      placeholder="Enter your password"
                      required
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                    />
                  </label>

                  <div className="form-row">
                    <label className="remember">
                      <input type="checkbox" defaultChecked /> Remember me
                    </label>
                    <button
                      type="button"
                      className="forgot"
                      onClick={() => onToast('Password reset instructions sent')}
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

                  <label>
                    Your Full Name
                    <input
                      type="text"
                      placeholder="e.g. Alex Miller"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </label>

                  <label>
                    Shop / Store Name
                    <input
                      type="text"
                      placeholder="e.g. Apex Trends Store"
                      required
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                    />
                  </label>

                  <label>
                    Email address
                    <input
                      type="email"
                      placeholder="alex@yourstore.com"
                      required
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                    />
                  </label>

                  <label>
                    Password
                    <input
                      type="password"
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                    />
                  </label>

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

              <label>
                Administrator Email
                <input
                  type="email"
                  placeholder="admin@usellerstore.com"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  placeholder="Enter administrator password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </label>

              <button
                type="submit"
                className="login-submit"
                disabled={isLoading}
                style={{ background: '#1e1b4b', marginTop: '14px' }}
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

  const [products, setProducts] = useState<Product[]>(initialProducts)
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
      if (supaProds && supaProds.length > 0) setProducts(supaProds)
      if (supaOrders && supaOrders.length > 0) setOrders(supaOrders)
      if (supaNotifs && supaNotifs.length > 0) setNotifications(supaNotifs)
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
      setProducts((prev) => [created, ...prev])
    }
  }

  const handleUpdateProduct = async (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    await updateProduct(updated)
  }

  const handleDeleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
    await deleteProduct(id)
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
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
    await updateOrderStatus(orderId, newStatus)
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
        <div className="app-shell seller-shell">
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
          />

          <main className="seller-main">
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
