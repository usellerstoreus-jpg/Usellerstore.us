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
  ExternalLink,
  Sparkles,
  Layers,
  Clock,
  Globe,
  Laptop,
  CheckCircle2,
  HelpCircle,
  Sliders,
  Send,
  Lock,
  UserPlus,
  Calendar,
  MapPin,
  Monitor,
  Copy,
  Compass,
  Navigation,
  Map,
  RefreshCw,
} from 'lucide-react'
import { SellerProfile, Product, Order, NotificationItem, initialSellerProfile } from '@/lib/mock-data'
import {
  updateSellerProfile,
  createNotification,
  fetchSellerProfiles,
  createSellerProfile,
  deleteSellerProfile,
  reviewKycSubmission,
} from '@/lib/supabase/api'
import {
  recordActivityLog,
  getDeviceDetails,
  getLocationDetails,
  recordSellerLoginSession,
  fetchSellerLoginSessions,
  clearAllSellerLoginSessions,
  SellerLoginSession,
} from '@/lib/activity-logger'
import { AdminKycModal } from '@/components/admin/AdminKycModal'

export interface AdminSellersViewProps {
  initialSeller?: SellerProfile
  sellers?: SellerProfile[]
  products?: Product[]
  orders?: Order[]
  onToast: (msg: string) => void
  onSwitchToSeller?: (sellerProfile?: SellerProfile) => void
}

type ModalType =
  | null
  | 'onboardSeller'
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
  | 'inspectKyc'

interface AuditLog {
  id: string
  action: string
  detail: string
  timestamp: string
}

export interface LoginSession {
  id: string
  timestamp: string
  rawDate?: string
  ip: string
  device: string
  location: string
  countryCode?: string
  userAgent?: string
  status?: 'Success' | '2FA Verified'
}

export function AdminSellersView({
  initialSeller,
  sellers,
  products = [],
  orders = [],
  onToast,
  onSwitchToSeller,
}: AdminSellersViewProps) {
  // Main seller state initialized cleanly without SSR mismatch
  const [seller, setSeller] = useState<SellerProfile>(initialSeller || initialSellerProfile)

  // List of sellers (dynamically synced from database & props)
  const [sellersList, setSellersList] = useState<SellerProfile[]>(() => {
    if (sellers && sellers.length > 0) return sellers
    return [initialSeller || initialSellerProfile]
  })
  const [selectedSeller, setSelectedSeller] = useState<SellerProfile>(() => {
    if (sellers && sellers.length > 0) return sellers[0]
    return initialSeller || initialSellerProfile
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Sync with client-side localStorage after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('u_seller_active_profile')
        if (saved) {
          const parsed = JSON.parse(saved)
          setSeller((prev) => ({ ...prev, ...parsed }))
        }
      } catch {}
    }
  }, [])

  // Sync sellers prop when loaded
  useEffect(() => {
    if (sellers && sellers.length > 0) {
      setSellersList(sellers)
      setSelectedSeller((prev) => {
        const match = sellers.find((s) => s.email === prev.email || s.id === prev.id)
        return match || sellers[0]
      })
    }
  }, [sellers])

  // Onboard Seller modal state
  const [onboardShopName, setOnboardShopName] = useState('')
  const [onboardOwnerName, setOnboardOwnerName] = useState('')
  const [onboardEmail, setOnboardEmail] = useState('')
  const [onboardPassword, setOnboardPassword] = useState('')
  const [onboardBalance, setOnboardBalance] = useState('0.00')
  const [onboardGuarantee, setOnboardGuarantee] = useState('0.00')
  const [isOnboarding, setIsOnboarding] = useState(false)

  // Sync sellers list from Supabase on mount
  useEffect(() => {
    async function loadSellers() {
      try {
        const fetched = await fetchSellerProfiles()
        if (fetched && fetched.length > 0) {
          setSellersList(fetched)
          setSelectedSeller((prev) => {
            const match = fetched.find((s) => s.email === prev.email || s.id === prev.id)
            return match || fetched[0]
          })
        }
      } catch (err) {
        console.warn('[AdminSellersView] Failed to load sellers:', err)
      }
    }
    loadSellers()
  }, [])

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

  // Real Login History & Geolocation tracking model
  const [loginSearchQuery, setLoginSearchQuery] = useState('')
  const [copiedIp, setCopiedIp] = useState<string | null>(null)
  const [sellerLoginHistory, setSellerLoginHistory] = useState<SellerLoginSession[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isLocatingNow, setIsLocatingNow] = useState(false)
  const [expandedMapId, setExpandedMapId] = useState<string | null>(null)

  // Load genuine recorded login sessions for the selected seller
  const loadSellerSessions = async (sellerId: string) => {
    if (!sellerId) return
    setIsLoadingHistory(true)
    try {
      const sessions = await fetchSellerLoginSessions(sellerId)
      setSellerLoginHistory(sessions)
    } catch {
      setSellerLoginHistory([])
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Reload history whenever selected seller changes or modal opens
  useEffect(() => {
    if (selectedSeller?.id && activeModal === 'loginHistory') {
      loadSellerSessions(selectedSeller.id)
    }
  }, [selectedSeller?.id, activeModal])

  // Real-time locator action: pings geolocation engine, detects real IP, pinpoint coordinates, ISP, and records active session
  const handleLocateActiveSession = async () => {
    if (!selectedSeller?.id) return
    setIsLocatingNow(true)
    try {
      const session = await recordSellerLoginSession({
        sellerId: selectedSeller.id,
        sellerName: selectedSeller.shopName || selectedSeller.ownerName || 'Merchant',
        sellerEmail: selectedSeller.email,
      })
      if (session) {
        setSellerLoginHistory((prev) => [session, ...prev.filter((s) => s.id !== session.id)])
        onToast(`✓ Activity located: ${session.city}, ${session.country} (${session.ip})`)
        setExpandedMapId(session.id)
      } else {
        onToast('Failed to locate current session.')
      }
    } catch (err: any) {
      onToast('Error locating session: ' + (err.message || 'Network error'))
    } finally {
      setIsLocatingNow(false)
    }
  }

  const handleCopyIp = (ip: string) => {
    try {
      navigator.clipboard.writeText(ip)
      setCopiedIp(ip)
      onToast(`IP address ${ip} copied to clipboard`)
      setTimeout(() => setCopiedIp(null), 2000)
    } catch {
      onToast(`IP: ${ip}`)
    }
  }

  const filteredLoginHistory = sellerLoginHistory.filter((item) => {
    if (!loginSearchQuery.trim()) return true
    const q = loginSearchQuery.toLowerCase()
    return (
      item.ip?.toLowerCase().includes(q) ||
      item.city?.toLowerCase().includes(q) ||
      item.region?.toLowerCase().includes(q) ||
      item.country?.toLowerCase().includes(q) ||
      item.countryCode?.toLowerCase().includes(q) ||
      item.isp?.toLowerCase().includes(q) ||
      item.device?.toLowerCase().includes(q) ||
      item.userAgent?.toLowerCase().includes(q) ||
      item.timestamp?.toLowerCase().includes(q)
    )
  })

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
    const target = selectedSeller
    const updated = { ...target, ...updates }
    setSelectedSeller(updated)
    setSellersList((prev) =>
      prev.map((s) => (s.email === target.email || (s.id && target.id && s.id === target.id) ? updated : s))
    )

    try {
      if (typeof window !== 'undefined') {
        const active = localStorage.getItem('u_seller_active_profile')
        if (active) {
          const parsed = JSON.parse(active)
          if (parsed.email === target.email || parsed.id === target.id) {
            localStorage.setItem('u_seller_active_profile', JSON.stringify(updated))
          }
        }
      }
    } catch {}

    await updateSellerProfile(updates, target.id, target.email)

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

  // Sync modal states whenever selectedSeller changes
  useEffect(() => {
    if (selectedSeller) {
      setTargetRating(selectedSeller.rating || 5.0)
      setTargetReviews(selectedSeller.reviewCount || 504)
      setIsLimitUnlimited(selectedSeller.productLimit === 'unlimited' || !selectedSeller.productLimit)
      setCustomLimit(typeof selectedSeller.productLimit === 'number' ? selectedSeller.productLimit : 1000)
      setBoosterEnabled(selectedSeller.viewsBooster?.enabled || false)
      setBoosterMultiplier(selectedSeller.viewsBooster?.multiplier || 2.0)
      setBoosterExtraViews(selectedSeller.viewsBooster?.extraDailyViews || 5000)
    }
  }, [selectedSeller])

  // Onboard new seller handler
  const handleOnboardSeller = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onboardShopName.trim() || !onboardEmail.trim()) {
      onToast('Shop name and email are required')
      return
    }
    setIsOnboarding(true)
    try {
      const cleanShop = onboardShopName.trim()
      const cleanOwner = onboardOwnerName.trim() || cleanShop
      const cleanEmail = onboardEmail.trim().toLowerCase()
      const initialBal = parseFloat(onboardBalance) || 0
      const initialG = parseFloat(onboardGuarantee) || 0

      const newProfile: SellerProfile = {
        id: `seller-${Date.now()}`,
        shopName: cleanShop,
        ownerName: cleanOwner,
        email: cleanEmail,
        phone: '+1 (555) 234-5678',
        currency: 'USD ($)',
        balance: initialBal,
        guarantee: initialG,
        rating: 5.0,
        totalOrders: 0,
        memberSince: new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date()),
        verified: true,
        active: true,
        isSuspended: false,
        withdrawalsBlocked: false,
        allowProductRemoval: true,
        productLimit: 'unlimited',
        viewsBooster: { enabled: false, multiplier: 1.0, extraDailyViews: 0 },
        password: onboardPassword || 'password123',
        reviewCount: 504,
        activeItemsCount: 504,
        lastActiveAgo: 'Just now',
        joinedExact: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        seoTitle: `${cleanShop} Official Store`,
        seoDescription: `Shop top quality products from ${cleanShop}.`,
        avatarLetter: cleanShop.charAt(0).toUpperCase() || 'S',
        payoutMethods: [],
      }

      const [deviceInfo, locationInfo] = await Promise.all([
        Promise.resolve(getDeviceDetails()),
        getLocationDetails(),
      ])

      const created = await createSellerProfile(newProfile, onboardPassword, {
        device: deviceInfo,
        location: locationInfo,
      })
      setSellersList((prev) => [created, ...prev.filter((s) => s.email !== created.email)])
      setSelectedSeller(created)
      setActiveModal(null)
      setOnboardShopName('')
      setOnboardOwnerName('')
      setOnboardEmail('')
      setOnboardPassword('')
      setOnboardBalance('0.00')
      setOnboardGuarantee('0.00')

      // Record in platform activity log
      await recordActivityLog({
        action: 'user_signup',
        title: 'User Sign Up',
        description: `Merchant "${created.ownerName || created.shopName}" (${created.email}) onboarded by Administrator.`,
        user: {
          name: created.ownerName || created.shopName,
          email: created.email,
          role: 'seller',
          shopName: created.shopName,
          avatar: created.avatarLetter,
        },
        location: locationInfo,
        device: deviceInfo,
        status: 'success',
        metadata: {
          onboardedBy: 'Administrator',
          initialBalance: initialBal,
        },
      })

      const logText = `New merchant onboarded: "${created.shopName}" (${created.email}) with initial balance $${initialBal.toFixed(2)}`
      const newLog: AuditLog = {
        id: 'log-' + Date.now(),
        action: 'Merchant Onboarding',
        detail: logText,
        timestamp: 'Just now',
      }
      setAuditLogs((prev) => [newLog, ...prev])

      onToast(`Seller "${created.shopName}" onboarded & saved to database!`)
    } catch (err: any) {
      onToast(err.message || 'Failed to onboard seller')
    } finally {
      setIsOnboarding(false)
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
      `Password changed by Administrator for ${selectedSeller.shopName}`
    )
    onToast(`Password successfully updated for ${selectedSeller.shopName}!`)
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
        window.dispatchEvent(new CustomEvent('u_seller_notifications_update', { detail: { notification: newNotif } }))
      }
    } catch {}

    await persistSellerUpdate({}, `Dispatched ${notifType} notification: "${notifTitle}" to ${selectedSeller.shopName}`)
    onToast(`Notification dispatched to ${selectedSeller.shopName}!`)
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

    const currentBal = Number(selectedSeller.balance || 0)
    let newBalance = currentBal
    if (balanceAction === 'credit') {
      newBalance = Number((currentBal + amountNum).toFixed(2))
    } else {
      newBalance = Number(Math.max(0, currentBal - amountNum).toFixed(2))
    }

    const logText = `${balanceAction === 'credit' ? 'Credited' : 'Debited'} $${amountNum.toFixed(2)} to ${selectedSeller.shopName} ${
      balanceReason ? `(${balanceReason})` : ''
    }. New balance: $${newBalance.toFixed(2)}`

    await persistSellerUpdate({ balance: newBalance }, logText)
    onToast(`Balance updated: $${newBalance.toFixed(2)} USD for ${selectedSeller.shopName}`)
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

    const currentG = Number(selectedSeller.guarantee || 0)
    let newGuarantee = currentG
    if (guaranteeAction === 'deposit') {
      newGuarantee = Number((currentG + amountNum).toFixed(2))
    } else if (guaranteeAction === 'release') {
      newGuarantee = Number(Math.max(0, currentG - amountNum).toFixed(2))
    } else {
      newGuarantee = Number(amountNum.toFixed(2))
    }

    const logText = `Guarantee funds adjusted (${guaranteeAction}): $${amountNum.toFixed(2)} for ${selectedSeller.shopName}. Current: $${newGuarantee.toFixed(2)}`
    await persistSellerUpdate({ guarantee: newGuarantee }, logText)
    onToast(`Guarantee deposit updated: $${newGuarantee.toFixed(2)} USD for ${selectedSeller.shopName}`)
    setGuaranteeAmount('')
    setGuaranteeReason('')
    setActiveModal(null)
  }

  // 7. Shop Rating
  const handleSaveRating = async (e: React.FormEvent) => {
    e.preventDefault()
    await persistSellerUpdate(
      { rating: targetRating, reviewCount: targetReviews },
      `Shop rating updated to ${targetRating.toFixed(2)} (${targetReviews} reviews) for ${selectedSeller.shopName}`
    )
    onToast(`Shop rating set to ${targetRating.toFixed(2)} ★ for ${selectedSeller.shopName}`)
    setActiveModal(null)
  }

  // 8. Product Limit
  const handleSaveProductLimit = async (e: React.FormEvent) => {
    e.preventDefault()
    const limitVal = isLimitUnlimited ? 'unlimited' : customLimit
    await persistSellerUpdate(
      { productLimit: limitVal },
      `Product catalog limit updated to ${isLimitUnlimited ? 'Unlimited' : `${customLimit} items`} for ${selectedSeller.shopName}`
    )
    onToast(
      isLimitUnlimited
        ? `Product limit removed (Unlimited) for ${selectedSeller.shopName}`
        : `Product limit configured to ${customLimit} items for ${selectedSeller.shopName}`
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
      `Views booster ${boosterEnabled ? `enabled (${boosterMultiplier}x, +${boosterExtraViews}/day)` : 'disabled'} for ${selectedSeller.shopName}`
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
    const nextSuspended = !selectedSeller.isSuspended
    await persistSellerUpdate(
      { isSuspended: nextSuspended, active: !nextSuspended },
      `Store ${nextSuspended ? 'suspended' : 'reactivated'} by Administrator for ${selectedSeller.shopName}`
    )
    onToast(
      nextSuspended
        ? `Account ${selectedSeller.shopName} has been suspended.`
        : `Account ${selectedSeller.shopName} reactivated successfully.`
    )
    setActiveModal(null)
  }

  // 11. Block Withdrawals
  const handleToggleWithdrawals = async () => {
    const nextBlocked = !selectedSeller.withdrawalsBlocked
    await persistSellerUpdate(
      { withdrawalsBlocked: nextBlocked },
      `Withdrawals ${nextBlocked ? 'blocked' : 'unblocked'} for ${selectedSeller.shopName}`
    )
    onToast(
      nextBlocked
        ? `Withdrawals locked for ${selectedSeller.shopName}.`
        : `Withdrawals enabled for ${selectedSeller.shopName}.`
    )
    setActiveModal(null)
  }

  // 12. Allow Product Removal
  const handleToggleProductRemoval = async () => {
    const nextRemoval = !selectedSeller.allowProductRemoval
    await persistSellerUpdate(
      { allowProductRemoval: nextRemoval },
      `Catalog product removal permission set to ${nextRemoval ? 'Allowed' : 'Prohibited'} for ${selectedSeller.shopName}`
    )
    onToast(
      nextRemoval
        ? `Product removal permission granted to ${selectedSeller.shopName}.`
        : `Product removal restricted for ${selectedSeller.shopName}.`
    )
    setActiveModal(null)
  }

  // 13. Delete Store (Soft delete & Restore)
  const handleDeleteStore = async () => {
    await deleteSellerProfile(selectedSeller.email || selectedSeller.id || '')
    setSellersList((prev) =>
      prev.map((s) => (s.email === selectedSeller.email ? { ...s, isDeleted: true } : s))
    )
    onToast(`Store "${selectedSeller.shopName}" moved to Deleted archive.`)
    setActiveModal(null)
  }

  const handleRestoreStore = async (targetToRestore?: SellerProfile) => {
    const sToRestore = targetToRestore || selectedSeller
    await updateSellerProfile({ isDeleted: false }, sToRestore.id, sToRestore.email)
    setSellersList((prev) =>
      prev.map((s) => (s.email === sToRestore.email ? { ...s, isDeleted: false } : s))
    )
    onToast(`Store "${sToRestore.shopName}" restored to active sellers!`)
    setShowDeleted(false)
  }

  // 14. KYC Approval and Rejection handlers
  const handleApproveKyc = async (sellerId: string) => {
    const target = selectedSeller
    const success = await reviewKycSubmission(sellerId, 'approved', undefined, target.email)
    if (success) {
      const updated: SellerProfile = {
        ...target,
        verified: true,
        kyc: {
          ...(target.kyc || {
            status: 'approved',
            documentType: 'national_id',
            submittedAt: 'Today',
          }),
          status: 'approved',
        },
      }
      setSelectedSeller(updated)
      setSellersList((prev) =>
        prev.map((s) => (s.id === sellerId || s.email === target.email ? updated : s))
      )
      try {
        if (typeof window !== 'undefined') {
          const active = localStorage.getItem('u_seller_active_profile')
          if (active) {
            const parsed = JSON.parse(active)
            if (parsed.id === sellerId || parsed.email === target.email) {
              parsed.verified = true
              if (parsed.kyc) parsed.kyc.status = 'approved'
              localStorage.setItem('u_seller_active_profile', JSON.stringify(parsed))
            }
          }
        }
      } catch {}
    } else {
      throw new Error('Failed to update KYC status in database.')
    }
  }

  const handleRejectKyc = async (sellerId: string, reason?: string) => {
    const target = selectedSeller
    const success = await reviewKycSubmission(sellerId, 'rejected', reason, target.email)
    if (success) {
      const updated: SellerProfile = {
        ...target,
        verified: false,
        kyc: {
          ...(target.kyc || {
            status: 'rejected',
            documentType: 'national_id',
            submittedAt: 'Today',
          }),
          status: 'rejected',
          rejectionReason: reason || 'Information does not match criteria.',
        },
      }
      setSelectedSeller(updated)
      setSellersList((prev) =>
        prev.map((s) => (s.id === sellerId || s.email === target.email ? updated : s))
      )
      try {
        if (typeof window !== 'undefined') {
          const active = localStorage.getItem('u_seller_active_profile')
          if (active) {
            const parsed = JSON.parse(active)
            if (parsed.id === sellerId || parsed.email === target.email) {
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
      throw new Error('Failed to update KYC status in database.')
    }
  }

  // Render items count (defaults to 504 from screenshot or products.length)
  const displayItemsCount =
    products.length > 0 ? products.length : selectedSeller.activeItemsCount || 504

  return (
    <div className="sellers-page space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* TOP HEADER: ICON, TITLE, SEARCH, RESULTS COUNT, DELETED TOGGLE */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Title with Blue Indicator & Blue Icon matching screenshot */}
        <div className="flex items-center gap-3">
          <div className="w-1 h-7 bg-blue-600 rounded-r-md -ml-4 sm:-ml-6 shrink-0 hidden sm:block" />
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <Users size={18} className="stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight m-0">Sellers</h1>
            <p className="text-xs text-slate-400 font-normal m-0 mt-0.5">
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

          {/* Results Count Pill */}
          <div className="px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">RESULTS</span>
            <span suppressHydrationWarning className="text-slate-900 font-bold">{filteredSellers.length}</span>
          </div>

          {/* Deleted Toggle Switch */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600">Deleted</span>
            <button
              type="button"
              role="switch"
              aria-checked={showDeleted}
              onClick={() => setShowDeleted(!showDeleted)}
              className={`w-10 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer flex items-center ${
                showDeleted ? 'bg-indigo-600' : 'bg-slate-200 hover:bg-slate-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-200 ease-in-out ${
                  showDeleted ? 'translate-x-5' : 'translate-x-0'
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
          <div className="flex items-center justify-center gap-3 mt-4">
            {showDeleted && (
              <button
                type="button"
                onClick={() => setShowDeleted(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer shadow-xs"
              >
                Return to Active Sellers
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveModal('onboardSeller')}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 cursor-pointer shadow-xs"
            >
              + Onboard New Seller
            </button>
          </div>
        </div>
      ) : (
        filteredSellers.map((s) => {
          const isSuspended = Boolean(s.isSuspended)
          const isBlocked = Boolean(s.withdrawalsBlocked)

          return (
            <div
              key={s.email}
              className="seller-card bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-4 relative"
            >
              {/* Column 1: Identity & Avatar */}
              <div className="flex items-center gap-3.5 min-w-[280px]">
                {/* Purple Squircle Avatar with Status Dot matching screenshot */}
                <div className="relative shrink-0">
                  <div
                    suppressHydrationWarning
                    className="w-12 h-12 rounded-2xl bg-[#7C3AED] text-white font-bold text-lg flex items-center justify-center shadow-xs"
                  >
                    {s.avatarLetter || (s.shopName ? s.shopName.charAt(0).toUpperCase() : 'T')}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white ${
                      isSuspended ? 'bg-amber-400' : 'bg-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span suppressHydrationWarning className="text-sm font-bold text-slate-900">
                      {s.shopName}
                    </span>
                    <span suppressHydrationWarning className="text-xs text-slate-400 font-normal">
                      {s.lastActiveAgo || '2d ago'}
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
                  <div className="text-xs text-slate-500 font-normal mt-0.5">{s.email}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                    <CalendarDays size={13} className="text-slate-400" />
                    <span>Joined {s.joinedExact || '7 Aug 2026'}</span>
                  </div>
                </div>
              </div>

              {/* Middle Group: Rating & Tier */}
              <div className="flex flex-wrap items-center gap-8 sm:gap-14 py-2 xl:py-0 border-t xl:border-t-0 border-slate-100">
                {/* Rating & Active Items matching screenshot */}
                <div className="flex flex-col items-center">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs font-bold">
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    <span>{(s.rating || 5.0).toFixed(2)}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-normal mt-1">
                    {s.activeItemsCount || displayItemsCount} Active Items
                  </div>
                </div>

                {/* Account Tier & Status matching screenshot */}
                <div className="flex flex-col items-center">
                  {s.isDeleted ? (
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-rose-50 border border-rose-300 text-rose-700 text-[11px] font-bold tracking-wider uppercase">
                      DELETED
                    </span>
                  ) : isSuspended ? (
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-700 text-[11px] font-bold tracking-wider uppercase">
                      SUSPENDED
                    </span>
                  ) : s.verified ? (
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-600 text-[11px] font-bold tracking-wider uppercase">
                      VERIFIED
                    </span>
                  ) : s.kyc?.status === 'rejected' ? (
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-rose-50 border border-rose-300 text-rose-700 text-[11px] font-bold tracking-wider uppercase">
                      REJECTED
                    </span>
                  ) : s.kyc?.status === 'pending' ? (
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-700 text-[11px] font-bold tracking-wider uppercase">
                      PENDING KYC
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full bg-slate-50 border border-slate-300 text-slate-600 text-[11px] font-bold tracking-wider uppercase">
                      UNVERIFIED
                    </span>
                  )}
                  <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1">
                    ACCOUNT TIER
                  </div>
                </div>
              </div>

              {/* Right Side: Quick Action Button & Financials & Menu matching screenshot */}
              <div className="flex items-center justify-between xl:justify-end gap-5 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-100">
                {/* Actions: Login button & Three dots */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('u_seller_active_profile', JSON.stringify(s))
                          localStorage.setItem('u_auth_session', JSON.stringify({ role: 'seller', profile: s }))
                        }
                      } catch {}
                      if (onSwitchToSeller) {
                        onSwitchToSeller(s)
                      } else {
                        window.location.href = '/?mode=seller'
                      }
                      onToast(`Logged into ${s.shopName} merchant console!`)
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <ExternalLink size={14} className="text-slate-500" />
                    <span>Login</span>
                  </button>

                  {/* Quick Inspect KYC Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSeller(s)
                      setActiveModal('inspectKyc')
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer ${
                      s.verified
                        ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                        : 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold'
                    }`}
                    title={s.verified ? 'View KYC Verification' : 'Review Submitted KYC'}
                  >
                    <ShieldCheck size={14} className={s.verified ? 'text-emerald-500' : 'text-amber-600'} />
                    <span>{s.verified ? 'KYC Verified' : 'Review KYC'}</span>
                  </button>

                  {/* Three Dots Button & Floating Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      aria-label="Seller Actions Menu"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedSeller(s)
                        setActiveMenuId(activeMenuId === s.email ? null : s.email)
                      }}
                      className={`w-8 h-8 rounded-xl border transition-all grid place-items-center cursor-pointer ${
                        activeMenuId === s.email
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 shadow-2xs'
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
                              setSelectedSeller(s)
                              setActiveMenuId(null)
                              setActiveModal('inspectKyc')
                            }}
                            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-purple-700 hover:bg-purple-50 transition-colors text-left cursor-pointer font-bold"
                          >
                            <ShieldCheck size={15} className="text-purple-600" />
                            <span>Inspect & Review KYC</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSeller(s)
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
                              setSelectedSeller(s)
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
                              setSelectedSeller(s)
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
                              setSelectedSeller(s)
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
                              setSelectedSeller(s)
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
                              setSelectedSeller(s)
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
                              setSelectedSeller(s)
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
                              setSelectedSeller(s)
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
                              setSelectedSeller(s)
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
                              setSelectedSeller(s)
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
                              setSelectedSeller(s)
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
                              setSelectedSeller(s)
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
                                setSelectedSeller(s)
                                setActiveMenuId(null)
                                handleRestoreStore(s)
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
                                setSelectedSeller(s)
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
      {/* 13 WORKABLE ACTION & ONBOARDING MODALS */}
      {/* ------------------------------------------------------------- */}

      {/* 0. ONBOARD NEW SELLER MODAL */}
      {activeModal === 'onboardSeller' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 m-0">Onboard New Seller</h3>
                  <p className="text-xs text-slate-400 m-0">Register merchant account into Supabase database</p>
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

            <form onSubmit={handleOnboardSeller} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Store / Shop Name *
                  </label>
                  <input
                    type="text"
                    value={onboardShopName}
                    onChange={(e) => setOnboardShopName(e.target.value)}
                    placeholder="e.g. Apex Trends Store"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Owner Full Name
                  </label>
                  <input
                    type="text"
                    value={onboardOwnerName}
                    onChange={(e) => setOnboardOwnerName(e.target.value)}
                    placeholder="e.g. Alex Miller"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Merchant Email Address *
                </label>
                <input
                  type="email"
                  value={onboardEmail}
                  onChange={(e) => setOnboardEmail(e.target.value)}
                  placeholder="seller@store.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Temporary Store Password
                </label>
                <input
                  type="password"
                  value={onboardPassword}
                  onChange={(e) => setOnboardPassword(e.target.value)}
                  placeholder="At least 6 characters (default: password123)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Balance ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={onboardBalance}
                    onChange={(e) => setOnboardBalance(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Guarantee Money ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={onboardGuarantee}
                    onChange={(e) => setOnboardGuarantee(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
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
                  disabled={isOnboarding}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isOnboarding ? 'Saving...' : 'Register & Create Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <p className="text-xs text-slate-400 m-0">Update credentials for {selectedSeller.shopName}</p>
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
                    Direct message to {selectedSeller.shopName} Notification Center
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
                  <p className="text-xs text-slate-400 m-0">Live metrics &amp; audit history for {selectedSeller.shopName}</p>
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
                  ${(selectedSeller.balance || 0).toFixed(2)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Guarantee Deposit
                </span>
                <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                  ${(selectedSeller.guarantee || 0).toFixed(2)}
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
                  {orders.length || selectedSeller.totalOrders || 0}
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
                      selectedSeller.isSuspended ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {selectedSeller.isSuspended ? 'Suspended' : 'Active & Operational'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70">
                  <span className="text-slate-600">Withdrawals:</span>
                  <span
                    className={`font-bold ${
                      selectedSeller.withdrawalsBlocked ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {selectedSeller.withdrawalsBlocked ? 'Blocked / Frozen' : 'Permitted'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70">
                  <span className="text-slate-600">Product Removal:</span>
                  <span className="font-bold text-indigo-600">
                    {selectedSeller.allowProductRemoval ? 'Allowed' : 'Restricted'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70">
                  <span className="text-slate-600">Views Booster:</span>
                  <span className="font-bold text-purple-600">
                    {selectedSeller.viewsBooster?.enabled
                      ? `${selectedSeller.viewsBooster.multiplier}x Active`
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

      {/* 4. LOGIN HISTORY & ACTIVITY LOCATOR MODAL */}
      {activeModal === 'loginHistory' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Globe className="text-blue-600" size={22} />
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight m-0">Login history</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 mb-0">
                  Real-time authentication records and activity locations for <strong className="font-semibold text-slate-800">{selectedSeller.shopName || selectedSeller.ownerName || 'Merchant'}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search and Action Bar */}
            <div className="space-y-3">
              {/* Search Input */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={loginSearchQuery}
                  onChange={(e) => setLoginSearchQuery(e.target.value)}
                  placeholder="Search by IP, city, country, ISP, browser, device..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-slate-300 transition-colors"
                />
              </div>

              {/* Status & Locate Trigger Bar */}
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="text-slate-500 font-medium">
                  {filteredLoginHistory.length} recorded {filteredLoginHistory.length === 1 ? 'event' : 'events'}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLocateActiveSession}
                    disabled={isLocatingNow}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60 font-semibold text-xs transition-all cursor-pointer disabled:opacity-60 shadow-xs"
                    title="Detect and record current IP and exact coordinates"
                  >
                    <Compass size={14} className={isLocatingNow ? 'animate-spin text-blue-600' : 'text-blue-600'} />
                    <span>{isLocatingNow ? 'Locating Activity...' : 'Locate Current Activity'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!selectedSeller?.id) return
                      await clearAllSellerLoginSessions(selectedSeller.id)
                      setSellerLoginHistory([])
                      onToast('Seller login history cleared successfully')
                    }}
                    disabled={filteredLoginHistory.length === 0}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 font-semibold text-xs transition-all cursor-pointer disabled:opacity-40"
                    title="Clear login history for this seller"
                  >
                    <Trash2 size={13} />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Scrollable list of authentic session cards */}
              <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-1">
                {isLoadingHistory ? (
                  <div className="text-center py-10 space-y-2">
                    <RefreshCw size={20} className="animate-spin text-blue-500 mx-auto" />
                    <p className="text-xs text-slate-500">Loading sign-in records...</p>
                  </div>
                ) : filteredLoginHistory.length > 0 ? (
                  filteredLoginHistory.map((sess) => (
                    <div
                      key={sess.id}
                      className="border border-slate-200/90 rounded-2xl p-4 bg-white space-y-2.5 text-left hover:border-slate-300 transition-all shadow-xs"
                    >
                      {/* Row 1: Calendar & Timestamp */}
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <div className="flex items-center gap-2 font-normal">
                          <Calendar size={14} className="text-slate-500 shrink-0" />
                          <span>{sess.timestamp}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {sess.status || 'Success'}
                        </span>
                      </div>

                      {/* Row 2: Location, Red Pin & Country Badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <MapPin size={15} className="text-rose-500 shrink-0 fill-rose-500/10" />
                        <span className="text-sm font-bold text-slate-900">
                          {sess.locationFormatted || `${sess.city}, ${sess.region || sess.city}, ${sess.country}`}
                        </span>
                        {sess.countryCode && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                            {sess.countryCode}
                          </span>
                        )}
                        {sess.latitude && sess.longitude && (
                          <button
                            type="button"
                            onClick={() => setExpandedMapId(expandedMapId === sess.id ? null : sess.id)}
                            className="ml-auto text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Map size={12} />
                            <span>{expandedMapId === sess.id ? 'Hide Map' : 'Locate on Map'}</span>
                          </button>
                        )}
                      </div>

                      {/* Row 3: Network, IP, Copy & ISP */}
                      <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                        <Globe size={14} className="text-slate-500 shrink-0" />
                        <span className="font-mono text-xs text-slate-800 font-medium">{sess.ip}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyIp(sess.ip)}
                          className="p-0.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                          title="Copy IP address"
                        >
                          {copiedIp === sess.ip ? (
                            <Check size={12} className="text-emerald-500" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                        {sess.isp && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium truncate max-w-[200px]">
                            {sess.isp}
                          </span>
                        )}
                      </div>

                      {/* Row 4: Coordinates (if resolved) */}
                      {sess.latitude && sess.longitude && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                          <Navigation size={12} className="text-slate-400 shrink-0" />
                          <span>{sess.latitude.toFixed(4)}° N, {sess.longitude.toFixed(4)}° E</span>
                        </div>
                      )}

                      {/* Row 5: Device */}
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Monitor size={14} className="text-slate-500 shrink-0" />
                        <span>{sess.device || 'Desktop • Windows • Chrome'}</span>
                      </div>

                      {/* Row 6: User Agent */}
                      {sess.userAgent && (
                        <div className="text-[11px] font-mono text-slate-400 break-all leading-normal pt-0.5">
                          {sess.userAgent}
                        </div>
                      )}

                      {/* Interactive Map Embed when toggled */}
                      {expandedMapId === sess.id && sess.latitude && sess.longitude && (
                        <div className="rounded-xl overflow-hidden border border-slate-200 mt-2 bg-slate-50 animate-in fade-in">
                          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100/90 border-b border-slate-200 text-[11px] text-slate-700">
                            <span className="font-semibold flex items-center gap-1.5">
                              <Map size={13} className="text-blue-600" />
                              Pinpoint Location: {sess.city}, {sess.country}
                            </span>
                            <a
                              href={`https://www.google.com/maps?q=${sess.latitude},${sess.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 hover:underline"
                            >
                              Google Maps <ExternalLink size={10} />
                            </a>
                          </div>
                          <iframe
                            title={`Map for ${sess.ip}`}
                            width="100%"
                            height="190"
                            style={{ border: 0 }}
                            loading="lazy"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${sess.longitude - 0.04}%2C${sess.latitude - 0.04}%2C${sess.longitude + 0.04}%2C${sess.latitude + 0.04}&layer=mapnik&marker=${sess.latitude}%2C${sess.longitude}`}
                          />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto grid place-items-center">
                      <Compass size={24} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 m-0">No Sign-in Activity Recorded Yet</h4>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                        Sign-in activity is automatically located and logged when this merchant authenticates.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLocateActiveSession}
                      disabled={isLocatingNow}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
                    >
                      <Compass size={14} className={isLocatingNow ? 'animate-spin' : ''} />
                      <span>{isLocatingNow ? 'Locating...' : 'Locate Current Activity'}</span>
                    </button>
                  </div>
                )}
              </div>
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
                  <p className="text-xs text-slate-400 m-0">Current: ${(selectedSeller.balance || 0).toFixed(2)} USD ({selectedSeller.shopName})</p>
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
                  <p className="text-xs text-slate-400 m-0">Current: ${(selectedSeller.guarantee || 0).toFixed(2)} USD ({selectedSeller.shopName})</p>
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
                  <p className="text-xs text-slate-400 m-0">Control star rating and reviews for {selectedSeller.shopName}</p>
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
                  <p className="text-xs text-slate-400 m-0">Max inventory listings for {selectedSeller.shopName}</p>
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
                  <p className="text-xs text-slate-400 m-0">Simulate marketplace search traffic for {selectedSeller.shopName}</p>
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
                  {selectedSeller.isSuspended ? 'Reactivate Store' : 'Suspend Account'}
                </h3>
                <p className="text-xs text-slate-500 m-0">
                  Target merchant: <b className="text-slate-800">{selectedSeller.shopName}</b>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/70">
              {selectedSeller.isSuspended
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
                  selectedSeller.isSuspended ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {selectedSeller.isSuspended ? 'Confirm Reactivation' : 'Confirm Suspension'}
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
                  {selectedSeller.withdrawalsBlocked ? 'Unblock Withdrawals' : 'Block Withdrawals'}
                </h3>
                <p className="text-xs text-slate-500 m-0">
                  Target merchant: <b className="text-slate-800">{selectedSeller.shopName}</b>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-rose-50/60 p-3.5 rounded-2xl border border-rose-200/70">
              {selectedSeller.withdrawalsBlocked
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
                {selectedSeller.withdrawalsBlocked ? 'Unblock Withdrawals' : 'Confirm Payout Lock'}
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
                  Target merchant: <b className="text-slate-800">{selectedSeller.shopName}</b>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              Current setting:{' '}
              <b className="text-slate-800">
                {selectedSeller.allowProductRemoval ? 'Removal Allowed' : 'Removal Locked'}
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
                {selectedSeller.allowProductRemoval ? 'Lock Removal Access' : 'Allow Removal Access'}
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
                  Target merchant: <b className="text-slate-800">{selectedSeller.shopName}</b>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200/80">
              Are you sure you want to delete store <b className="text-rose-900">{selectedSeller.shopName}</b>?
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

      {/* 14. ADMIN KYC INSPECTION MODAL */}
      <AdminKycModal
        isOpen={activeModal === 'inspectKyc'}
        onClose={() => setActiveModal(null)}
        seller={selectedSeller}
        onApprove={handleApproveKyc}
        onReject={handleRejectKyc}
        onToast={onToast}
      />
    </div>
  )
}
