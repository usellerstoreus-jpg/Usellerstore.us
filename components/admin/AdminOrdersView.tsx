'use client'

import React, { useState, useMemo } from 'react'
import {
  ShoppingBag,
  Search,
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
  ChevronRight,
  ArrowLeft,
  Store,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react'
import { Product, Order, SellerProfile, shopCategories } from '@/lib/mock-data'

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

interface SelectedItem {
  product: Product
  quantity: number
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
  // Orders View & Selection state
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null)
  const [sellerSearch, setSellerSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'pickup' | 'on_the_way' | 'delivered' | 'cancelled'>('all')
  const [copiedSeller, setCopiedSeller] = useState(false)

  // Secondary Modals
  const [isSchedulesOpen, setIsSchedulesOpen] = useState(false)
  const [inspectOrder, setInspectOrder] = useState<Order | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // -------------------------------------------------------------
  // GIVE ORDER FLOW STATE (Matching Screenshots 1, 2, 3)
  // -------------------------------------------------------------
  const [isGiveOrderActive, setIsGiveOrderActive] = useState(false)
  const [giveStep, setGiveStep] = useState<1 | 2 | 3 | 4>(2)
  const [targetSellerId, setTargetSellerId] = useState('tester')

  // Step 2: Selected Products & Filter
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  // Step 4: Customer Details
  const [fullName, setFullName] = useState('Alexander Wright')
  const [phone, setPhone] = useState('+1 (555) 749-1823')
  const [address1, setAddress1] = useState('750 Park Avenue, Apt 14B')
  const [address2, setAddress2] = useState('Apt 14B')
  const [city, setCity] = useState('New York')
  const [stateName, setStateName] = useState('NY')
  const [postalCode, setPostalCode] = useState('10021')
  const [country, setCountry] = useState('United States')
  const [creationTiming, setCreationTiming] = useState<'instant' | 'scheduled'>('instant')
  const [isSubmitting, setIsSubmitting] = useState(false)

  interface ScheduleItem {
    id: string
    title: string
    frequency: string
    targetSeller: string
    status: 'active' | 'paused'
    lastRun: string
  }

  // Schedules state
  const [schedules, setSchedules] = useState<ScheduleItem[]>([
    {
      id: 'sch-1',
      title: 'Daily Organic Shopper Simulation',
      frequency: 'Every 6 hours',
      targetSeller: 'tester',
      status: 'active',
      lastRun: 'Today, 02:15 AM',
    },
    {
      id: 'sch-2',
      title: 'High-Value Electronics Fulfillment Check',
      frequency: 'Every 24 hours',
      targetSeller: 'tester',
      status: 'active',
      lastRun: 'Yesterday, 11:30 PM',
    },
  ])

  // Random USA Customer Preset Pool
  const randomUSAPresets = [
    {
      name: 'Alexander Wright',
      phone: '+1 (555) 749-1823',
      address1: '750 Park Avenue',
      address2: 'Apt 14B',
      city: 'New York',
      state: 'NY',
      zip: '10021',
    },
    {
      name: 'Sarah Jenkins',
      phone: '+1 (555) 382-9102',
      address1: '742 Evergreen Terrace',
      address2: '',
      city: 'Springfield',
      state: 'OR',
      zip: '97477',
    },
    {
      name: 'Emily Davis',
      phone: '+1 (555) 921-4820',
      address1: '452 Broadway Ave',
      address2: 'Suite 4B',
      city: 'San Francisco',
      state: 'CA',
      zip: '94107',
    },
    {
      name: 'Michael Roberts',
      phone: '+1 (555) 431-8976',
      address1: '1428 Elm Street',
      address2: 'Unit 204',
      city: 'Dallas',
      state: 'TX',
      zip: '75201',
    },
    {
      name: 'David Miller',
      phone: '+1 (555) 672-3341',
      address1: '320 Ocean Drive',
      address2: '',
      city: 'Miami',
      state: 'FL',
      zip: '33139',
    },
    {
      name: 'Jessica Vance',
      phone: '+1 (555) 219-5483',
      address1: '100 Silicon Valley Way',
      address2: 'Bldg 3',
      city: 'Palo Alto',
      state: 'CA',
      zip: '94301',
    },
  ]

  const handleApplyRandomUSA = () => {
    const random = randomUSAPresets[Math.floor(Math.random() * randomUSAPresets.length)]
    setFullName(random.name)
    setPhone(random.phone)
    setAddress1(random.address1)
    setAddress2(random.address2)
    setCity(random.city)
    setStateName(random.state)
    setPostalCode(random.zip)
    setCountry('United States')
    onToast(`Applied Random USA Customer (${random.name})!`)
  }

  // Sellers List matching live profile
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

  const selectedSeller = useMemo(() => {
    if (!selectedSellerId) return null
    return sellersList.find((s) => s.id === selectedSellerId) || null
  }, [selectedSellerId, sellersList])

  const sellerOrders = useMemo(() => {
    if (!selectedSeller) return []
    if (orderStatusFilter === 'all') return orders
    if (orderStatusFilter === 'pending') {
      return orders.filter((o) => o.status === 'unpaid' || o.status === 'paid')
    }
    return orders.filter((o) => o.status === orderStatusFilter)
  }, [selectedSeller, orders, orderStatusFilter])

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

  // Filtered Products for Step 2
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !productSearch.trim() ||
        p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(productSearch.toLowerCase())
      const matchCategory =
        selectedCategory === 'All' ||
        p.category.toLowerCase() === selectedCategory.toLowerCase()
      return matchSearch && matchCategory
    })
  }, [products, productSearch, selectedCategory])

  // Step 2 Selection Toggle
  const handleToggleProduct = (product: Product) => {
    setSelectedItems((prev) => {
      const exists = prev.find((item) => item.product.id === product.id)
      if (exists) {
        return prev.filter((item) => item.product.id !== product.id)
      } else {
        return [...prev, { product, quantity: 1 }]
      }
    })
  }

  // Step 3 Quantity Adjustments
  const handleQuantityChange = (productId: string, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter(Boolean) as SelectedItem[]
    )
  }

  const handleRemoveItem = (productId: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.product.id !== productId))
  }

  // Calculated Order Totals for Step 3 & 4
  const calculatedTotals = useMemo(() => {
    let revenue = 0
    let profit = 0
    selectedItems.forEach((item) => {
      revenue += Number(item.product.sell) * item.quantity
      profit += Number(item.product.profit) * item.quantity
    })
    return {
      revenue: Number(revenue.toFixed(2)),
      profit: Number(profit.toFixed(2)),
    }
  }, [selectedItems])

  // Final Order Creation from Step 4
  const handleFinalCreateOrder = async () => {
    if (selectedItems.length === 0) {
      onToast('Please select at least one product')
      setGiveStep(2)
      return
    }
    if (!fullName.trim()) {
      onToast('Please enter customer full name')
      return
    }

    setIsSubmitting(true)
    try {
      const orderNumber = '#ORD-' + Math.floor(10000 + Math.random() * 90000)
      const fullShipping = `${address1}${address2 ? ', ' + address2 : ''}, ${city}, ${stateName} ${postalCode}, ${country}`

      const newOrder: Order = {
        id: 'ord-' + Date.now(),
        orderNumber,
        customerName: fullName.trim(),
        customerEmail: `${fullName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        shippingAddress: fullShipping,
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        status: creationTiming === 'instant' ? 'paid' : 'unpaid',
        totalAmount: calculatedTotals.revenue,
        profit: calculatedTotals.profit,
        items: selectedItems.map((item) => ({
          productTitle: item.product.title,
          quantity: item.quantity,
          price: Number(item.product.sell),
          image: item.product.image,
        })),
      }

      await onCreateOrder(newOrder)
      setIsGiveOrderActive(false)
      setSelectedSellerId('tester')
      onToast(`Order ${orderNumber} created for ${sellerProfile.shopName}! (+$${calculatedTotals.profit.toFixed(2)} profit)`)
      // Reset selection
      setSelectedItems([])
    } catch {
      onToast('Error creating order')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Copy seller ID
  const handleCopySeller = (e: React.MouseEvent, text: string) => {
    e.stopPropagation()
    navigator.clipboard?.writeText(text)
    setCopiedSeller(true)
    onToast(`Copied "${text}" to clipboard!`)
    setTimeout(() => setCopiedSeller(false), 2000)
  }

  return (
    <div className="admin-orders-container space-y-6">
      {/* 1. Header Bar matching screenshot */}
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

        {/* Right Tools: Schedules & Give Order Trigger */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
            onClick={() => setIsSchedulesOpen(true)}
          >
            <CalendarClock size={15} className="text-slate-600" />
            <span>Schedules</span>
          </button>

          <button
            type="button"
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 ${
              isGiveOrderActive
                ? 'bg-[#5443ED] hover:bg-[#4332D6]'
                : 'bg-[#5443ED] hover:bg-[#4332D6]'
            }`}
            onClick={() => {
              if (isGiveOrderActive) {
                setIsGiveOrderActive(false)
              } else {
                setIsGiveOrderActive(true)
                setGiveStep(2) // Default to step 2 products if seller is tester
                if (selectedItems.length === 0 && products[0]) {
                  setSelectedItems([{ product: products[0], quantity: 1 }])
                }
              }
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>{isGiveOrderActive ? 'Viewing Give Order' : 'Give Order'}</span>
          </button>
        </div>
      </div>

      {/* 2. CONDITIONAL VIEW: Give Order Multi-Step Flow OR Normal Orders Screen */}
      {isGiveOrderActive ? (
        /* ------------------------------------------------------------- */
        /* MULTI-STEP GIVE ORDER WIZARD MATCHING SCREENSHOTS 1, 2, 3    */
        /* ------------------------------------------------------------- */
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
          {/* Wizard Header Bar: Back Button & Stepper Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
              onClick={() => {
                if (giveStep === 4) setGiveStep(3)
                else if (giveStep === 3) setGiveStep(2)
                else if (giveStep === 2) setIsGiveOrderActive(false)
                else setIsGiveOrderActive(false)
              }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            {/* Stepper Wizard in Center matching screenshots */}
            <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 sm:pb-0">
              {/* Step 1: Seller */}
              <button
                type="button"
                onClick={() => setGiveStep(1)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  giveStep > 1
                    ? 'bg-[#5443ED] text-white'
                    : giveStep === 1
                    ? 'bg-[#5443ED] text-white ring-2 ring-indigo-500/20'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {giveStep > 1 ? <Check size={13} strokeWidth={3} /> : <span className="w-4 h-4 rounded-full bg-white/20 grid place-items-center text-[10px]">1</span>}
                <span>Seller</span>
              </button>

              <span className="w-5 sm:w-8 h-0.5 bg-slate-200 shrink-0" />

              {/* Step 2: Products */}
              <button
                type="button"
                onClick={() => setGiveStep(2)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  giveStep > 2
                    ? 'bg-[#5443ED] text-white'
                    : giveStep === 2
                    ? 'bg-[#5443ED] text-white ring-2 ring-indigo-500/20'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {giveStep > 2 ? <Check size={13} strokeWidth={3} /> : <span className="w-4 h-4 rounded-full bg-white/20 grid place-items-center text-[10px]">2</span>}
                <span>Products</span>
              </button>

              <span className="w-5 sm:w-8 h-0.5 bg-slate-200 shrink-0" />

              {/* Step 3: Review */}
              <button
                type="button"
                onClick={() => {
                  if (selectedItems.length > 0) setGiveStep(3)
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  giveStep > 3
                    ? 'bg-[#5443ED] text-white'
                    : giveStep === 3
                    ? 'bg-[#5443ED] text-white ring-2 ring-indigo-500/20'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {giveStep > 3 ? <Check size={13} strokeWidth={3} /> : <span className="w-4 h-4 rounded-full bg-white/20 grid place-items-center text-[10px]">3</span>}
                <span>Review</span>
              </button>

              <span className="w-5 sm:w-8 h-0.5 bg-slate-200 shrink-0" />

              {/* Step 4: Customer */}
              <button
                type="button"
                onClick={() => {
                  if (selectedItems.length > 0) setGiveStep(4)
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  giveStep === 4
                    ? 'bg-[#5443ED] text-white ring-2 ring-indigo-500/20'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white/20 grid place-items-center text-[10px]">4</span>
                <span>Customer</span>
              </button>
            </div>

            <div className="hidden sm:block w-16" />
          </div>

          {/* STEP 1: SELECT SELLER */}
          {giveStep === 1 && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500">
                Choose the target seller who will receive this order and profit credit.
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {sellersList.map((seller) => (
                  <div
                    key={seller.id}
                    onClick={() => {
                      setTargetSellerId(seller.id)
                      setGiveStep(2)
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      targetSellerId === seller.id
                        ? 'border-indigo-600 bg-indigo-50/20 ring-2 ring-indigo-500/15'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#00bf87] text-white font-bold flex items-center justify-center">
                        {seller.avatarLetter}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">{seller.shopName}</div>
                        <div className="text-xs text-slate-400">Owner: {seller.ownerName}</div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: SELECT PRODUCTS (MATCHING SCREENSHOT 2) */}
          {giveStep === 2 && (
            <div className="space-y-5">
              {/* Search & Category Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-indigo-500 focus:outline-hidden text-slate-800"
                  />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => setProductSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Category Dropdown */}
                <div className="relative min-w-[200px]">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-800 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="All">All categories ({products.length})</option>
                    {shopCategories.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tap product to select header */}
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                TAP A PRODUCT TO SELECT ({selectedItems.length} SELECTED) · SHOWING {filteredProducts.length} OF {products.length}
              </div>

              {/* Product Cards Grid matching Screenshot 2 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 max-h-[58vh] overflow-y-auto pr-1">
                {filteredProducts.map((p) => {
                  const isSelected = selectedItems.some((item) => item.product.id === p.id)
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleToggleProduct(p)}
                      className={`relative rounded-2xl border transition-all cursor-pointer overflow-hidden flex flex-col justify-between bg-white shadow-xs hover:shadow-sm ${
                        isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/10'
                          : 'border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      {/* Selection Checkmark Badge */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-[#5443ED] text-white flex items-center justify-center shadow-xs">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}

                      {/* Product Image */}
                      <div className="h-36 sm:h-40 w-full bg-slate-100 overflow-hidden relative">
                        {p.image ? (
                          <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-slate-300">
                            <Package size={28} />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-2.5 flex flex-col flex-1 justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-tight" title={p.title}>
                            {p.title}
                          </h4>
                          <div className="text-[11px] text-blue-600 font-medium mt-1 truncate">
                            {p.category}
                          </div>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-slate-100 text-xs">
                          <div className="font-bold text-slate-900">
                            Unit: ${Number(p.sell).toFixed(2)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Cost: ${Number(p.cost).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Bottom Action Bar */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {selectedItems.length} product(s) selected
                </span>
                <button
                  type="button"
                  disabled={selectedItems.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-[#7C69EF] hover:bg-[#6854E4] text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setGiveStep(3)}
                >
                  Next: Review items
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW ITEMS (MATCHING SCREENSHOT 3) */}
          {giveStep === 3 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  ORDER ITEMS ({selectedItems.length})
                </span>
                <button
                  type="button"
                  className="text-xs text-slate-400 hover:text-slate-700 font-semibold cursor-pointer"
                  onClick={() => setSelectedItems([])}
                >
                  Clear all
                </button>
              </div>

              {selectedItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Package size={36} className="mx-auto mb-2 opacity-50" />
                  <p className="font-bold text-sm text-slate-700">No items in order</p>
                  <button
                    type="button"
                    className="mt-3 px-4 py-1.5 rounded-xl bg-[#5443ED] text-white text-xs font-bold cursor-pointer"
                    onClick={() => setGiveStep(2)}
                  >
                    Go to Products
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {selectedItems.map((item) => {
                    const itemRevenue = Number(item.product.sell) * item.quantity
                    const itemProfit = Number(item.product.profit) * item.quantity
                    return (
                      <div
                        key={item.product.id}
                        className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                            {item.product.image ? (
                              <img src={item.product.image} alt={item.product.title} className="w-full h-full object-cover" />
                            ) : (
                              <Package size={20} className="text-slate-300 m-auto mt-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 truncate max-w-md" title={item.product.title}>
                              {item.product.title}
                            </h4>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {item.quantity} × ${Number(item.product.sell).toFixed(2)} = <b className="text-slate-900">${itemRevenue.toFixed(2)}</b>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Cost: ${Number(item.product.cost).toFixed(2)}
                            </div>

                            {/* Quantity Stepper */}
                            <div className="flex items-center gap-1.5 mt-2">
                              <button
                                type="button"
                                className="w-6 h-6 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs grid place-items-center cursor-pointer"
                                onClick={() => handleQuantityChange(item.product.id, -1)}
                              >
                                -
                              </button>
                              <span className="font-bold text-xs text-slate-900 px-2 tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                className="w-6 h-6 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs grid place-items-center cursor-pointer"
                                onClick={() => handleQuantityChange(item.product.id, 1)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Profit and Remove */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                          <span className="text-sm font-bold text-[#7C69EF] tabular-nums">
                            +${itemProfit.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                            onClick={() => handleRemoveItem(item.product.id)}
                            title="Remove item"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Order Summary Row */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-sm">
                <div>
                  <span className="text-slate-500 font-medium">Revenue: </span>
                  <b className="text-slate-900 tabular-nums">${calculatedTotals.revenue.toFixed(2)}</b>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Profit: </span>
                  <b className="text-[#7C69EF] tabular-nums">+${calculatedTotals.profit.toFixed(2)}</b>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  disabled={selectedItems.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-[#5443ED] hover:bg-[#4332D6] text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                  onClick={() => setGiveStep(4)}
                >
                  Next: Customer
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CUSTOMER DETAILS (MATCHING SCREENSHOT 1) */}
          {giveStep === 4 && (
            <div className="space-y-5">
              {/* Header & Random USA Generator Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-slate-500 m-0">
                  Enter customer info or use a random USA customer to test.
                </p>
                <button
                  type="button"
                  onClick={handleApplyRandomUSA}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  <Sparkles size={14} className="text-indigo-600" />
                  <span>Random USA</span>
                </button>
              </div>

              {/* Form Fields matching Screenshot 1 */}
              <div className="space-y-3.5">
                {/* Full name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:outline-hidden text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:outline-hidden text-slate-800"
                    />
                  </div>
                </div>

                {/* Address line 1 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Address line 1</label>
                  <input
                    type="text"
                    value={address1}
                    onChange={(e) => setAddress1(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:outline-hidden text-slate-800"
                  />
                </div>

                {/* Address line 2 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Address line 2 (optional)</label>
                  <input
                    type="text"
                    value={address2}
                    onChange={(e) => setAddress2(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:outline-hidden text-slate-800"
                  />
                </div>

                {/* City & State */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:outline-hidden text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:outline-hidden text-slate-800"
                    />
                  </div>
                </div>

                {/* Postal code & Country */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Postal code</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:outline-hidden text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:outline-hidden text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* WHEN TO CREATE THIS ORDER */}
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  WHEN TO CREATE THIS ORDER
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Instant Option */}
                  <div
                    onClick={() => setCreationTiming('instant')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                      creationTiming === 'instant'
                        ? 'border-indigo-600 bg-indigo-50/20 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 grid place-items-center">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">Instant</div>
                      <div className="text-[11px] text-slate-500">Create the order now</div>
                    </div>
                  </div>

                  {/* Scheduled Option */}
                  <div
                    onClick={() => setCreationTiming('scheduled')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                      creationTiming === 'scheduled'
                        ? 'border-indigo-600 bg-indigo-50/20 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 grid place-items-center">
                      <CalendarClock size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">Scheduled</div>
                      <div className="text-[11px] text-slate-500">Auto create at a future time</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalCreateOrder}
                  className="px-6 py-2.5 rounded-xl bg-[#9080F8] hover:bg-[#7C69EF] text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>{isSubmitting ? 'Creating order…' : 'Create order'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* STANDARD 2-COLUMN ORDERS MANAGEMENT INTERFACE                 */
        /* ------------------------------------------------------------- */
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

                      {/* 3 Pills: TOTAL, PENDING, DELIVERED */}
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
              /* Selected Seller Workspace */
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
                      onClick={() => {
                        setIsGiveOrderActive(true)
                        setGiveStep(2)
                        if (selectedItems.length === 0 && products[0]) {
                          setSelectedItems([{ product: products[0], quantity: 1 }])
                        }
                      }}
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
                      onClick={() => {
                        setIsGiveOrderActive(true)
                        setGiveStep(2)
                      }}
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
                            {/* Item Thumbnail & Name */}
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

                            {/* Customer & Address */}
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

                          {/* Order Actions Toolbar */}
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
      )}

      {/* 3. Schedules Modal */}
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
                      onClick={() => {
                        setSchedules((prev) =>
                          prev.map((s) => (s.id === sch.id ? { ...s, status: s.status === 'active' ? 'paused' : 'active' } : s))
                        )
                        onToast('Schedule state updated')
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      {sch.status === 'active' ? 'Pause Pipeline' : 'Resume Pipeline'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const randomProd = products[0]
                        const newOrder: Order = {
                          id: 'ord-' + Date.now(),
                          orderNumber: '#ORD-' + Math.floor(10000 + Math.random() * 90000),
                          customerName: 'Scheduled Customer (Auto)',
                          customerEmail: 'auto.customer@pipeline.com',
                          shippingAddress: '742 Evergreen Terrace, Springfield, OR',
                          date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
                          status: 'paid',
                          totalAmount: randomProd?.sell || 59.95,
                          profit: randomProd?.profit || 12.5,
                          items: [
                            {
                              productTitle: randomProd?.title || 'Store Product',
                              quantity: 1,
                              price: randomProd?.sell || 59.95,
                              image: randomProd?.image || '',
                            },
                          ],
                        }
                        onCreateOrder(newOrder)
                        setSelectedSellerId('tester')
                        onToast(`Triggered "${sch.title}": Order ${newOrder.orderNumber} created!`)
                      }}
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

      {/* 4. Order Receipt Inspection Modal */}
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

      {/* 5. Delete Confirmation Modal */}
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
