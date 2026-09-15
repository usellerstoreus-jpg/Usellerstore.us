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
  ChevronDown,
  ChevronUp,
  Pencil,
  ArrowLeftRight,
  Phone,
  MapPin,
  User,
  XCircle,
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

interface ScheduleHistoryItem {
  id: string
  title: string
  status: 'Failed' | 'Cancelled'
  target: string
  dateStr: string
  timeStr: string
  totalOrders: number
  successCount: number
  failCount: number
  retryCount: number
  errors: {
    orderTitle: string
    target: string
    errorMessage: string
    time: string
  }[]
}

const mockScheduleHistory: ScheduleHistoryItem[] = [
  {
    id: 'hist-1',
    title: 'Delivered — 20 orders',
    status: 'Failed',
    target: 'Delivered',
    dateStr: 'August 2nd, 2026 at 2:54 AM (1 month ago)',
    timeStr: '2:55 AM',
    totalOrders: 20,
    successCount: 0,
    failCount: 20,
    retryCount: 0,
    errors: Array.from({ length: 8 }).map((_, i) => ({
      orderTitle: 'Order —',
      target: 'completed',
      errorMessage: 'operator does not exist: seller_order_status = text',
      time: '2:55 AM',
    })),
  },
  {
    id: 'hist-2',
    title: 'On the way — 20 orders',
    status: 'Failed',
    target: 'On the way',
    dateStr: 'August 2nd, 2026 at 2:52 AM (1 month ago)',
    timeStr: '2:52 AM',
    totalOrders: 20,
    successCount: 0,
    failCount: 20,
    retryCount: 0,
    errors: Array.from({ length: 8 }).map((_, i) => ({
      orderTitle: 'Order —',
      target: 'completed',
      errorMessage: 'operator does not exist: seller_order_status = text',
      time: '2:52 AM',
    })),
  },
  {
    id: 'hist-3',
    title: 'Delivered — 1 order',
    status: 'Failed',
    target: 'Delivered',
    dateStr: 'July 27th, 2026 at 7:10 PM (2 months ago)',
    timeStr: '7:11 PM',
    totalOrders: 1,
    successCount: 0,
    failCount: 1,
    retryCount: 0,
    errors: [
      {
        orderTitle: 'Order —',
        target: 'completed',
        errorMessage: 'operator does not exist: seller_order_status = text',
        time: '7:11 PM',
      },
    ],
  },
  {
    id: 'hist-4',
    title: 'On the way — 1 order',
    status: 'Cancelled',
    target: 'On the way',
    dateStr: 'July 27th, 2026 at 8:10 PM (2 months ago)',
    timeStr: '8:10 PM',
    totalOrders: 1,
    successCount: 0,
    failCount: 0,
    retryCount: 0,
    errors: [],
  },
  {
    id: 'hist-5',
    title: 'On the way — 1 order',
    status: 'Failed',
    target: 'On the way',
    dateStr: 'July 27th, 2026 at 7:07 PM (2 months ago)',
    timeStr: '7:07 PM',
    totalOrders: 1,
    successCount: 0,
    failCount: 1,
    retryCount: 0,
    errors: [
      {
        orderTitle: 'Order —',
        target: 'completed',
        errorMessage: 'operator does not exist: seller_order_status = text',
        time: '7:07 PM',
      },
    ],
  },
  {
    id: 'hist-6',
    title: 'On the way — 3 orders',
    status: 'Cancelled',
    target: 'On the way',
    dateStr: 'July 27th, 2026 at 10:04 PM (2 months ago)',
    timeStr: '10:04 PM',
    totalOrders: 3,
    successCount: 0,
    failCount: 0,
    retryCount: 0,
    errors: [],
  },
]

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
  // Orders View & Selection state - default to 'tester' matching Screenshot 1
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>('tester')
  const [sellerSearch, setSellerSearch] = useState('')
  const [orderSearch, setOrderSearch] = useState('')
  const [copiedSeller, setCopiedSeller] = useState(false)
  const [showHidden, setShowHidden] = useState(false)
  const [checkedOrderIds, setCheckedOrderIds] = useState<string[]>([])
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>('ord-ec60cb68')

  // Schedules View state (Screenshots 3, 4, 5)
  const [isSchedulesViewActive, setIsSchedulesViewActive] = useState(false)
  const [schedulesSubTab, setSchedulesSubTab] = useState<'upcoming' | 'history'>('upcoming')
  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>('hist-1')

  // Modals & Inspection (Screenshot 2)
  const [inspectOrder, setInspectOrder] = useState<Order | null>(null)
  const [isEditingOrder, setIsEditingOrder] = useState(false)
  const [editCustomerName, setEditCustomerName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [isReplacingItem, setIsReplacingItem] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // -------------------------------------------------------------
  // GIVE ORDER FLOW STATE
  // -------------------------------------------------------------
  const [isGiveOrderActive, setIsGiveOrderActive] = useState(false)
  const [giveStep, setGiveStep] = useState<1 | 2 | 3 | 4>(2)
  const [targetSellerId, setTargetSellerId] = useState('tester')

  // Step 2: Selected Products & Filter
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  // Step 4: Customer Details - default to Screenshot 1 & 2 values
  const [fullName, setFullName] = useState('Usellerstore')
  const [phone, setPhone] = useState('28288282')
  const [address1, setAddress1] = useState('KCXASCJAI, FWEUFH')
  const [address2, setAddress2] = useState('EFUWEF')
  const [city, setCity] = useState('DIQWDJ')
  const [stateName, setStateName] = useState('WDJI')
  const [postalCode, setPostalCode] = useState('10001')
  const [country, setCountry] = useState('United States')
  const [creationTiming, setCreationTiming] = useState<'instant' | 'scheduled'>('instant')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Random USA Customer Presets
  const randomUSAPresets = [
    {
      name: 'Usellerstore',
      phone: '28288282',
      address1: 'KCXASCJAI, FWEUFH',
      address2: 'EFUWEF',
      city: 'DIQWDJ',
      state: 'WDJI',
      zip: '10001',
    },
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
  ]

  const handleApplyRandomUSA = () => {
    const randomPick = randomUSAPresets[Math.floor(Math.random() * randomUSAPresets.length)]
    setFullName(randomPick.name)
    setPhone(randomPick.phone)
    setAddress1(randomPick.address1)
    setAddress2(randomPick.address2)
    setCity(randomPick.city)
    setStateName(randomPick.state)
    setPostalCode(randomPick.zip)
    setCountry('United States')
    onToast(`Applied customer: ${randomPick.name}`)
  }

  // Active merchants list
  const sellersList = useMemo(() => {
    const testerSeller = {
      id: 'tester',
      shopName: 'tester',
      ownerName: 'Zain',
      avatarLetter: 'T',
      totalOrders: orders.length,
      pendingOrders: orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length,
      deliveredOrders: orders.filter((o) => o.status === 'delivered').length,
      balance: sellerProfile.balance || 430.5,
    }

    return [testerSeller]
  }, [orders, sellerProfile])

  const filteredSellers = useMemo(() => {
    if (!sellerSearch.trim()) return sellersList
    const q = sellerSearch.toLowerCase()
    return sellersList.filter(
      (s) => s.shopName.toLowerCase().includes(q) || s.ownerName.toLowerCase().includes(q)
    )
  }, [sellersList, sellerSearch])

  const selectedSeller = useMemo(() => {
    return sellersList.find((s) => s.id === selectedSellerId) || sellersList[0]
  }, [sellersList, selectedSellerId])

  // Filtered orders for selected seller
  const sellerOrders = useMemo(() => {
    let result = orders
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase()
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.items.some((i) => i.productTitle.toLowerCase().includes(q))
      )
    }
    return result
  }, [orders, orderSearch])

  // Products filtering for Step 2
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory
      const matchSearch =
        !productSearch.trim() ||
        p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase())
      return matchCat && matchSearch
    })
  }, [products, selectedCategory, productSearch])

  // Selection handlers
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

  const handleQuantityChange = (productId: string, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = Math.max(1, item.quantity + delta)
            return { ...item, quantity: newQty }
          }
          return item
        })
        .filter((item) => item.quantity > 0)
    )
  }

  const handleRemoveItem = (productId: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.product.id !== productId))
  }

  // Calculated totals for wizard
  const calculatedTotals = useMemo(() => {
    let revenue = 0
    let profit = 0
    selectedItems.forEach((item) => {
      revenue += Number(item.product.sell) * item.quantity
      profit += Number(item.product.profit) * item.quantity
    })
    return { revenue, profit }
  }, [selectedItems])

  // Order submission
  const handleFinalCreateOrder = async () => {
    if (selectedItems.length === 0) {
      onToast('Please select at least one product')
      setGiveStep(2)
      return
    }

    setIsSubmitting(true)
    try {
      const randomHex = Math.random().toString(16).substring(2, 10)
      const orderNumber = `#${randomHex}`

      const formattedItems = selectedItems.map((item) => ({
        productTitle: item.product.title,
        quantity: item.quantity,
        price: item.product.sell,
        image: item.product.image,
      }))

      const now = new Date()
      const day = now.getDate()
      const month = now.toLocaleDateString('en-US', { month: 'short' })
      const hours = now.getHours().toString().padStart(2, '0')
      const mins = now.getMinutes().toString().padStart(2, '0')
      const dateString = `${day} ${month}, ${hours}:${mins}`

      const fullShipping = `${address1}${address2 ? `, ${address2}` : ''}, ${city}, ${stateName}, ${postalCode}, ${country}`

      const newOrder: Order = {
        id: `ord-${randomHex}`,
        orderNumber,
        customerName: fullName || 'Usellerstore',
        customerEmail: phone || '28288282',
        shippingAddress: fullShipping,
        date: dateString,
        status: 'paid', // Displays as Pending
        totalAmount: selectedItems[0]?.product.cost || 14.64,
        profit: calculatedTotals.profit,
        items: formattedItems,
      }

      await onCreateOrder(newOrder)
      setSelectedSellerId('tester')
      setExpandedOrderId(newOrder.id)
      setIsGiveOrderActive(false)
      setSelectedItems([])
      onToast(`Order ${orderNumber} created for seller!`)
    } catch (err: any) {
      onToast(`Failed to create order: ${err.message || 'Unknown error'}`)
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

  const toggleCheckOrder = (id: string) => {
    setCheckedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  return (
    <div className="admin-orders-container space-y-6">
      {/* 1. Header Bar matching Screenshots 1 & 3 */}
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

        {/* Right Tools: Search, Schedules & Give Order */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Header Search input matching Screenshot 1 & 3 */}
          <div className="relative flex items-center min-w-[220px]">
            <Search size={15} className="absolute left-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={isSchedulesViewActive ? 'Search sellers...' : 'Search orders...'}
              value={isSchedulesViewActive ? sellerSearch : orderSearch}
              onChange={(e) => {
                if (isSchedulesViewActive) setSellerSearch(e.target.value)
                else setOrderSearch(e.target.value)
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-indigo-500 text-xs text-slate-800 focus:outline-hidden transition-all"
            />
          </div>

          {/* Schedules Toggle Button */}
          <button
            type="button"
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0 ${
              isSchedulesViewActive
                ? 'bg-[#0F172A] text-white hover:bg-slate-800'
                : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
            onClick={() => {
              setIsSchedulesViewActive(!isSchedulesViewActive)
              if (isGiveOrderActive) setIsGiveOrderActive(false)
            }}
          >
            <CalendarClock size={15} className={isSchedulesViewActive ? 'text-white' : 'text-slate-600'} />
            <span>{isSchedulesViewActive ? 'Viewing Schedules' : 'Schedules'}</span>
          </button>

          {/* Give Order Button */}
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 bg-[#5443ED] hover:bg-[#4332D6]"
            onClick={() => {
              if (isGiveOrderActive) {
                setIsGiveOrderActive(false)
              } else {
                setIsGiveOrderActive(true)
                setIsSchedulesViewActive(false)
                setGiveStep(2)
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

      {/* 2. CONDITIONAL VIEW: Give Order Wizard OR Schedules View OR Standard Orders Screen */}
      {isGiveOrderActive ? (
        /* ------------------------------------------------------------- */
        /* MULTI-STEP GIVE ORDER WIZARD                                  */
        /* ------------------------------------------------------------- */
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
          {/* Wizard Header Bar */}
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

            {/* Stepper Wizard in Center */}
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

              {/* Bottom Action Bar */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 p-4 -mx-5 sm:-mx-7 -mb-5 sm:-mb-7 rounded-b-3xl z-20 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Selected Merchant:</span>
                  <span className="text-xs text-slate-900 font-bold">
                    {sellersList.find((s) => s.id === targetSellerId)?.shopName || 'tester (Zain)'}
                  </span>
                </div>
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-xl bg-[#7C69EF] hover:bg-[#6854E4] text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  onClick={() => setGiveStep(2)}
                >
                  <span>Next: Select products</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT PRODUCTS */}
          {giveStep === 2 && (
            <div className="space-y-5">
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
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

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

              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                TAP A PRODUCT TO SELECT ({selectedItems.length} SELECTED) · SHOWING {filteredProducts.length} OF {products.length}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 max-h-[58vh] overflow-y-auto pr-1">
                {filteredProducts.map((p) => {
                  const isSelected = selectedItems.some((i) => i.product.id === p.id)
                  const selectedQty = selectedItems.find((i) => i.product.id === p.id)?.quantity || 0

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleToggleProduct(p)}
                      className={`relative bg-white rounded-2xl border transition-all cursor-pointer p-3 flex flex-col justify-between group overflow-hidden ${
                        isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 z-10 w-5 h-5 rounded-full bg-[#5443ED] text-white flex items-center justify-center shadow-xs">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}

                      <div>
                        <div className="aspect-square rounded-xl bg-slate-100 overflow-hidden mb-2 relative">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-slate-300">
                              <Package size={28} />
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute bottom-1.5 left-1.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                              Qty: {selectedQty}
                            </div>
                          )}
                        </div>

                        <h4 className="font-bold text-xs text-slate-800 line-clamp-2 leading-tight" title={p.title}>
                          {p.title}
                        </h4>
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
                  )
                })}
              </div>

              {/* Bottom Action Bar: Sticky Frosted Bar */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 p-4 -mx-5 sm:-mx-7 -mb-5 sm:-mb-7 rounded-b-3xl z-20 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-700 font-bold">
                    {selectedItems.length} product{selectedItems.length === 1 ? '' : 's'} selected
                  </span>
                  {selectedItems.length > 0 && (
                    <span className="hidden sm:inline-block text-xs text-slate-500 font-medium">
                      · Subtotal: <b className="text-slate-900">${calculatedTotals.revenue.toFixed(2)}</b> (Est. Profit: <b className="text-[#7C69EF]">+${calculatedTotals.profit.toFixed(2)}</b>)
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={selectedItems.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-[#7C69EF] hover:bg-[#6854E4] text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  onClick={() => setGiveStep(3)}
                >
                  <span>Next: Review items</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW ITEMS */}
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

              {/* Bottom Action Bar: Sticky Frosted Bar */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 p-4 -mx-5 sm:-mx-7 -mb-5 sm:-mb-7 rounded-b-3xl z-20 flex items-center justify-between shadow-lg">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                  onClick={() => setGiveStep(2)}
                >
                  <ArrowLeft size={14} />
                  <span>Back to Products</span>
                </button>
                <button
                  type="button"
                  disabled={selectedItems.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-[#7C69EF] hover:bg-[#6854E4] text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  onClick={() => setGiveStep(4)}
                >
                  <span>Next: Customer</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CUSTOMER DETAILS */}
          {giveStep === 4 && (
            <div className="space-y-5">
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

              {/* Form Fields */}
              <div className="space-y-3.5">
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Address line 1</label>
                  <input
                    type="text"
                    value={address1}
                    onChange={(e) => setAddress1(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:outline-hidden text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Address line 2 (optional)</label>
                  <input
                    type="text"
                    value={address2}
                    onChange={(e) => setAddress2(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:outline-hidden text-slate-800"
                  />
                </div>

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

              {/* Bottom Action Bar: Sticky Frosted Bar */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 p-4 -mx-5 sm:-mx-7 -mb-5 sm:-mb-7 rounded-b-3xl z-20 flex items-center justify-between shadow-lg">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                  onClick={() => setGiveStep(3)}
                >
                  <ArrowLeft size={14} />
                  <span>Back to Review</span>
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalCreateOrder}
                  className="px-6 py-2.5 rounded-xl bg-[#7C69EF] hover:bg-[#6854E4] text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>{isSubmitting ? 'Creating order…' : 'Create order'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : isSchedulesViewActive ? (
        /* ------------------------------------------------------------- */
        /* SCHEDULES MANAGEMENT VIEW (Matching Screenshots 3, 4, 5)      */
        /* ------------------------------------------------------------- */
        <div className="space-y-4">
          {/* Subtabs: Upcoming vs History */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSchedulesSubTab('upcoming')}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                schedulesSubTab === 'upcoming'
                  ? 'bg-white border border-slate-200 shadow-xs text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock size={14} className="text-slate-500" />
              <span>Upcoming</span>
            </button>

            <button
              type="button"
              onClick={() => setSchedulesSubTab('history')}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                schedulesSubTab === 'history'
                  ? 'bg-white border border-slate-900 text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarClock size={14} className="text-slate-500" />
              <span>History</span>
            </button>
          </div>

          {/* Upcoming Tab (Screenshot 3) */}
          {schedulesSubTab === 'upcoming' && (
            <div className="rounded-2xl border border-dashed border-slate-200/90 p-16 text-center text-xs text-slate-500 bg-white/50 min-h-[300px] flex items-center justify-center shadow-xs">
              No upcoming schedules. Pick orders and click Schedule status change.
            </div>
          )}

          {/* History Tab (Screenshots 4 & 5) */}
          {schedulesSubTab === 'history' && (
            <div className="space-y-3">
              {mockScheduleHistory.map((item) => {
                const isExpanded = expandedScheduleId === item.id
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs transition-all"
                  >
                    {/* Header line of schedule run */}
                    <div
                      onClick={() => setExpandedScheduleId(isExpanded ? null : item.id)}
                      className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/50 select-none transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-slate-400">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900 leading-tight">
                              {item.title}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === 'Failed'
                                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {item.status}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                              → {item.target}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock size={11} /> {item.dateStr}
                            </span>
                            <span>•</span>
                            <span>{item.totalOrders} orders</span>
                            <span>•</span>
                            <span>✓ {item.successCount} · ✕ {item.failCount} · ⤶ {item.retryCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Execution Logs (Screenshot 5) */}
                    {isExpanded && item.errors.length > 0 && (
                      <div className="border-t border-slate-100 divide-y divide-slate-100 bg-white">
                        {item.errors.map((err, errIdx) => (
                          <div
                            key={errIdx}
                            className="p-3.5 pl-9 flex items-start justify-between gap-3 text-xs"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <XCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <div className="text-slate-700 font-medium flex items-center gap-2">
                                  <span>{err.orderTitle}</span>
                                  <span className="text-slate-400 font-normal">Target: {err.target}</span>
                                </div>
                                <div className="text-rose-500 font-mono text-[11px] mt-0.5">
                                  {err.errorMessage}
                                </div>
                              </div>
                            </div>
                            <span className="text-slate-400 text-[11px] shrink-0">{err.time}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* STANDARD 2-COLUMN ORDERS MANAGEMENT INTERFACE (Screenshot 1)  */
        /* ------------------------------------------------------------- */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Sellers List (4 cols) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-2.5">
            {/* Top Store Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              <Store size={13} className="text-slate-500" />
              <span>tester</span>
            </div>

            {/* Seller Cards */}
            {filteredSellers.map((seller) => {
              const isSelected = selectedSellerId === seller.id
              return (
                <div
                  key={seller.id}
                  onClick={() => setSelectedSellerId(seller.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                    isSelected
                      ? 'bg-white border-indigo-400 ring-2 ring-indigo-500/15 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Identity */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-[#00bf87] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                          {seller.avatarLetter}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 leading-tight">
                          {seller.shopName}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <span>{seller.ownerName}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopySeller(e, seller.id)}
                            className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 cursor-pointer"
                            title="Copy seller ID"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 3 Pills matching Screenshot 1 */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>TOTAL</span>
                        <span className="font-extrabold ml-0.5">{seller.totalOrders}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 bg-[#FEF3C7] text-[#D97706] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>PENDING</span>
                        <span className="font-extrabold ml-0.5">{seller.pendingOrders}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 bg-[#D1FAE5] text-[#047857] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>DELIVERED</span>
                        <span className="font-extrabold ml-0.5">{seller.deliveredOrders}</span>
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right Column: Orders for Selected Seller (8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-3">
            {/* Top Toolbar matching Screenshot 1 */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                <Store size={13} className="text-slate-500" />
                <span>{selectedSeller?.shopName || 'tester'}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowHidden(!showHidden)
                  onToast(showHidden ? 'Showing all orders' : 'Showing hidden orders view')
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                <Trash2 size={13} className="text-slate-500" />
                <span>Show hidden</span>
              </button>
            </div>

            {/* Orders List matching Screenshot 1 */}
            {sellerOrders.length === 0 ? (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs space-y-3">
                <Package size={36} className="mx-auto text-slate-300" />
                <h3 className="font-bold text-sm text-slate-800">No orders yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click &quot;+ Give Order&quot; above to dispatch an order to {selectedSeller?.shopName || 'tester'}.
                </p>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5443ED] text-white text-xs font-bold shadow-xs hover:bg-[#4332D6] transition-colors cursor-pointer"
                  onClick={() => {
                    setIsGiveOrderActive(true)
                    setGiveStep(2)
                  }}
                >
                  <Plus size={14} />
                  <span>Give Order to {selectedSeller?.shopName || 'tester'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sellerOrders.map((order, idx) => {
                  const isExpanded = expandedOrderId === order.id
                  const isChecked = checkedOrderIds.includes(order.id)
                  const primaryItem = order.items[0]

                  return (
                    <div
                      key={order.id}
                      className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs hover:border-slate-300 transition-all"
                    >
                      {/* Accordion Header Row matching Screenshot 1 */}
                      <div
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        {/* Left Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Circular Checkbox */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleCheckOrder(order.id)
                            }}
                            className={`w-4 h-4 rounded-full border flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
                              isChecked
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-300 hover:border-slate-400'
                            }`}
                          >
                            {isChecked && <Check size={10} strokeWidth={3} />}
                          </div>

                          {/* Sequence Number Box */}
                          <div className="w-9 h-9 rounded-xl bg-[#F1F5F9] text-slate-700 font-bold flex items-center justify-center text-sm shrink-0">
                            {idx + 1}
                          </div>

                          {/* Customer Name & Subtitle */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition-colors">
                                {order.customerName}
                              </span>
                              <span className="bg-slate-100 text-slate-500 text-[11px] font-medium px-2 py-0.5 rounded-md">
                                {order.items.length} item{order.items.length === 1 ? '' : 's'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span>{order.items.reduce((s, i) => s + (i.quantity || 1), 0)} unit</span>
                              <span>•</span>
                              <span>{order.date}</span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <Clock size={11} /> 12m
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right Info */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="font-bold text-sm text-slate-900 tabular-nums">
                              ${Number(order.totalAmount).toFixed(2)}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium tabular-nums mt-0.5">
                              Profit: ${Number(order.profit).toFixed(2)}
                            </div>
                          </div>

                          {/* Pending Badge */}
                          <span className="bg-[#FEF3C7] text-[#D97706] font-semibold text-xs px-2.5 py-0.5 rounded-full capitalize">
                            {order.status === 'paid' ? 'Pending' : order.status.replace(/_/g, ' ')}
                          </span>

                          {/* Chevron Toggle Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedOrderId(isExpanded ? null : order.id)
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Product Items matching Screenshot 1 */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 divide-y divide-slate-100">
                          {order.items.map((item, itemIdx) => (
                            <div
                              key={itemIdx}
                              onClick={() => setInspectOrder(order)}
                              className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden shrink-0 bg-slate-50">
                                  <img
                                    src={item.image || '/products/mibasies_makeup_bag.jpg'}
                                    alt={item.productTitle}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-xs text-slate-900 truncate max-w-lg leading-snug" title={item.productTitle}>
                                    {item.productTitle}
                                  </h4>
                                  <div className="text-xs text-slate-400 mt-0.5 font-medium">
                                    Qty {item.quantity} × ${Number(item.price).toFixed(2)}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-bold text-sm text-slate-900 tabular-nums">
                                  ${(Number(item.price) * item.quantity).toFixed(2)}
                                </span>
                                <span className="bg-[#FEF3C7] text-[#D97706] font-semibold text-xs px-2.5 py-0.5 rounded-full capitalize">
                                  {order.status === 'paid' ? 'Pending' : order.status.replace(/_/g, ' ')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Order Details / Inspection Modal (MATCHING SCREENSHOT 2) */}
      {inspectOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header matching Screenshot 2 */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-14 h-14 rounded-2xl border border-slate-200 overflow-hidden shrink-0 bg-slate-100">
                  <img
                    src={inspectOrder.items[0]?.image || '/products/mibasies_makeup_bag.jpg'}
                    alt={inspectOrder.items[0]?.productTitle || 'Product'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 truncate max-w-sm leading-snug" title={inspectOrder.items[0]?.productTitle}>
                    {inspectOrder.items[0]?.productTitle || 'Store Product'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="bg-slate-100 text-slate-600 font-mono text-[11px] px-2 py-0.5 rounded-md font-medium">
                      {inspectOrder.orderNumber}
                    </span>
                    <span className="bg-[#FEF3C7] text-[#D97706] font-semibold text-[11px] px-2.5 py-0.5 rounded-full capitalize">
                      {inspectOrder.status === 'paid' ? 'Pending' : inspectOrder.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <Clock size={11} /> Placed {inspectOrder.date}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                onClick={() => {
                  setInspectOrder(null)
                  setIsEditingOrder(false)
                  setIsReplacingItem(false)
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* 3 Action Buttons matching Screenshot 2 */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditingOrder(!isEditingOrder)
                  setEditCustomerName(inspectOrder.customerName)
                  setEditPhone(inspectOrder.customerEmail)
                  setEditAddress(inspectOrder.shippingAddress)
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs transition-colors cursor-pointer ${
                  isEditingOrder
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Pencil size={13} />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => setIsReplacingItem(!isReplacingItem)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs transition-colors cursor-pointer ${
                  isReplacingItem
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <ArrowLeftRight size={13} />
                <span>Replace</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onDeleteOrder(inspectOrder.id)
                  setInspectOrder(null)
                  onToast(`Order ${inspectOrder.orderNumber} deleted`)
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </div>

            {/* Inline Replace Tool */}
            {isReplacingItem && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-700">Select replacement product:</div>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {products.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => {
                        inspectOrder.items[0] = {
                          productTitle: prod.title,
                          quantity: 1,
                          price: prod.sell,
                          image: prod.image,
                        }
                        inspectOrder.totalAmount = prod.cost
                        inspectOrder.profit = prod.profit
                        setIsReplacingItem(false)
                        onToast(`Replaced item with "${prod.title}"`)
                      }}
                      className="p-2 bg-white rounded-xl border border-slate-200 text-left hover:border-indigo-500 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <img src={prod.image} alt={prod.title} className="w-8 h-8 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-slate-900 truncate">{prod.title}</div>
                        <div className="text-[10px] text-slate-500">${prod.sell.toFixed(2)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Inline Edit Form */}
            {isEditingOrder && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="text-xs font-bold text-slate-700">Edit Order Details:</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={editCustomerName}
                    onChange={(e) => setEditCustomerName(e.target.value)}
                    placeholder="Customer Name"
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Phone"
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Shipping Address"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      inspectOrder.customerName = editCustomerName
                      inspectOrder.customerEmail = editPhone
                      inspectOrder.shippingAddress = editAddress
                      setIsEditingOrder(false)
                      onToast('Order details updated')
                    }}
                    className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Seller Line */}
            <div className="text-xs text-slate-500">
              Seller <b className="text-slate-900 ml-1">tester</b>
            </div>

            {/* 5 Metric Cards Grid matching Screenshot 2 */}
            <div className="space-y-2.5">
              {/* Row 1: Quantity, Unit Price, Total Revenue */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    QUANTITY
                  </div>
                  <div className="text-base font-extrabold text-slate-900 mt-1">
                    {inspectOrder.items[0]?.quantity || 1}
                  </div>
                </div>

                <div className="p-3 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    UNIT PRICE
                  </div>
                  <div className="text-base font-extrabold text-slate-900 mt-1">
                    ${Number(inspectOrder.items[0]?.price || 17.99).toFixed(2)}
                  </div>
                </div>

                <div className="p-3 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    TOTAL REVENUE
                  </div>
                  <div className="text-base font-extrabold text-slate-900 mt-1">
                    ${((inspectOrder.items[0]?.price || 17.99) * (inspectOrder.items[0]?.quantity || 1)).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Row 2: Seller Cost & Seller Profit */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    SELLER COST
                  </div>
                  <div className="text-base font-extrabold text-slate-900 mt-1">
                    ${Number(inspectOrder.totalAmount || 14.64).toFixed(2)}
                  </div>
                </div>

                {/* Vibrant Solid Purple Card matching Screenshot 2 */}
                <div className="p-3.5 rounded-2xl bg-[#5443ED] text-white shadow-md">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                    SELLER PROFIT
                  </div>
                  <div className="text-base font-extrabold text-white mt-1">
                    ${Number(inspectOrder.profit || 3.35).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Box matching Screenshot 2 */}
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold tracking-wider uppercase">
                <User size={13} />
                <span>CUSTOMER</span>
              </div>
              <div className="font-bold text-sm text-slate-900">
                {inspectOrder.customerName}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Phone size={13} className="text-slate-400 shrink-0" />
                <span>{inspectOrder.customerEmail}</span>
              </div>
              <div className="flex items-start gap-1.5 text-xs text-slate-600">
                <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{inspectOrder.shippingAddress}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Delete Confirmation Modal */}
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
                  onToast('Order removed')
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
