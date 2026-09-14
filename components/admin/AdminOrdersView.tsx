'use client'

import React, { useState, useMemo } from 'react'
import {
  ShoppingBag,
  Search,
  Calendar,
  CalendarClock,
  Plus,
  Copy,
  Check,
  Truck,
  Package,
  PackageCheck,
  Trash2,
  Printer,
  X,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Zap,
  DollarSign,
  ChevronRight,
  Store,
  UserCheck
} from 'lucide-react'
import { Product, Order, SellerProfile } from '@/lib/mock-data'

export interface AdminOrdersViewProps {
  orders: Order[]
  products: Product[]
  sellerProfile: SellerProfile
  onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void
  onDeleteOrder: (orderId: string) => void
  onCreateOrder: (newOrder: Order) => Promise<void> | void
  onToast: (message: string) => void
  onSwitchToSeller?: () => void
}

export function AdminOrdersView({
  orders,
  products,
  sellerProfile,
  onUpdateOrderStatus,
  onDeleteOrder,
  onCreateOrder,
  onToast,
  onSwitchToSeller,
}: AdminOrdersViewProps) {
  // Selection & Filter states
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null)
  const [sellerSearch, setSellerSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'pickup' | 'on_the_way' | 'delivered' | 'cancelled'>('all')
  const [copiedSeller, setCopiedSeller] = useState(false)

  // Modals
  const [isGiveOrderOpen, setIsGiveOrderOpen] = useState(false)
  const [isSchedulesOpen, setIsSchedulesOpen] = useState(false)
  const [inspectOrder, setInspectOrder] = useState<Order | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Give Order Form state
  const [giveSellerId, setGiveSellerId] = useState('tester')
  const [giveProductId, setGiveProductId] = useState(products[0]?.id || '')
  const [giveQuantity, setGiveQuantity] = useState(1)
  const [giveCustomerName, setGiveCustomerName] = useState('Michael Roberts')
  const [giveCustomerEmail, setGiveCustomerEmail] = useState('m.roberts@gmail.com')
  const [giveAddress, setGiveAddress] = useState('1428 Elm Street, Dallas, TX 75201')
  const [giveInitialStatus, setGiveInitialStatus] = useState<Order['status']>('paid')
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)

  // Schedules state
  const [schedules, setSchedules] = useState([
    {
      id: 'sch-1',
      title: 'Daily Organic Shopper Simulation',
      frequency: 'Every 6 hours',
      targetSeller: 'tester',
      status: 'active' as const,
      lastRun: 'Today, 02:15 AM',
    },
    {
      id: 'sch-2',
      title: 'High-Value Electronics Fulfillment Check',
      frequency: 'Every 24 hours',
      targetSeller: 'tester',
      status: 'active' as const,
      lastRun: 'Yesterday, 11:30 PM',
    },
    {
      id: 'sch-3',
      title: 'Weekend Flash Surge Pipeline',
      frequency: 'Weekends only',
      targetSeller: 'tester',
      status: 'paused' as const,
      lastRun: 'Last Saturday',
    },
  ])

  // Sellers List matching live profile data
  const sellersList = useMemo(() => {
    return [
      {
        id: 'tester',
        shopName: sellerProfile.shopName || 'tester',
        ownerName: sellerProfile.ownerName || 'Zain',
        email: sellerProfile.email || 'zain55@gmail.com',
        avatarLetter: (sellerProfile.shopName?.[0] || 'T').toUpperCase(),
        totalOrders: orders.length,
        pendingOrders: orders.filter((o) => ['unpaid', 'paid', 'pickup', 'on_the_way'].includes(o.status)).length,
        deliveredOrders: orders.filter((o) => o.status === 'delivered').length,
        balance: sellerProfile.balance,
      },
    ]
  }, [sellerProfile, orders])

  // Filtered sellers by search
  const filteredSellers = useMemo(() => {
    const q = sellerSearch.toLowerCase().trim()
    if (!q) return sellersList
    return sellersList.filter(
      (s) =>
        s.shopName.toLowerCase().includes(q) ||
        s.ownerName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    )
  }, [sellersList, sellerSearch])

  // Selected seller details
  const selectedSeller = useMemo(() => {
    if (!selectedSellerId) return null
    return sellersList.find((s) => s.id === selectedSellerId) || null
  }, [selectedSellerId, sellersList])

  // Filtered orders for selected seller
  const sellerOrders = useMemo(() => {
    if (!selectedSeller) return []
    if (orderStatusFilter === 'all') return orders
    if (orderStatusFilter === 'pending') {
      return orders.filter((o) => o.status === 'unpaid' || o.status === 'paid')
    }
    return orders.filter((o) => o.status === orderStatusFilter)
  }, [selectedSeller, orders, orderStatusFilter])

  // Status breakdown counts
  const statusCounts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === 'unpaid' || o.status === 'paid').length,
      pickup: orders.filter((o) => o.status === 'pickup').length,
      on_the_way: orders.filter((o) => o.status === 'on_the_way').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    }
  }, [orders])

  // Copy seller ID / store info
  const handleCopySeller = (e: React.MouseEvent, text: string) => {
    e.stopPropagation()
    navigator.clipboard?.writeText(text)
    setCopiedSeller(true)
    onToast(`Copied "${text}" to clipboard!`)
    setTimeout(() => setCopiedSeller(false), 2000)
  }

  // Handle Dispatching a Give Order
  const handleDispatchOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingOrder(true)

    try {
      const selectedProd = products.find((p) => p.id === giveProductId) || products[0]
      const unitSell = selectedProd ? Number(selectedProd.sell) : 59.95
      const unitProfit = selectedProd ? Number(selectedProd.profit) : 15.0
      const totalAmount = Number((unitSell * giveQuantity).toFixed(2))
      const totalProfit = Number((unitProfit * giveQuantity).toFixed(2))

      const orderNumber = '#ORD-' + Math.floor(10000 + Math.random() * 90000)
      const newOrder: Order = {
        id: 'ord-' + Date.now(),
        orderNumber,
        customerName: giveCustomerName.trim() || 'Valued Customer',
        customerEmail: giveCustomerEmail.trim() || 'customer@example.com',
        shippingAddress: giveAddress.trim() || '452 Pine Street, Seattle, WA',
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        status: giveInitialStatus,
        totalAmount,
        profit: totalProfit,
        items: [
          {
            productTitle: selectedProd ? selectedProd.title : 'Premium Store Product',
            quantity: giveQuantity,
            price: unitSell,
            image: selectedProd?.image || '/products/omega_seamaster_chronograph.jpg',
          },
        ],
      }

      await onCreateOrder(newOrder)
      setIsGiveOrderOpen(false)
      setSelectedSellerId('tester') // Auto select seller to view new order
      onToast(`Order ${orderNumber} dispatched to ${sellerProfile.shopName}! (+$${totalProfit.toFixed(2)} profit)`)
    } catch {
      onToast('Failed to dispatch order. Please try again.')
    } finally {
      setIsSubmittingOrder(false)
    }
  }

  // Quick Preset Orders
  const applyPreset = (preset: 'watch' | 'laptop' | 'casual') => {
    if (preset === 'watch') {
      const watch = products.find((p) => p.category === 'Fashion') || products[0]
      if (watch) setGiveProductId(watch.id)
      setGiveQuantity(1)
      setGiveCustomerName('Alexander Wright')
      setGiveCustomerEmail('a.wright@manhattan.com')
      setGiveAddress('750 Park Avenue, Apt 14B, New York, NY 10021')
      setGiveInitialStatus('paid')
    } else if (preset === 'laptop') {
      const laptop = products.find((p) => p.category === 'Laptops') || products[0]
      if (laptop) setGiveProductId(laptop.id)
      setGiveQuantity(1)
      setGiveCustomerName('Elena Rostova')
      setGiveCustomerEmail('elena.rostova@techcorp.io')
      setGiveAddress('100 Silicon Valley Way, Palo Alto, CA 94301')
      setGiveInitialStatus('pickup')
    } else {
      const casual = products[0]
      if (casual) setGiveProductId(casual.id)
      setGiveQuantity(2)
      setGiveCustomerName('David Miller')
      setGiveCustomerEmail('david.m@gmail.com')
      setGiveAddress('320 Magnolia Blvd, Austin, TX 78701')
      setGiveInitialStatus('paid')
    }
  }

  // Toggle Schedule
  const toggleSchedule = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: s.status === 'active' ? 'paused' : 'active' } : s))
    )
    onToast('Schedule state updated successfully')
  }

  // Run Schedule Test
  const handleRunScheduleNow = (scheduleTitle: string) => {
    const randomProd = products[Math.floor(Math.random() * products.length)] || products[0]
    const unitSell = randomProd ? Number(randomProd.sell) : 89.95
    const unitProfit = randomProd ? Number(randomProd.profit) : 22.5
    const orderNumber = '#ORD-' + Math.floor(10000 + Math.random() * 90000)

    const scheduledOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber,
      customerName: 'Scheduled Shopper (Auto)',
      customerEmail: 'auto.shopper@pipeline.com',
      shippingAddress: '900 Automated Blvd, Chicago, IL 60601',
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'paid',
      totalAmount: unitSell,
      profit: unitProfit,
      items: [
        {
          productTitle: randomProd?.title || 'Catalog Product',
          quantity: 1,
          price: unitSell,
          image: randomProd?.image || '',
        },
      ],
    }

    onCreateOrder(scheduledOrder)
    setSelectedSellerId('tester')
    onToast(`Triggered "${scheduleTitle}": Order ${orderNumber} created!`)
  }

  return (
    <div className="admin-orders-container space-y-6">
      {/* 1. Header matching user reference screenshot */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Orders Title with Blue Accent Bar */}
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-10 bg-blue-600 rounded-full shrink-0" />
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShoppingBag size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight m-0">Orders</h1>
            <p className="text-xs text-slate-500 mt-0.5 m-0">
              Update seller orders through pickup, delivering, and completed.
            </p>
          </div>
        </div>

        {/* Middle & Right: Search, Schedules & Give Order Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Sellers Input */}
          <div className="relative min-w-[240px] sm:w-64">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search sellers..."
              value={sellerSearch}
              onChange={(e) => setSellerSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all text-slate-800 placeholder:text-slate-400 font-medium"
            />
            {sellerSearch && (
              <button
                type="button"
                onClick={() => setSellerSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Schedules Button */}
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
            onClick={() => setIsSchedulesOpen(true)}
            title="View and configure automated order dispatch schedules"
          >
            <CalendarClock size={15} className="text-slate-600" />
            <span>Schedules</span>
          </button>

          {/* Give Order Button */}
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#5443ED] hover:bg-[#4332D6] text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
            onClick={() => {
              if (!selectedSellerId) setSelectedSellerId('tester')
              setIsGiveOrderOpen(true)
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Give Order</span>
          </button>
        </div>
      </div>

      {/* 2. Main 2-Column Orders Interface matching screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Sellers List (4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
            Active Merchants ({filteredSellers.length})
          </div>

          {filteredSellers.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-400 shadow-xs">
              <Search size={28} className="mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-xs">No sellers found</p>
              <p className="text-[11px] mt-1 text-slate-400">Clear your search to see all sellers.</p>
            </div>
          ) : (
            filteredSellers.map((seller) => {
              const isSelected = selectedSellerId === seller.id
              return (
                <div
                  key={seller.id}
                  onClick={() => setSelectedSellerId(seller.id)}
                  className={`relative p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                    isSelected
                      ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/15 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Seller Identity */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full bg-[#00bf87] text-white flex items-center justify-center font-bold text-base shadow-xs">
                          {seller.avatarLetter}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white" />
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 leading-tight truncate">
                          {seller.shopName}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <span className="truncate">{seller.ownerName}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopySeller(e, seller.id)}
                            className="text-slate-400 hover:text-slate-700 transition-colors p-0.5"
                            title="Copy seller ID"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 3 Pills matching screenshot: TOTAL, PENDING, DELIVERED */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold"
                        title="Total Orders"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>TOTAL</span>
                        <span className="font-extrabold">{seller.totalOrders}</span>
                      </span>

                      <span
                        className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/60 px-2 py-0.5 rounded-full text-[10px] font-bold"
                        title="Pending Orders"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>PENDING</span>
                        <span className="font-extrabold">{seller.pendingOrders}</span>
                      </span>

                      <span
                        className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full text-[10px] font-bold"
                        title="Delivered Orders"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>DELIVERED</span>
                        <span className="font-extrabold">{seller.deliveredOrders}</span>
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Right Column: Orders View (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8">
          {!selectedSeller ? (
            /* Empty State: Matching screenshot "No seller selected" */
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[420px] shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={28} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 m-0">No seller selected</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
                Pick a seller from the list to see their active orders and update pickup, delivering, and completion status from here.
              </p>
              <button
                type="button"
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                onClick={() => setSelectedSellerId('tester')}
              >
                <span>Select &quot;{sellerProfile.shopName}&quot;</span>
                <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            /* Selected Seller Workspace with full status transition controls */
            <div className="space-y-4">
              {/* Selected Seller Header Bar */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#00bf87] text-white flex items-center justify-center font-bold text-lg shadow-xs">
                    {selectedSeller.avatarLetter}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900 leading-tight m-0">
                        {selectedSeller.shopName}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        VERIFIED SELLER
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 m-0">
                      Owner: <b className="text-slate-700">{selectedSeller.ownerName}</b> · Balance: <b className="text-emerald-600">${selectedSeller.balance.toFixed(2)}</b>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {onSwitchToSeller && (
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      onClick={onSwitchToSeller}
                      title="Preview this seller's console"
                    >
                      <Store size={14} /> <span>Storefront</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-[#5443ED] hover:bg-[#4332D6] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    onClick={() => setIsGiveOrderOpen(true)}
                  >
                    <Plus size={14} /> <span>Give Order</span>
                  </button>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto">
                {[
                  { id: 'all', label: 'All Orders', count: statusCounts.all },
                  { id: 'pending', label: 'Pending / Paid', count: statusCounts.pending },
                  { id: 'pickup', label: 'Pickup Ready', count: statusCounts.pickup },
                  { id: 'on_the_way', label: 'Delivering', count: statusCounts.on_the_way },
                  { id: 'delivered', label: 'Completed', count: statusCounts.delivered },
                  { id: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled },
                ].map((tab) => {
                  const isActive = orderStatusFilter === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#EEF2FF] text-indigo-700 font-bold shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      onClick={() => setOrderStatusFilter(tab.id as any)}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                          isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Orders List */}
              {sellerOrders.length === 0 ? (
                <div className="bg-white border border-slate-200/80 rounded-3xl p-10 text-center shadow-xs">
                  <Package size={36} className="mx-auto mb-2 text-slate-300" />
                  <h3 className="font-bold text-sm text-slate-800">No orders in this status</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    There are no orders matching this filter for {selectedSeller.shopName}. Use the button below to dispatch a new order.
                  </p>
                  <button
                    type="button"
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5443ED] text-white text-xs font-bold shadow-xs hover:bg-[#4332D6] transition-colors cursor-pointer"
                    onClick={() => setIsGiveOrderOpen(true)}
                  >
                    <Plus size={14} />
                    <span>Give Order to {selectedSeller.shopName}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {sellerOrders.map((order) => {
                    const isUnpaidOrPaid = order.status === 'unpaid' || order.status === 'paid'
                    const isPickup = order.status === 'pickup'
                    const isDelivering = order.status === 'on_the_way'
                    const isDelivered = order.status === 'delivered'
                    const isCancelled = order.status === 'cancelled'

                    return (
                      <div
                        key={order.id}
                        className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
                      >
                        {/* Order Top Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                              {order.orderNumber}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock size={12} /> {order.date}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${
                                isDelivered
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : isDelivering
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : isPickup
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : isCancelled
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {isDelivered && <PackageCheck size={12} />}
                              {isDelivering && <Truck size={12} />}
                              {isPickup && <Package size={12} />}
                              {isCancelled && <AlertCircle size={12} />}
                              {isUnpaidOrPaid && <Clock size={12} />}
                              <span>{order.status.replace(/_/g, ' ')}</span>
                            </span>
                          </div>
                        </div>

                        {/* Customer & Item Details */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          {/* Item Thumbnail & Name (7 cols) */}
                          <div className="md:col-span-7 flex items-start gap-3">
                            <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {order.items[0]?.image ? (
                                <img
                                  src={order.items[0].image}
                                  alt={order.items[0].productTitle}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package size={22} className="text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate leading-snug" title={order.items[0]?.productTitle}>
                                {order.items[0]?.productTitle || 'Store item'}
                              </h4>
                              <div className="text-xs text-slate-500 mt-0.5">
                                Qty: <b className="text-slate-800">{order.items[0]?.quantity || 1}</b> · Unit Price: <b className="text-slate-800">${Number(order.items[0]?.price || 0).toFixed(2)}</b>
                              </div>
                              <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                                Seller Net Profit: +${Number(order.profit).toFixed(2)}
                              </div>
                            </div>
                          </div>

                          {/* Customer & Address (5 cols) */}
                          <div className="md:col-span-5 bg-slate-50/80 rounded-xl p-3 text-xs border border-slate-100 flex flex-col justify-between">
                            <div>
                              <div className="font-semibold text-slate-800 truncate">
                                {order.customerName}
                              </div>
                              <div className="text-slate-400 text-[11px] truncate">
                                {order.customerEmail}
                              </div>
                              <div className="text-slate-500 text-[11px] mt-1 line-clamp-1" title={order.shippingAddress}>
                                📍 {order.shippingAddress}
                              </div>
                            </div>
                            <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between font-bold text-slate-900">
                              <span>Order Total:</span>
                              <span className="text-sm font-black tabular-nums">${Number(order.totalAmount).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Order Actions Toolbar (Fulfillment Flow: Pickup -> Delivering -> Completed) */}
                        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                          {/* Workflow Status Advances */}
                          <div className="flex flex-wrap items-center gap-2">
                            {isUnpaidOrPaid && (
                              <button
                                type="button"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                                onClick={() => onUpdateOrderStatus(order.id, 'pickup')}
                              >
                                <Package size={13} />
                                <span>Mark as Picked Up</span>
                              </button>
                            )}

                            {isPickup && (
                              <button
                                type="button"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                                onClick={() => onUpdateOrderStatus(order.id, 'on_the_way')}
                              >
                                <Truck size={13} />
                                <span>Dispatch for Delivery</span>
                              </button>
                            )}

                            {isDelivering && (
                              <button
                                type="button"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                                onClick={() => onUpdateOrderStatus(order.id, 'delivered')}
                              >
                                <PackageCheck size={13} />
                                <span>Mark as Delivered & Completed</span>
                              </button>
                            )}

                            {isDelivered && (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                <Check size={13} /> Completed & Settled
                              </span>
                            )}

                            {!isCancelled && !isDelivered && (
                              <button
                                type="button"
                                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
                                onClick={() => onUpdateOrderStatus(order.id, 'cancelled')}
                                title="Cancel order and reverse attached profit"
                              >
                                Cancel
                              </button>
                            )}
                          </div>

                          {/* Secondary Utilities */}
                          <div className="flex items-center gap-1.5 ml-auto">
                            <button
                              type="button"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                              onClick={() => setInspectOrder(order)}
                              title="Inspect Order Manifest / Receipt"
                            >
                              <Printer size={14} />
                            </button>

                            <button
                              type="button"
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                              onClick={() => setDeleteConfirmId(order.id)}
                              title="Delete false test order from database"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Give Order Modal */}
      {isGiveOrderOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#5443ED]/10 text-[#5443ED] flex items-center justify-center font-bold">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 m-0">Give Order to Seller</h3>
                  <p className="text-xs text-slate-500 m-0 mt-0.5">Dispatch simulated real-time orders to active sellers</p>
                </div>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                onClick={() => setIsGiveOrderOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Order Presets Strip */}
            <div className="p-4 bg-indigo-50/40 border-b border-indigo-100/60">
              <div className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-500" /> One-Click Presets
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('watch')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-50 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                >
                  Luxury Watch ($5,320)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('laptop')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-50 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                >
                  MacBook M3 ($8,230)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('casual')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-50 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                >
                  Standard Retail Order
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleDispatchOrder} className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* Target Merchant */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Target Merchant
                </label>
                <select
                  value={giveSellerId}
                  onChange={(e) => setGiveSellerId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-800 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="tester">{sellerProfile.shopName} (Owner: {sellerProfile.ownerName})</option>
                </select>
              </div>

              {/* Product Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Catalog Product
                </label>
                <select
                  value={giveProductId}
                  onChange={(e) => setGiveProductId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-800 focus:outline-hidden focus:border-indigo-500 truncate"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title.slice(0, 45)}... · ${p.sell.toFixed(2)} (Profit: +${p.profit.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity & Initial Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Quantity
                  </label>
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs"
                      onClick={() => setGiveQuantity(Math.max(1, giveQuantity - 1))}
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-bold text-xs text-slate-900 tabular-nums">
                      {giveQuantity}
                    </span>
                    <button
                      type="button"
                      className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs"
                      onClick={() => setGiveQuantity(giveQuantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Initial Status
                  </label>
                  <select
                    value={giveInitialStatus}
                    onChange={(e) => setGiveInitialStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="paid">Paid (Awaiting Pickup)</option>
                    <option value="pickup">Pickup Ready</option>
                    <option value="on_the_way">Delivering</option>
                  </select>
                </div>
              </div>

              {/* Customer Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={giveCustomerName}
                    onChange={(e) => setGiveCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Customer Email
                  </label>
                  <input
                    type="email"
                    required
                    value={giveCustomerEmail}
                    onChange={(e) => setGiveCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Shipping Address
                </label>
                <input
                  type="text"
                  required
                  value={giveAddress}
                  onChange={(e) => setGiveAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                  onClick={() => setIsGiveOrderOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="px-5 py-2 rounded-xl bg-[#5443ED] hover:bg-[#4332D6] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>{isSubmittingOrder ? 'Dispatching…' : 'Dispatch Order Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Schedules Modal */}
      {isSchedulesOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <CalendarClock size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 m-0">Automated Order Schedules</h3>
                  <p className="text-xs text-slate-500 m-0 mt-0.5">Recurring pipelines that auto-dispatch simulated purchases</p>
                </div>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                onClick={() => setIsSchedulesOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3.5 max-h-[60vh] overflow-y-auto">
              {schedules.map((sch) => (
                <div
                  key={sch.id}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 space-y-3 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                        {sch.title}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>Frequency: <b className="text-slate-600">{sch.frequency}</b></span>
                        <span>·</span>
                        <span>Last: <b className="text-slate-600">{sch.lastRun}</b></span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        sch.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {sch.status}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleSchedule(sch.id)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      {sch.status === 'active' ? 'Pause Pipeline' : 'Resume Pipeline'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRunScheduleNow(sch.title)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      <Zap size={12} />
                      <span>Trigger Now</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Auto-scheduler active</span>
              <button
                type="button"
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                onClick={() => setIsSchedulesOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Order Receipt / Manifest Inspection Modal */}
      {inspectOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900 m-0">Order Receipt</h3>
              </div>
              <button
                type="button"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                onClick={() => setInspectOrder(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Order Number:</span>
                <span className="font-bold text-slate-900">{inspectOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Date:</span>
                <span className="font-medium text-slate-700">{inspectOrder.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-900">{inspectOrder.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-700">{inspectOrder.customerEmail}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Shipping To:</span>
                <span className="text-slate-700 text-right max-w-[200px] truncate">{inspectOrder.shippingAddress}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold uppercase text-indigo-600">{inspectOrder.status}</span>
              </div>
              <div className="flex justify-between py-1.5 font-bold text-sm text-slate-900">
                <span>Total Amount:</span>
                <span>${Number(inspectOrder.totalAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-emerald-600 font-bold">
                <span>Seller Profit:</span>
                <span>+${Number(inspectOrder.profit).toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                className="flex-1 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                onClick={() => {
                  window.print?.()
                  onToast('Printing order receipt...')
                }}
              >
                Print Receipt
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                onClick={() => setInspectOrder(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertCircle size={20} />
              <h3 className="font-bold text-base text-slate-900 m-0">Permanently Delete Order?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed m-0">
              This will remove this order from the database and adjust the seller account balance accordingly. This action cannot be undone.
            </p>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                onClick={() => {
                  onDeleteOrder(deleteConfirmId)
                  setDeleteConfirmId(null)
                }}
              >
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
