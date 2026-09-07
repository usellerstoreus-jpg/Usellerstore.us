'use client'

import React, { useState } from 'react'
import {
  Sparkles,
  Plus,
  ShoppingCart,
  ArrowUpRight,
  CircleDollarSign,
  TrendingUp,
  Eye,
  ClipboardList,
  Box,
  Package,
  CalendarDays,
  ShieldCheck,
  Copy,
  ExternalLink,
  Wallet,
  CheckCircle2,
  Clock,
  Store,
  Check,
  ChevronRight,
  TrendingDown
} from 'lucide-react'
import { Product, Order, SellerProfile } from '@/lib/mock-data'

interface DashboardViewProps {
  profile: SellerProfile
  products: Product[]
  orders: Order[]
  onNavigate: (tab: 'Dashboard' | 'Products' | 'Orders' | 'Notifications' | 'Profile') => void
  onOpenBalanceModal: () => void
  onToast: (msg: string) => void
  onCreateDemoOrder?: () => void
}

export function DashboardView({
  profile,
  products,
  orders,
  onNavigate,
  onOpenBalanceModal,
  onToast,
  onCreateDemoOrder,
}: DashboardViewProps) {
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | 'all'>('7d')
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)

  // Derived Metrics from live data
  const totalProducts = products.length
  const activeProducts = products.filter((p) => p.status === 'active').length

  // Calculate live order totals
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), profile.balance)
  const totalProfit = orders.reduce((sum, o) => sum + (Number(o.profit) || 0), 0)
  const deliveredOrders = orders.filter((o) => o.status === 'delivered').length
  const pendingOrders = orders.filter((o) => ['unpaid', 'paid', 'pickup', 'on_the_way'].includes(o.status)).length
  const avgOrderValue = orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : '59.95'
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '24.8'

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
  const categoryCounts: { [cat: string]: number } = {}
  products.forEach((p) => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1
  })
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const dotColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899']

  // Mock timeline data for sales chart (7 days)
  const dailyData = [
    { day: 'Mon', revenue: 142.5, profit: 34.2, orders: 2 },
    { day: 'Tue', revenue: 215.8, profit: 56.4, orders: 3 },
    { day: 'Wed', revenue: 180.0, profit: 42.1, orders: 2 },
    { day: 'Thu', revenue: 320.4, profit: 88.6, orders: 5 },
    { day: 'Fri', revenue: 285.0, profit: 71.0, orders: 4 },
    { day: 'Sat', revenue: 410.2, profit: 104.5, orders: 6 },
    { day: 'Today', revenue: Math.max(160, profile.balance), profit: Math.max(45, totalProfit || 45), orders: orders.length || 2 },
  ]
  const maxBarValue = Math.max(...dailyData.map((d) => d.revenue), 450)

  // Monthly Milestone target ($5,000 goal)
  const monthlyGoal = 5000
  const currentMonthRevenue = Math.min(monthlyGoal, totalRevenue || 650)
  const goalPercent = Math.min(100, Math.round((currentMonthRevenue / monthlyGoal) * 100))

  return (
    <div className="dashboard-content-wrap space-y-6">
      {/* Top Banner with Store Link & Quick Status */}
      <div className="prototype-bar flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-700 font-bold tracking-normal normal-case shrink-0">
            Storefront Live · {profile.shopName}
          </span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-slate-500 lowercase truncate max-w-[170px] sm:max-w-xs">{storefrontUrl}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 transition-all font-medium text-xs normal-case shadow-xs cursor-pointer"
            onClick={handleCopyLink}
          >
            {copiedUrl ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            <span>{copiedUrl ? 'Copied' : 'Copy Link'}</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors normal-case"
            onClick={() => onToast('Store status: 100% operational')}
          >
            <Sparkles size={14} className="text-amber-500" /> All systems nominal
          </button>
        </div>
      </div>

      {/* Hero Cockpit Banner */}
      <section className="welcome-hero relative overflow-hidden rounded-2xl p-4 sm:p-6 text-white shadow-xl">
        <div className="hero-glow-blob" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6">
          {/* Left Store Details */}
          <div className="welcome-person flex items-center gap-3 sm:gap-4">
            <div className="avatar hero-avatar relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 text-xl sm:text-2xl rounded-2xl">
              {profile.avatarLetter}
              <span className="online-dot" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                <span className="eyebrow uppercase text-cyan-300 font-semibold text-[10px] sm:text-[11px] tracking-wider">
                  OFFICIAL MERCHANT COCKPIT
                </span>
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                  <ShieldCheck size={10} /> VERIFIED
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white m-0 truncate">
                {profile.shopName}
              </h1>
              <p className="text-slate-300 text-xs mt-1 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span>Owner: <b className="text-white">{profile.ownerName}</b></span>
                <span>•</span>
                <span className="text-amber-300 font-medium">★ {profile.rating.toFixed(1)}</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">{orders.length} orders</span>
              </p>
            </div>
          </div>

          {/* Center Balances */}
          <div className="hero-balances flex items-center justify-around sm:justify-start gap-3 sm:gap-4 bg-white/10 backdrop-blur-md px-4 sm:px-5 py-3 rounded-xl border border-white/15 w-full sm:w-auto">
            <div
              className="cursor-pointer transition-transform hover:scale-105"
              onClick={onOpenBalanceModal}
              title="Click to view full balance details"
            >
              <span className="text-[10px] tracking-wider uppercase text-cyan-200 block mb-0.5">
                AVAILABLE BALANCE
              </span>
              <strong className="text-xl sm:text-2xl font-black text-white block">
                ${profile.balance.toFixed(2)}
              </strong>
            </div>
            <div className="h-9 w-px bg-white/20" />
            <div>
              <span className="text-[10px] tracking-wider uppercase text-slate-300 block mb-0.5">
                GUARANTEE POOL
              </span>
              <strong className="text-xl sm:text-2xl font-black text-emerald-300 block">
                ${profile.guarantee.toFixed(2)}
              </strong>
            </div>
          </div>

          {/* Right Action Shortcuts */}
          <div className="hero-actions grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              className="hero-btn-primary justify-center text-center text-xs sm:text-sm py-2 sm:py-2.5"
              onClick={() => onNavigate('Products')}
            >
              <Plus size={16} /> Add Product
            </button>
            {onCreateDemoOrder && (
              <button
                type="button"
                className="hero-btn-secondary justify-center text-center text-xs sm:text-sm py-2 sm:py-2.5"
                onClick={onCreateDemoOrder}
                title="Create a live demo order to see real-time revenue increase"
              >
                <ShoppingCart size={16} /> Test Order
              </button>
            )}
            <button
              type="button"
              className="hero-btn-accent justify-center text-center text-xs sm:text-sm py-2 sm:py-2.5 col-span-2 sm:col-span-1"
              onClick={onOpenBalanceModal}
            >
              <ArrowUpRight size={16} /> Withdraw
            </button>
          </div>
        </div>
      </section>

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="kpi-card group hover:shadow-lg transition-all duration-200">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <CircleDollarSign size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-slate-900">
              ${totalRevenue.toFixed(2)}
            </strong>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-600">
            <TrendingUp size={14} />
            <span>+18.4%</span>
            <span className="text-slate-400 font-normal">vs last month</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="kpi-card group hover:shadow-lg transition-all duration-200">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Net Store Profit
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-slate-900">
              ${totalProfit > 0 ? totalProfit.toFixed(2) : (totalRevenue * 0.25).toFixed(2)}
            </strong>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-600">
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
              {profitMargin}% margin
            </span>
            <span className="text-slate-400 font-normal">Healthy ROI</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="kpi-card group hover:shadow-lg transition-all duration-200">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Orders
            </span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <ShoppingCart size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-slate-900">{orders.length}</strong>
            <span className="text-xs text-slate-500">all-time</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span className="text-emerald-600 font-semibold">{deliveredOrders} delivered</span>
            <span>•</span>
            <span className="text-amber-600 font-semibold">{pendingOrders} pending</span>
          </div>
        </div>

        {/* Avg. Order Value */}
        <div className="kpi-card group hover:shadow-lg transition-all duration-200">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Avg. Order Value
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Box size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-slate-900">${avgOrderValue}</strong>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <span className="text-slate-700 font-semibold">{totalProducts} active SKUs</span> in catalog
          </div>
        </div>
      </div>

      {/* Middle Grid: Sales Performance Interactive Chart & Monthly Target */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Performance Chart (2 cols) */}
        <div className="panel lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <TrendingUp size={18} />
                </span>
                <h2 className="text-lg font-bold text-slate-900 m-0">Revenue Analytics</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 m-0">
                Daily volume, transaction trends, and gross profit breakdown
              </p>
            </div>

            {/* Time Period Filter Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  chartPeriod === '7d' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                onClick={() => setChartPeriod('7d')}
              >
                7 Days
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  chartPeriod === '30d' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                onClick={() => setChartPeriod('30d')}
              >
                30 Days
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  chartPeriod === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                onClick={() => setChartPeriod('all')}
              >
                All Time
              </button>
            </div>
          </div>

          {/* Interactive SVG Bar & Trend Visualization */}
          <div className="chart-container relative h-56 w-full pt-4">
            <div className="flex items-end justify-between h-40 gap-2 px-2 border-b border-slate-100">
              {dailyData.map((d, index) => {
                const heightPercent = Math.max(15, Math.round((d.revenue / maxBarValue) * 100))
                const isHovered = hoveredBar === index
                return (
                  <div
                    key={d.day}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                    onMouseEnter={() => setHoveredBar(index)}
                    onMouseLeave={() => setHoveredBar(null)}
                    onTouchStart={() => setHoveredBar(hoveredBar === index ? null : index)}
                  >
                    {/* Hover Floating Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-12 z-20 bg-slate-900 text-white text-[11px] py-1 px-2.5 rounded-md shadow-lg whitespace-nowrap pointer-events-none animate-fadeIn">
                        <strong>${d.revenue.toFixed(2)}</strong>
                        <span className="text-slate-300 ml-1">({d.orders} orders)</span>
                      </div>
                    )}

                    {/* Bar Stack */}
                    <div
                      className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 relative ${
                        isHovered
                          ? 'bg-blue-600 shadow-md scale-y-105'
                          : 'bg-gradient-to-t from-blue-500 to-cyan-400 opacity-90'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    >
                      <div
                        className="w-full bg-emerald-400/80 rounded-t-sm absolute bottom-0"
                        style={{ height: `${Math.round((d.profit / d.revenue) * 100)}%` }}
                        title={`Profit: $${d.profit}`}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 mt-2">{d.day}</span>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Total Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-400 inline-block" /> Gross Margin
                </span>
              </div>
              <span className="font-semibold text-slate-700">Average: ${(totalRevenue / 7).toFixed(2)}/day</span>
            </div>
          </div>
        </div>

        {/* Monthly Target & Quick Store Stats (1 col) */}
        <div className="panel p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Monthly Goal
              </span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {goalPercent}%
              </span>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-baseline">
                <strong className="text-2xl font-bold text-slate-900">${currentMonthRevenue.toFixed(2)}</strong>
                <span className="text-xs text-slate-400">Target: ${monthlyGoal.toFixed(2)}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${goalPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 m-0">
                ${(monthlyGoal - currentMonthRevenue).toFixed(2)} remaining to hit your monthly milestone bonus.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Active Products:</span>
                <b className="text-slate-800">{activeProducts} of {totalProducts} items</b>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Store Rating:</span>
                <b className="text-amber-600">★ {profile.rating.toFixed(2)} (Top Rated)</b>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Available Payout:</span>
                <b className="text-emerald-600 font-bold">${profile.balance.toFixed(2)}</b>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="w-full mt-6 py-2.5 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all font-semibold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            onClick={onOpenBalanceModal}
          >
            <Wallet size={15} /> Request Payout Now
          </button>
        </div>
      </div>

      {/* Lower 2 Panels: Recent Orders Feed & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Live Orders Table (2 cols) */}
        <div className="panel lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                <ShoppingCart size={18} />
              </span>
              <h2 className="text-lg font-bold text-slate-900 m-0">Recent Store Orders</h2>
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
            <div className="py-10 text-center text-slate-400">
              <ShoppingCart size={36} className="mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-sm">No orders yet</p>
              <p className="text-xs">Click &quot;Test Order&quot; in the hero above to simulate an incoming customer order.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full text-left text-xs min-w-[520px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="pb-3 font-semibold">Order</th>
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Items</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 font-semibold">Profit</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {orders.slice(0, 4).map((order) => {
                    const statusBadge =
                      order.status === 'delivered'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : order.status === 'paid'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : order.status === 'pickup'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 font-bold text-slate-900">{order.orderNumber}</td>
                        <td className="py-3">
                          <div className="text-slate-900 font-semibold">{order.customerName}</div>
                          <div className="text-slate-400 text-[10px]">{order.date}</div>
                        </td>
                        <td className="py-3 text-slate-600 max-w-[140px] truncate">
                          {order.items[0]?.productTitle || 'Product items'}
                        </td>
                        <td className="py-3 font-bold text-slate-900">${Number(order.totalAmount).toFixed(2)}</td>
                        <td className="py-3 font-bold text-emerald-600">+${Number(order.profit).toFixed(2)}</td>
                        <td className="py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${statusBadge}`}>
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

        {/* Category Breakdown (1 col) */}
        <div className="panel p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Box size={18} />
              </span>
              <h2 className="text-lg font-bold text-slate-900 m-0">Top Categories</h2>
            </div>
            <span className="text-xs font-bold text-slate-500">{totalProducts} Items</span>
          </div>

          <ul className="space-y-3.5">
            {topCategories.map(([catName, count], idx) => {
              const percent = Math.round((count / (totalProducts || 1)) * 100)
              const color = dotColors[idx % dotColors.length]
              return (
                <li key={catName} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                      {catName}
                    </span>
                    <span className="font-bold text-slate-900">
                      {count} <span className="text-slate-400 font-normal">({percent}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${percent}%`, backgroundColor: color }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              className="w-full py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              onClick={() => onNavigate('Products')}
            >
              <span>Manage Entire Catalog</span> <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
