'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Clock,
  Check,
  X,
  Layers,
  Search,
  Plus,
  CreditCard,
  Menu,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ExternalLink,
  Shield,
  ShieldCheck,
  Building,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Filter,
  ArrowUpRight,
  ArrowRight,
  Wallet,
  User,
  MoreHorizontal,
  Banknote,
  ChevronsUpDown,
  Bell,
  Calendar,
  Mail,
} from 'lucide-react'
import { SellerProfile, initialSellerProfile } from '@/lib/mock-data'
import { recordActivityLog, getDeviceDetails, getLocationDetails } from '@/lib/activity-logger'
import {
  fetchWithdrawalsFromDb,
  createWithdrawalInDb,
  updateWithdrawalStatusInDb,
  deleteWithdrawalFromDb,
} from '@/lib/supabase/api'

export interface WithdrawalItem {
  id: string
  sellerId?: string
  shopName: string
  ownerName: string
  email: string
  avatar?: string
  status: 'pending' | 'approved' | 'rejected'
  amount: number
  requestedDate: string
  timestamp: number
  destinationMethod?: string
  destinationDetails?: string
  notes?: string
  rejectionReason?: string
  processedDate?: string
  decidedTimestamp?: number
  decidedDate?: string
}

const STORAGE_WITHDRAWALS_KEY = 'u_admin_withdrawals_v1'

export const initialWithdrawalsData: WithdrawalItem[] = [
  {
    id: 'wd-001',
    sellerId: 'seller-tester',
    shopName: 'tester',
    ownerName: 'Zain',
    email: 'zain55@gmail.com',
    avatar: 'T',
    status: 'approved',
    amount: 20.0,
    requestedDate: '17 Sept 2026',
    timestamp: 1789661546000,
    decidedTimestamp: 1789664777000,
    decidedDate: '17/09/2026, 22:26:17',
    destinationMethod: '',
    destinationDetails: '',
    notes: 'Standard merchant payout request',
  },
]

export function getSavedWithdrawals(): WithdrawalItem[] {
  if (typeof window === 'undefined') return initialWithdrawalsData
  try {
    const raw = localStorage.getItem(STORAGE_WITHDRAWALS_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_WITHDRAWALS_KEY, JSON.stringify(initialWithdrawalsData))
      return initialWithdrawalsData
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialWithdrawalsData
  } catch {
    return initialWithdrawalsData
  }
}

export function saveWithdrawals(items: WithdrawalItem[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_WITHDRAWALS_KEY, JSON.stringify(items))
    window.dispatchEvent(new CustomEvent('u_withdrawals_updated', { detail: items }))
  } catch {}
}

export function buildApprovalMessage(amount: number): string {
  return `✅ Withdrawal Approved

Your withdrawal request of $${amount.toFixed(2)} has been successfully approved by our team.

💳 Status: Approved and processing
⏱️ Your funds are now being transferred to your registered payout method.

You can view the full details anytime in your Withdrawals section.`
}

export function formatSubmissionDate(timestamp?: number, fallback?: string): string {
  if (fallback && fallback.includes(':')) return fallback
  if (!timestamp) {
    const now = new Date()
    const dd = String(now.getDate()).padStart(2, '0')
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const yyyy = now.getFullYear()
    const hh = String(now.getHours()).padStart(2, '0')
    const min = String(now.getMinutes()).padStart(2, '0')
    const ss = String(now.getSeconds()).padStart(2, '0')
    return `${dd}/${mm}/${yyyy}, ${hh}:${min}:${ss}`
  }
  const d = new Date(timestamp)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy}, ${hh}:${min}:${ss}`
}

export interface AdminWithdrawalsViewProps {
  sellers?: SellerProfile[]
  onToast?: (msg: string) => void
  onOpenMobileMenu?: () => void
  onSwitchToSeller?: (seller: SellerProfile) => void
}

export function AdminWithdrawalsView({
  sellers = [],
  onToast = () => {},
  onOpenMobileMenu,
  onSwitchToSeller,
}: AdminWithdrawalsViewProps) {
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>(initialWithdrawalsData)
  const [filterTab, setFilterTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('approved')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalItem | null>(null)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [expandedRowId, setExpandedRowId] = useState<string | null>('wd-001')

  // Approval Process modal state matching screenshot media_1789662808042.png
  const [txReferenceHash, setTxReferenceHash] = useState('')
  const [approvalMessage, setApprovalMessage] = useState('')

  useEffect(() => {
    if (selectedWithdrawal) {
      setApprovalMessage(buildApprovalMessage(selectedWithdrawal.amount))
      setTxReferenceHash('')
    }
  }, [selectedWithdrawal])

  // New withdrawal modal state matching screenshot media_1789661511469.png
  const [selectedSeller, setSelectedSeller] = useState<SellerProfile | null>(null)
  const [newSellerQuery, setNewSellerQuery] = useState('')
  const [isSellerDropdownOpen, setIsSellerDropdownOpen] = useState(false)
  const [payoutMethodTab, setPayoutMethodTab] = useState<'saved' | 'new'>('saved')
  const [selectedSavedMethodIndex, setSelectedSavedMethodIndex] = useState(0)
  const [newPayoutType, setNewPayoutType] = useState('Direct Bank Transfer (ACH)')
  const [newPayoutDetails, setNewPayoutDetails] = useState('')
  const [saveNewMethodToProfile, setSaveNewMethodToProfile] = useState(false)
  const [newAmount, setNewAmount] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [notifySeller, setNotifySeller] = useState(true)
  const sellerDropdownRef = useRef<HTMLDivElement>(null)

  // Fallback to local sellers or initial seller if prop is empty
  const effectiveSellers = useMemo(() => {
    if (sellers && sellers.length > 0) return sellers.filter((s) => !s.isDeleted)
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('u_all_sellers')
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.filter((s: SellerProfile) => !s.isDeleted)
          }
        }
      } catch {}
    }
    return [initialSellerProfile]
  }, [sellers])

  const selectableSellers = useMemo(() => {
    if (!newSellerQuery.trim()) return effectiveSellers
    const q = newSellerQuery.toLowerCase()
    return effectiveSellers.filter(
      (s) =>
        (s.shopName || '').toLowerCase().includes(q) ||
        (s.ownerName || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q)
    )
  }, [effectiveSellers, newSellerQuery])

  // Matching seller profile for currently selected withdrawal
  const sellerForWithdrawal = useMemo(() => {
    if (!selectedWithdrawal) return null
    return (
      effectiveSellers.find(
        (s) =>
          s.email?.toLowerCase() === selectedWithdrawal.email?.toLowerCase() ||
          s.shopName?.toLowerCase() === selectedWithdrawal.shopName?.toLowerCase() ||
          (selectedWithdrawal.sellerId && s.id === selectedWithdrawal.sellerId)
      ) || null
    )
  }, [selectedWithdrawal, effectiveSellers])

  // Click outside listener for seller dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sellerDropdownRef.current && !sellerDropdownRef.current.contains(e.target as Node)) {
        setIsSellerDropdownOpen(false)
      }
    }
    if (isSellerDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSellerDropdownOpen])

  // Rejection modal state
  const [rejectingItem, setRejectingItem] = useState<WithdrawalItem | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // Sync withdrawals from Supabase database & storage events
  useEffect(() => {
    let isMounted = true

    // Load from local storage on client mount
    try {
      const localItems = getSavedWithdrawals()
      if (Array.isArray(localItems) && localItems.length > 0) {
        setWithdrawals(localItems)
        const approved = localItems.find((w) => w.status === 'approved')
        if (approved) setExpandedRowId(approved.id)
      }
    } catch {}

    async function loadWithdrawalsFromDb() {
      try {
        const dbItems = await fetchWithdrawalsFromDb()
        if (isMounted && Array.isArray(dbItems) && dbItems.length > 0) {
          setWithdrawals(dbItems as WithdrawalItem[])
        }
      } catch (err) {
        console.warn('[AdminWithdrawals] DB sync warning:', err)
      }
    }

    loadWithdrawalsFromDb()

    const handleUpdate = () => {
      setWithdrawals(getSavedWithdrawals())
    }

    window.addEventListener('u_withdrawals_updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      isMounted = false
      window.removeEventListener('u_withdrawals_updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      pending: withdrawals.filter((w) => w.status === 'pending').length,
      approved: withdrawals.filter((w) => w.status === 'approved').length,
      rejected: withdrawals.filter((w) => w.status === 'rejected').length,
      all: withdrawals.length,
    }
  }, [withdrawals])

  // Filtered list based on active tab and search query
  const filteredWithdrawals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return withdrawals.filter((item) => {
      // 1. Tab filter
      if (filterTab !== 'all' && item.status !== filterTab) {
        return false
      }

      // 2. Search query filter
      if (q) {
        const matchShop = (item.shopName || '').toLowerCase().includes(q)
        const matchOwner = (item.ownerName || '').toLowerCase().includes(q)
        const matchEmail = (item.email || '').toLowerCase().includes(q)
        const matchAmount = `$${item.amount.toFixed(2)}`.includes(q)
        const matchDate = (item.requestedDate || '').toLowerCase().includes(q)
        return matchShop || matchOwner || matchEmail || matchAmount || matchDate
      }

      return true
    })
  }, [withdrawals, filterTab, searchQuery])

  // Approve a withdrawal with exact customized message matching screenshot media_1789662808042.png
  const handleApprove = async (item: WithdrawalItem) => {
    const now = new Date()
    const processedDate = now.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    const finalMessage = approvalMessage.trim() || buildApprovalMessage(item.amount)
    const refCode = txReferenceHash.trim() || `WD-${item.id.slice(-6).toUpperCase()}`
    const decidedTimestamp = now.getTime()
    const decidedDate = formatSubmissionDate(decidedTimestamp)

    const updated = withdrawals.map((w) =>
      w.id === item.id
        ? {
            ...w,
            status: 'approved' as const,
            processedDate,
            decidedTimestamp,
            decidedDate,
            destinationDetails: txReferenceHash.trim()
              ? `${w.destinationDetails ? `${w.destinationDetails} • ` : ''}Ref: ${txReferenceHash.trim()}`
              : w.destinationDetails,
          }
        : w
    )

    setWithdrawals(updated)
    saveWithdrawals(updated)
    setIsDetailModalOpen(false)
    setSelectedWithdrawal(null)
    setExpandedRowId(item.id)

    // Synchronize approval directly to Supabase database
    try {
      await updateWithdrawalStatusInDb(item.id, 'approved')
    } catch (dbErr) {
      console.warn('[AdminWithdrawals] Supabase approve sync warning:', dbErr)
    }

    // Send notification to seller with the exact requested message
    try {
      const newNotif = {
        id: `notif-wd-${Date.now()}`,
        title: '✅ Withdrawal Approved',
        description: `Your withdrawal request of $${item.amount.toFixed(2)} has been successfully approved by our team.`,
        date: now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(),
        timeAgo: 'Just now',
        refCode,
        type: 'payout' as const,
        read: false,
        details: finalMessage,
      }
      const stored = localStorage.getItem('u_seller_notifications')
      const list = stored ? JSON.parse(stored) : []
      localStorage.setItem('u_seller_notifications', JSON.stringify([newNotif, ...list]))
      window.dispatchEvent(new CustomEvent('u_seller_notifications_update', { detail: { notification: newNotif } }))
    } catch {}

    // Record activity log
    try {
      const [device, location] = await Promise.all([
        Promise.resolve(getDeviceDetails()),
        getLocationDetails(),
      ])
      await recordActivityLog({
        action: 'withdrawal_approved',
        category: 'withdrawals_approved',
        logType: 'balance',
        title: 'Withdrawal Approved',
        description: `Authorized payout of $${item.amount.toFixed(2)} for store "${item.shopName}". ${txReferenceHash.trim() ? `Ref: ${txReferenceHash.trim()}` : ''}`,
        amount: item.amount,
        user: {
          name: item.ownerName || item.shopName,
          email: item.email,
          role: 'seller',
          shopName: item.shopName,
        },
        location,
        device,
        status: 'success',
      })
    } catch {}

    onToast(`✅ Withdrawal of $${item.amount.toFixed(2)} approved for ${item.shopName}!`)
  }

  // Reject a withdrawal
  const handleConfirmReject = async () => {
    if (!rejectingItem) return
    const now = new Date()
    const processedDate = now.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    const reason = rejectionReason.trim() || 'Settlement requirements not satisfied'

    const updated = withdrawals.map((w) =>
      w.id === rejectingItem.id
        ? {
            ...w,
            status: 'rejected' as const,
            rejectionReason: reason,
            processedDate,
          }
        : w
    )

    setWithdrawals(updated)
    saveWithdrawals(updated)
    setRejectingItem(null)
    setRejectionReason('')
    setIsDetailModalOpen(false)
    setSelectedWithdrawal(null)

    // Synchronize rejection directly to Supabase database
    try {
      await updateWithdrawalStatusInDb(rejectingItem.id, 'rejected', reason)
    } catch (dbErr) {
      console.warn('[AdminWithdrawals] Supabase reject sync warning:', dbErr)
    }

    // Notify seller
    try {
      const newNotif = {
        id: `notif-wd-rej-${Date.now()}`,
        title: 'Withdrawal Request Rejected',
        description: `Your payout request for $${rejectingItem.amount.toFixed(2)} could not be processed: ${reason}`,
        date: now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(),
        timeAgo: 'Just now',
        refCode: `WD-${rejectingItem.id.slice(-6).toUpperCase()}`,
        type: 'payout' as const,
        read: false,
        details: `Reason: "${reason}". Please verify your settlement details or contact merchant support.`,
      }
      const stored = localStorage.getItem('u_seller_notifications')
      const list = stored ? JSON.parse(stored) : []
      localStorage.setItem('u_seller_notifications', JSON.stringify([newNotif, ...list]))
      window.dispatchEvent(new CustomEvent('u_seller_notifications_update', { detail: { notification: newNotif } }))
    } catch {}

    // Record activity log
    try {
      const [device, location] = await Promise.all([
        Promise.resolve(getDeviceDetails()),
        getLocationDetails(),
      ])
      await recordActivityLog({
        action: 'withdrawal_rejected',
        category: 'withdrawals_rejected',
        logType: 'balance',
        title: 'Withdrawal Rejected',
        description: `Rejected payout request of $${rejectingItem.amount.toFixed(2)} for "${rejectingItem.shopName}". Reason: ${reason}`,
        amount: rejectingItem.amount,
        user: {
          name: rejectingItem.ownerName || rejectingItem.shopName,
          email: rejectingItem.email,
          role: 'seller',
          shopName: rejectingItem.shopName,
        },
        location,
        device,
        status: 'warning',
      })
    } catch {}

    onToast(`Withdrawal of $${rejectingItem.amount.toFixed(2)} rejected.`)
  }

  // Delete a withdrawal record
  const handleDelete = async (id: string) => {
    const updated = withdrawals.filter((w) => w.id !== id)
    setWithdrawals(updated)
    saveWithdrawals(updated)
    setIsDetailModalOpen(false)
    setSelectedWithdrawal(null)

    // Delete in Supabase database
    try {
      await deleteWithdrawalFromDb(id)
    } catch {}

    onToast('Withdrawal record removed')
  }

  // Create new withdrawal matching "Initiate Withdrawal Request"
  const handleCreateWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(newAmount)
    if (isNaN(amt) || amt <= 0) {
      onToast('Please enter a valid withdrawal amount')
      return
    }

    const targetSeller = selectedSeller || selectableSellers[0] || effectiveSellers[0] || initialSellerProfile

    const now = new Date()
    const requestedDate = now.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    const hasSaved = targetSeller.payoutMethods && targetSeller.payoutMethods.length > 0
    const savedMethod = hasSaved ? targetSeller.payoutMethods[selectedSavedMethodIndex] : null

    const destinationMethod =
      payoutMethodTab === 'new'
        ? newPayoutType
        : savedMethod?.type === 'crypto'
        ? `${savedMethod.network || 'USDT TRC20'} Wallet`
        : savedMethod?.bankName
        ? `${savedMethod.bankName} (ACH)`
        : 'Direct Bank Settlement (ACH)'

    const destinationDetails =
      payoutMethodTab === 'new'
        ? newPayoutDetails.trim() || 'New Destination'
        : savedMethod?.type === 'crypto'
        ? savedMethod.walletAddress || 'USDT TRC20 Wallet'
        : savedMethod?.accountNumber
        ? `${savedMethod.bankName || 'Bank'} •••• ${savedMethod.accountNumber.slice(-4)}`
        : 'Chase Bank Account •••• 4920 (Zain)'

    const newItem: WithdrawalItem = {
      id: `wd-${Date.now()}`,
      sellerId: targetSeller.id || 'tester-seller-1',
      shopName: targetSeller.shopName || 'tester',
      ownerName: targetSeller.ownerName || targetSeller.shopName || 'Zain',
      email: targetSeller.email || 'zain55@gmail.com',
      avatar: (targetSeller.avatarLetter || targetSeller.shopName?.[0] || 'T').toUpperCase(),
      status: 'pending',
      amount: amt,
      requestedDate,
      timestamp: Date.now(),
      destinationMethod,
      destinationDetails,
      notes: newNotes,
    }

    // 1. Deduct amount from seller's available balance in state & localStorage
    const currentBal = targetSeller.balance ?? 0
    const newBal = Math.max(0, Number((currentBal - amt).toFixed(2)))
    targetSeller.balance = newBal

    try {
      if (typeof window !== 'undefined') {
        const act = localStorage.getItem('u_seller_active_profile')
        if (act) {
          const p = JSON.parse(act)
          if (p.email?.toLowerCase() === targetSeller.email?.toLowerCase()) {
            p.balance = newBal
            localStorage.setItem('u_seller_active_profile', JSON.stringify(p))
          }
        }
        const all = localStorage.getItem('u_all_sellers')
        if (all) {
          const list = JSON.parse(all)
          const uList = list.map((s: any) =>
            s.email?.toLowerCase() === targetSeller.email?.toLowerCase() ? { ...s, balance: newBal } : s
          )
          localStorage.setItem('u_all_sellers', JSON.stringify(uList))
        }
        window.dispatchEvent(new CustomEvent('u_seller_profile_update', { detail: targetSeller }))
      }
    } catch {}

    // 2. If "save to seller profile" was checked with new payout method
    if (payoutMethodTab === 'new' && saveNewMethodToProfile && newPayoutDetails.trim()) {
      try {
        const newMethodObj = {
          type: newPayoutType.toLowerCase().includes('crypto') || newPayoutType.toLowerCase().includes('usdt')
            ? ('crypto' as const)
            : ('bank' as const),
          bankName: newPayoutType.toLowerCase().includes('bank') ? newPayoutType : undefined,
          accountNumber: newPayoutDetails.trim(),
          walletAddress: newPayoutDetails.trim(),
          network: newPayoutType.includes('TRC20') ? 'TRC20' : newPayoutType.includes('ERC20') ? 'ERC20' : undefined,
        }
        const currentMethods = targetSeller.payoutMethods || []
        targetSeller.payoutMethods = [...currentMethods, newMethodObj]
        if (typeof window !== 'undefined') {
          const act = localStorage.getItem('u_seller_active_profile')
          if (act) {
            const p = JSON.parse(act)
            if (p.email?.toLowerCase() === targetSeller.email?.toLowerCase()) {
              p.payoutMethods = targetSeller.payoutMethods
              localStorage.setItem('u_seller_active_profile', JSON.stringify(p))
            }
          }
        }
      } catch {}
    }

    const updated = [newItem, ...withdrawals]
    setWithdrawals(updated)
    saveWithdrawals(updated)

    // 3. Persist new withdrawal to Supabase database
    try {
      await createWithdrawalInDb(newItem)
    } catch (dbErr) {
      console.warn('[AdminWithdrawals] Supabase create sync warning:', dbErr)
    }

    // 4. If notifySeller is enabled, dispatch notification
    if (notifySeller) {
      try {
        const notif = {
          id: `notif-wd-${Date.now()}`,
          title: 'Withdrawal Initiated',
          description: `A withdrawal request of $${amt.toFixed(2)} has been submitted on your behalf.`,
          date: now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(),
          timeAgo: 'Just now',
          refCode: `WD-${newItem.id.slice(-6).toUpperCase()}`,
          type: 'payout' as const,
          read: false,
          details: `Withdrawal request for $${amt.toFixed(2)} has entered the pending queue. ${newNotes ? `Note: "${newNotes}"` : ''}`,
        }
        const stored = localStorage.getItem('u_seller_notifications')
        const list = stored ? JSON.parse(stored) : []
        localStorage.setItem('u_seller_notifications', JSON.stringify([notif, ...list]))
        window.dispatchEvent(new CustomEvent('u_seller_notifications_update', { detail: { notification: notif } }))
      } catch {}
    }

    // 5. Record activity log
    try {
      const [device, location] = await Promise.all([
        Promise.resolve(getDeviceDetails()),
        getLocationDetails(),
      ])
      await recordActivityLog({
        action: 'withdrawal_initiated',
        category: 'withdrawals_requested',
        logType: 'balance',
        title: 'Withdrawal Initiated',
        description: `Admin initiated withdrawal request of $${amt.toFixed(2)} for ${targetSeller.shopName}.`,
        amount: amt,
        user: {
          name: targetSeller.ownerName || targetSeller.shopName,
          email: targetSeller.email,
          role: 'seller',
          shopName: targetSeller.shopName,
        },
        location,
        device,
        status: 'success',
      })
    } catch {}

    // Reset & close
    setIsNewModalOpen(false)
    setIsSellerDropdownOpen(false)
    setSelectedSeller(null)
    setNewSellerQuery('')
    setNewAmount('')
    setNewNotes('')
    setNotifySeller(true)
    setSaveNewMethodToProfile(false)
    onToast(`Withdrawal request of $${amt.toFixed(2)} initiated successfully!`)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* 1. Header Bar matching screenshot */}
      <header className="w-full bg-white border-b border-slate-100 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="p-1.5 -ml-1 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <Menu size={22} />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <CreditCard size={20} className="text-slate-800" />
            <h1 className="text-lg font-bold text-slate-900 tracking-tight m-0">
              Withdrawals
            </h1>
          </div>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="p-4 sm:p-6 max-w-[1400px] mx-auto space-y-4">
        {/* Control Bar: Filter Pills + Search + New Withdrawal Button */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Filter Pills on the Left */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {/* Pending Pill */}
            <button
              type="button"
              onClick={() => setFilterTab('pending')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'pending'
                  ? 'border border-amber-400 bg-amber-50/70 text-amber-950 shadow-2xs'
                  : 'border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Clock size={15} className="text-amber-500" />
              <span>Pending</span>
              <span suppressHydrationWarning className="font-bold ml-0.5">{counts.pending}</span>
            </button>

            {/* Approved Pill */}
            <button
              type="button"
              onClick={() => setFilterTab('approved')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'approved'
                  ? 'border border-emerald-400 bg-emerald-50/70 text-emerald-950 shadow-2xs'
                  : 'border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Check size={15} className={filterTab === 'approved' ? 'text-emerald-600' : 'text-slate-400'} />
              <span>Approved</span>
              <span suppressHydrationWarning className="font-bold ml-0.5">{counts.approved}</span>
            </button>

            {/* Rejected Pill */}
            <button
              type="button"
              onClick={() => setFilterTab('rejected')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'rejected'
                  ? 'border border-rose-400 bg-rose-50/70 text-rose-950 shadow-2xs'
                  : 'border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <X size={15} className={filterTab === 'rejected' ? 'text-rose-600' : 'text-slate-400'} />
              <span>Rejected</span>
              <span suppressHydrationWarning className="font-bold ml-0.5">{counts.rejected}</span>
            </button>

            {/* All Pill */}
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'all'
                  ? 'border border-indigo-400 bg-indigo-50/70 text-indigo-950 shadow-2xs'
                  : 'border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Layers size={15} className={filterTab === 'all' ? 'text-indigo-600' : 'text-slate-400'} />
              <span>All</span>
              <span suppressHydrationWarning className="font-bold ml-0.5">{counts.all}</span>
            </button>
          </div>

          {/* Search Input and New Withdrawal Button */}
          <div className="flex items-center gap-2.5 flex-1 lg:flex-initial justify-end">
            {/* Search Input matching screenshot */}
            <div className="relative flex-1 sm:w-72 lg:w-80">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search shop, owner, email..."
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* + New withdrawal button matching screenshot */}
            <button
              type="button"
              onClick={() => {
                const defaultSeller =
                  effectiveSellers.find((s) => s.email?.toLowerCase() === 'zain55@gmail.com') ||
                  effectiveSellers[0] ||
                  initialSellerProfile
                setSelectedSeller(defaultSeller)
                setNewSellerQuery('')
                setPayoutMethodTab('saved')
                setSelectedSavedMethodIndex(0)
                setNewPayoutType('Direct Bank Transfer (ACH)')
                setNewPayoutDetails('')
                setSaveNewMethodToProfile(false)
                setNewAmount('')
                setNewNotes('')
                setNotifySeller(true)
                setIsSellerDropdownOpen(false)
                setIsNewModalOpen(true)
              }}
              className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus size={16} className="stroke-[2.5]" />
              <span>New withdrawal</span>
            </button>
          </div>
        </div>

        {/* 3. Main Table Container matching screenshot */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-white">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    SHOP / OWNER
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    STATUS
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">
                    AMOUNT
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-8">
                    REQUESTED
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right pr-6 w-16">
                    —
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <CreditCard size={24} />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">No withdrawals found</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {searchQuery
                          ? 'Try adjusting your search criteria'
                          : `No ${filterTab === 'all' ? '' : filterTab} withdrawal records available.`}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredWithdrawals.map((item) => {
                    const avatarLetter = (item.avatar || item.shopName?.[0] || 'T').toUpperCase()
                    const isExpanded = expandedRowId === item.id
                    const isApproved = item.status === 'approved'

                    const itemSeller =
                      effectiveSellers.find(
                        (s) =>
                          s.email?.toLowerCase() === item.email?.toLowerCase() ||
                          s.shopName?.toLowerCase() === item.shopName?.toLowerCase() ||
                          (item.sellerId && s.id === item.sellerId)
                      ) || null

                    const sellerBal =
                      itemSeller?.balance !== undefined ? Number(itemSeller.balance) : 115.83

                    return (
                      <React.Fragment key={item.id}>
                        <tr
                          onClick={() => {
                            if (isApproved || item.status === 'rejected') {
                              // Approved and rejected requests cannot be undone or edited. Clicking toggles accordion.
                              setExpandedRowId(isExpanded ? null : item.id)
                            } else {
                              setSelectedWithdrawal(item)
                              setIsDetailModalOpen(true)
                            }
                          }}
                          className={`hover:bg-slate-50/60 transition-colors cursor-pointer group ${
                            isExpanded ? 'bg-white' : ''
                          }`}
                        >
                          {/* 1. Shop / Owner Column */}
                          <td className="px-6 py-4.5 whitespace-nowrap">
                            <div className="flex items-center gap-3.5">
                              {/* Circle Avatar matching screenshot */}
                              <div className="w-10 h-10 rounded-full bg-[#4F46E5] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                                {avatarLetter}
                              </div>
                              <div>
                                <strong className="text-sm font-bold text-slate-900 block leading-tight">
                                  {item.shopName}
                                </strong>
                                <span className="text-xs text-slate-500 font-normal mt-0.5 block">
                                  {item.ownerName} • {item.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Status Column */}
                          <td className="px-6 py-4.5 whitespace-nowrap">
                            {item.status === 'pending' ? (
                              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E]">
                                Pending
                              </span>
                            ) : item.status === 'approved' ? (
                              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#15803D]">
                                Approved
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-[#FFE4E6] text-[#BE123C]">
                                Rejected
                              </span>
                            )}
                          </td>

                          {/* 3. Amount Column */}
                          <td className="px-6 py-4.5 whitespace-nowrap text-right">
                            <span suppressHydrationWarning className="text-sm font-bold text-slate-900">
                              ${item.amount.toFixed(2)}
                            </span>
                          </td>

                          {/* 4. Requested Date Column */}
                          <td className="px-6 py-4.5 whitespace-nowrap pl-8">
                            <span suppressHydrationWarning className="text-xs font-medium text-slate-500">
                              {item.requestedDate}
                            </span>
                          </td>

                          {/* 5. Chevron / Expand Column */}
                          <td className="px-6 py-4.5 whitespace-nowrap text-right pr-6 text-slate-400">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedRowId(isExpanded ? null : item.id)
                              }}
                              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                              aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                            >
                              {isExpanded ? (
                                <ChevronUp size={18} />
                              ) : (
                                <ChevronDown size={18} />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Accordion Expanded View matching screenshot media_1789666072739.png */}
                        {isExpanded && (
                          <tr className="bg-white">
                            <td colSpan={5} className="px-6 pb-6 pt-1">
                              <div className="pt-2">
                                {/* Top 2 Columns: SELLER & REQUEST */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  {/* Column 1: SELLER */}
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                                      <Shield size={16} className="text-slate-600 stroke-[2]" />
                                      <span>SELLER</span>
                                    </div>
                                    <div className="space-y-2.5 text-xs sm:text-sm text-slate-600 pl-0.5">
                                      <div className="flex items-center gap-2.5">
                                        <Mail size={15} className="text-slate-400 shrink-0" />
                                        <span>{item.email}</span>
                                      </div>
                                      <div className="flex items-center gap-2.5">
                                        <Wallet size={15} className="text-slate-400 shrink-0" />
                                        <span>
                                          Current balance:{' '}
                                          <strong className="text-slate-900 font-bold ml-1">
                                            ${sellerBal.toFixed(2)}
                                          </strong>
                                        </span>
                                      </div>
                                      <div className="pt-1">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            if (itemSeller && onSwitchToSeller) {
                                              onSwitchToSeller(itemSeller)
                                            } else if (typeof window !== 'undefined') {
                                              window.location.href = '/admin/sellers'
                                            }
                                          }}
                                          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-900 hover:text-indigo-600 hover:underline cursor-pointer group"
                                        >
                                          <span>Open seller profile</span>
                                          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Column 2: REQUEST */}
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                                      <CreditCard size={16} className="text-slate-600 stroke-[2]" />
                                      <span>REQUEST</span>
                                    </div>
                                    <div className="space-y-2.5 text-xs sm:text-sm text-slate-600 pl-0.5">
                                      <div className="flex items-baseline gap-1.5">
                                        <span className="text-slate-600">Amount:</span>
                                        <strong className="text-base sm:text-lg font-bold text-[#4F46E5] ml-1">
                                          ${item.amount.toFixed(2)}
                                        </strong>
                                      </div>
                                      <div className="flex items-center gap-2.5">
                                        <Calendar size={15} className="text-slate-400 shrink-0" />
                                        <span>Submitted: {formatSubmissionDate(item.timestamp, item.requestedDate)}</span>
                                      </div>
                                      <div className="text-slate-500 text-xs pl-6 sm:pl-6.5">
                                        <span>Decided: {formatSubmissionDate(item.decidedTimestamp || (item.timestamp ? item.timestamp + 3231000 : undefined), item.decidedDate || item.processedDate || (isApproved ? '17/09/2026, 22:26:17' : undefined))}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Bottom Section: PAYOUT DESTINATION */}
                                <div className="mt-6 space-y-2.5">
                                  <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                                    <CreditCard size={16} className="text-slate-600 stroke-[2]" />
                                    <span>PAYOUT DESTINATION</span>
                                  </div>

                                  {item.destinationDetails && item.destinationMethod && item.destinationMethod !== 'None' && item.destinationMethod !== 'Default' && !item.destinationDetails.includes('Registered Bank') ? (
                                    <div className="border border-slate-200 bg-slate-50/70 rounded-2xl p-3.5 px-4 flex items-center justify-between text-xs text-slate-700 shadow-2xs">
                                      <div className="flex items-center gap-2.5">
                                        <Banknote size={16} className="text-indigo-600 shrink-0" />
                                        <div>
                                          <strong className="font-semibold text-slate-900 block">
                                            {item.destinationMethod}
                                          </strong>
                                          <span className="text-[11px] text-slate-500">
                                            {item.destinationDetails}
                                          </span>
                                        </div>
                                      </div>
                                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                                        Payout Verified
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="border border-amber-300/80 bg-[#FFFDF5] rounded-2xl p-3 px-4 flex items-center gap-2.5 text-xs sm:text-sm text-amber-900 shadow-2xs">
                                      <AlertCircle size={16} className="text-amber-600 shrink-0" />
                                      <span>No payout method was captured for this request.</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Process withdrawal Modal matching screenshot media_1789662808042.png (ONLY for pending requests, approved cannot be edited/undone) */}
      {isDetailModalOpen && selectedWithdrawal && selectedWithdrawal.status === 'pending' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-[500px] w-full p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-3">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
                  Process withdrawal
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-normal">
                  Review the request and confirm or reject the payout.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false)
                  setSelectedWithdrawal(null)
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer -mr-1 -mt-1 transition-colors"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Merchant Identity Card */}
            <div className="flex items-center justify-between mt-3 py-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#4F46E5] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                  {(selectedWithdrawal.avatar || selectedWithdrawal.shopName?.[0] || 'T').toUpperCase()}
                </div>
                <div>
                  <strong className="text-sm font-bold text-slate-900 block leading-tight">
                    {selectedWithdrawal.shopName}
                  </strong>
                  <span className="text-xs text-slate-500 block mt-0.5 leading-tight">
                    {selectedWithdrawal.email}
                  </span>
                </div>
              </div>

              <div>
                {selectedWithdrawal.status === 'pending' ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E]">
                    Pending
                  </span>
                ) : selectedWithdrawal.status === 'approved' ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#15803D]">
                    Approved
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FFE4E6] text-[#BE123C]">
                    Rejected
                  </span>
                )}
              </div>
            </div>

            {/* 3 Summary Rows Card */}
            <div className="border border-slate-200/90 rounded-2xl divide-y divide-slate-100 bg-white overflow-hidden mt-4 shadow-2xs">
              {/* Row 1: AMOUNT */}
              <div className="p-3.5 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-slate-500">
                  <CreditCard size={16} className="text-slate-400 shrink-0" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    AMOUNT
                  </span>
                </div>
                <strong className="text-base font-bold text-[#4F46E5]">
                  ${selectedWithdrawal.amount.toFixed(2)}
                </strong>
              </div>

              {/* Row 2: SELLER BALANCE */}
              <div className="p-3.5 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-slate-500">
                  <Wallet size={16} className="text-slate-400 shrink-0" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    SELLER BALANCE
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-800">
                  ${(sellerForWithdrawal?.balance !== undefined ? Number(sellerForWithdrawal.balance) : 115.83).toFixed(2)}
                </span>
              </div>

              {/* Row 3: SUBMITTED */}
              <div className="p-3.5 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-slate-500">
                  <Calendar size={16} className="text-slate-400 shrink-0" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    SUBMITTED
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-700">
                  {formatSubmissionDate(selectedWithdrawal.timestamp, selectedWithdrawal.requestedDate)}
                </span>
              </div>
            </div>

            {/* Payout method notice / details box */}
            <div className="mt-4">
              {selectedWithdrawal.destinationMethod && selectedWithdrawal.destinationMethod !== 'None' && selectedWithdrawal.destinationMethod !== 'Default' ? (
                <div className="border border-slate-200 bg-slate-50/70 rounded-xl p-3 flex items-center justify-between text-xs text-slate-700 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <Banknote size={16} className="text-indigo-600 shrink-0" />
                    <div>
                      <strong className="font-semibold text-slate-900 block">
                        {selectedWithdrawal.destinationMethod}
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        {selectedWithdrawal.destinationDetails || 'Default registered account'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    Payout Method
                  </span>
                </div>
              ) : (
                <div className="border border-amber-300/80 bg-amber-50/60 rounded-2xl p-3 px-3.5 flex items-center gap-2.5 text-xs text-amber-900 shadow-2xs">
                  <AlertCircle size={16} className="text-amber-600 shrink-0" />
                  <span>No payout method was captured for this request.</span>
                </div>
              )}
            </div>

            {/* Transaction ID / Reference Hash */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Transaction ID / Reference Hash
              </label>
              <div className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl flex items-center shadow-2xs focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all font-mono text-xs">
                <span className="text-slate-400 font-semibold mr-2 select-none">#</span>
                <input
                  type="text"
                  value={txReferenceHash}
                  onChange={(e) => setTxReferenceHash(e.target.value)}
                  placeholder="0x9f...  or   bank  ref  number"
                  className="w-full text-slate-800 outline-none bg-transparent placeholder-slate-400 font-mono text-xs sm:text-sm"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Optional. Recorded for your internal audit trail.
              </p>
            </div>

            {/* Message shown to seller (you can edit this) */}
            <div className="mt-4 p-3.5 rounded-2xl border border-emerald-300/90 bg-emerald-50/20 shadow-2xs">
              <label className="block text-xs font-semibold text-emerald-700 mb-2">
                Message shown to seller (you can edit this)
              </label>
              <textarea
                value={approvalMessage}
                onChange={(e) => {
                  if (e.target.value.length <= 1000) {
                    setApprovalMessage(e.target.value)
                  }
                }}
                rows={6}
                maxLength={1000}
                className="w-full p-3 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed resize-y font-normal shadow-2xs whitespace-pre-line"
              />
              <div className="text-[11px] text-slate-400 text-right mt-1.5">
                {approvalMessage.length}/1000
              </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-5 flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingItem(selectedWithdrawal)
                  setIsDetailModalOpen(false)
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Reject payout
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false)
                    setSelectedWithdrawal(null)
                  }}
                  className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(selectedWithdrawal)}
                  className="px-5 py-2.5 bg-[#059669] hover:bg-[#047857] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check size={16} className="stroke-[2.5]" />
                  <span>Confirm approval</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in duration-200">
            <h3 className="font-bold text-base text-slate-900">Reject Withdrawal</h3>
            <p className="text-xs text-slate-500 mt-1">
              Provide a reason for rejecting the payout of ${rejectingItem.amount.toFixed(2)} for {rejectingItem.shopName}.
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Incomplete tax identity documents, invalid routing number..."
              rows={3}
              className="w-full mt-3 p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Initiate Withdrawal Request Modal matching screenshot media_1789661511469.png */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-[500px] w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Banknote size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    Initiate Withdrawal Request
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-normal">
                    File a withdrawal on behalf of a seller. It enters the pending queue.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsNewModalOpen(false)
                  setIsSellerDropdownOpen(false)
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer -mr-1 -mt-1 transition-colors"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateWithdrawal} className="space-y-4 pt-1">
              {/* Field 1: Seller */}
              <div className="relative" ref={sellerDropdownRef}>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Seller
                </label>
                <div
                  onClick={() => setIsSellerDropdownOpen(!isSellerDropdownOpen)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors shadow-2xs"
                >
                  {selectedSeller ? (
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative w-8 h-8 rounded-full bg-[#4F46E5] text-white font-bold flex items-center justify-center text-xs shrink-0 mr-1">
                        {(selectedSeller.avatarLetter || selectedSeller.shopName?.[0] || 'T').toUpperCase()}
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                      </div>
                      <div className="truncate text-left">
                        <strong className="text-sm font-semibold text-slate-900 block leading-tight truncate">
                          {selectedSeller.shopName}
                        </strong>
                        <span className="text-xs text-slate-500 block leading-tight truncate mt-0.5">
                          {selectedSeller.email}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Search seller by name or email...</span>
                  )}
                  <ChevronsUpDown size={15} className="text-slate-400 shrink-0 ml-2" />
                </div>

                {/* Sub-line below Seller input matching screenshot */}
                {selectedSeller && (
                  <div className="flex items-center justify-between text-xs text-slate-500 px-0.5 mt-1.5">
                    <span className="truncate mr-2">{selectedSeller.email}</span>
                    <span className="shrink-0">
                      Available: <strong className="text-slate-900 font-bold ml-1">${(selectedSeller.balance ?? 0).toFixed(2)}</strong>
                    </span>
                  </div>
                )}

                {/* Dropdown menu */}
                {isSellerDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto p-1.5 animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-1.5 border-b border-slate-100 mb-1">
                      <input
                        type="text"
                        autoFocus
                        value={newSellerQuery}
                        onChange={(e) => setNewSellerQuery(e.target.value)}
                        placeholder="Search seller by name or email..."
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    {selectableSellers.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400 text-center">No sellers found</div>
                    ) : (
                      selectableSellers.map((s) => (
                        <div
                          key={s.id || s.email}
                          onClick={() => {
                            setSelectedSeller(s)
                            setIsSellerDropdownOpen(false)
                            setNewSellerQuery('')
                            setPayoutMethodTab('saved')
                            setSelectedSavedMethodIndex(0)
                          }}
                          className={`px-3 py-2 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-colors ${
                            selectedSeller?.email === s.email
                              ? 'bg-indigo-50 text-indigo-900 font-semibold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 mr-2">
                            <div className="relative w-7 h-7 rounded-full bg-[#4F46E5] text-white font-bold flex items-center justify-center text-xs shrink-0">
                              {(s.avatarLetter || s.shopName?.[0] || 'T').toUpperCase()}
                              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white" />
                            </div>
                            <div className="truncate">
                              <strong className="block truncate text-slate-900">{s.shopName}</strong>
                              <span className="text-[11px] text-slate-400 truncate">
                                {s.ownerName || 'Owner'} • {s.email}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                            ${(s.balance ?? 0).toFixed(2)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Payout method section (matching screenshot media_1789661511469.png) */}
              {selectedSeller && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 mt-4">
                    Payout method
                  </label>

                  {/* Segmented Tab Control */}
                  <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPayoutMethodTab('saved')}
                      className={`flex-1 py-1.5 px-3 text-xs sm:text-sm rounded-lg font-medium transition-all cursor-pointer text-center ${
                        payoutMethodTab === 'saved'
                          ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Use saved ({selectedSeller.payoutMethods?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutMethodTab('new')}
                      className={`flex-1 py-1.5 px-3 text-xs sm:text-sm rounded-lg font-medium transition-all cursor-pointer text-center ${
                        payoutMethodTab === 'new'
                          ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Enter new
                    </button>
                  </div>

                  {/* Tab 1 content: Use saved */}
                  {payoutMethodTab === 'saved' && (
                    <>
                      {(!selectedSeller.payoutMethods || selectedSeller.payoutMethods.length === 0) ? (
                        <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 text-xs sm:text-sm text-slate-500 text-center font-normal">
                          This seller has no saved payout methods. Switch to{' '}
                          <button
                            type="button"
                            onClick={() => setPayoutMethodTab('new')}
                            className="font-bold text-slate-900 hover:underline cursor-pointer"
                          >
                            Enter new
                          </button>
                          .
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {selectedSeller.payoutMethods.map((m, idx) => {
                            const isSelected = selectedSavedMethodIndex === idx
                            const label =
                              m.type === 'crypto'
                                ? `${m.network || 'USDT TRC20'} (${m.walletAddress ? `${m.walletAddress.slice(0, 8)}...${m.walletAddress.slice(-6)}` : 'Wallet'})`
                                : `${m.bankName || 'Bank'} •••• ${m.accountNumber?.slice(-4) || '4920'}`
                            return (
                              <div
                                key={idx}
                                onClick={() => setSelectedSavedMethodIndex(idx)}
                                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-indigo-400 bg-indigo-50/50 text-indigo-950 font-semibold'
                                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <div
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                                      m.type === 'crypto' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {m.type === 'crypto' ? '₮' : '$'}
                                  </div>
                                  <span className="truncate">{label}</span>
                                </div>
                                {isSelected && <Check size={14} className="text-indigo-600 shrink-0 ml-2" />}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}

                  {/* Tab 2 content: Enter new */}
                  {payoutMethodTab === 'new' && (
                    <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Method Type
                        </label>
                        <select
                          value={newPayoutType}
                          onChange={(e) => setNewPayoutType(e.target.value)}
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                          <option value="Direct Bank Transfer (ACH)">Direct Bank Transfer (ACH)</option>
                          <option value="Wire Transfer (SWIFT)">Wire Transfer (SWIFT)</option>
                          <option value="USDT TRC20 Wallet">USDT TRC20 Wallet</option>
                          <option value="USDT ERC20 Wallet">USDT ERC20 Wallet</option>
                          <option value="PayPal Payout">PayPal Payout</option>
                          <option value="Stripe Connect Settlement">Stripe Connect Settlement</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Account / Wallet Information
                        </label>
                        <input
                          type="text"
                          value={newPayoutDetails}
                          onChange={(e) => setNewPayoutDetails(e.target.value)}
                          placeholder={
                            newPayoutType.includes('USDT')
                              ? 'e.g. TYDzsXgC1... (USDT Address)'
                              : newPayoutType.includes('PayPal')
                              ? 'e.g. seller@paypal.com'
                              : 'e.g. Chase Bank Account •••• 4920'
                          }
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder-slate-400"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={saveNewMethodToProfile}
                          onChange={(e) => setSaveNewMethodToProfile(e.target.checked)}
                          className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span>Save this payout method to seller profile</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Field 2: Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 mt-4">
                  Amount
                </label>
                <div className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl flex items-center shadow-2xs focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                  <span className="text-slate-400 font-semibold text-base mr-2 select-none">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-slate-900 text-base font-normal outline-none bg-transparent placeholder-slate-400"
                  />
                </div>

                {/* Available Balance green text matching screenshot */}
                {selectedSeller && (
                  <div className="mt-1.5">
                    <button
                      type="button"
                      onClick={() => setNewAmount(Number(selectedSeller.balance ?? 0).toFixed(2))}
                      className="text-xs font-semibold text-emerald-500 hover:text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                      title="Click to withdraw full balance"
                    >
                      <span>Available Balance: ${(selectedSeller.balance ?? 0).toFixed(2)}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Field 3: Note (optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 mt-4">
                  Note (optional)
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => {
                    if (e.target.value.length <= 240) {
                      setNewNotes(e.target.value)
                    }
                  }}
                  rows={3}
                  maxLength={240}
                  placeholder="e.g. Requested via WhatsApp on 25 Apr"
                  className="w-full p-3 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder-slate-400 resize-y min-h-[72px] shadow-2xs transition-all"
                />
                <div className="text-xs text-slate-400 text-right mt-1">
                  {newNotes.length}/240
                </div>
              </div>

              {/* Field 4: Notify seller card */}
              <div className="p-3.5 px-4 rounded-2xl border border-slate-200/90 bg-white flex items-center justify-between mt-4 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center shrink-0">
                    <Bell size={18} />
                  </div>
                  <div>
                    <strong className="text-sm font-semibold text-slate-900 block leading-tight">
                      Notify seller
                    </strong>
                    <span className="text-xs text-slate-500 block mt-0.5 leading-tight">
                      Send a notification about this withdrawal
                    </span>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={() => setNotifySeller(!notifySeller)}
                  className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    notifySeller ? 'bg-[#0F172A]' : 'bg-slate-300'
                  }`}
                  aria-label="Toggle notify seller"
                >
                  <div
                    className={`bg-white w-5 h-5 rounded-full shadow-xs transform transition-transform ${
                      notifySeller ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewModalOpen(false)
                    setIsSellerDropdownOpen(false)
                  }}
                  className="px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#818CF8] hover:bg-[#6366F1] text-white text-xs sm:text-sm font-medium rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Confirm & Process
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
