'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Users,
  Search,
  LogIn,
  MoreVertical,
  CalendarDays,
  Key,
  Bell,
  Activity,
  History,
  Wallet,
  ShieldCheck,
  Star,
  Package,
  TrendingUp,
  Ban,
  MinusCircle,
  Trash2,
  X,
  Check,
  AlertTriangle,
  RotateCcw,
  Eye,
  EyeOff,
  DollarSign,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  Layers,
  Clock,
  Globe,
  Laptop,
  CheckCircle2,
  HelpCircle,
  Sliders,
  Send,
  Lock
} from 'lucide-react'
import { SellerProfile, Product, Order, NotificationItem } from '@/lib/mock-data'
import { updateSellerProfile, createNotification } from '@/lib/supabase/api'

export interface AdminSellersViewProps {
  initialSeller?: SellerProfile
  products?: Product[]
  orders?: Order[]
  onToast: (msg: string) => void
  onSwitchToSeller?: () => void
}

type ModalType =
  | null
  | 'changePassword'
  | 'sendNotification'
  | 'activityOverview'
  | 'loginHistory'
  | 'adjustBalance'
  | 'guaranteeMoney'
  | 'shopRating'
  | 'productLimit'
  | 'viewsBooster'
  | 'suspendAccount'
  | 'blockWithdrawals'
  | 'allowProductRemoval'
  | 'deleteStore'

interface AuditLog {
  id: string
  action: string
  detail: string
  timestamp: string
}

interface LoginSession {
  id: string
  timestamp: string
  ip: string
  device: string
  location: string
  status: 'Success' | '2FA Verified'
}

export function AdminSellersView({
  initialSeller,
  products = [],
  orders = [],
  onToast,
  onSwitchToSeller,
}: AdminSellersViewProps) {
  // Main seller state
  const [seller, setSeller] = useState<SellerProfile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('u_seller_active_profile')
        if (saved) {
          const parsed = JSON.parse(saved)
          return {
            ...initialSeller,
            ...parsed,
          }
        }
      } catch {}
    }
    return (
      initialSeller || {
        shopName: 'tester',
        ownerName: 'Zain',
        email: 'zain55@gmail.com',
        phone: '+1 (555) 234-5678',
        currency: 'USD ($)',
        balance: 0.0,
        guarantee: 0.0,
        rating: 5.0,
        totalOrders: 0,
        memberSince: 'Aug 2026',
        verified: true,
        active: true,
        isSuspended: false,
        withdrawalsBlocked: false,
        allowProductRemoval: true,
        productLimit: 'unlimited',
        activeItemsCount: 504,
        reviewCount: 504,
        lastActiveAgo: '15h ago',
        joinedExact: '7 Aug 2026',
        viewsBooster: {
          enabled: false,
          multiplier: 1.0,
          extraDailyViews: 0,
        },
        seoTitle: 'tester Official Store',
        seoDescription: '',
        avatarLetter: 'T',
        payoutMethods: [],
      }
    )
  })

  // List of sellers (supports soft-delete toggle)
  const [sellersList, setSellersList] = useState<SellerProfile[]>([seller])
  const [searchQuery, setSearchQuery] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Audit trail state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'log-1',
      action: 'Store Initialized',
      detail: 'Registered with invitation code MXSVHSDL',
      timestamp: '7 Aug 2026, 09:30 AM',
    },
    {
      id: 'log-2',
      action: 'Tier Verified',
      detail: 'Identity documents approved by Administrator',
      timestamp: '7 Aug 2026, 11:15 AM',
    },
    {
      id: 'log-3',
      action: 'Inventory Sync',
      detail: 'Catalog updated to 504 active items',
      timestamp: '15h ago',
    },
  ])

  // Login history state
  const [loginHistory] = useState<LoginSession[]>([
    {
      id: 'sess-1',
      timestamp: 'Today, 04:12 PM',
      ip: '198.51.100.42',
      device: 'Chrome 128 (Windows 11)',
      location: 'New York, United States',
      status: 'Success',
    },
    {
      id: 'sess-2',
      timestamp: 'Yesterday, 11:30 AM',
      ip: '172.56.21.90',
      device: 'Safari 17.4 (iOS / iPhone 15)',
      location: 'Dallas, United States',
      status: '2FA Verified',
    },
    {
      id: 'sess-3',
      timestamp: '12 Sep 2026, 08:14 PM',
      ip: '104.28.212.89',
      device: 'Chrome 128 (Windows 11)',
      location: 'New York, United States',
      status: 'Success',
    },
    {
      id: 'sess-4',
      timestamp: '10 Sep 2026, 02:45 PM',
      ip: '104.28.212.89',
      device: 'Edge 128 (Windows 11)',
      location: 'New York, United States',
      status: 'Success',
    },
  ])

  // Close dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Sync state changes with localStorage & Supabase
  const persistSellerUpdate = async (updates: Partial<SellerProfile>, logDetail?: string) => {
    const updated = { ...seller, ...updates }
    setSeller(updated)
    setSellersList((prev) => prev.map((s) => (s.email === seller.email ? updated : s)))

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('u_seller_active_profile', JSON.stringify(updated))
      }
    } catch {}

    await updateSellerProfile(updates)

    if (logDetail) {
      const newLog: AuditLog = {
        id: 'log-' + Date.now(),
        action: 'Admin Override',
        detail: logDetail,
        timestamp: 'Just now',
      }
      setAuditLogs((prev) => [newLog, ...prev])
    }
  }

  // Filter sellers based on search & deleted toggle
  const filteredSellers = sellersList.filter((item) => {
    const isItemDeleted = Boolean(item.isDeleted)
    if (showDeleted !== isItemDeleted) return false

    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      item.shopName.toLowerCase().includes(q) ||
      item.ownerName.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q)
    )
  })

  // Modal form states
  // 1. Change Password
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // 2. Send Notification
  const [notifTitle, setNotifTitle] = useState('')
  const [notifDesc, setNotifDesc] = useState('')
  const [notifType, setNotifType] = useState<NotificationItem['type']>('system')

  // 3. Adjust Balance
  const [balanceAction, setBalanceAction] = useState<'credit' | 'debit'>('credit')
  const [balanceAmount, setBalanceAmount] = useState('')
  const [balanceReason, setBalanceReason] = useState('')

  // 4. Guarantee Money
  const [guaranteeAction, setGuaranteeAction] = useState<'deposit' | 'release' | 'set'>('deposit')
  const [guaranteeAmount, setGuaranteeAmount] = useState('')
  const [guaranteeReason, setGuaranteeReason] = useState('')

  // 5. Shop Rating
  const [targetRating, setTargetRating] = useState<number>(seller.rating || 5.0)
  const [targetReviews, setTargetReviews] = useState<number>(seller.reviewCount || 504)

  // 6. Product Limit
  const [isLimitUnlimited, setIsLimitUnlimited] = useState<boolean>(
    seller.productLimit === 'unlimited' || !seller.productLimit
  )
  const [customLimit, setCustomLimit] = useState<number>(
    typeof seller.productLimit === 'number' ? seller.productLimit : 1000
  )

  // 7. Views Booster
  const [boosterEnabled, setBoosterEnabled] = useState<boolean>(
    seller.viewsBooster?.enabled || false
  )
  const [boosterMultiplier, setBoosterMultiplier] = useState<number>(
    seller.viewsBooster?.multiplier || 2.0
  )
  const [boosterExtraViews, setBoosterExtraViews] = useState<number>(
    seller.viewsBooster?.extraDailyViews || 5000
  )

  // -------------------------------------------------------------
  // HANDLERS FOR ALL 12 ACTIONS
  // -------------------------------------------------------------

  // 1. Change Password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword) {
      onToast('Please enter a new password')
      return
    }
    if (newPassword !== confirmPassword) {
      onToast('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      onToast('Password must be at least 6 characters')
      return
    }

    await persistSellerUpdate(
      { password: newPassword },
      `Password changed by Administrator for ${seller.shopName}`
    )
    onToast(`Password successfully updated for ${seller.shopName}!`)
    setNewPassword('')
    setConfirmPassword('')
    setActiveModal(null)
  }

  // 2. Send Notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notifTitle.trim()) {
      onToast('Notification title is required')
      return
    }

    const newNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      title: notifTitle.trim(),
      description: notifDesc.trim() || 'Notice from Administrator console.',
      date: new Date()
        .toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
        .toUpperCase(),
      timeAgo: 'Just now',
      refCode: 'ADM-' + Math.floor(100000 + Math.random() * 900000),
      type: notifType,
      read: false,
      details: notifDesc.trim(),
    }

    await createNotification(newNotif)

    // Also push to local storage notification cache for the seller
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('u_seller_notifications')
        const list = stored ? JSON.parse(stored) : []
        localStorage.setItem('u_seller_notifications', JSON.stringify([newNotif, ...list]))
      }
    } catch {}

    await persistSellerUpdate({}, `Dispatched ${notifType} notification: "${notifTitle}"`)
    onToast(`Notification dispatched to ${seller.shopName}!`)
    setNotifTitle('')
    setNotifDesc('')
    setActiveModal(null)
  }

  // 5. Adjust Balance
  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = parseFloat(balanceAmount)
    if (isNaN(amountNum) || amountNum <= 0) {
      onToast('Please enter a valid positive amount')
      return
    }

    let newBalance = seller.balance
    if (balanceAction === 'credit') {
      newBalance = Number((seller.balance + amountNum).toFixed(2))
    } else {
      newBalance = Number(Math.max(0, seller.balance - amountNum).toFixed(2))
    }

    const logText = `${balanceAction === 'credit' ? 'Credited' : 'Debited'} $${amountNum.toFixed(2)} ${
      balanceReason ? `(${balanceReason})` : ''
    }. New balance: $${newBalance.toFixed(2)}`

    await persistSellerUpdate({ balance: newBalance }, logText)
    onToast(`Balance updated: $${newBalance.toFixed(2)} USD`)
    setBalanceAmount('')
    setBalanceReason('')
    setActiveModal(null)
  }

  // 6. Guarantee Money
  const handleGuaranteeMoney = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = parseFloat(guaranteeAmount)
    if (isNaN(amountNum) || amountNum < 0) {
      onToast('Please enter a valid amount')
      return
    }

    let newGuarantee = seller.guarantee
    if (guaranteeAction === 'deposit') {
      newGuarantee = Number((seller.guarantee + amountNum).toFixed(2))
    } else if (guaranteeAction === 'release') {
      newGuarantee = Number(Math.max(0, seller.guarantee - amountNum).toFixed(2))
    } else {
      newGuarantee = Number(amountNum.toFixed(2))
    }

    const logText = `Guarantee funds adjusted (${guaranteeAction}): $${amountNum.toFixed(2)}. Current: $${newGuarantee.toFixed(2)}`
    await persistSellerUpdate({ guarantee: newGuarantee }, logText)
    onToast(`Guarantee deposit updated: $${newGuarantee.toFixed(2)} USD`)
    setGuaranteeAmount('')
    setGuaranteeReason('')
    setActiveModal(null)
  }

  // 7. Shop Rating
  const handleSaveRating = async (e: React.FormEvent) => {
    e.preventDefault()
    await persistSellerUpdate(
      { rating: targetRating, reviewCount: targetReviews },
      `Shop rating updated to ${targetRating.toFixed(2)} (${targetReviews} reviews)`
    )
    onToast(`Shop rating set to ${targetRating.toFixed(2)} ★`)
    setActiveModal(null)
  }

  // 8. Product Limit
  const handleSaveProductLimit = async (e: React.FormEvent) => {
    e.preventDefault()
    const limitVal = isLimitUnlimited ? 'unlimited' : customLimit
    await persistSellerUpdate(
      { productLimit: limitVal },
      `Product catalog limit updated to ${isLimitUnlimited ? 'Unlimited' : `${customLimit} items`}`
    )
    onToast(
      isLimitUnlimited
        ? 'Product limit removed (Unlimited)'
        : `Product limit configured to ${customLimit} items`
    )
    setActiveModal(null)
  }

  // 9. Views Booster
  const handleSaveViewsBooster = async (e: React.FormEvent) => {
    e.preventDefault()
    const viewsConfig = {
      enabled: boosterEnabled,
      multiplier: boosterMultiplier,
      extraDailyViews: boosterExtraViews,
    }
    await persistSellerUpdate(
      { viewsBooster: viewsConfig },
      `Views booster ${boosterEnabled ? `enabled (${boosterMultiplier}x, +${boosterExtraViews}/day)` : 'disabled'}`
    )
    onToast(
      boosterEnabled
        ? `Views booster activated: ${boosterMultiplier}x multiplier applied!`
        : 'Views booster disabled.'
    )
    setActiveModal(null)
  }

  // 10. Suspend Account
  const handleToggleSuspend = async () => {
    const nextSuspended = !seller.isSuspended
    await persistSellerUpdate(
      { isSuspended: nextSuspended, active: !nextSuspended },
      `Store ${nextSuspended ? 'suspended' : 'reactivated'} by Administrator`
    )
    onToast(
      nextSuspended
        ? `Account ${seller.shopName} has been suspended.`
        : `Account ${seller.shopName} reactivated successfully.`
    )
    setActiveModal(null)
  }

  // 11. Block Withdrawals
  const handleToggleWithdrawals = async () => {
    const nextBlocked = !seller.withdrawalsBlocked
    await persistSellerUpdate(
      { withdrawalsBlocked: nextBlocked },
      `Withdrawals ${nextBlocked ? 'blocked' : 'unblocked'} for merchant`
    )
    onToast(
      nextBlocked
        ? `Withdrawals locked for ${seller.shopName}.`
        : `Withdrawals enabled for ${seller.shopName}.`
    )
    setActiveModal(null)
  }

  // 12. Allow Product Removal
  const handleToggleProductRemoval = async () => {
    const nextRemoval = !seller.allowProductRemoval
    await persistSellerUpdate(
      { allowProductRemoval: nextRemoval },
      `Catalog product removal permission set to ${nextRemoval ? 'Allowed' : 'Prohibited'}`
    )
    onToast(
      nextRemoval
        ? 'Product removal permission granted to seller.'
        : 'Product removal restricted for seller.'
    )
    setActiveModal(null)
  }

  // 13. Delete Store (Soft delete & Restore)
  const handleDeleteStore = async () => {
    await persistSellerUpdate(
      { isDeleted: true, deletedAt: new Date().toISOString() },
      `Store ${seller.shopName} soft-deleted by Administrator`
    )
    onToast(`Store "${seller.shopName}" moved to Deleted archive.`)
    setActiveModal(null)
  }

  const handleRestoreStore = async () => {
    await persistSellerUpdate(
      { isDeleted: false, deletedAt: undefined },
      `Store ${seller.shopName} restored from Deleted archive`
    )
    onToast(`Store "${seller.shopName}" restored to active sellers!`)
    setShowDeleted(false)
  }

  // Render items count (defaults to 504 from screenshot or products.length)
  const displayItemsCount =
    products.length > 0 ? products.length : seller.activeItemsCount || 504

  return (
    <div className="sellers-page space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* TOP HEADER: ICON, TITLE, SEARCH, RESULTS COUNT, DELETED TOGGLE */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Title with Blue Icon */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-xs">
            <Users size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight m-0">Sellers</h1>
            <p className="text-xs text-slate-500 font-medium m-0 mt-0.5">
              All sellers who registered with your invitation code. Click a row to manage.
            </p>
          </div>
        </div>

        {/* Right Tools: Search Bar, Results Count, Deleted Toggle */}
        <div className="flex flex-wrap items-center gap-3">
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
              placeholder="Search shop, name, or email..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Results Count Pill */}
          <div className="px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700 text-[11px] font-bold tracking-wider uppercase shadow-2xs flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">RESULTS</span>
            <span className="text-slate-900 font-extrabold">{filteredSellers.length}</span>
          </div>

          {/* Deleted Toggle Switch */}
          <div className="flex items-center gap-2 pl-1 border-l border-slate-200/80">
            <span className="text-xs font-semibold text-slate-600">Deleted</span>
            <button
              type="button"
              role="switch"
              aria-checked={showDeleted}
              onClick={() => setShowDeleted(!showDeleted)}
              className={`w-10 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer flex items-center ${
                showDeleted ? 'bg-indigo-600' : 'bg-slate-200 hover:bg-slate-300'
              }`}
            >
              <div
                className={`w-4.5 h-4.5 rounded-full bg-white shadow-xs transition-transform duration-200 ease-in-out ${
                  showDeleted ? 'translate-x-4.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SELLER CARDS LIST */}
      {/* ------------------------------------------------------------- */}
      {filteredSellers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 grid place-items-center mx-auto mb-3">
            <Search size={22} />
          </div>
          <h3 className="text-sm font-bold text-slate-800 m-0">No sellers found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {showDeleted
              ? 'There are no deleted or archived sellers in this console.'
              : 'Try modifying your search criteria or clear the search bar.'}
          </p>
          {showDeleted && (
            <button
              type="button"
              onClick={() => setShowDeleted(false)}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer shadow-xs"
            >
              Return to Active Sellers
            </button>
          )}
        </div>
      ) : (
        filteredSellers.map((s) => {
          const isSuspended = Boolean(s.isSuspended)
          const isBlocked = Boolean(s.withdrawalsBlocked)

          return (
            <div
              key={s.email}
              className="seller-card bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-4 relative"
            >
              {/* Column 1: Identity & Avatar */}
              <div className="flex items-center gap-3.5 min-w-[280px]">
                {/* Purple Avatar with Online Dot */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-[#6366F1] text-white font-black text-lg flex items-center justify-center shadow-xs">
                    {s.avatarLetter || s.shopName.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white ${
                      isSuspended ? 'bg-amber-400' : 'bg-slate-300'
                    }`}
                  />
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900">{s.shopName}</span>
                    <span className="text-xs text-slate-400 font-normal">
                      {s.lastActiveAgo || '15h ago'}
                    </span>
                    {isSuspended && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                        Suspended
                      </span>
                    )}
                    {isBlocked && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                        Payouts Locked
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">{s.email}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-0.5">
                    <CalendarDays size={13} className="text-slate-400" />
                    <span>Joined {s.joinedExact || '7 Aug 2026'}</span>
                  </div>
                </div>
              </div>

              {/* Middle Group: Rating & Tier */}
              <div className="flex flex-wrap items-center gap-8 sm:gap-12 py-2 xl:py-0 border-t xl:border-t-0 border-slate-100">
                {/* Rating & Active Items */}
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs font-extrabold shadow-2xs">
                    <Star size={13} className="fill-amber-400 text-amber-400" />
                    <span>{(s.rating || 5.0).toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {displayItemsCount} Active Items
                  </div>
                </div>

                {/* Account Tier & Status */}
                <div className="space-y-1">
                  {s.isDeleted ? (
                    <span className="inline-block px-3 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-black tracking-wider uppercase">
                      DELETED
                    </span>
                  ) : isSuspended ? (
                    <span className="inline-block px-3 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-black tracking-wider uppercase">
                      SUSPENDED
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-black tracking-wider uppercase">
                      VERIFIED
                    </span>
                  )}
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    ACCOUNT TIER
                  </div>
                </div>
              </div>

              {/* Right Side: Quick Action Button & Financials & Menu */}
              <div className="flex items-center justify-between xl:justify-end gap-5 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-100">
                {/* Actions: Login button & Three dots */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSwitchToSeller) {
                        onSwitchToSeller()
                      } else {
                        window.location.href = '/?mode=seller'
                      }
                      onToast(`Logged into ${s.shopName} merchant console!`)
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowUpRight size={15} className="text-slate-500" />
                    <span>Login</span>
                  </button>

                  {/* Three Dots Button & Floating Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      aria-label="Seller Actions Menu"
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveMenuId(activeMenuId === s.email ? null : s.email)
                      }}
                      className={`w-8 h-8 rounded-xl border transition-all grid place-items-center cursor-pointer ${
                        activeMenuId === s.email
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 shadow-2xs'
                      }`}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* FLOATING ACTION DROPDOWN MENU (MATCHING SCREENSHOT) */}
                    {activeMenuId === s.email && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2.5 z-50 animate-in fade-in zoom-in-95"
                      >
                        {/* SECTION 1: ACCOUNT ACTIONS */}
                        <div className="px-3 py-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1">
                            ACCOUNT ACTIONS
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null)
                              setActiveModal('changePassword')
                            }}
                            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                          >
                            <Key size={15} className="text-slate-400" />
                            <span>Change Password</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null)
                              setActiveModal('sendNotification')
                            }}
                            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                          >
                            <Bell size={15} className="text-indigo-500" />
                            <span>Send Notification</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null)
                              setActiveModal('activityOverview')
                            }}
                            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                          >
                            <Activity size={15} className="text-teal-500" />
                            <span>Activity Overview</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null)
                              setActiveModal('loginHistory')
                            }}
                            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                          >
                            <History size={15} className="text-indigo-600" />
                            <span>Login History</span>
                          </button>
                        </div>

                        <div className="h-px bg-slate-100 my-1" />

                        {/* SECTION 2: FINANCIALS */}
                        <div className="px-3 py-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1">
                            FINANCIALS
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null)
                              setActiveModal('adjustBalance')
                            }}
                            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                          >
                            <Wallet size={15} className="text-emerald-500" />
                            <span>Adjust Balance</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null)
                              setActiveModal('guaranteeMoney')
                            }}
                            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                          >
                            <ShieldCheck size={15} className="text-blue-500" />
                            <span>Guarantee Money</span>
                          </button>
                        </div>

                        <div className="h-px bg-slate-100 my-1" />

                        {/* SECTION 3: SHOP SETTINGS */}
                        <div className="px-3 py-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1">
                            SHOP SETTINGS
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null)
                              setActiveModal('shopRating')
                            }}
                            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                          >
                            <Star size={15} className="text-amber-500" />
                            <span>Shop Rating</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null)
                              setActiveModal('productLimit')
                            }}
                            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                          >
                            <Package size={15} className="text-purple-500" />
                            <span>Product Limit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null)
                              setActiveModal('viewsBooster')
                            }}
                            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                          >
                            <TrendingUp size={15} className="text-rose-500" />
                            <span>Views Booster</span>
                          </button>
                        </div>

                        <div className="h-px bg-slate-100 my-1" />

                        {/* SECTION 4: RISK CONTROLS */}
                        <div className="px-3 py-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1">
                            RISK CONTROLS
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null)
                              setActiveModal('suspendAccount')
                            }}
                            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-amber-600 hover:bg-amber-50 transition-colors text-left cursor-pointer"
                          >
                            <Ban size={15} className="text-amber-500" />
                            <span>{s.isSuspended ? 'Reactivate Account' : 'Suspend Account'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null)
                              setActiveModal('blockWithdrawals')
                            }}
                            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                          >
                            <MinusCircle size={15} className="text-rose-500" />
                            <span>
                              {s.withdrawalsBlocked ? 'Unblock Withdrawals' : 'Block Withdrawals'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null)
                              setActiveModal('allowProductRemoval')
                            }}
                            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors text-left cursor-pointer"
                          >
                            <Package size={15} className="text-indigo-500" />
                            <span>
                              {s.allowProductRemoval ? 'Lock Product Removal' : 'Allow Product Removal'}
                            </span>
                          </button>
                          {s.isDeleted ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null)
                                handleRestoreStore()
                              }}
                              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors text-left cursor-pointer"
                            >
                              <RotateCcw size={15} className="text-emerald-500" />
                              <span>Restore Store</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null)
                                setActiveModal('deleteStore')
                              }}
                              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                            >
                              <Trash2 size={15} className="text-rose-500" />
                              <span>Delete Store</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financials: BALANCE & GUARANTEE */}
                <div className="text-right min-w-[110px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-tight">
                    BALANCE
                  </span>
                  <span className="text-base font-black text-slate-900 block leading-tight">
                    ${(s.balance || 0).toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium block leading-tight mt-0.5">
                    Guarantee ${(s.guarantee || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )
        })
      )}

      {/* ------------------------------------------------------------- */}
      {/* 12 WORKABLE ACTION MODALS */}
      {/* ------------------------------------------------------------- */}

      {/* 1. CHANGE PASSWORD MODAL */}
      {activeModal === 'changePassword' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 grid place-items-center">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 m-0">Change Password</h3>
                  <p className="text-xs text-slate-400 m-0">Update credentials for {seller.shopName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. SEND NOTIFICATION MODAL */}
      {activeModal === 'sendNotification' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center">
                  <Bell size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 m-0">Send Notification</h3>
                  <p className="text-xs text-slate-400 m-0">
                    Direct message to {seller.shopName} Notification Center
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notification Category
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['system', 'order', 'kyc', 'payout'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNotifType(cat)}
                      className={`py-2 text-center rounded-xl text-xs font-bold uppercase tracking-wider border cursor-pointer ${
                        notifType === cat
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notification Title
                </label>
                <input
                  type="text"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="e.g. Account Security Alert or Promotion Notice"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Message Description
                </label>
                <textarea
                  value={notifDesc}
                  onChange={(e) => setNotifDesc(e.target.value)}
                  rows={4}
                  placeholder="Write message content that will appear in the seller dashboard..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={13} />
                  <span>Send Notification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ACTIVITY OVERVIEW MODAL */}
      {activeModal === 'activityOverview' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 grid place-items-center">
                  <Activity size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 m-0">Store Activity Overview</h3>
                  <p className="text-xs text-slate-400 m-0">Live metrics &amp; audit history for {seller.shopName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Store Balance
                </span>
                <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                  ${(seller.balance || 0).toFixed(2)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Guarantee Deposit
                </span>
                <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                  ${(seller.guarantee || 0).toFixed(2)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Active Items
                </span>
                <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                  {displayItemsCount}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Orders
                </span>
                <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                  {orders.length || seller.totalOrders || 0}
                </span>
              </div>
            </div>

            {/* Store Health & Permissions */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="text-xs font-bold text-slate-800">Security &amp; Permissions Status</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70">
                  <span className="text-slate-600">Store Status:</span>
                  <span
                    className={`font-bold ${
                      seller.isSuspended ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {seller.isSuspended ? 'Suspended' : 'Active & Operational'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70">
                  <span className="text-slate-600">Withdrawals:</span>
                  <span
                    className={`font-bold ${
                      seller.withdrawalsBlocked ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {seller.withdrawalsBlocked ? 'Blocked / Frozen' : 'Permitted'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70">
                  <span className="text-slate-600">Product Removal:</span>
                  <span className="font-bold text-indigo-600">
                    {seller.allowProductRemoval ? 'Allowed' : 'Restricted'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70">
                  <span className="text-slate-600">Views Booster:</span>
                  <span className="font-bold text-purple-600">
                    {seller.viewsBooster?.enabled
                      ? `${seller.viewsBooster.multiplier}x Active`
                      : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Audit Trail */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-800">Administrator &amp; Store Audit Trail</div>
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-white border border-slate-200/80 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 block">{log.action}</span>
                      <span className="text-slate-500 text-[11px]">{log.detail}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Close Overview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. LOGIN HISTORY MODAL */}
      {activeModal === 'loginHistory' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 m-0">Merchant Login History</h3>
                  <p className="text-xs text-slate-400 m-0">Recent authentication events for {seller.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="p-3">Time</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Device / Browser</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loginHistory.map((sess) => (
                    <tr key={sess.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-medium text-slate-900">{sess.timestamp}</td>
                      <td className="p-3 font-mono text-slate-600 text-[11px]">{sess.ip}</td>
                      <td className="p-3">{sess.device}</td>
                      <td className="p-3 text-slate-500">{sess.location}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          {sess.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. ADJUST BALANCE MODAL */}
      {activeModal === 'adjustBalance' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center">
                  <Wallet size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 m-0">Adjust Seller Balance</h3>
                  <p className="text-xs text-slate-400 m-0">Current: ${(seller.balance || 0).toFixed(2)} USD</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdjustBalance} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBalanceAction('credit')}
                    className={`py-2 text-center rounded-xl text-xs font-bold border cursor-pointer ${
                      balanceAction === 'credit'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    + Add Balance (Credit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBalanceAction('debit')}
                    className={`py-2 text-center rounded-xl text-xs font-bold border cursor-pointer ${
                      balanceAction === 'debit'
                        ? 'bg-rose-50 border-rose-500 text-rose-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    - Deduct Balance (Debit)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount in USD ($)
                </label>
                <div className="relative">
                  <DollarSign
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason / Memo Note (Optional)
                </label>
                <input
                  type="text"
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  placeholder="e.g. Settlement compensation, refund correction"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. GUARANTEE MONEY MODAL */}
      {activeModal === 'guaranteeMoney' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 grid place-items-center">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 m-0">Guarantee Deposit</h3>
                  <p className="text-xs text-slate-400 m-0">Current: ${(seller.guarantee || 0).toFixed(2)} USD</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGuaranteeMoney} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Action</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['deposit', 'release', 'set'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setGuaranteeAction(mode)}
                      className={`py-2 text-center rounded-xl text-xs font-bold uppercase tracking-wider border cursor-pointer ${
                        guaranteeAction === mode
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount ($)
                </label>
                <div className="relative">
                  <DollarSign
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={guaranteeAmount}
                    onChange={(e) => setGuaranteeAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Internal Note (Optional)
                </label>
                <input
                  type="text"
                  value={guaranteeReason}
                  onChange={(e) => setGuaranteeReason(e.target.value)}
                  placeholder="e.g. Risk deposit compliance requirement"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Update Guarantee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. SHOP RATING MODAL */}
      {activeModal === 'shopRating' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 grid place-items-center">
                  <Star size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 m-0">Configure Shop Rating</h3>
                  <p className="text-xs text-slate-400 m-0">Control store star rating and review count</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRating} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Star Rating: <b className="text-amber-600 text-sm ml-1">{targetRating.toFixed(2)} ★</b>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.05"
                  value={targetRating}
                  onChange={(e) => setTargetRating(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-1">
                  <span>1.00</span>
                  <span>2.00</span>
                  <span>3.00</span>
                  <span>4.00</span>
                  <span>5.00</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Reviews Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={targetReviews}
                  onChange={(e) => setTargetReviews(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Rating
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. PRODUCT LIMIT MODAL */}
      {activeModal === 'productLimit' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 grid place-items-center">
                  <Package size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 m-0">Configure Product Limit</h3>
                  <p className="text-xs text-slate-400 m-0">Max inventory catalog listings for {seller.shopName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProductLimit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Unlimited Products</span>
                  <span className="text-[11px] text-slate-400">Allow merchant to publish without catalog limit</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isLimitUnlimited}
                  onClick={() => setIsLimitUnlimited(!isLimitUnlimited)}
                  className={`w-10 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer flex items-center ${
                    isLimitUnlimited ? 'bg-purple-600' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white shadow-xs transition-transform duration-200 ease-in-out ${
                      isLimitUnlimited ? 'translate-x-4.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {!isLimitUnlimited && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Maximum Number of Products
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customLimit}
                    onChange={(e) => setCustomLimit(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-bold"
                    required
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. VIEWS BOOSTER MODAL */}
      {activeModal === 'viewsBooster' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 grid place-items-center">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 m-0">Store Views Booster</h3>
                  <p className="text-xs text-slate-400 m-0">Simulate organic marketplace search traffic</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveViewsBooster} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Booster Active</span>
                  <span className="text-[11px] text-slate-400">Apply traffic surge multiplier</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={boosterEnabled}
                  onClick={() => setBoosterEnabled(!boosterEnabled)}
                  className={`w-10 h-5.5 rounded-full transition-colors relative p-0.5 cursor-pointer flex items-center ${
                    boosterEnabled ? 'bg-rose-600' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white shadow-xs transition-transform duration-200 ease-in-out ${
                      boosterEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Traffic Multiplier
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1.5, 2.0, 5.0, 10.0].map((mult) => (
                    <button
                      key={mult}
                      type="button"
                      onClick={() => setBoosterMultiplier(mult)}
                      className={`py-2 text-center rounded-xl text-xs font-bold border cursor-pointer ${
                        boosterMultiplier === mult
                          ? 'bg-rose-50 border-rose-500 text-rose-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {mult}x
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Extra Daily Impressions: <b className="text-rose-600">+{boosterExtraViews.toLocaleString()}</b>
                </label>
                <input
                  type="range"
                  min="1000"
                  max="20000"
                  step="500"
                  value={boosterExtraViews}
                  onChange={(e) => setBoosterExtraViews(parseInt(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Booster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. SUSPEND ACCOUNT MODAL */}
      {activeModal === 'suspendAccount' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 grid place-items-center shrink-0">
                <Ban size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">
                  {seller.isSuspended ? 'Reactivate Store' : 'Suspend Account'}
                </h3>
                <p className="text-xs text-slate-500 m-0">
                  Target merchant: <b className="text-slate-800">{seller.shopName}</b>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/70">
              {seller.isSuspended
                ? 'Reactivating this seller store will restore full access to publish products, process orders, and manage listings.'
                : 'Suspending this seller store will temporarily disable order processing and prevent new item submissions.'}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleSuspend}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-xs cursor-pointer ${
                  seller.isSuspended ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {seller.isSuspended ? 'Confirm Reactivation' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. BLOCK WITHDRAWALS MODAL */}
      {activeModal === 'blockWithdrawals' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 grid place-items-center shrink-0">
                <MinusCircle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">
                  {seller.withdrawalsBlocked ? 'Unblock Withdrawals' : 'Block Withdrawals'}
                </h3>
                <p className="text-xs text-slate-500 m-0">
                  Target merchant: <b className="text-slate-800">{seller.shopName}</b>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-rose-50/60 p-3.5 rounded-2xl border border-rose-200/70">
              {seller.withdrawalsBlocked
                ? 'Unblocking withdrawals will allow this merchant to submit payout requests to their linked bank account.'
                : 'Blocking withdrawals will prevent this merchant from requesting any payouts until cleared by compliance.'}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleWithdrawals}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {seller.withdrawalsBlocked ? 'Unblock Withdrawals' : 'Confirm Payout Lock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. ALLOW PRODUCT REMOVAL MODAL */}
      {activeModal === 'allowProductRemoval' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 grid place-items-center shrink-0">
                <Package size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Product Removal Permission</h3>
                <p className="text-xs text-slate-500 m-0">
                  Target merchant: <b className="text-slate-800">{seller.shopName}</b>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              Current setting:{' '}
              <b className="text-slate-800">
                {seller.allowProductRemoval ? 'Removal Allowed' : 'Removal Locked'}
              </b>
              . When locked, the seller cannot delete products that have active customer orders or historical purchases.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleProductRemoval}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {seller.allowProductRemoval ? 'Lock Removal Access' : 'Allow Removal Access'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13. DELETE STORE MODAL */}
      {activeModal === 'deleteStore' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 grid place-items-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Delete Store</h3>
                <p className="text-xs text-slate-500 m-0">
                  Target merchant: <b className="text-slate-800">{seller.shopName}</b>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200/80">
              Are you sure you want to delete store <b className="text-rose-900">{seller.shopName}</b>?
              This store will be moved to the <b>Deleted</b> archive view. You can review or restore it anytime using the Deleted toggle in the header.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStore}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
