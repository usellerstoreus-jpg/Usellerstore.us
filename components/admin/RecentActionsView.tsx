'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Activity,
  Search,
  Box,
  Key,
  UserPlus,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Menu,
  X,
  Check,
  RefreshCw,
} from 'lucide-react'
import { SellerProfile, Product } from '@/lib/mock-data'
import {
  fetchActivityLogs,
  ActivityLogItem,
  formatTimeAgo,
} from '@/lib/activity-logger'

export interface RecentActionItem {
  id: string
  category:
    | 'products'
    | 'seller_logins'
    | 'registrations'
    | 'payout_methods'
    | 'withdrawals_requested'
    | 'withdrawals_approved'
    | 'withdrawals_rejected'
    | 'deposits'
    | 'balance_changes'
  sellerName: string
  sellerEmail: string
  timeAgo: string
  dateGroup: string // e.g. 'TODAY · THURSDAY 17 SEPT' or 'TUESDAY 15 SEPT'
  timestamp: string // ISO
  actionText: string
  title?: string
  image?: string
  priceBadge?: string
  details?: string
  location?: string
  device?: string
}

interface RecentActionsViewProps {
  sellers?: SellerProfile[]
  products?: Product[]
  onOpenMobileMenu?: () => void
  onToast?: (message: string) => void
  onSwitchToSeller?: (seller?: SellerProfile) => void
}

function formatDateGroup(isoString: string): string {
  try {
    const d = new Date(isoString)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = d.toDateString() === yesterday.toDateString()

    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
    const day = d.getDate()
    const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()

    if (isToday) return `TODAY · ${weekday} ${day} ${month}`
    if (isYesterday) return `YESTERDAY · ${weekday} ${day} ${month}`
    return `${weekday} ${day} ${month}`
  } catch {
    return 'RECENT ACTIVITY'
  }
}

export function RecentActionsView({
  sellers = [],
  products = [],
  onOpenMobileMenu,
  onToast = () => {},
  onSwitchToSeller,
}: RecentActionsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [rawLogs, setRawLogs] = useState<ActivityLogItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const items = await fetchActivityLogs(sellers, products)
      setRawLogs(items)
    } catch (err) {
      console.warn('Failed to load activity logs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    // Listen for live new logs
    const handleNewLog = () => {
      fetchActivityLogs(sellers, products).then(setRawLogs)
    }
    window.addEventListener('u_activity_log_created', handleNewLog)
    return () => window.removeEventListener('u_activity_log_created', handleNewLog)
  }, [sellers, products])

  // Convert raw logs to structured RecentActionItem list
  const allActions = useMemo<RecentActionItem[]>(() => {
    return rawLogs.map((log) => {
      // Determine category
      let category: RecentActionItem['category'] = 'products'
      if (log.category) {
        category = log.category as RecentActionItem['category']
      } else if (log.action === 'seller_login' || log.action === 'admin_login') {
        category = 'seller_logins'
      } else if (log.action === 'user_signup' || log.action === 'seller_signup') {
        category = 'registrations'
      } else if (log.action === 'product_added' || log.action === 'product_updated') {
        category = 'products'
      } else if (log.action === 'withdrawal_requested') {
        category = 'withdrawals_requested'
      } else if (log.action === 'withdrawal_approved') {
        category = 'withdrawals_approved'
      } else if (log.action === 'withdrawal_rejected') {
        category = 'withdrawals_rejected'
      } else if (log.action === 'deposit_received') {
        category = 'deposits'
      } else if (log.action === 'balance_adjusted' || log.action === 'order_placed') {
        category = 'balance_changes'
      } else if (log.action === 'payout_method_added') {
        category = 'payout_methods'
      }

      // Determine action text & price badge
      let actionText = 'Added a product'
      let priceBadge: string | undefined
      let image = log.product?.image

      if (category === 'products') {
        actionText = log.action === 'product_updated' ? 'Updated product' : 'Added a product'
        if (log.product?.price) {
          priceBadge = `$${Number(log.product.price).toFixed(2)}`
        }
      } else if (category === 'seller_logins') {
        actionText = 'Logged in to console'
      } else if (category === 'registrations') {
        actionText = 'Registered new store'
      } else if (category === 'withdrawals_requested') {
        actionText = 'Requested withdrawal'
        if (log.amount) priceBadge = `$${Number(log.amount).toFixed(2)}`
      } else if (category === 'balance_changes') {
        actionText = 'Balance updated'
        if (log.amount) priceBadge = `$${Number(log.amount).toFixed(2)}`
      }

      const sellerName = log.user?.name || log.user?.shopName || 'Merchant'
      const sellerEmail = log.user?.email || '—'
      const timeAgo = formatTimeAgo(log.timestamp)
      const dateGroup = formatDateGroup(log.timestamp)

      return {
        id: log.id,
        category,
        sellerName,
        sellerEmail,
        timeAgo,
        dateGroup,
        timestamp: log.timestamp,
        actionText,
        title: log.product?.title || log.title,
        image,
        priceBadge,
        details: log.description,
        location: log.location?.formatted,
        device: log.device?.formatted,
      }
    })
  }, [rawLogs])

  // Calculate real dynamic counts for each pill category from real data
  const counts = useMemo(() => {
    return {
      all: allActions.length,
      seller_logins: allActions.filter((a) => a.category === 'seller_logins').length,
      registrations: allActions.filter((a) => a.category === 'registrations').length,
      products: allActions.filter((a) => a.category === 'products').length,
      payout_methods: allActions.filter((a) => a.category === 'payout_methods').length,
      withdrawals_requested: allActions.filter((a) => a.category === 'withdrawals_requested').length,
      withdrawals_approved: allActions.filter((a) => a.category === 'withdrawals_approved').length,
      withdrawals_rejected: allActions.filter((a) => a.category === 'withdrawals_rejected').length,
      deposits: allActions.filter((a) => a.category === 'deposits').length,
      balance_changes: allActions.filter((a) => a.category === 'balance_changes').length,
    }
  }, [allActions])

  // Filter actions based on active pill and search query
  const filteredActions = useMemo(() => {
    return allActions.filter((item) => {
      // Category filter
      if (activeFilter !== 'all' && item.category !== activeFilter) {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = item.sellerName?.toLowerCase().includes(q)
        const matchEmail = item.sellerEmail?.toLowerCase().includes(q)
        const matchTitle = item.title?.toLowerCase().includes(q)
        const matchAction = item.actionText?.toLowerCase().includes(q)
        const matchLocation = item.location?.toLowerCase().includes(q)
        return matchName || matchEmail || matchTitle || matchAction || matchLocation
      }

      return true
    })
  }, [allActions, activeFilter, searchQuery])

  // Group actions by dateGroup
  const groupedActions = useMemo(() => {
    const groups: { [date: string]: RecentActionItem[] } = {}
    filteredActions.forEach((item) => {
      const groupKey = item.dateGroup
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(item)
    })
    return groups
  }, [filteredActions])

  // Filter pills specification matching screenshot styles
  const filterPills = [
    {
      id: 'all',
      label: 'All',
      count: counts.all,
      badgeStyle: 'bg-slate-700 text-white',
      pillStyle:
        activeFilter === 'all'
          ? 'bg-[#0F172A] text-white font-bold shadow-xs'
          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
    },
    {
      id: 'seller_logins',
      label: 'Seller Logins',
      count: counts.seller_logins,
      badgeStyle: 'bg-white text-[#065F46] font-bold shadow-2xs',
      pillStyle:
        activeFilter === 'seller_logins'
          ? 'bg-[#059669] text-white font-bold'
          : 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]/60 hover:bg-[#D1FAE5]',
    },
    {
      id: 'registrations',
      label: 'Registrations',
      count: counts.registrations,
      badgeStyle: 'bg-white text-[#075985] font-bold shadow-2xs',
      pillStyle:
        activeFilter === 'registrations'
          ? 'bg-[#0284C7] text-white font-bold'
          : 'bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]/60 hover:bg-[#E0F2FE]',
    },
    {
      id: 'products',
      label: 'Products',
      count: counts.products,
      badgeStyle: 'bg-white text-[#6B21A8] font-bold shadow-2xs',
      pillStyle:
        activeFilter === 'products'
          ? 'bg-[#9333EA] text-white font-bold'
          : 'bg-[#FAF5FF] text-[#9333EA] border border-[#E9D5FF]/60 hover:bg-[#F3E8FF]',
    },
    {
      id: 'payout_methods',
      label: 'Payout Methods',
      count: counts.payout_methods,
      badgeStyle: 'bg-white text-[#92400E] font-bold shadow-2xs',
      pillStyle:
        activeFilter === 'payout_methods'
          ? 'bg-[#D97706] text-white font-bold'
          : 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]/60 hover:bg-[#FEF3C7]',
    },
    {
      id: 'withdrawals_requested',
      label: 'Withdrawals Requested',
      count: counts.withdrawals_requested,
      badgeStyle: 'bg-white text-[#9A3412] font-bold shadow-2xs',
      pillStyle:
        activeFilter === 'withdrawals_requested'
          ? 'bg-[#EA580C] text-white font-bold'
          : 'bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5]/60 hover:bg-[#FFEDD5]',
    },
    {
      id: 'withdrawals_approved',
      label: 'Withdrawals Approved',
      count: counts.withdrawals_approved,
      badgeStyle: 'bg-white text-[#065F46] font-bold shadow-2xs',
      pillStyle:
        activeFilter === 'withdrawals_approved'
          ? 'bg-[#059669] text-white font-bold'
          : 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]/60 hover:bg-[#D1FAE5]',
    },
    {
      id: 'withdrawals_rejected',
      label: 'Withdrawals Rejected',
      count: counts.withdrawals_rejected,
      badgeStyle: 'bg-white text-[#9F1239] font-bold shadow-2xs',
      pillStyle:
        activeFilter === 'withdrawals_rejected'
          ? 'bg-[#E11D48] text-white font-bold'
          : 'bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]/60 hover:bg-[#FFE4E6]',
    },
    {
      id: 'deposits',
      label: 'Deposits',
      count: counts.deposits,
      badgeStyle: 'bg-white text-[#115E59] font-bold shadow-2xs',
      pillStyle:
        activeFilter === 'deposits'
          ? 'bg-[#0D9488] text-white font-bold'
          : 'bg-[#F0FDFA] text-[#0D9488] border border-[#99F6E4]/60 hover:bg-[#CCFBF1]',
    },
    {
      id: 'balance_changes',
      label: 'Balance Changes',
      count: counts.balance_changes,
      badgeStyle: 'bg-white text-[#3730A3] font-bold shadow-2xs',
      pillStyle:
        activeFilter === 'balance_changes'
          ? 'bg-[#4F46E5] text-white font-bold'
          : 'bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]/60 hover:bg-[#E0E7FF]',
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb Bar */}
      <div className="flex items-center justify-between gap-2 text-slate-800 pb-2">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="p-2 -ml-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 md:hidden cursor-pointer shadow-2xs"
            aria-label="Open sidebar menu"
          >
            <Menu size={18} />
          </button>
          <Activity size={18} className="text-indigo-600" />
          <span>Recent Actions</span>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={isLoading}
          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer shadow-2xs transition-colors"
          title="Refresh live activity"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin text-indigo-600' : ''} />
        </button>
      </div>

      {/* Main Header Banner */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <Activity size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight m-0">Recent Actions</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1 m-0">
              Live timeline of your sellers&apos; activity — logins, registrations, products, payouts, and
              balance changes.
            </p>
          </div>
        </div>

        {/* Live Indicator Badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-emerald-600 bg-emerald-50/90 border border-emerald-200/80 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search seller, email, or action..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white border border-slate-200/90 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            onClick={() => setSearchQuery('')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter Badges with Real Dynamic Counts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-wrap">
        {filterPills.map((pill) => (
          <button
            key={pill.id}
            type="button"
            onClick={() => {
              setActiveFilter(pill.id)
              onToast(`Filter: ${pill.label} (${pill.count})`)
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer flex items-center gap-2 shrink-0 ${pill.pillStyle}`}
          >
            <span>{pill.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] ${pill.badgeStyle}`}>
              {pill.count}
            </span>
          </button>
        ))}
      </div>

      {/* Timeline Feed Grouped by Real Dates */}
      <div className="space-y-6 pt-2">
        {Object.keys(groupedActions).length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400 shadow-xs">
            <Activity size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-800 text-sm m-0">No actions found</p>
            <p className="text-xs text-slate-400 mt-1 m-0">
              No recent actions match your current search query or filter.
            </p>
          </div>
        ) : (
          Object.entries(groupedActions).map(([dateGroup, items]) => (
            <div key={dateGroup} className="space-y-3">
              {/* Real Date Header */}
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">
                {dateGroup}
              </div>

              {/* Timeline Container Card */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 relative">
                {/* Continuous Vertical Connector Line */}
                <div className="absolute left-[39px] top-9 bottom-9 w-[2px] bg-slate-100 z-0 pointer-events-none" />

                {/* Timeline Items List */}
                <div className="space-y-8 relative z-10">
                  {items.map((item, idx) => {
                    const isProduct = item.category === 'products'
                    const isLogin = item.category === 'seller_logins'
                    const isReg = item.category === 'registrations'
                    const isWithdrawal =
                      item.category === 'withdrawals_requested' ||
                      item.category === 'withdrawals_approved' ||
                      item.category === 'withdrawals_rejected'

                    return (
                      <div key={item.id || idx} className="flex items-start gap-4">
                        {/* Circular Icon Badge */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border relative z-10 shadow-2xs ${
                            isProduct
                              ? 'bg-purple-50 text-purple-600 border-purple-100'
                              : isLogin
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : isReg
                              ? 'bg-sky-50 text-sky-600 border-sky-100'
                              : isWithdrawal
                              ? 'bg-orange-50 text-orange-600 border-orange-100'
                              : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                          }`}
                        >
                          {isProduct ? (
                            <Box size={18} className="stroke-[2]" />
                          ) : isLogin ? (
                            <Key size={17} className="stroke-[2]" />
                          ) : isReg ? (
                            <UserPlus size={17} className="stroke-[2]" />
                          ) : isWithdrawal ? (
                            <CreditCard size={17} className="stroke-[2]" />
                          ) : (
                            <Activity size={18} className="stroke-[2]" />
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          {/* Row 1: Seller Name + Email + Time Ago */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 truncate">
                              <strong className="text-sm font-bold text-slate-900 truncate">
                                {item.sellerName}
                              </strong>
                              <span className="text-xs text-slate-400 font-normal truncate">
                                {item.sellerEmail}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400 font-medium shrink-0 ml-auto">
                              {item.timeAgo}
                            </span>
                          </div>

                          {/* Row 2: Content Details */}
                          {isProduct ? (
                            <div className="mt-2.5 flex items-center gap-3">
                              {/* Product Thumbnail */}
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.title || 'Product'}
                                  className="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-100 shrink-0"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-semibold text-slate-900 line-clamp-1 m-0">
                                  {item.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-slate-400 font-normal">
                                    {item.actionText}
                                  </span>
                                  {item.priceBadge && (
                                    <span className="bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full text-xs border border-purple-100/70">
                                      {item.priceBadge}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-slate-800 m-0">{item.title}</p>
                                {item.priceBadge && (
                                  <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md text-xs">
                                    {item.priceBadge}
                                  </span>
                                )}
                              </div>
                              {item.details && (
                                <p className="text-xs text-slate-500 mt-1 m-0">{item.details}</p>
                              )}
                              {item.device && (
                                <p className="text-[11px] text-slate-400 mt-1 m-0">{item.device}</p>
                              )}
                              {item.location && (
                                <p className="text-[11px] text-slate-400 mt-0.5 m-0">{item.location}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
