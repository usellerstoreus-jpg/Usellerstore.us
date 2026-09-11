'use client'

import React, { useState, useMemo } from 'react'
import {
  Sparkles,
  Plus,
  ShoppingCart,
  ArrowUpRight,
  CircleDollarSign,
  TrendingUp,
  Eye,
  Box,
  Boxes,
  CalendarDays,
  ShieldCheck,
  Copy,
  Wallet,
  Clock,
  Check,
  ChevronRight,
  TrendingDown,
  BarChart3,
  AlertTriangle,
  PackageCheck,
  Package,
  RefreshCw,
  Layers,
  ArrowRight,
  Star
} from 'lucide-react'
import { Product, Order, SellerProfile } from '@/lib/mock-data'

interface DashboardViewProps {
  profile: SellerProfile
  products: Product[]
  orders: Order[]
  onNavigate: (tab: 'Dashboard' | 'Products' | 'Orders' | 'Notifications' | 'Profile') => void
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
  onToast,
  onCreateDemoOrder,
}: DashboardViewProps) {
  const [chartPeriod, setChartPeriod] = useState<'7D' | '30D' | '90D' | '1Y'>('7D')
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const [isRestocking, setIsRestocking] = useState(false)

  // Derived Metrics from live data
  const totalProducts = products.length
  const activeProducts = products.filter((p) => p.status === 'active').length
  const outOfStockProducts = products.filter((p) => Number(p.stock) === 0)
  const lowStockProducts = products.filter((p) => Number(p.stock) > 0 && Number(p.stock) < 5)

  // Calculate live order totals
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), profile.balance)
  const totalProfit = orders.reduce((sum, o) => sum + (Number(o.profit) || 0), 0)
  const totalCost = Math.max(0, totalRevenue - totalProfit)
  const deliveredOrders = orders.filter((o) => o.status === 'delivered').length
  const pendingOrders = orders.filter((o) => ['unpaid', 'paid', 'pickup', 'on_the_way'].includes(o.status)).length
  const avgOrderValue = orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : '59.95'
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '24.8'

  // Month-to-date estimates
  const monthRevenue = totalRevenue * 0.72
  const monthProfit = totalProfit > 0 ? totalProfit * 0.72 : totalRevenue * 0.22

  // Store URL
  const storeSlug = profile.shopName.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const storefrontUrl = `https://usellerstore.us/shop/${storeSlug}`

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(storefrontUrl)
    setCopiedUrl(true)
    onToast('Storefront link copied to clipboard!')
    setTimeout(() => setCopiedUrl(false), 2500)
  }

  // Category breakdown
  const categoryCounts = useMemo(() => {
    const counts: { [cat: string]: number } = {}
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1
    })
    return counts
  }, [products])

  const topCategories = useMemo(() => {
    return Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
  }, [categoryCounts])

  const dotColors = ['#0284C7', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4']

  // Timeline data for sales chart depending on chartPeriod
  const timelineData = useMemo(() => {
    if (chartPeriod === '30D') {
      return [
        { label: 'Week 1', revenue: 420.0, profit: 110.0, orders: 8 },
        { label: 'Week 2', revenue: 680.5, profit: 175.4, orders: 12 },
        { label: 'Week 3', revenue: 950.0, profit: 245.0, orders: 17 },
        { label: 'Week 4', revenue: Math.max(820, totalRevenue), profit: Math.max(210, totalProfit || 210), orders: Math.max(14, orders.length) },
      ]
    }
    if (chartPeriod === '90D') {
      return [
        { label: 'Month 1', revenue: 1850.0, profit: 460.0, orders: 32 },
        { label: 'Month 2', revenue: 2400.0, profit: 620.0, orders: 45 },
        { label: 'Month 3', revenue: Math.max(3100, totalRevenue * 1.5), profit: Math.max(780, totalProfit * 1.5), orders: Math.max(58, orders.length * 2) },
      ]
    }
    if (chartPeriod === '1Y') {
      return [
        { label: 'Q1', revenue: 5400.0, profit: 1350.0, orders: 98 },
        { label: 'Q2', revenue: 7200.0, profit: 1820.0, orders: 130 },
        { label: 'Q3', revenue: 8900.0, profit: 2280.0, orders: 165 },
        { label: 'Q4', revenue: Math.max(10500, totalRevenue * 3), profit: Math.max(2700, totalProfit * 3), orders: Math.max(190, orders.length * 4) },
      ]
    }
    // Default: 7D
    return [
      { label: 'Mon', revenue: 142.5, profit: 34.2, orders: 2 },
      { label: 'Tue', revenue: 215.8, profit: 56.4, orders: 3 },
      { label: 'Wed', revenue: 180.0, profit: 42.1, orders: 2 },
      { label: 'Thu', revenue: 320.4, profit: 88.6, orders: 5 },
      { label: 'Fri', revenue: 285.0, profit: 71.0, orders: 4 },
      { label: 'Sat', revenue: 410.2, profit: 104.5, orders: 6 },
      { label: 'Today', revenue: Math.max(160, profile.balance), profit: Math.max(45, totalProfit || 45), orders: orders.length || 2 },
    ]
  }, [chartPeriod, totalRevenue, totalProfit, orders.length, profile.balance])

  const maxBarValue = Math.max(...timelineData.map((d) => d.revenue), 450)

  const handleRestockAll = () => {
    setIsRestocking(true)
    setTimeout(() => {
      setIsRestocking(false)
      onToast('Inventory restocked successfully!')
    }, 900)
  }

  return (
    <div className="dashboard-content-wrap space-y-5 sm:space-y-6">
      {/* 1. Top Bar: Storefront Link & System Live Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white/80 backdrop-blur-md p-2.5 sm:px-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-800 font-bold tracking-normal normal-case shrink-0">
            Storefront Live · {profile.shopName}
          </span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-slate-500 lowercase font-medium truncate max-w-[200px] sm:max-w-xs">
            {storefrontUrl}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 transition-all font-medium text-xs normal-case shadow-xs cursor-pointer"
            onClick={handleCopyLink}
          >
            {copiedUrl ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            <span>{copiedUrl ? 'Copied Link' : 'Copy Store Link'}</span>
          </button>
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 normal-case">
            <Sparkles size={13} className="text-emerald-500" /> 100% Operational
          </div>
        </div>
      </div>

      {/* 2. Hero Store Cockpit Banner (Styled after usellerstore.com) */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-br from-[#0B192C] via-[#0F52BA] to-[#1E3E62] text-white shadow-xl p-5 sm:p-7">
        {/* Ambient Blurred Spheres */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 h-48 w-48 rounded-full bg-blue-400/10 blur-2xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6">
          {/* Left: Store Identity & Rating */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-white/15 backdrop-blur-md ring-2 ring-white/30 overflow-hidden flex items-center justify-center font-black text-xl sm:text-2xl text-white shadow-lg">
                {profile.avatarLetter}
              </div>
              <span
                className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-400 border-2 border-[#0B192C] flex items-center justify-center shadow-xs"
                title="Merchant account verified and active"
              >
                <Sparkles size={10} className="text-emerald-950" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-300">
                  OFFICIAL RESELLER PORTAL
                </span>
                <span className="inline-flex items-center gap-1 bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <ShieldCheck size={11} /> VERIFIED
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight leading-tight truncate text-white">
                {profile.shopName}
              </h1>
              <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm text-white/80 flex-wrap">
                <span>Owner: <b className="text-white">{profile.ownerName}</b></span>
                <span className="opacity-40">·</span>
                <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                  <Star size={13} className="fill-amber-300 text-amber-300" />
                  <span>{profile.rating.toFixed(1)}</span>
                </span>
                <span className="opacity-40">·</span>
                <span className="truncate">{orders.length} orders all-time</span>
              </div>
            </div>
          </div>

          {/* Center: Dual Glassmorphism Balance Widgets */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:min-w-[300px]">
            <div
              className="rounded-xl bg-white/12 hover:bg-white/18 backdrop-blur-md border border-white/20 p-3 transition-all cursor-pointer hover:scale-102"
              onClick={onOpenBalanceModal}
              title="Click to view full balance details and history"
            >
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-cyan-200 font-semibold">
                <CircleDollarSign size={12} />
                <span>AVAILABLE BALANCE</span>
              </div>
              <div className="text-lg sm:text-2xl font-black tabular-nums leading-tight mt-1 text-white">
                ${profile.balance.toFixed(2)}
              </div>
              <span className="text-[10px] text-cyan-200/80 underline font-medium">Recharge / Payout →</span>
            </div>

            <div className="rounded-xl bg-white/12 backdrop-blur-md border border-white/20 p-3">
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-200 font-semibold">
                <ShieldCheck size={12} />
                <span>GUARANTEE POOL</span>
              </div>
              <div className="text-lg sm:text-2xl font-black tabular-nums leading-tight mt-1 text-emerald-300">
                ${profile.guarantee.toFixed(2)}
              </div>
              <span className="text-[10px] text-emerald-200/80 font-medium">100% Protected</span>
            </div>
          </div>
        </div>

        {/* Hero Quick Action Pills Strip */}
        <div className="relative mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold px-3.5 py-2 text-xs shadow-md transition-all cursor-pointer"
            onClick={() => onNavigate('Products')}
          >
            <Plus size={15} className="text-blue-600" />
            <span>Add Product</span>
          </button>

          {onOpenStorefront && (
            <button
              type="button"
              id="dashboard-browse-storefront-btn"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-200 hover:from-cyan-200 hover:to-sky-100 text-slate-950 font-black px-3.5 py-2 text-xs shadow-md transition-all cursor-pointer"
              onClick={onOpenStorefront}
            >
              <ShoppingCart size={15} className="text-blue-700" />
              <span>Browse Storefront ({products.length} Products)</span>
            </button>
          )}

          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-white font-semibold px-3.5 py-2 text-xs transition-all cursor-pointer"
            onClick={() => onNavigate('Orders')}
          >
            <ShoppingCart size={15} />
            <span>View Orders ({orders.length})</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3.5 py-2 text-xs shadow-md transition-all cursor-pointer"
            onClick={onOpenBalanceModal}
          >
            <ArrowUpRight size={15} />
            <span>Withdraw Earnings</span>
          </button>

          {onCreateDemoOrder && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-cyan-200 font-semibold px-3 py-2 text-xs transition-all ml-auto cursor-pointer"
              onClick={onCreateDemoOrder}
              title="Generate a demo order to verify real-time revenue & balance updates"
            >
              <Sparkles size={14} className="text-amber-400" />
              <span>Simulate Customer Order</span>
            </button>
          )}
        </div>
      </section>

      {/* 3. Top 3 Primary KPI Cards (Revenue, Profit, Orders) matching usellerstore.com */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Total Revenue */}
        <div className="relative overflow-hidden rounded-2xl border bg-card p-4 sm:p-5 ring-1 ring-blue-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent pointer-events-none" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Total Revenue
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums leading-tight mt-1.5 truncate">
                ${totalRevenue.toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium truncate">
                {orders.length} orders all-time
              </div>
            </div>
            <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/15 text-blue-600 ring-1 ring-blue-500/25">
              <CircleDollarSign size={22} strokeWidth={2.2} />
            </div>
          </div>
          <div className="relative mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/25">
              <TrendingUp size={12} /> Live Payout Sync
            </span>
            <span className="text-slate-400 font-medium">+18.4% vs last mo</span>
          </div>
        </div>

        {/* Total Profit */}
        <div className="relative overflow-hidden rounded-2xl border bg-card p-4 sm:p-5 ring-1 ring-emerald-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent pointer-events-none" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Total Profit
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 tabular-nums leading-tight mt-1.5 truncate">
                ${totalProfit > 0 ? totalProfit.toFixed(2) : (totalRevenue * 0.25).toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium truncate">
                Net profit margin: <b className="text-emerald-700">{profitMargin}%</b>
              </div>
            </div>
            <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/25">
              <TrendingUp size={22} strokeWidth={2.2} />
            </div>
          </div>
          <div className="relative mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/25">
              <ShieldCheck size={12} /> Healthy ROI
            </span>
            <span className="text-slate-400 font-medium">${(monthProfit).toFixed(2)} this mo</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="relative overflow-hidden rounded-2xl border bg-card p-4 sm:p-5 ring-1 ring-violet-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/15 via-violet-500/5 to-transparent pointer-events-none" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Total Orders
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums leading-tight mt-1.5 truncate">
                {orders.length}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium truncate">
                {pendingOrders > 0 ? `${pendingOrders} awaiting fulfillment` : 'All caught up'}
              </div>
            </div>
            <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 bg-violet-500/15 text-violet-600 ring-1 ring-violet-500/25">
              <ShoppingCart size={22} strokeWidth={2.2} />
            </div>
          </div>
          <div className="relative mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${
              pendingOrders > 0
                ? 'bg-amber-500/10 text-amber-700 ring-amber-500/25'
                : 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/25'
            }`}>
              {pendingOrders > 0 ? `${pendingOrders} pending` : '0 pending'}
            </span>
            <span className="text-slate-400 font-medium">{deliveredOrders} delivered</span>
          </div>
        </div>
      </section>

      {/* 4. Six Secondary Metric Cards Grid (Direct match of usellerstore.com layout) */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
        {/* Total Views */}
        <div className="relative overflow-hidden bg-card border rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex items-center gap-2.5 ring-1 ring-blue-500/15 hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent pointer-events-none" />
          <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/15 text-blue-600">
            <Eye size={18} />
          </div>
          <div className="relative min-w-0 flex-1">
            <div className="font-extrabold text-sm sm:text-base tabular-nums leading-tight text-slate-900 truncate">
              1,420
            </div>
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 leading-tight mt-0.5 truncate">
              Total Views
            </div>
          </div>
        </div>

        {/* Today Views */}
        <div className="relative overflow-hidden bg-card border rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex items-center gap-2.5 ring-1 ring-emerald-500/15 hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent pointer-events-none" />
          <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/15 text-emerald-600">
            <Eye size={18} />
          </div>
          <div className="relative min-w-0 flex-1">
            <div className="font-extrabold text-sm sm:text-base tabular-nums leading-tight text-slate-900 truncate">
              184
            </div>
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 leading-tight mt-0.5 truncate">
              Today Views
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="relative overflow-hidden bg-card border rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex items-center gap-2.5 ring-1 ring-amber-500/15 hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent pointer-events-none" />
          <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-500/15 text-amber-600">
            <Clock size={18} />
          </div>
          <div className="relative min-w-0 flex-1">
            <div className="font-extrabold text-sm sm:text-base tabular-nums leading-tight text-slate-900 truncate">
              {pendingOrders}
            </div>
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 leading-tight mt-0.5 truncate">
              Pending Orders
            </div>
          </div>
        </div>

        {/* Delivered Orders */}
        <div className="relative overflow-hidden bg-card border rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex items-center gap-2.5 ring-1 ring-emerald-500/15 hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent pointer-events-none" />
          <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/15 text-emerald-600">
            <PackageCheck size={18} />
          </div>
          <div className="relative min-w-0 flex-1">
            <div className="font-extrabold text-sm sm:text-base tabular-nums leading-tight text-slate-900 truncate">
              {deliveredOrders}
            </div>
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 leading-tight mt-0.5 truncate">
              Delivered
            </div>
          </div>
        </div>

        {/* Products in Catalog */}
        <div className="relative overflow-hidden bg-card border rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex items-center gap-2.5 ring-1 ring-slate-500/15 hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 via-transparent pointer-events-none" />
          <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0 bg-slate-500/15 text-slate-700">
            <Boxes size={18} />
          </div>
          <div className="relative min-w-0 flex-1">
            <div className="font-extrabold text-sm sm:text-base tabular-nums leading-tight text-slate-900 truncate">
              {totalProducts}
            </div>
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 leading-tight mt-0.5 truncate">
              Catalog SKUs
            </div>
          </div>
        </div>

        {/* This Month Performance */}
        <div className="relative overflow-hidden bg-card border rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex items-center gap-2.5 ring-1 ring-orange-500/15 hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent pointer-events-none" />
          <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0 bg-orange-500/15 text-orange-600">
            <CalendarDays size={18} />
          </div>
          <div className="relative min-w-0 flex-1">
            <div className="font-extrabold text-sm sm:text-base tabular-nums leading-tight text-slate-900 truncate">
              ${monthRevenue.toFixed(0)}
            </div>
            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 leading-tight mt-0.5 truncate">
              This Month
            </div>
          </div>
        </div>
      </section>

      {/* 5. Split Section: Sales Stats & Performance Breakdown (3 cols) vs Category Distribution (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Sales Stats & Interactive Analytics Chart (3 cols) */}
        <div className="lg:col-span-3 rounded-2xl bg-card border border-slate-200/80 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center ring-1 ring-blue-500/20">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-tight">Sales Stats</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time revenue, gross margins, and timeframe analytics</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 px-2.5 py-1 text-xs font-bold ring-1 ring-emerald-500/20">
                  <TrendingUp size={13} /> {profitMargin}% margin
                </span>

                {/* Time Range Pills */}
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                  {(['7D', '30D', '90D', '1Y'] as const).map((period) => (
                    <button
                      key={period}
                      type="button"
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        chartPeriod === period
                          ? 'bg-white text-slate-900 shadow-xs font-bold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                      onClick={() => setChartPeriod(period)}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Trend Chart */}
            <div className="relative h-44 w-full pt-3 pb-1 border-b border-slate-100">
              <div className="flex items-end justify-between h-32 gap-2 px-2">
                {timelineData.map((d, index) => {
                  const heightPercent = Math.max(18, Math.round((d.revenue / maxBarValue) * 100))
                  const isHovered = hoveredBar === index
                  return (
                    <div
                      key={d.label}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                      onMouseEnter={() => setHoveredBar(index)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {isHovered && (
                        <div className="absolute -top-10 z-30 bg-slate-900 text-white text-[11px] py-1 px-2.5 rounded-lg shadow-xl whitespace-nowrap pointer-events-none animate-in fade-in">
                          <strong>${d.revenue.toFixed(2)}</strong>
                          <span className="text-slate-300 ml-1.5">({d.orders} orders)</span>
                        </div>
                      )}

                      <div
                        className={`w-full max-w-[42px] rounded-t-lg transition-all duration-300 relative ${
                          isHovered
                            ? 'bg-blue-600 shadow-md scale-y-102'
                            : 'bg-gradient-to-t from-blue-600 to-cyan-400 opacity-90'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      >
                        <div
                          className="w-full bg-emerald-400/85 rounded-t-sm absolute bottom-0 transition-all"
                          style={{ height: `${Math.min(90, Math.round((d.profit / d.revenue) * 100))}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 mt-2">{d.label}</span>
                    </div>
                  )
                })}
              </div>

              {/* Chart Legend */}
              <div className="flex items-center justify-between text-xs text-slate-500 mt-2 px-1">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" /> Revenue
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-400 inline-block" /> Gross Margin
                  </span>
                </div>
                <span className="font-semibold text-slate-700 text-[11px]">
                  Average: ${(totalRevenue / timelineData.length).toFixed(2)} / period
                </span>
              </div>
            </div>

            {/* Structured Metric Table matching usellerstore.com */}
            <div className="divide-y divide-slate-100 text-xs sm:text-sm mt-3">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 font-medium">Total Revenue</span>
                <span className="font-bold text-slate-900 tabular-nums">${totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 font-medium">Total Product Cost</span>
                <span className="font-bold text-slate-700 tabular-nums">${totalCost.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 font-medium">Net Realized Profit</span>
                <span className="font-black text-emerald-600 tabular-nums">
                  +${totalProfit > 0 ? totalProfit.toFixed(2) : (totalRevenue * 0.25).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 font-medium">This Month Estimated Revenue</span>
                <span className="font-bold text-slate-900 tabular-nums">${monthRevenue.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 font-medium">This Month Estimated Profit</span>
                <span className="font-black text-emerald-600 tabular-nums">+${monthProfit.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 font-medium">Average Order Value</span>
                <span className="font-bold text-slate-900 tabular-nums">${avgOrderValue}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Payout threshold: <b>$50.00</b></span>
            <button
              type="button"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              onClick={onOpenBalanceModal}
            >
              <span>Manage Withdrawals</span> <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Products by Category Breakdown (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-card border border-slate-200/80 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center ring-1 ring-purple-500/20">
                  <Boxes size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-tight">Products by Category</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Catalog distribution</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                {totalProducts} Total
              </span>
            </div>

            {topCategories.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Boxes size={36} className="mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-sm">No products in catalog</p>
                <p className="text-xs mt-1">Add your first product to see category statistics.</p>
              </div>
            ) : (
              <ul className="space-y-3.5 mt-4">
                {topCategories.map(([catName, count], idx) => {
                  const percent = Math.round((count / (totalProducts || 1)) * 100)
                  const color = dotColors[idx % dotColors.length]
                  return (
                    <li key={catName} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800 flex items-center gap-2 truncate">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="truncate">{catName}</span>
                        </span>
                        <div className="flex items-baseline gap-1.5 shrink-0">
                          <span className="font-bold text-slate-900 tabular-nums">{count}</span>
                          <span className="text-slate-400 text-[11px] tabular-nums">({percent}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%`, backgroundColor: color }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="pt-5 border-t border-slate-100 mt-6">
            <button
              type="button"
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              onClick={() => onNavigate('Products')}
            >
              <span>Manage Entire Catalog ({totalProducts})</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 6. Lower Grid: Stock & Inventory Alerts (2 cols) vs Recent Orders Table (3 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Stock Alerts Panel (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-card border border-slate-200/80 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center ring-1 ring-amber-500/20">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-tight">Stock Alerts</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {outOfStockProducts.length > 0
                      ? `${outOfStockProducts.length} out of stock · ${lowStockProducts.length} running low`
                      : 'Inventory health check'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                onClick={() => onNavigate('Products')}
              >
                <span>Manage</span> <ChevronRight size={14} />
              </button>
            </div>

            {/* Out-of-stock warning banner */}
            {outOfStockProducts.length > 0 && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200/80">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-rose-700">
                      Restock Required
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      {outOfStockProducts.length} product(s) currently unavailable to buyers.
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isRestocking}
                    onClick={handleRestockAll}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 text-xs font-bold shadow-xs cursor-pointer shrink-0 transition"
                  >
                    <RefreshCw size={12} className={isRestocking ? 'animate-spin' : ''} />
                    <span>{isRestocking ? 'Restocking…' : 'Quick Refill'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* List of items needing restock */}
            {outOfStockProducts.length === 0 && lowStockProducts.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <PackageCheck size={36} className="mx-auto mb-2 text-emerald-500" />
                <p className="font-bold text-sm text-slate-800">All Products Well-Stocked</p>
                <p className="text-xs text-slate-500 mt-1">100% of your active listings have sufficient warehouse inventory.</p>
              </div>
            ) : (
              <ul className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {[...outOfStockProducts, ...lowStockProducts].slice(0, 5).map((p) => {
                  const isZero = Number(p.stock) === 0
                  return (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/60 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.image ? (
                            <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
                          ) : (
                            <Package size={18} className="text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate max-w-[170px]" title={p.title}>
                            {p.title}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            SKU: {p.sku || 'SKU-GEN'} · ${p.sell.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border tabular-nums shrink-0 ${
                          isZero
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {isZero ? 'Out of stock' : `${p.stock} left`}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              type="button"
              className="w-full py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              onClick={() => onNavigate('Products')}
            >
              <Plus size={14} /> <span>List New Product Listing</span>
            </button>
          </div>
        </div>

        {/* Recent Live Orders Table (3 cols) */}
        <div className="lg:col-span-3 rounded-2xl bg-card border border-slate-200/80 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center ring-1 ring-violet-500/20">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-tight">Recent Orders</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Live store transactions and customer purchases</p>
                </div>
              </div>

              <button
                type="button"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                onClick={() => onNavigate('Orders')}
              >
                <span>View All ({orders.length})</span> <ChevronRight size={14} />
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShoppingCart size={36} className="mx-auto mb-2 opacity-50" />
                <p className="font-bold text-sm text-slate-800">No customer orders yet</p>
                <p className="text-xs mt-1">Click &quot;Simulate Customer Order&quot; on the hero above to test real-time orders.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                      <th className="pb-3 font-bold">Order #</th>
                      <th className="pb-3 font-bold">Customer</th>
                      <th className="pb-3 font-bold">Item</th>
                      <th className="pb-3 font-bold">Total</th>
                      <th className="pb-3 font-bold">Profit</th>
                      <th className="pb-3 font-bold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {orders.slice(0, 5).map((order) => {
                      const statusBadge =
                        order.status === 'delivered'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : order.status === 'paid'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : order.status === 'pickup'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : order.status === 'cancelled'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 font-bold text-slate-900">{order.orderNumber}</td>
                          <td className="py-3">
                            <div className="text-slate-900 font-semibold">{order.customerName}</div>
                            <div className="text-slate-400 text-[10px]">{order.date}</div>
                          </td>
                          <td className="py-3 text-slate-600 max-w-[140px] truncate">
                            {order.items[0]?.productTitle || 'Store products'}
                          </td>
                          <td className="py-3 font-bold text-slate-900">${Number(order.totalAmount).toFixed(2)}</td>
                          <td className="py-3 font-black text-emerald-600">+${Number(order.profit).toFixed(2)}</td>
                          <td className="py-3 text-right">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${statusBadge}`}>
                              {order.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs mt-4">
            <span className="text-slate-500">Showing {Math.min(5, orders.length)} of {orders.length} orders</span>
            <button
              type="button"
              className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              onClick={() => onNavigate('Orders')}
            >
              <span>Go to Orders Console</span> <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
