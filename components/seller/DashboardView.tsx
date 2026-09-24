'use client'

import React, { useMemo } from 'react'
import {
  Plus,
  ShoppingCart,
  ArrowUpRight,
  TrendingUp,
  Eye,
  Box,
  CalendarDays,
  Clock,
  BarChart3,
  Boxes,
  Star,
  Sparkles,
  CreditCard,
  Store,
} from 'lucide-react'
import { Product, Order, SellerProfile } from '@/lib/mock-data'

interface DashboardViewProps {
  profile: SellerProfile
  products: Product[]
  orders: Order[]
  onNavigate: (tab: 'Dashboard' | 'Products' | 'Orders' | 'Notifications' | 'Profile' | 'Withdraw') => void
  onOpenBalanceModal: () => void
  onOpenStorefront?: () => void
  onToast: (msg: string) => void
  onCreateDemoOrder?: () => void
}

export function DashboardView({
  profile,
  products,
  orders,
  onNavigate,
  onOpenBalanceModal,
  onOpenStorefront,
}: DashboardViewProps) {
  // Financial calculations from live state: Only delivered orders credit profit to dashboard
  const deliveredOrdersList = orders.filter((o) => o.status === 'delivered')
  const deliveredProfit = deliveredOrdersList.reduce((sum, o) => sum + (Number(o.profit) || 0), 0)
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
  const totalProfit = deliveredProfit > 0 ? deliveredProfit : (profile.balance > 0 ? profile.balance : 0)
  const totalCost = Math.max(0, totalRevenue - deliveredProfit)
  const deliveredOrders = deliveredOrdersList.length
  const pendingOrders = orders.filter((o) =>
    ['unpaid', 'paid', 'pickup', 'on_the_way', 'out_for_delivery'].includes(o.status)
  ).length
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(0) : '0'

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const thisMonthOrders = orders.filter((o) => {
    if (!o.date) return true
    const d = new Date(o.date)
    return !isNaN(d.getTime()) ? (d.getMonth() === currentMonth && d.getFullYear() === currentYear) : true
  })
  const monthRevenue = thisMonthOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
  const monthProfit = thisMonthOrders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + (Number(o.profit) || 0), 0)

  // Category distribution computed dynamically from live catalog products
  const categoryData = useMemo(() => {
    if (!products || products.length === 0) return []
    const counts: Record<string, number> = {}
    products.forEach((p) => {
      const cat = p.category || 'General'
      counts[cat] = (counts[cat] || 0) + 1
    })

    const colors = [
      '#3B82F6',
      '#10B981',
      '#8B5CF6',
      '#F59E0B',
      '#EF4444',
      '#06B6D4',
      '#EC4899',
      '#6366F1',
      '#14B8A6',
    ]

    const total = products.length
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], index) => ({
        name,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
        color: colors[index % colors.length],
      }))
  }, [products])

  return (
    <div className="dashboard-content-wrap space-y-6">
      {/* 1. Hero Cockpit Banner matching screenshot */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0F3558] text-white p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left: Avatar & Identity */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-[#20496E] flex items-center justify-center font-bold text-2xl text-white shadow-inner">
                {(profile.shopName ? profile.shopName[0] : (profile.avatarLetter || 'T')).toUpperCase()}
              </div>
              <div
                className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-400 flex items-center justify-center ring-2 ring-[#0F3558]"
                title="Verified Seller Account"
              >
                <Sparkles size={11} className="text-emerald-950" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-300">
                WELCOME BACK
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight mt-0.5 truncate">
                {profile.shopName}
              </h1>
              <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm text-slate-200">
                <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                  <Star size={13} className="fill-amber-300 text-amber-300" />
                  <span>{profile.rating ? profile.rating.toFixed(1) : '5.0'}</span>
                </span>
                <span className="text-slate-400">·</span>
                <span suppressHydrationWarning>{orders.length} orders all-time</span>
              </div>
            </div>
          </div>

          {/* Right: Balance & Guarantee Cards */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              className="text-left rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 px-5 py-2.5 min-w-[125px] transition-colors cursor-pointer"
              onClick={onOpenBalanceModal}
              title="Click to view balance details"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                <CreditCard size={12} />
                <span>BALANCE</span>
              </div>
              <div suppressHydrationWarning className="text-lg sm:text-xl font-bold text-white mt-0.5 tabular-nums">
                ${profile.balance.toFixed(2)}
              </div>
            </button>

            <div className="rounded-2xl bg-white/10 border border-white/15 px-5 py-2.5 min-w-[125px]">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                <Box size={12} />
                <span>GUARANTEE</span>
              </div>
              <div suppressHydrationWarning className="text-lg sm:text-xl font-bold text-white mt-0.5 tabular-nums">
                ${profile.guarantee.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Hero Bottom Actions */}
        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-medium transition-colors cursor-pointer"
            onClick={() => onNavigate('Products')}
          >
            <Plus size={14} />
            <span>Add product</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-medium transition-colors cursor-pointer"
            onClick={() => onNavigate('Orders')}
          >
            <ShoppingCart size={14} />
            <span>View orders</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-medium transition-colors cursor-pointer"
            onClick={onOpenBalanceModal}
          >
            <ArrowUpRight size={14} />
            <span>Withdraw</span>
          </button>

          {onOpenStorefront && (
            <button
              type="button"
              id="dashboard-open-storefront-btn"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold transition-all shadow-xs cursor-pointer"
              onClick={onOpenStorefront}
            >
              <Store size={14} className="text-blue-600" />
              <span>View storefront</span>
            </button>
          )}
        </div>
      </section>

      {/* 2. Three Large Pastel Stat Cards matching screenshot */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Total Revenue */}
        <div className="bg-[#EEF4FF] border border-blue-100/80 rounded-3xl p-6 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#DBEAFE] text-blue-600 flex items-center justify-center shrink-0 font-bold text-lg">
            $
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              TOTAL REVENUE
            </div>
            <div suppressHydrationWarning className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">
              ${totalRevenue.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Total Profit */}
        <div className="bg-[#ECFDF5] border border-emerald-100/80 rounded-3xl p-6 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#D1FAE5] text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              TOTAL PROFIT
            </div>
            <div suppressHydrationWarning className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">
              ${totalProfit.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-[#FAF5FF] border border-purple-100/80 rounded-3xl p-6 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#F3E8FF] text-purple-600 flex items-center justify-center shrink-0">
            <ShoppingCart size={20} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              TOTAL ORDERS
            </div>
            <div suppressHydrationWarning className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {orders.length}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Six Secondary Metric Cards matching screenshot */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Views */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
            <Eye size={18} />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 text-base leading-tight">0</div>
            <div className="text-[11px] text-slate-500 leading-tight mt-0.5 truncate">Total Views</div>
          </div>
        </div>

        {/* Today Views */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
            <Eye size={18} />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 text-base leading-tight">0</div>
            <div className="text-[11px] text-slate-500 leading-tight mt-0.5 truncate">Today Views</div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <Clock size={18} />
          </div>
          <div className="min-w-0">
            <div suppressHydrationWarning className="font-bold text-slate-900 text-base leading-tight">
              {pendingOrders}
            </div>
            <div className="text-[11px] text-slate-500 leading-tight mt-0.5 truncate">Pending</div>
          </div>
        </div>

        {/* Delivered */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
            <Box size={18} />
          </div>
          <div className="min-w-0">
            <div suppressHydrationWarning className="font-bold text-slate-900 text-base leading-tight">
              {deliveredOrders}
            </div>
            <div className="text-[11px] text-slate-500 leading-tight mt-0.5 truncate">Delivered</div>
          </div>
        </div>

        {/* Products */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
            <Box size={18} />
          </div>
          <div className="min-w-0">
            <div suppressHydrationWarning className="font-bold text-slate-900 text-base leading-tight">
              {products.length}
            </div>
            <div className="text-[11px] text-slate-500 leading-tight mt-0.5 truncate">Products</div>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-[#FFF7ED] border border-orange-100 rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center shrink-0">
            <CalendarDays size={18} />
          </div>
          <div className="min-w-0">
            <div suppressHydrationWarning className="font-bold text-slate-900 text-sm leading-tight">
              ${monthRevenue.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-500 leading-tight mt-0.5">This Month</div>
            <div suppressHydrationWarning className="text-[10px] text-slate-400 leading-tight">
              Profit ${monthProfit.toFixed(2)}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Bottom Split Section: Sales Stats & Products by Category */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Sales Stats */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <BarChart3 size={17} />
              </div>
              <h2 className="text-base font-bold text-slate-900">Sales Stats</h2>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-0.5 text-xs font-semibold">
              <TrendingUp size={12} /> {profitMargin}% margin
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-sm">
            <div className="flex items-center justify-between py-3">
              <span className="text-slate-600 font-medium">Total Revenue</span>
              <span suppressHydrationWarning className="font-bold text-slate-900 tabular-nums">
                ${totalRevenue.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-slate-600 font-medium">Total Cost</span>
              <span suppressHydrationWarning className="font-bold text-slate-900 tabular-nums">
                ${totalCost.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-slate-600 font-medium">Total Profit</span>
              <span suppressHydrationWarning className="font-bold text-emerald-600 tabular-nums">
                ${totalProfit.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-slate-600 font-medium">This Month Revenue</span>
              <span suppressHydrationWarning className="font-bold text-slate-900 tabular-nums">
                ${monthRevenue.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-slate-600 font-medium">This Month Profit</span>
              <span suppressHydrationWarning className="font-bold text-emerald-600 tabular-nums">
                ${monthProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Products by Category */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                <Boxes size={17} />
              </div>
              <h2 className="text-base font-bold text-slate-900">Products by Category</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">{products.length} total</span>
          </div>

          <div className="space-y-4">
            {categoryData.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No products found in catalog.</p>
            ) : (
              categoryData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-700 font-medium truncate">{item.name}</span>
                  </div>
                  <div className="flex items-baseline gap-2 shrink-0">
                    <span className="font-bold text-slate-900 tabular-nums">{item.count}</span>
                    <span className="text-slate-400 text-xs tabular-nums">{item.percent}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
