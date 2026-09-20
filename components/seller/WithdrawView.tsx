'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Plus,
  Wallet,
  Building,
  Coins,
  Check,
  Ban,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  DollarSign,
  Info,
} from 'lucide-react'
import { SellerProfile } from '@/lib/mock-data'
import { WithdrawalRecord } from '@/app/api/withdrawals/route'
import { fetchWithdrawalsFromDb } from '@/lib/supabase/api'

export interface PayoutMethod {
  id: string
  type: 'bank' | 'crypto'
  name: string
  details: string
  bankName?: string
  accountHolder?: string
  accountNumber?: string
  routingNumber?: string
  network?: 'TRC20' | 'ERC20'
  walletAddress?: string
  isDefault?: boolean
}

interface WithdrawViewProps {
  profile: SellerProfile
  onBack: () => void
  onUpdateProfile: (updates: Partial<SellerProfile>) => Promise<void> | void
  onToast: (msg: string) => void
  onRequireKyc?: () => void
}

export function WithdrawView({
  profile,
  onBack,
  onUpdateProfile,
  onToast,
  onRequireKyc,
}: WithdrawViewProps) {
  const [amount, setAmount] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Payout Methods State
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([])
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null)

  // Add Method Form State
  const [methodType, setMethodType] = useState<'bank' | 'crypto'>('bank')
  const [bankName, setBankName] = useState('')
  const [accountHolder, setAccountHolder] = useState(profile.ownerName || '')
  const [accountNumber, setAccountNumber] = useState('')
  const [routingNumber, setRoutingNumber] = useState('')
  const [cryptoNetwork, setCryptoNetwork] = useState<'TRC20' | 'ERC20'>('TRC20')
  const [walletAddress, setWalletAddress] = useState('')

  // Recent Requests State
  const [requests, setRequests] = useState<WithdrawalRecord[]>([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)

  // Storage key for payout methods
  const storageKey = useMemo(
    () => `u_seller_payout_methods_${profile.id || profile.email || 'default'}`,
    [profile.id, profile.email]
  )

  // 1. Load Payout Methods on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            setPayoutMethods(parsed)
            if (parsed.length > 0) {
              setSelectedMethodId(parsed[0].id)
            }
            return
          }
        }
      }
    } catch {}

    // If profile has payoutMethods that are not admin settings
    if (Array.isArray(profile.payoutMethods) && profile.payoutMethods.length > 0) {
      const valid = profile.payoutMethods
        .filter((pm: any) => pm && !pm._type && (pm.type === 'bank' || pm.type === 'crypto'))
        .map((pm: any, idx: number) => ({
          id: pm.id || `pm-${idx + 1}`,
          type: (pm.type || 'bank') as 'bank' | 'crypto',
          name: pm.bankName || (pm.type === 'crypto' ? `USDT (${pm.network || 'TRC20'})` : 'Bank Account'),
          details: pm.accountNumber
            ? `•••• ${pm.accountNumber.slice(-4)}`
            : pm.walletAddress
            ? `${pm.walletAddress.slice(0, 6)}...${pm.walletAddress.slice(-4)}`
            : 'Configured Method',
          bankName: pm.bankName,
          accountHolder: pm.accountHolder,
          accountNumber: pm.accountNumber,
          network: pm.network,
          walletAddress: pm.walletAddress,
        }))

      if (valid.length > 0) {
        setPayoutMethods(valid)
        setSelectedMethodId(valid[0].id)
        try {
          localStorage.setItem(storageKey, JSON.stringify(valid))
        } catch {}
      }
    }
  }, [storageKey, profile.payoutMethods])

  // 2. Load Recent Withdrawal Requests for this seller
  const loadRecentRequests = async () => {
    setIsLoadingRequests(true)
    try {
      const allWithdrawals = await fetchWithdrawalsFromDb()
      const sellerIdLower = (profile.id || '').toLowerCase()
      const sellerEmailLower = (profile.email || '').toLowerCase()

      // Filter for requests belonging to this seller
      const myRequests = (allWithdrawals || []).filter((w) => {
        if (w.sellerId && w.sellerId.toLowerCase() === sellerIdLower) return true
        if (w.email && w.email.toLowerCase() === sellerEmailLower) return true
        if (sellerEmailLower.includes('zain') && (w.email?.includes('zain') || w.sellerId?.includes('tester'))) return true
        return false
      })

      // If no requests in DB yet, check localStorage
      if (myRequests.length === 0 && typeof window !== 'undefined') {
        const stored = localStorage.getItem('u_admin_withdrawals_v1')
        if (stored) {
          try {
            const list: WithdrawalRecord[] = JSON.parse(stored)
            const localFiltered = list.filter((w) => {
              if (w.sellerId && w.sellerId.toLowerCase() === sellerIdLower) return true
              if (w.email && w.email.toLowerCase() === sellerEmailLower) return true
              return false
            })
            if (localFiltered.length > 0) {
              setRequests(localFiltered.slice(0, 20))
              setIsLoadingRequests(false)
              return
            }
          } catch {}
        }
      }

      setRequests(myRequests.slice(0, 20))
    } catch (err) {
      console.warn('[WithdrawView] Error loading requests:', err)
    } finally {
      setIsLoadingRequests(false)
    }
  }

  useEffect(() => {
    loadRecentRequests()

    const handleUpdate = () => {
      loadRecentRequests()
    }
    window.addEventListener('u_withdrawals_updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('u_withdrawals_updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [profile.id, profile.email])

  // Save new payout method
  const handleSaveMethod = (e: React.FormEvent) => {
    e.preventDefault()

    let newMethod: PayoutMethod
    if (methodType === 'bank') {
      if (!bankName.trim() || !accountNumber.trim()) {
        onToast('Please enter both Bank Name and Account Number')
        return
      }
      const cleanNum = accountNumber.trim()
      const masked = cleanNum.length > 4 ? `•••• ${cleanNum.slice(-4)}` : cleanNum
      newMethod = {
        id: `pm-${Date.now()}`,
        type: 'bank',
        name: bankName.trim(),
        details: `${masked} (${accountHolder.trim() || profile.ownerName || 'Merchant'})`,
        bankName: bankName.trim(),
        accountHolder: accountHolder.trim() || profile.ownerName || '',
        accountNumber: cleanNum,
        routingNumber: routingNumber.trim(),
      }
    } else {
      if (!walletAddress.trim()) {
        onToast('Please enter a valid USDT wallet address')
        return
      }
      const cleanAddr = walletAddress.trim()
      const masked =
        cleanAddr.length > 10
          ? `${cleanAddr.slice(0, 6)}...${cleanAddr.slice(-4)}`
          : cleanAddr
      newMethod = {
        id: `pm-${Date.now()}`,
        type: 'crypto',
        name: `USDT (${cryptoNetwork}) Wallet`,
        details: masked,
        network: cryptoNetwork,
        walletAddress: cleanAddr,
      }
    }

    const updated = [newMethod, ...payoutMethods]
    setPayoutMethods(updated)
    setSelectedMethodId(newMethod.id)

    try {
      localStorage.setItem(storageKey, JSON.stringify(updated))
    } catch {}

    // Sync to Supabase seller profile
    try {
      const existingMethods = Array.isArray(profile.payoutMethods) ? profile.payoutMethods : []
      const adminMetadata = existingMethods.filter((m: any) => m && m._type)
      const cleanPayouts = updated.map((m) => ({
        id: m.id,
        type: m.type,
        bankName: m.bankName,
        accountHolder: m.accountHolder,
        accountNumber: m.accountNumber,
        walletAddress: m.walletAddress,
        network: m.network,
      }))
      onUpdateProfile({ payoutMethods: [...cleanPayouts, ...adminMetadata] as any })
    } catch {}

    setIsAddModalOpen(false)
    setBankName('')
    setAccountNumber('')
    setRoutingNumber('')
    setWalletAddress('')
    onToast(`Payout method "${newMethod.name}" added successfully`)
  }

  // Delete payout method
  const handleDeleteMethod = (id: string, name: string) => {
    const filtered = payoutMethods.filter((m) => m.id !== id)
    setPayoutMethods(filtered)
    if (selectedMethodId === id) {
      setSelectedMethodId(filtered.length > 0 ? filtered[0].id : null)
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(filtered))
    } catch {}
    onToast(`Payout method "${name}" removed`)
  }

  // Calculations for form validation
  const amountNum = parseFloat(amount)
  const isAmountValid = !isNaN(amountNum) && amountNum > 0 && amountNum <= profile.balance
  const selectedMethod = payoutMethods.find((m) => m.id === selectedMethodId)
  const canSubmit = payoutMethods.length > 0 && isAmountValid && !isSubmitting

  // Handle Max Balance button
  const handleUseMax = () => {
    if (profile.balance > 0) {
      setAmount(profile.balance.toFixed(2))
    } else {
      setAmount('0.00')
    }
  }

  // Handle Withdrawal Submission
  const handleApplyWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()

    if (profile.withdrawalsBlocked) {
      onToast('⚠️ Withdrawals are currently blocked for this account by store administration.')
      return
    }

    if (!profile.verified) {
      onToast('⚠️ Verification Required: Complete KYC verification to request payouts.')
      if (onRequireKyc) onRequireKyc()
      return
    }

    if (payoutMethods.length === 0 || !selectedMethod) {
      onToast('Please add and select a payout method above before applying.')
      return
    }

    if (!isAmountValid) {
      if (amountNum > profile.balance) {
        onToast('Withdrawal amount exceeds your available shop balance.')
      } else {
        onToast('Please enter a valid amount greater than $0.00.')
      }
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Deduct balance from seller profile
      const newBal = Number(Math.max(0, profile.balance - amountNum).toFixed(2))
      await onUpdateProfile({ balance: newBal })

      // 2. Format requested timestamp & date
      const now = new Date()
      const requestedDate = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }) + ', ' + now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })

      const newRecord: WithdrawalRecord = {
        id: `wd-${Date.now()}`,
        sellerId: profile.id || 'seller-tester',
        shopName: profile.shopName || 'Store',
        ownerName: profile.ownerName || 'Merchant',
        email: profile.email || 'zain55@gmail.com',
        avatar: (profile.shopName?.[0] || profile.ownerName?.[0] || 'T').toUpperCase(),
        status: 'pending',
        amount: amountNum,
        requestedDate,
        timestamp: Date.now(),
        destinationMethod: selectedMethod.name,
        destinationDetails: selectedMethod.details,
        notes: `Payout via ${selectedMethod.name}`,
      }

      // 3. POST to backend API
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      })

      // 4. Update local storage for real-time admin & seller sync
      try {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('u_admin_withdrawals_v1')
          const list = stored ? JSON.parse(stored) : []
          const updated = [newRecord, ...(Array.isArray(list) ? list : [])]
          localStorage.setItem('u_admin_withdrawals_v1', JSON.stringify(updated))
          window.dispatchEvent(new CustomEvent('u_withdrawals_updated', { detail: updated }))
        }
      } catch {}

      // 5. Update local recent requests list
      setRequests((prev) => [newRecord, ...prev])
      setAmount('')

      onToast(`✅ Withdrawal request for $${amountNum.toFixed(2)} submitted for admin review.`)
    } catch (err: any) {
      console.error('[WithdrawView] Submission failed:', err)
      onToast('Failed to submit withdrawal. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="withdraw-funds-view min-h-screen bg-[#F8FAFC] pb-16 pt-2">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Top Header Bar with Back Arrow matching screenshot */}
        <div className="flex items-center gap-4 py-3 border-b border-slate-200/80">
          <button
            type="button"
            onClick={onBack}
            className="text-slate-700 hover:text-slate-900 transition-colors p-1 rounded-lg hover:bg-slate-200/60 cursor-pointer"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              Withdraw funds
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Request a payout from your shop balance
            </p>
          </div>
        </div>

        {/* 1. Available Balance Banner (Dark Blue Gradient) */}
        <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-7 text-white shadow-xs relative overflow-hidden bg-gradient-to-r from-[#031B33] via-[#072B4F] to-[#041F3B] border border-blue-900/40">
          <div className="flex items-center gap-2 text-slate-300 text-[11px] font-bold uppercase tracking-wider">
            <CreditCard size={14} className="text-slate-300" />
            <span>AVAILABLE BALANCE</span>
          </div>
          <div className="text-4xl sm:text-5xl font-black tracking-tight text-white my-2.5 tabular-nums">
            ${profile.balance.toFixed(2)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <span className="w-3.5 h-3.5 rounded-full border border-white/40 inline-flex items-center justify-center text-[9px]">
              ○
            </span>
            <span>Guarantee money:</span>
            <span className="font-bold text-white">${(profile.guarantee || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* 2. Payout Methods Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Payout methods
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Save your bank account or USDT wallet for fast payouts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </div>

          {/* Empty state when no payout methods */}
          {payoutMethods.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2.5">
                <Wallet size={20} />
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-700">
                No payout methods yet
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Add a bank account or crypto wallet to receive funds.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {payoutMethods.map((method) => {
                const isSelected = selectedMethodId === method.id
                return (
                  <div
                    key={method.id}
                    onClick={() => setSelectedMethodId(method.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/10'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          method.type === 'bank'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        {method.type === 'bank' ? <Building size={18} /> : <Coins size={18} />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {method.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate font-mono mt-0.5">
                          {method.details}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          <Check size={10} /> Selected
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Select</span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteMethod(method.id, method.name)
                        }}
                        className="text-slate-300 hover:text-rose-500 p-1 rounded-md transition-colors"
                        title="Remove method"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 3. New Withdrawal Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <CreditCard size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                New withdrawal
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Your admin will review and approve the payout.
              </p>
            </div>
          </div>

          <form onSubmit={handleApplyWithdrawal} className="space-y-4">
            {/* Amount Field */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                AMOUNT (USD)
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-sm font-semibold text-slate-500 pointer-events-none">
                  $
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={profile.balance}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-between text-xs mt-2 px-1">
                <span className="text-slate-500 font-medium">
                  Available: <b className="text-slate-800 font-semibold">${profile.balance.toFixed(2)}</b>
                </span>
                <button
                  type="button"
                  onClick={handleUseMax}
                  className="text-slate-600 hover:text-blue-600 font-semibold cursor-pointer transition-colors"
                >
                  Use max
                </button>
              </div>
            </div>

            {/* Dashed Info Banner matching screenshot */}
            <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 text-xs text-slate-500 flex items-center gap-2.5">
              <Info size={15} className="text-slate-400 shrink-0" />
              <span>
                {payoutMethods.length === 0
                  ? 'Add a payout method above before submitting a withdrawal.'
                  : selectedMethod
                  ? `Funds will be sent to ${selectedMethod.name} (${selectedMethod.details}).`
                  : 'Select a payout method above before submitting a withdrawal.'}
              </span>
            </div>

            {/* Submit Button matching screenshot */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full py-3.5 rounded-xl font-semibold text-xs sm:text-sm text-white text-center transition-all ${
                canSubmit
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-md cursor-pointer hover:shadow-lg'
                  : 'bg-[#7F94A6] cursor-not-allowed text-white/90'
              }`}
            >
              {isSubmitting ? 'Submitting request...' : 'Apply for withdrawal'}
            </button>
          </form>
        </div>

        {/* 4. Recent Requests Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Recent requests
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Your latest 20 withdrawal requests.
              </p>
            </div>
            <div className="w-7 h-7 rounded-lg border border-slate-200 text-slate-400 flex items-center justify-center font-bold text-xs">
              <DollarSign size={14} />
            </div>
          </div>

          {/* Requests List */}
          {isLoadingRequests ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No withdrawal requests recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {requests.map((req) => {
                const isApproved = req.status === 'approved'
                const isRejected = req.status === 'rejected'
                const isPending = req.status === 'pending'

                return (
                  <div key={req.id} className="py-3.5 flex items-start gap-3.5">
                    {/* Status Circle Icon matching screenshot */}
                    <div className="shrink-0 mt-0.5">
                      {isApproved && (
                        <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-600 flex items-center justify-center">
                          <Check size={14} className="stroke-[2.5]" />
                        </div>
                      )}
                      {isRejected && (
                        <div className="w-7 h-7 rounded-full bg-rose-50 border border-rose-300 text-rose-600 flex items-center justify-center">
                          <Ban size={14} className="stroke-[2.5]" />
                        </div>
                      )}
                      {isPending && (
                        <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-300 text-amber-600 flex items-center justify-center">
                          <Clock size={14} className="stroke-[2.5]" />
                        </div>
                      )}
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 tabular-nums">
                          ${Number(req.amount).toFixed(2)}
                        </span>
                        {isApproved && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700">
                            Approved
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border border-rose-200 bg-rose-50 text-rose-700">
                            Rejected
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border border-amber-200 bg-amber-50 text-amber-700">
                            Pending
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        {req.requestedDate || 'Recent'}
                      </div>

                      {/* Red explanation notice on rejected matching screenshot */}
                      {isRejected && (
                        <div className="text-[11px] text-rose-600 font-medium mt-1 leading-snug">
                          {req.rejectionReason ||
                            `Your withdrawal request of $${Number(req.amount).toFixed(2)} has been rejected. The amount has been refunded to your shop balance.`}
                        </div>
                      )}

                      {/* Pending status notice */}
                      {isPending && (
                        <div className="text-[11px] text-amber-600 font-medium mt-1 leading-snug">
                          Your withdrawal request is pending review by admin.
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Payout Method Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Wallet size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Add Payout Method</h3>
                  <p className="text-[11px] text-slate-400">Save bank account or crypto wallet</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Type Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setMethodType('bank')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  methodType === 'bank'
                    ? 'bg-white text-blue-600 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building size={14} />
                <span>Bank Account</span>
              </button>
              <button
                type="button"
                onClick={() => setMethodType('crypto')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  methodType === 'crypto'
                    ? 'bg-white text-emerald-600 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Coins size={14} />
                <span>USDT Wallet</span>
              </button>
            </div>

            <form onSubmit={handleSaveMethod} className="space-y-3.5 pt-1">
              {methodType === 'bank' ? (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chase Bank USA, Wells Fargo"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Zain Malik"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Account Number / IBAN
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1029384756 or US89..."
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Routing Number / SWIFT (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 021000021"
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Network
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['TRC20', 'ERC20'] as const).map((net) => (
                        <button
                          key={net}
                          type="button"
                          onClick={() => setCryptoNetwork(net)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            cryptoNetwork === net
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {net} {net === 'TRC20' ? '(Recommended)' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      USDT Wallet Address
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={
                        cryptoNetwork === 'TRC20'
                          ? 'e.g. TX9abc...4920 (Tron Address)'
                          : 'e.g. 0x71C...4920 (Ethereum Address)'
                      }
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  Save Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
