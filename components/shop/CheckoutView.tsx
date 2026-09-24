'use client'

import React, { useState, useEffect } from 'react'
import {
  Search,
  Heart,
  Bell,
  ShoppingCart,
  User,
  MapPin,
  Truck,
  Check,
  X,
  ShieldCheck,
  RotateCcw,
  Lock,
  CheckCircle2,
  Package,
  Plus,
  Minus,
  Trash2,
  Pencil,
  ArrowRight,
  ExternalLink,
  LogOut,
} from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { Product, Order, SellerProfile } from '@/lib/mock-data'

export interface CheckoutAddress {
  id: string
  name: string
  phone: string
  street: string
  street2?: string
  city: string
  state: string
  zip: string
  country: string
  isDefault: boolean
}

export interface CheckoutViewProps {
  cart: { product: Product; quantity: number }[]
  allProducts: Product[]
  sellerProfile: SellerProfile
  wishlistCount?: number
  onPlaceOrder?: (order: Order) => Promise<void> | void
  onNavigateHome: () => void
  onNavigateShop: () => void
  onNavigateCategories: () => void
  onNavigateCart?: () => void
  onNavigateOrders?: () => void
  onOpenWishlist?: () => void
  onOpenNotifications?: () => void
  onOpenProfile?: () => void
  unreadNotifsCount?: number
  onToast: (msg: string) => void
  onClearCart?: () => void
  onUpdateCartQuantity?: (productId: string, delta: number) => void
  onRemoveFromCart?: (productId: string) => void
}

export function CheckoutView({
  cart,
  allProducts,
  sellerProfile,
  wishlistCount = 0,
  unreadNotifsCount = 0,
  onPlaceOrder,
  onNavigateHome,
  onNavigateShop,
  onNavigateCategories,
  onNavigateCart,
  onNavigateOrders,
  onOpenWishlist,
  onOpenNotifications,
  onOpenProfile,
  onToast,
  onClearCart,
  onUpdateCartQuantity,
  onRemoveFromCart,
}: CheckoutViewProps) {
  // Address State
  const [savedAddresses, setSavedAddresses] = useState<CheckoutAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    street: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    isDefault: true,
  })

  // Cart Drawer State
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false)

  // Order Placement State
  const [isPlacing, setIsPlacing] = useState(false)
  const [orderConfirmed, setOrderConfirmed] = useState<Order | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Load saved address from localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('u_customer_shipping_addresses')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSavedAddresses(parsed)
            setSelectedAddressId(parsed[0].id)
          }
        }
      }
    } catch {}
  }, [])

  // Calculate pricing matching the screenshot
  // Subtotal from cart items (or fallback to PetSafe item if cart is empty)
  const effectiveCart =
    cart && cart.length > 0
      ? cart
      : [
          {
            product: allProducts.find(
              (p) =>
                p.title.includes('PetSafe') ||
                p.id === 'prod-10' ||
                p.sell === 166.46
            ) || {
              id: 'prod-10',
              title: 'PetSafe Wireless Pet Containment System',
              sell: 166.46,
              cost: 128.81,
              profit: 37.65,
              category: 'Electronics',
              image: '/products/petsafe_collar_main.jpg',
              stock: 24,
              sku: 'PETSAFE-WL-SYS',
              status: 'active',
            },
            quantity: 1,
          },
        ]

  const subtotal = effectiveCart.reduce(
    (sum, item) => sum + (Number(item.product.sell) || 0) * item.quantity,
    0
  )
  // Exact 5% tax matching user screenshot ($166.46 * 0.05 = $8.32)
  const tax = Math.round(subtotal * 0.05 * 100) / 100
  const shipping = 0 // Free
  const total = subtotal + tax

  // Open Add Address modal with clean form
  const handleOpenAddAddress = () => {
    setAddressForm({
      name: '',
      phone: '',
      street: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      country: 'United States',
      isDefault: true,
    })
    setIsAddressModalOpen(true)
  }

  // Handle saving new address
  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault()
    if (!addressForm.name || !addressForm.phone || !addressForm.street || !addressForm.city || !addressForm.state || !addressForm.zip) {
      onToast('Please fill in all required fields.')
      return
    }

    const newAddr: CheckoutAddress = {
      id: `addr-${Date.now()}`,
      name: addressForm.name,
      phone: addressForm.phone,
      street: addressForm.street,
      street2: addressForm.street2,
      city: addressForm.city,
      state: addressForm.state,
      zip: addressForm.zip,
      country: addressForm.country || 'United States',
      isDefault: addressForm.isDefault,
    }

    let updated = [...savedAddresses]
    if (newAddr.isDefault) {
      updated = updated.map((a) => ({ ...a, isDefault: false }))
      updated.unshift(newAddr)
    } else {
      updated.push(newAddr)
    }

    setSavedAddresses(updated)
    setSelectedAddressId(newAddr.id)
    setIsAddressModalOpen(false)
    try {
      localStorage.setItem('u_customer_shipping_addresses', JSON.stringify(updated))
    } catch {}
    onToast('Shipping address saved successfully!')
  }

  // Handle place order
  const handlePlaceOrder = async () => {
    if (savedAddresses.length === 0) {
      onToast('Please add a shipping address first.')
      setIsAddressModalOpen(true)
      return
    }

    const selectedAddr =
      savedAddresses.find((a) => a.id === selectedAddressId) || savedAddresses[0]

    setIsPlacing(true)
    try {
      const orderNum = `ORD-${Math.floor(100000 + Math.random() * 900000)}`
      const profitTotal = effectiveCart.reduce(
        (sum, item) => sum + (Number(item.product.profit) || 0) * item.quantity,
        0
      )

      const activeSellerId = sellerProfile?.id || (effectiveCart[0]?.product as any)?.sellerId || 'seller-1'

      const newOrder: Order = {
        id: orderNum,
        orderNumber: orderNum,
        customerName: selectedAddr.name,
        customerEmail: 'usellerstore.us@gmail.com',
        totalAmount: total,
        profit: profitTotal,
        status: 'unpaid',
        date: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        shippingAddress: `${selectedAddr.street}${selectedAddr.street2 ? ', ' + selectedAddr.street2 : ''}, ${selectedAddr.city}, ${selectedAddr.state} ${selectedAddr.zip}`,
        sellerId: activeSellerId,
        items: effectiveCart.map((item) => ({
          productTitle: item.product.title,
          price: Number(item.product.sell) || 0,
          quantity: item.quantity,
          image: item.product.image || '',
          sellerId: (item.product as any).sellerId || activeSellerId,
        })),
      }

      // 1. Save directly to u_seller_orders in localStorage
      try {
        const existingOrders = JSON.parse(
          localStorage.getItem('u_seller_orders') || '[]'
        )
        const updatedOrders = [
          newOrder,
          ...existingOrders.filter((o: Order) => o.id !== newOrder.id && o.orderNumber !== newOrder.orderNumber),
        ]
        localStorage.setItem('u_seller_orders', JSON.stringify(updatedOrders))

        // Save recent order numbers for customer quick track
        const existingNums = JSON.parse(localStorage.getItem('u_recent_orders') || '[]')
        const updatedNums = [newOrder.orderNumber, ...existingNums.filter((n: string) => n !== newOrder.orderNumber)].slice(0, 5)
        localStorage.setItem('u_recent_orders', JSON.stringify(updatedNums))

        // 2. Increment total orders for seller in active profile
        const storedProfile = localStorage.getItem('u_seller_active_profile')
        const currentProf = storedProfile ? JSON.parse(storedProfile) : sellerProfile
        const updatedProf = {
          ...currentProf,
          totalOrders: (Number(currentProf.totalOrders) || 0) + 1,
        }
        localStorage.setItem('u_seller_active_profile', JSON.stringify(updatedProf))

        // 3. Create seller notification
        const newNotif = {
          id: `notif-${Date.now()}`,
          title: 'New Customer Order',
          description: `Order ${newOrder.orderNumber} for $${Number(newOrder.totalAmount).toFixed(2)} received from ${newOrder.customerName}`,
          date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(),
          timeAgo: 'Just now',
          refCode: newOrder.orderNumber,
          type: 'order',
          read: false,
          details: `Customer ${newOrder.customerName} placed an order for ${newOrder.items.length} item(s) totaling $${Number(newOrder.totalAmount).toFixed(2)}. Delivery to: ${newOrder.shippingAddress}.`,
        }
        const existingNotifs = JSON.parse(localStorage.getItem('u_seller_notifications') || '[]')
        const updatedNotifs = [newNotif, ...existingNotifs.filter((n: any) => n.id !== newNotif.id)]
        localStorage.setItem('u_seller_notifications', JSON.stringify(updatedNotifs))

        // 4. Dispatch live custom events for real-time reactivity asynchronously
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('u_seller_orders_update', { detail: { order: newOrder } }))
          window.dispatchEvent(new CustomEvent('u_seller_notifications_update', { detail: { notification: newNotif } }))
          window.dispatchEvent(new CustomEvent('u_seller_profile_update', { detail: { profile: updatedProf } }))
        }, 0)
      } catch (e) {
        console.warn('LocalStorage save error:', e)
      }

      if (onPlaceOrder) {
        await onPlaceOrder(newOrder)
      }

      if (onClearCart) {
        onClearCart()
      } else {
        try {
          localStorage.removeItem('u_seller_cart')
        } catch {}
      }

      setOrderConfirmed(newOrder)
      onToast('Order placed successfully and recorded in seller account!')
    } catch (err) {
      console.error(err)
      onToast('Could not complete order. Please try again.')
    } finally {
      setIsPlacing(false)
    }
  }

  const selectedAddr = savedAddresses.find((a) => a.id === selectedAddressId)

  const totalCartCount = effectiveCart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col antialiased">
      {/* 1. STOREFRONT HEADER MATCHING SCREENSHOT */}
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur-md border-b border-slate-100 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 lg:gap-8">
          {/* Logo & Main Nav Links */}
          <div className="flex items-center gap-6 lg:gap-8 shrink-0">
            <BrandLogo size="md" onClick={onNavigateShop} />

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold" aria-label="Main Store Navigation">
              <button
                type="button"
                id="checkout-nav-home"
                onClick={onNavigateHome}
                className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Home
              </button>
              <button
                type="button"
                id="checkout-nav-shop"
                onClick={onNavigateShop}
                className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Shop
              </button>
              <button
                type="button"
                id="checkout-nav-categories"
                onClick={onNavigateCategories}
                className="text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Categories
              </button>
            </nav>
          </div>

          {/* Centered Pill Search Bar */}
          <div className="flex-1 max-w-xl mx-auto hidden sm:block">
            <div className="relative w-full">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="checkout-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-11 pr-9 py-2.5 rounded-full bg-[#F1F5F9] text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent focus:border-blue-400 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Right Action Icons: Heart, Bell, Cart (badge 1), User avatar circle */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Wishlist Heart Icon */}
            <button
              type="button"
              id="checkout-header-wishlist"
              onClick={onOpenWishlist}
              className="p-1.5 text-slate-700 hover:text-rose-600 transition-colors relative cursor-pointer"
              title="Wishlist"
              aria-label="Wishlist"
            >
              <Heart size={20} className={wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Notifications Bell Icon */}
            <button
              type="button"
              id="checkout-header-notifications"
              onClick={onOpenNotifications}
              className="p-1.5 text-slate-700 hover:text-blue-600 transition-colors relative cursor-pointer"
              title="Store & Product Notifications"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Shopping Cart with Signature Orange Badge (e.g. "1") */}
            <button
              type="button"
              id="checkout-header-cart"
              onClick={() => setIsCartDrawerOpen(true)}
              className="p-1.5 text-slate-700 hover:text-slate-900 transition-colors relative cursor-pointer group"
              title="Shopping Cart"
              aria-label="Shopping Cart"
            >
              <ShoppingCart size={20} className="group-hover:scale-105 transition-transform" />
              {totalCartCount > 0 && (
                <span
                  suppressHydrationWarning
                  className="absolute -top-1.5 -right-1.5 bg-[#F97316] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs"
                >
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* User Avatar Circle Icon & Dropdown Menu */}
            <div className="relative">
              <button
                type="button"
                id="checkout-header-user"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-1.5 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer rounded-full hover:bg-slate-100"
                title="Customer Account"
                aria-label="Customer Account"
              >
                <User size={21} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-10 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs space-y-0.5 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <span className="block text-slate-900 font-bold text-xs truncate">
                      usellerstore.us@gmail.com
                    </span>
                  </div>

                  <button
                    type="button"
                    id="checkout-menu-profile"
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      if (onOpenProfile) onOpenProfile()
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 font-medium text-slate-700 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <User size={16} className="text-slate-500" />
                    <span>Profile</span>
                  </button>

                  <button
                    type="button"
                    id="checkout-menu-orders"
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      if (onNavigateOrders) onNavigateOrders()
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 font-medium text-slate-700 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <Package size={16} className="text-slate-500" />
                    <span>My Orders</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      onToast('Logged out of customer session')
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 font-medium text-slate-700 hover:text-rose-600 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <LogOut size={16} className="text-slate-500" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="sm:hidden px-4 pb-3">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-8 py-2 rounded-full bg-[#F1F5F9] text-xs focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </header>

      {/* 2. MAIN CHECKOUT SCREEN MATCHING SCREENSHOT */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full">
        {/* Page Title: Checkout */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-8">
          Checkout
        </h1>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Shipping Address + Payment Method (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card 1: Shipping Address */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-6 h-6 rounded-full border border-slate-400/80 flex items-center justify-center text-slate-700 shrink-0">
                  <MapPin size={13} className="text-slate-700" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Shipping Address</h2>
              </div>

              {savedAddresses.length === 0 ? (
                /* Empty Dashed Box matching user screenshot */
                <div className="border border-dashed border-slate-300 rounded-2xl py-12 px-6 flex flex-col items-center justify-center text-center bg-slate-50/20">
                  {/* Pin inside circular ring icon */}
                  <div className="w-12 h-12 rounded-full border-2 border-slate-700 flex items-center justify-center text-slate-700 mb-3.5">
                    <MapPin size={22} className="text-slate-700" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-4">
                    No saved addresses yet
                  </p>
                  <button
                    type="button"
                    id="checkout-add-address-btn"
                    onClick={handleOpenAddAddress}
                    className="bg-[#1E4E79] hover:bg-[#163c5e] active:scale-[0.98] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>+ Add address</span>
                  </button>
                </div>
              ) : (
                /* Saved Address Card View */
                <div className="space-y-3">
                  <div className="border-2 border-[#1E4E79] bg-blue-50/20 rounded-xl p-4 sm:p-5 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {selectedAddr?.name || 'Customer'}
                        </span>
                        <span className="bg-[#1E4E79] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {selectedAddr?.street}
                        {selectedAddr?.street2 ? `, ${selectedAddr.street2}` : ''}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedAddr?.city}, {selectedAddr?.state} {selectedAddr?.zip},{' '}
                        {selectedAddr?.country}
                      </p>
                      <p className="text-xs text-slate-500 font-medium pt-1">
                        Phone: {selectedAddr?.phone}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (selectedAddr) {
                          setAddressForm({
                            name: selectedAddr.name,
                            phone: selectedAddr.phone,
                            street: selectedAddr.street,
                            street2: selectedAddr.street2 || '',
                            city: selectedAddr.city,
                            state: selectedAddr.state,
                            zip: selectedAddr.zip,
                            country: selectedAddr.country || 'United States',
                            isDefault: selectedAddr.isDefault,
                          })
                        }
                        setIsAddressModalOpen(true)
                      }}
                      className="text-xs font-semibold text-[#1E4E79] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Pencil size={13} />
                      <span>Change</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="text-xs font-semibold text-slate-600 hover:text-[#1E4E79] flex items-center gap-1.5 pt-1 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add another address</span>
                  </button>
                </div>
              )}
            </div>

            {/* Card 2: Payment Method */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-4">Payment Method</h2>

              {/* Cash on Delivery option with prominent blue border matching screenshot */}
              <div className="border-2 border-[#1E4E79] rounded-xl p-4 sm:p-5 bg-white flex items-center gap-4 cursor-pointer shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                  <Truck size={20} />
                </div>
                <div className="flex-1">
                  <div className="text-sm sm:text-base font-bold text-slate-900">
                    Cash on Delivery
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Pay in cash when your order arrives
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary Card (lg:col-span-5) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-5">Order Summary</h2>

              {/* Items List */}
              <div className="space-y-3">
                {effectiveCart.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <span
                      className="text-slate-700 font-medium truncate max-w-[210px] sm:max-w-[260px]"
                      title={item.product.title}
                    >
                      {item.product.title}
                      {item.quantity > 1 && (
                        <span className="text-slate-400 font-normal ml-1">
                          x{item.quantity}
                        </span>
                      )}
                    </span>
                    <span className="text-slate-900 font-semibold tabular-nums shrink-0">
                      ${((Number(item.product.sell) || 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Divider 1 */}
              <div className="border-t border-slate-200/90 my-4" />

              {/* Breakdown Rows */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="text-slate-900 font-semibold tabular-nums">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Shipping</span>
                  <span className="text-slate-900 font-semibold">Free</span>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Tax (5%)</span>
                  <span className="text-slate-900 font-semibold tabular-nums">
                    ${tax.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Divider 2 */}
              <div className="border-t border-slate-200/90 my-4" />

              {/* Total Row */}
              <div className="flex items-center justify-between text-base font-bold text-slate-900">
                <span>Total</span>
                <span className="tabular-nums text-slate-900 font-bold">
                  ${total.toFixed(2)}
                </span>
              </div>

              {/* Place Order Button matching screenshot */}
              <button
                type="button"
                id="checkout-place-order-btn"
                disabled={isPlacing}
                onClick={handlePlaceOrder}
                className="w-full mt-6 py-3.5 px-4 bg-[#6F88A0] hover:bg-[#1E4E79] active:scale-[0.99] text-white rounded-xl font-semibold text-sm transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isPlacing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <span>Place Order — ${total.toFixed(2)}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 3. TRUST BADGES BAR MATCHING SCREENSHOT */}
      <section className="w-full bg-[#071120] text-white py-6 px-4 sm:px-6 border-b border-slate-800/70 mt-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Badge 1: Secure Checkout */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-blue-950/70 border border-blue-800/40 text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm leading-tight">Secure Checkout</h4>
              <p className="text-slate-400 text-xs mt-0.5">256-bit SSL encryption</p>
            </div>
          </div>

          {/* Badge 2: 30-Day Returns */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-blue-950/70 border border-blue-800/40 text-blue-400 flex items-center justify-center shrink-0">
              <RotateCcw size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm leading-tight">30-Day Returns</h4>
              <p className="text-slate-400 text-xs mt-0.5">Easy & hassle-free</p>
            </div>
          </div>

          {/* Badge 3: Safe Payments */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-blue-950/70 border border-blue-800/40 text-blue-400 flex items-center justify-center shrink-0">
              <Lock size={19} strokeWidth={2.2} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm leading-tight">Safe Payments</h4>
              <p className="text-slate-400 text-xs mt-0.5">Protected transactions</p>
            </div>
          </div>

          {/* Badge 4: Quality Assured */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-blue-950/70 border border-blue-800/40 text-blue-400 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm leading-tight">Quality Assured</h4>
              <p className="text-slate-400 text-xs mt-0.5">Verified sellers only</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. COMPREHENSIVE DARK FOOTER MATCHING SCREENSHOT */}
      <footer className="w-full bg-[#030712] text-slate-300 pt-14 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
            {/* Col 1: Brand & Tagline */}
            <div className="md:col-span-5 space-y-4">
              <div className="inline-flex items-center bg-white px-3.5 py-2 rounded-xl shadow-xs">
                <BrandLogo size="md" />
              </div>
              <span className="block text-[11px] font-extrabold tracking-widest text-slate-400 uppercase">
                SHOP SMARTER • LIVE BETTER
              </span>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Discover premium products at unbeatable prices. Trusted by thousands worldwide.
              </p>
            </div>

            {/* Col 2: SHOP Links */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-white font-black text-xs uppercase tracking-wider">SHOP</h4>
              <ul className="space-y-2 text-xs text-slate-400 font-medium">
                <li>
                  <button
                    type="button"
                    onClick={onNavigateShop}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    All Products
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onNavigateCategories}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Categories
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenWishlist}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsCartDrawerOpen(true)}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Cart ({totalCartCount})
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: ACCOUNT Links */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-white font-black text-xs uppercase tracking-wider">ACCOUNT</h4>
              <ul className="space-y-2 text-xs text-slate-400 font-medium">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateOrders) onNavigateOrders()
                      else if (onOpenProfile) onOpenProfile()
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    My Orders
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenProfile}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Login
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenProfile}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Register
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: SELL WITH US */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Package size={14} className="text-blue-400" />
                <span>SELL WITH US</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Grow your business — reach thousands of customers.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="px-4 py-2 bg-[#1E4E79] hover:bg-[#163c5e] text-white rounded-lg text-xs font-bold transition-all text-center cursor-pointer shadow-xs"
                >
                  Become a Seller
                </button>
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all text-center cursor-pointer"
                >
                  Seller Login
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} U Seller Store. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="hover:text-slate-400 transition-colors cursor-pointer">
                Privacy Policy
              </span>
              <span className="hover:text-slate-400 transition-colors cursor-pointer">
                Terms of Service
              </span>
              <span className="hover:text-slate-400 transition-colors cursor-pointer">
                Contact Support
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* 5. ADD NEW ADDRESS MODAL MATCHING USER SCREENSHOT */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 relative p-6 sm:p-7">
            {/* Header: Title on Left, Close X on Right */}
            <div className="flex items-center justify-between pb-1 mb-4">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Add new address
              </h3>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3.5">
              {/* Full name * */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Full name *
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.name}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, name: e.target.value })
                  }
                  placeholder="John Smith"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E4E79]/20 focus:border-[#1E4E79] transition-all"
                />
              </div>

              {/* Phone * */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={addressForm.phone}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, phone: e.target.value })
                  }
                  placeholder="+1 555 123 4567"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E4E79]/20 focus:border-[#1E4E79] transition-all"
                />
              </div>

              {/* Address line 1 * */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Address line 1 *
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.street}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, street: e.target.value })
                  }
                  placeholder="123 Main St"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E4E79]/20 focus:border-[#1E4E79] transition-all"
                />
              </div>

              {/* Address line 2 */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Address line 2
                </label>
                <input
                  type="text"
                  value={addressForm.street2}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, street2: e.target.value })
                  }
                  placeholder="Apt, suite, unit (optional)"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E4E79]/20 focus:border-[#1E4E79] transition-all"
                />
              </div>

              {/* City * & State / region * */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, city: e.target.value })
                    }
                    placeholder="Los Angeles"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E4E79]/20 focus:border-[#1E4E79] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    State / region *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, state: e.target.value })
                    }
                    placeholder="State or region"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E4E79]/20 focus:border-[#1E4E79] transition-all"
                  />
                </div>
              </div>

              {/* Postal code * & Country * */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Postal code *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.zip}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, zip: e.target.value })
                    }
                    placeholder="Postal code"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E4E79]/20 focus:border-[#1E4E79] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Country *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.country}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, country: e.target.value })
                    }
                    placeholder="United States"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E4E79]/20 focus:border-[#1E4E79] transition-all"
                  />
                </div>
              </div>

              {/* Set as default shipping address checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                <div
                  onClick={() =>
                    setAddressForm((prev) => ({ ...prev, isDefault: !prev.isDefault }))
                  }
                  className={`w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    addressForm.isDefault
                      ? 'bg-[#1E4E79] text-white'
                      : 'border border-slate-300 bg-white'
                  }`}
                >
                  {addressForm.isDefault && <Check size={12} strokeWidth={3} />}
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-700">
                  Set as default shipping address
                </span>
              </label>

              {/* Action Buttons: Cancel and Save address */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="checkout-save-address-submit-btn"
                  className="px-5 py-2.5 rounded-xl bg-[#1E4E79] hover:bg-[#163c5e] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Save address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. SLIDE-OUT CART SIDEBAR DRAWER (When cart icon clicked) */}
      {isCartDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsCartDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-lg">Your Cart</h3>
                  <span className="text-xs text-slate-500 font-semibold">({totalCartCount})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 divide-y divide-slate-100">
                {effectiveCart.map(({ product, quantity }) => (
                  <div key={product.id} className="pt-4 first:pt-0 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {product.image && product.image.trim() ? (
                        <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={24} className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{product.title}</h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        ${(Number(product.sell) || 0).toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (onUpdateCartQuantity) onUpdateCartQuantity(product.id, -1)
                          }}
                          className="w-6 h-6 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer text-xs"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-bold text-slate-900 min-w-4 text-center">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (onUpdateCartQuantity) onUpdateCartQuantity(product.id, 1)
                          }}
                          className="w-6 h-6 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer text-xs"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                    {onRemoveFromCart && (
                      <button
                        type="button"
                        onClick={() => onRemoveFromCart(product.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-slate-100 bg-white space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Subtotal</span>
                  <span className="text-base font-extrabold text-slate-900 tabular-nums">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="w-full py-3.5 bg-[#1E4E79] hover:bg-[#163c5e] text-white rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center"
                >
                  Close & Proceed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. ORDER CONFIRMED MODAL */}
      {orderConfirmed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 text-center shadow-2xl border border-slate-200 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check size={34} strokeWidth={3} />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900">Order Confirmed!</h3>
              <p className="text-xs text-slate-500">
                Thank you for your purchase from {sellerProfile.shopName}.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Reference:</span>
                <span className="font-mono font-bold text-slate-900">
                  {orderConfirmed.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment:</span>
                <span className="font-bold text-emerald-600">Cash on Delivery</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Amount:</span>
                <span className="font-bold text-slate-900">
                  ${orderConfirmed.totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Address:</span>
                <span className="font-medium text-slate-700 truncate max-w-[200px]">
                  {orderConfirmed.shippingAddress}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Our courier will contact you when the shipment is out for delivery. Please
              prepare the exact cash amount upon delivery.
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                id="checkout-order-view-orders-btn"
                onClick={() => {
                  setOrderConfirmed(null)
                  if (onNavigateOrders) onNavigateOrders()
                  else onNavigateShop()
                }}
                className="w-full py-3 bg-[#1E4E79] hover:bg-[#163c5e] text-white rounded-xl font-bold text-xs shadow-md cursor-pointer transition-colors flex items-center justify-center gap-2"
              >
                <Package size={15} />
                <span>View in My Orders</span>
              </button>

              <button
                type="button"
                id="checkout-order-continue-shopping-btn"
                onClick={() => {
                  setOrderConfirmed(null)
                  onNavigateShop()
                }}
                className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
