'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Search,
  ShoppingCart,
  Heart,
  Star,
  Check,
  X,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  SlidersHorizontal,
  Eye,
  Sparkles,
  LayoutGrid,
  List,
  ChevronDown,
  ShoppingBag,
  ExternalLink,
  Store,
  Tag,
  CreditCard,
  Lock,
  Building2,
  PackageCheck,
  Trash2,
  Share2,
  CheckCircle2,
  AlertCircle,
  Printer,
  Clock
} from 'lucide-react'
import { Product, Order, SellerProfile } from '@/lib/mock-data'

export interface ShoppingDashboardProps {
  products: Product[]
  sellerProfile: SellerProfile
  onPlaceOrder?: (order: Order) => Promise<void> | void
  onSwitchToSeller?: () => void
  onSwitchToAdmin?: () => void
  onToast: (msg: string) => void
}

interface CartItem {
  product: Product
  quantity: number
}

export function ShoppingDashboard({
  products,
  sellerProfile,
  onPlaceOrder,
  onSwitchToSeller,
  onSwitchToAdmin,
  onToast,
}: ShoppingDashboardProps) {
  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [priceRange, setPriceRange] = useState<string>('all')
  const [inStockOnly, setInStockOnly] = useState<boolean>(false)
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest'>('featured')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Cart & Wishlist State
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('u_seller_cart')
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return []
  })
  const [wishlist, setWishlist] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('u_seller_wishlist')
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return []
  })

  // Modals State
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState<number>(0)
  const [promoApplied, setPromoApplied] = useState(false)

  // Order Tracking State
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false)
  const [trackQuery, setTrackQuery] = useState('')
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null)
  const [isSearchingTrack, setIsSearchingTrack] = useState(false)
  const [trackError, setTrackError] = useState('')
  const [recentOrderNumbers, setRecentOrderNumbers] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('u_recent_orders')
        if (stored) return JSON.parse(stored)
      } catch {}
    }
    return []
  })

  // Checkout Form State
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1)
  const [customerInfo, setCustomerInfo] = useState({
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    phone: '+1 (555) 482-9912',
    address: '452 Broadway Ave, Suite 4B',
    city: 'New York',
    state: 'NY',
    zip: '10013',
    paymentMethod: 'card' as 'card' | 'paypal' | 'crypto' | 'cod',
    cardNumber: '•••• •••• •••• 4242',
    cardExp: '12/28',
    cardCvc: '883',
  })
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

  // Sync Cart to LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('u_seller_cart', JSON.stringify(cart))
    }
  }, [cart])

  // Sync Wishlist to LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('u_seller_wishlist', JSON.stringify(wishlist))
    }
  }, [wishlist])

  // Extract Categories
  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return ['All', ...Array.from(set)]
  }, [products])

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: products.length }
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1
    })
    return counts
  }, [products])

  // Filter & Sort Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Search filter
        const query = searchQuery.toLowerCase().trim()
        const matchesSearch =
          !query ||
          product.title.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.sku?.toLowerCase().includes(query)

        // Category filter
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory

        // In Stock filter
        const matchesStock = !inStockOnly || Number(product.stock) > 0

        // Price range filter
        let matchesPrice = true
        const sell = Number(product.sell)
        if (priceRange === 'under25') matchesPrice = sell < 25
        else if (priceRange === '25to50') matchesPrice = sell >= 25 && sell <= 50
        else if (priceRange === '50to100') matchesPrice = sell > 50 && sell <= 100
        else if (priceRange === 'over100') matchesPrice = sell > 100

        return matchesSearch && matchesCategory && matchesStock && matchesPrice
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return Number(a.sell) - Number(b.sell)
        if (sortBy === 'price-desc') return Number(b.sell) - Number(a.sell)
        if (sortBy === 'newest') return b.id.localeCompare(a.id)
        if (sortBy === 'rating') return Number(b.stock) - Number(a.stock)
        // Default 'featured'
        return 0
      })
  }, [products, searchQuery, selectedCategory, priceRange, inStockOnly, sortBy])

  // Cart Calculations
  const totalCartItems = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0)
  }, [cart])

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + Number(item.product.sell) * item.quantity, 0)
  }, [cart])

  const shippingFee = subtotal > 65 || subtotal === 0 ? 0 : 4.99
  const taxAmount = Number((subtotal * 0.08).toFixed(2))
  const discountAmount = promoApplied ? Number((subtotal * promoDiscount).toFixed(2)) : 0
  const grandTotal = Number(Math.max(0, subtotal - discountAmount + shippingFee + taxAmount).toFixed(2))

  // Wishlist handler
  const toggleWishlist = (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setWishlist((prev) => {
      const exists = prev.includes(productId)
      if (exists) {
        onToast('Removed item from Wishlist')
        return prev.filter((id) => id !== productId)
      } else {
        onToast('Added item to Wishlist')
        return [...prev, productId]
      }
    })
  }

  // Cart operations
  const addToCart = (product: Product, quantity = 1, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (Number(product.stock) <= 0) {
      onToast('Sorry, this product is currently out of stock')
      return
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id)
      if (existingIndex > -1) {
        const updated = [...prev]
        const newQty = updated[existingIndex].quantity + quantity
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.min(newQty, Number(product.stock) || 99),
        }
        return updated
      } else {
        return [...prev, { product, quantity }]
      }
    })

    onToast(`Added "${product.title.slice(0, 20)}..." to Cart`)
  }

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter(Boolean) as CartItem[]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
    onToast('Item removed from cart')
  }

  const clearCart = () => {
    setCart([])
  }

  // Promo code handler
  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase()
    if (code === 'SAVE10' || code === 'WELCOME10' || code === 'SELLERSTORE') {
      setPromoDiscount(0.1)
      setPromoApplied(true)
      onToast('Promo code applied! 10% discount added.')
    } else {
      onToast('Invalid promo code. Try SAVE10')
    }
  }

  // Checkout order placement
  const handleCompleteCheckout = async () => {
    if (cart.length === 0) return
    setIsPlacingOrder(true)

    // Calculate total profit for the seller
    const orderProfit = cart.reduce((acc, item) => {
      const unitProfit = Math.max(0, Number(item.product.profit) || (Number(item.product.sell) - Number(item.product.cost)))
      return acc + unitProfit * item.quantity
    }, 0)

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber: '#ORD-' + Math.floor(10000 + Math.random() * 90000),
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      shippingAddress: `${customerInfo.address}, ${customerInfo.city}, ${customerInfo.state} ${customerInfo.zip}`,
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'paid',
      totalAmount: grandTotal,
      profit: Number(orderProfit.toFixed(2)),
      items: cart.map((c) => ({
        productTitle: c.product.title,
        quantity: c.quantity,
        price: Number(c.product.sell),
        image: c.product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80',
      })),
    }

    try {
      if (onPlaceOrder) {
        await onPlaceOrder(newOrder)
      }
      setCompletedOrder(newOrder)
      setRecentOrderNumbers((prev) => {
        const updated = [newOrder.orderNumber, ...prev.filter((n) => n !== newOrder.orderNumber)].slice(0, 5)
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('u_recent_orders', JSON.stringify(updated))
          }
        } catch {}
        return updated
      })
      clearCart()
      setIsCheckoutOpen(false)
      setIsCartOpen(false)
      onToast(`Order ${newOrder.orderNumber} successfully placed!`)
    } catch (err) {
      console.error('Order placement error:', err)
      onToast('Order placement failed. Please try again.')
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const handleSearchOrder = async (queryNum?: string) => {
    const target = (queryNum || trackQuery).trim()
    if (!target) return
    setIsSearchingTrack(true)
    setTrackError('')
    try {
      const res = await fetch(`/api/orders?orderNumber=${encodeURIComponent(target)}`)
      const data = await res.json()
      if (data.orders && data.orders.length > 0) {
        setTrackedOrder(data.orders[0])
      } else {
        // Check local storage orders fallback
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('u_seller_orders')
          if (saved) {
            const list: Order[] = JSON.parse(saved)
            const found = list.find((o) => o.orderNumber.toLowerCase().includes(target.toLowerCase()))
            if (found) {
              setTrackedOrder(found)
              return
            }
          }
        }
        setTrackError(`No order found matching "${target}". Check the reference number.`)
      }
    } catch (err) {
      setTrackError('Error querying database. Please try again.')
    } finally {
      setIsSearchingTrack(false)
    }
  }

  const fillDemoCustomer = () => {
    setCustomerInfo({
      name: 'Alexander Wright',
      email: 'alex.wright@example.com',
      phone: '+1 (415) 555-0198',
      address: '742 Evergreen Terrace',
      city: 'San Francisco',
      state: 'CA',
      zip: '94107',
      paymentMethod: 'card',
      cardNumber: '•••• •••• •••• 5591',
      cardExp: '08/27',
      cardCvc: '419',
    })
    onToast('Demo customer details pre-filled')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Banner: Trust & Announcements */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#0F52BA] to-[#0284C7] text-white py-2 px-4 text-xs font-medium">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
              Storefront
            </span>
            <span className="hidden sm:inline">
              Welcome to <strong>{sellerProfile.shopName}</strong> official storefront
            </span>
            <span className="sm:hidden">
              Official Storefront: <strong>{sellerProfile.shopName}</strong>
            </span>
            <span className="text-cyan-200 text-[11px]">• Free Express Delivery over $65</span>
          </div>

          <div className="flex items-center gap-3 text-xs ml-auto">
            {onSwitchToSeller && (
              <button
                type="button"
                id="shop-nav-seller-btn"
                onClick={onSwitchToSeller}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-md transition-all font-semibold cursor-pointer text-[11px]"
              >
                <Store size={13} />
                <span>Seller Console</span>
              </button>
            )}
            {onSwitchToAdmin && (
              <button
                type="button"
                id="shop-nav-admin-btn"
                onClick={onSwitchToAdmin}
                className="hidden md:flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-md transition-all font-semibold cursor-pointer text-[11px]"
              >
                <Building2 size={13} />
                <span>Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Brand & Store Identity */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0B192C] to-[#0F52BA] text-white flex items-center justify-center font-bold text-lg shadow-md ring-1 ring-black/10 shrink-0">
              {sellerProfile.avatarLetter || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-900 text-lg tracking-tight hover:text-blue-600 transition-colors">
                  {sellerProfile.shopName}
                </span>
                <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  <ShieldCheck size={11} className="text-emerald-600" /> Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                <span className="text-amber-500 font-bold flex items-center">
                  <Star size={11} className="fill-amber-400 stroke-amber-400 inline" /> {sellerProfile.rating || 5.0}
                </span>
                <span>• 100% Guaranteed Genuine • USA Shipping</span>
              </p>
            </div>
          </div>

          {/* Center Search Input (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-lg mx-4">
            <div className="relative w-full">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="shop-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across all products, electronics, health, apparel..."
                className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-100 hover:bg-slate-50 focus:bg-white text-sm border border-transparent focus:border-blue-500 focus:ring-3 focus:ring-blue-100 focus:outline-none transition-all placeholder:text-slate-400 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Right Actions: Wishlist & Cart */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Track Order Button */}
            <button
              type="button"
              id="shop-track-order-btn"
              onClick={() => {
                setIsTrackModalOpen(true)
                setTrackError('')
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer font-bold text-xs border border-slate-200 shadow-2xs"
              title="Track Your Order in Database"
            >
              <PackageCheck size={16} className="text-blue-600" />
              <span className="hidden sm:inline">Track Order</span>
            </button>

            {/* Wishlist Button */}
            <button
              type="button"
              id="shop-wishlist-toggle"
              onClick={() => {
                if (wishlist.length === 0) {
                  onToast('Your wishlist is currently empty')
                } else {
                  onToast(`You have ${wishlist.length} items saved in your wishlist`)
                }
              }}
              className="relative p-2.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
              title="Wishlist"
            >
              <Heart size={20} className={wishlist.length > 0 ? 'fill-rose-500 text-rose-500' : ''} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart Drawer Trigger */}
            <button
              type="button"
              id="shop-cart-open-btn"
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2.5 bg-gradient-to-r from-[#0B192C] to-[#0F52BA] hover:from-[#0F52BA] hover:to-[#0284C7] text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md shadow-blue-900/10 hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <div className="relative">
                <ShoppingCart size={18} />
                {totalCartItems > 0 && (
                  <span className="absolute -top-2.5 -right-2.5 bg-amber-400 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                    {totalCartItems}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">Cart</span>
              <span className="text-cyan-200 font-semibold text-xs border-l border-white/20 pl-2">
                ${subtotal.toFixed(2)}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="lg:hidden px-4 pb-3">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands, categories..."
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-slate-100 text-sm border border-transparent focus:border-blue-500 focus:bg-white focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Showcase Section */}
      <section className="bg-gradient-to-b from-slate-900 to-[#0B192C] text-white py-10 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold px-3 py-1 rounded-full">
                <Sparkles size={13} className="text-amber-300" />
                <span>Direct From Merchant • Fast Worldwide Fulfillment</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Shop Premium Collection at <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-400">{sellerProfile.shopName}</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
                Discover curated top-rated goods across wellness, electronics, tablets, home, pet accessories and outdoor gear. Hand-inspected and guaranteed authentic.
              </p>

              {/* Trust Value Badges */}
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-200 font-medium">
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
                  <Truck size={15} className="text-cyan-400" />
                  <span>2-Day US Fast Shipping</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
                  <RotateCcw size={15} className="text-emerald-400" />
                  <span>30-Day Easy Returns</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
                  <ShieldCheck size={15} className="text-amber-400" />
                  <span>Buyer Protection Guarantee</span>
                </div>
              </div>
            </div>

            {/* Hero Summary Card */}
            <div className="w-full md:w-80 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 text-white shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/15">
                <span className="text-xs uppercase tracking-wider text-cyan-200 font-bold">Catalog Overview</span>
                <span className="text-xs bg-emerald-500/30 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                  Live Stock
                </span>
              </div>
              <div className="py-4 space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-300">Total Products</span>
                  <span className="font-bold text-white text-base">{products.length} Items</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-300">Active Categories</span>
                  <span className="font-bold text-white text-base">{categories.length - 1} Categories</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-300">Customer Rating</span>
                  <span className="font-bold text-amber-300 flex items-center gap-1">
                    <Star size={14} className="fill-amber-300 inline" /> {sellerProfile.rating || 5.0} / 5.0
                  </span>
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  id="shop-view-all-btn"
                  onClick={() => {
                    setSelectedCategory('All')
                    setSearchQuery('')
                    const el = document.getElementById('products-section')
                    el?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer text-center block"
                >
                  Explore All Products ↓
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area: Category Bar, Filters, and Product Catalog */}
      <main id="products-section" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Horizontal Category Nav Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat
            return (
              <button
                key={cat}
                type="button"
                id={`shop-category-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-2 ring-blue-600 ring-offset-2'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-2xs'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {categoryCounts[cat] || 0}
                </span>
              </button>
            )
          })}
        </div>

        {/* Toolbar: Result Counts, Price Filter, Sort, and View Mode */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
            <span>Showing</span>
            <strong className="text-slate-900 font-bold">{filteredProducts.length}</strong>
            <span>of {products.length} products</span>
            {selectedCategory !== 'All' && (
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                {selectedCategory}
                <X size={12} className="cursor-pointer" onClick={() => setSelectedCategory('All')} />
              </span>
            )}
            {searchQuery && (
              <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                "{searchQuery}"
                <X size={12} className="cursor-pointer" onClick={() => setSearchQuery('')} />
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 ml-auto">
            {/* Price Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <label htmlFor="shop-price-select" className="text-slate-500 font-semibold hidden sm:inline">Price:</label>
              <select
                id="shop-price-select"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Prices</option>
                <option value="under25">Under $25</option>
                <option value="25to50">$25 to $50</option>
                <option value="50to100">$50 to $100</option>
                <option value="over100">$100 & Above</option>
              </select>
            </div>

            {/* In Stock Toggle */}
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer select-none bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>In Stock Only</span>
            </label>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <label htmlFor="shop-sort-select" className="text-slate-500 font-semibold hidden sm:inline">Sort:</label>
              <select
                id="shop-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="featured">Featured First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Stock / Popularity</option>
                <option value="newest">Newest Additions</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="List View"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Product Catalog Display */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <ShoppingBag size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">No matching products found</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                We couldn't find any products matching your current search or filters. Try clearing your filters to see all {products.length} products.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('All')
                setPriceRange('all')
                setInStockOnly(false)
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View Layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map((product) => {
              const isWishlisted = wishlist.includes(product.id)
              const inStock = Number(product.stock) > 0
              const isLowStock = inStock && Number(product.stock) < 15
              const originalMSRP = Number((Number(product.sell) * 1.25).toFixed(2))
              const discountPercent = Math.round(((originalMSRP - Number(product.sell)) / originalMSRP) * 100)

              return (
                <div
                  key={product.id}
                  id={`product-card-${product.id}`}
                  className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative"
                >
                  {/* Image Container with Badges & Overlays */}
                  <div className="relative aspect-square bg-slate-100 overflow-hidden cursor-pointer">
                    <img
                      src={
                        product.image ||
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80'
                      }
                      alt={product.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onClick={() => setQuickViewProduct(product)}
                    />

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                      <span className="bg-[#0B192C]/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                        {product.category}
                      </span>
                      {discountPercent > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-xs w-fit">
                          {discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    {/* Wishlist Toggle Button */}
                    <button
                      type="button"
                      onClick={(e) => toggleWishlist(product.id, e)}
                      className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all z-10 cursor-pointer ${
                        isWishlisted
                          ? 'bg-white text-rose-500 shadow-md scale-110'
                          : 'bg-white/80 hover:bg-white text-slate-600 hover:text-rose-500 shadow-xs'
                      }`}
                      title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <Heart size={16} className={isWishlisted ? 'fill-rose-500' : ''} />
                    </button>

                    {/* Quick View Button Hover Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-slate-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setQuickViewProduct(product)}
                        className="bg-white/95 hover:bg-white text-slate-900 px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md hover:scale-105 transition-transform cursor-pointer"
                      >
                        <Eye size={14} />
                        <span>Quick View</span>
                      </button>
                    </div>

                    {/* Out of Stock Overlay */}
                    {!inStock && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-10">
                        <span className="bg-rose-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      {/* Rating & Stock pill */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star size={13} className="fill-amber-400 stroke-amber-400" />
                          <span>4.8</span>
                          <span className="text-slate-400 font-normal">({Number(product.stock) * 3 + 18})</span>
                        </div>
                        {inStock ? (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isLowStock
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {isLowStock ? `Only ${product.stock} left` : 'In Stock'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                            Sold Out
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4
                        onClick={() => setQuickViewProduct(product)}
                        className="font-bold text-slate-900 text-sm hover:text-blue-600 line-clamp-2 cursor-pointer transition-colors leading-snug"
                        title={product.title}
                      >
                        {product.title}
                      </h4>

                      {/* SKU */}
                      <p className="text-[11px] text-slate-400 font-mono">SKU: {product.sku || 'SKU-GEN'}</p>
                    </div>

                    {/* Price & Action Row */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-slate-900">
                            ${Number(product.sell).toFixed(2)}
                          </span>
                          <span className="text-xs text-slate-400 line-through">
                            ${originalMSRP.toFixed(2)}
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-semibold block">
                          Free Shipping eligible
                        </span>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        type="button"
                        id={`add-to-cart-${product.id}`}
                        disabled={!inStock}
                        onClick={(e) => addToCart(product, 1, e)}
                        className={`p-2.5 rounded-xl font-bold transition-all flex items-center justify-center cursor-pointer ${
                          inStock
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md hover:scale-105 active:scale-95'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                        title={inStock ? 'Add to cart' : 'Out of stock'}
                      >
                        <ShoppingCart size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* List View Layout */
          <div className="space-y-4">
            {filteredProducts.map((product) => {
              const inStock = Number(product.stock) > 0
              const isWishlisted = wishlist.includes(product.id)
              const originalMSRP = Number((Number(product.sell) * 1.25).toFixed(2))

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-center gap-5"
                >
                  <div
                    className="w-full sm:w-40 aspect-square sm:h-36 rounded-xl bg-slate-100 overflow-hidden relative shrink-0 cursor-pointer"
                    onClick={() => setQuickViewProduct(product)}
                  >
                    <img
                      src={
                        product.image ||
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80'
                      }
                      alt={product.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                    <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {product.category}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500 text-xs font-bold flex items-center gap-1">
                          <Star size={13} className="fill-amber-400 stroke-amber-400" /> 4.8
                        </span>
                        <span className="text-xs text-slate-400 font-mono">• {product.sku}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          inStock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {inStock ? `In Stock (${product.stock})` : 'Out of stock'}
                      </span>
                    </div>

                    <h4
                      onClick={() => setQuickViewProduct(product)}
                      className="font-bold text-slate-900 text-base hover:text-blue-600 cursor-pointer transition-colors"
                    >
                      {product.title}
                    </h4>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      High-grade commercial quality product distributed directly from {sellerProfile.shopName}. Backed by 30-day return policy and full manufacturer warranty.
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-slate-900">${Number(product.sell).toFixed(2)}</span>
                        <span className="text-xs text-slate-400 line-through">${originalMSRP.toFixed(2)}</span>
                        <span className="text-xs font-bold text-emerald-600">Save 20%</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleWishlist(product.id)}
                          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                            isWishlisted
                              ? 'border-rose-300 text-rose-600 bg-rose-50'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Heart size={16} className={isWishlisted ? 'fill-rose-500' : ''} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickViewProduct(product)}
                          className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye size={14} /> Details
                        </button>
                        <button
                          type="button"
                          disabled={!inStock}
                          onClick={() => addToCart(product, 1)}
                          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                            inStock
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <ShoppingCart size={15} /> Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Slide-over Shopping Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              {/* Cart Drawer Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <ShoppingCart size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Your Shopping Cart</h3>
                    <p className="text-xs text-slate-500">{totalCartItems} item(s) selected</p>
                  </div>
                </div>
                <button
                  type="button"
                  id="close-cart-btn"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <ShoppingBag size={28} />
                    </div>
                    <h4 className="font-bold text-slate-800 text-base">Your cart is empty</h4>
                    <p className="text-xs text-slate-500 max-w-xs">
                      Looks like you haven't added any products to your cart yet. Explore our catalog and add what you love!
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsCartOpen(false)}
                      className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-700 cursor-pointer"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  cart.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80"
                    >
                      <img
                        src={
                          product.image ||
                          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80'
                        }
                        alt={product.title}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                      />

                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-xs text-slate-900 truncate" title={product.title}>
                          {product.title}
                        </h5>
                        <p className="text-[11px] text-slate-500 font-medium">
                          ${Number(product.sell).toFixed(2)} each
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(product.id, -1)}
                              className="p-1 hover:bg-slate-100 text-slate-600 cursor-pointer"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="px-2 text-xs font-bold text-slate-800 tabular-nums">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(product.id, 1)}
                              className="p-1 hover:bg-slate-100 text-slate-600 cursor-pointer"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <span className="text-xs font-black text-slate-900 ml-auto tabular-nums">
                            ${(Number(product.sell) * quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer / Checkout Summary */}
              {cart.length > 0 && (
                <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3">
                  {/* Promo Code Input */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Promo Code (Try: SAVE10)"
                        disabled={promoApplied}
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={promoApplied || !promoCode.trim()}
                      onClick={handleApplyPromo}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      {promoApplied ? 'Applied' : 'Apply'}
                    </button>
                  </div>

                  {/* Calculations */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
                    </div>
                    {promoApplied && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Promo Discount (10%)</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Shipping</span>
                      <span>
                        {shippingFee === 0 ? (
                          <strong className="text-emerald-600 font-bold">FREE</strong>
                        ) : (
                          `$${shippingFee.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Estimated Tax (8%)</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                      <span>Total Amount</span>
                      <span className="text-blue-600 text-base">${grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    type="button"
                    id="cart-proceed-checkout-btn"
                    onClick={() => {
                      setIsCartOpen(false)
                      setIsCheckoutOpen(true)
                    }}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight size={16} />
                  </button>

                  <p className="text-[10px] text-center text-slate-400 font-medium flex items-center justify-center gap-1">
                    <Lock size={11} /> 256-bit Encrypted Secure Checkout
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              id="close-quickview-btn"
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors z-10 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8">
              {/* Product Imagery */}
              <div className="space-y-3">
                <div className="aspect-square rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                  <img
                    src={
                      quickViewProduct.image ||
                      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80'
                    }
                    alt={quickViewProduct.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-xl bg-slate-100 border border-slate-200 overflow-hidden opacity-80 hover:opacity-100 cursor-pointer"
                    >
                      <img
                        src={quickViewProduct.image}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Specifications & Purchase Form */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      {quickViewProduct.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      SKU: {quickViewProduct.sku || 'N/A'}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                    {quickViewProduct.title}
                  </h3>

                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={15} className="fill-amber-400 stroke-amber-400" />
                      ))}
                    </div>
                    <span className="font-bold text-slate-800">4.9</span>
                    <span className="text-slate-400 text-xs">(84 verified reviews)</span>
                  </div>

                  {/* Price */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-baseline gap-3">
                    <span className="text-3xl font-black text-slate-900">
                      ${Number(quickViewProduct.sell).toFixed(2)}
                    </span>
                    <span className="text-sm text-slate-400 line-through">
                      ${(Number(quickViewProduct.sell) * 1.25).toFixed(2)}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-md ml-auto">
                      Save 20%
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Genuine official item supplied directly by <strong>{sellerProfile.shopName}</strong>. Manufactured using high quality commercial materials, guaranteed authenticity, and backed by comprehensive customer support.
                  </p>

                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span>In Stock & Ready to Ship ({quickViewProduct.stock} units available)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck size={14} className="text-blue-500" />
                      <span>Free Standard Shipping on Orders Over $65</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RotateCcw size={14} className="text-purple-500" />
                      <span>Hassle-free 30-Day Money-Back Guarantee</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      id="quickview-add-cart-btn"
                      onClick={() => {
                        addToCart(quickViewProduct, 1)
                        setQuickViewProduct(null)
                        setIsCartOpen(true)
                      }}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <ShoppingCart size={17} />
                      <span>Add to Cart</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleWishlist(quickViewProduct.id)}
                      className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 cursor-pointer"
                      title="Wishlist"
                    >
                      <Heart
                        size={18}
                        className={wishlist.includes(quickViewProduct.id) ? 'fill-rose-500 text-rose-500' : ''}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-600 text-white">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Secure Checkout</h3>
                  <p className="text-xs text-slate-500">Order from {sellerProfile.shopName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="checkout-demo-fill-btn"
                  onClick={fillDemoCustomer}
                  className="px-2.5 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold border border-blue-200 cursor-pointer"
                >
                  ⚡ Auto-Fill Demo Details
                </button>
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Items Mini Summary */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Items in Order ({totalCartItems})</span>
                  <span className="text-blue-600 font-extrabold text-sm">${grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex gap-2 overflow-x-auto py-1">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs shrink-0"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.title}
                        className="w-7 h-7 rounded-md object-cover"
                      />
                      <span className="font-bold text-slate-800 truncate max-w-[120px]">
                        {item.product.title}
                      </span>
                      <span className="text-slate-500 font-mono">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address Information */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Truck size={16} className="text-blue-600" />
                  <span>1. Shipping Information</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      id="checkout-name-input"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      id="checkout-email-input"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      id="checkout-address-input"
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={customerInfo.city}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                      <input
                        type="text"
                        value={customerInfo.state}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, state: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Zip Code</label>
                      <input
                        type="text"
                        value={customerInfo.zip}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, zip: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard size={16} className="text-blue-600" />
                  <span>2. Payment Details</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'card', label: 'Credit Card' },
                    { id: 'paypal', label: 'PayPal' },
                    { id: 'crypto', label: 'USDT / Crypto' },
                    { id: 'cod', label: 'Cash On Delivery' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setCustomerInfo({ ...customerInfo, paymentMethod: m.id as any })}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        customerInfo.paymentMethod === m.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/30'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {customerInfo.paymentMethod === 'card' && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Card Number</label>
                      <input
                        type="text"
                        value={customerInfo.cardNumber}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, cardNumber: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Expires</label>
                        <input
                          type="text"
                          value={customerInfo.cardExp}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, cardExp: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">CVC</label>
                        <input
                          type="text"
                          value={customerInfo.cardCvc}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, cardCvc: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Place Order CTA */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-left w-full sm:w-auto">
                  <span className="text-xs text-slate-500 block">Total to Pay:</span>
                  <span className="text-2xl font-black text-slate-900">${grandTotal.toFixed(2)}</span>
                </div>

                <button
                  type="button"
                  id="checkout-place-order-btn"
                  disabled={isPlacingOrder}
                  onClick={handleCompleteCheckout}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isPlacingOrder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Order...</span>
                    </>
                  ) : (
                    <>
                      <PackageCheck size={18} />
                      <span>Place Order (${grandTotal.toFixed(2)})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Success Confirmation Modal */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <Check size={32} strokeWidth={3} />
            </div>

            <div className="space-y-1">
              <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Order Confirmed
              </span>
              <h3 className="text-2xl font-black text-slate-900">Thank You For Your Order!</h3>
              <p className="text-xs text-slate-500">
                A confirmation receipt has been sent to <strong>{completedOrder.customerEmail}</strong>
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Reference:</span>
                <span className="font-mono font-bold text-slate-900">{completedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Charged:</span>
                <span className="font-bold text-blue-600">${completedOrder.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Delivery:</span>
                <span className="font-bold text-slate-800">2 - 3 Business Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Deliver To:</span>
                <span className="font-medium text-slate-700 truncate max-w-[200px]">
                  {completedOrder.shippingAddress}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                id="order-success-track-btn"
                onClick={() => {
                  setTrackedOrder(completedOrder)
                  setIsTrackModalOpen(true)
                  setCompletedOrder(null)
                }}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <PackageCheck size={14} />
                <span>Track This Order Live in Database</span>
              </button>

              <button
                type="button"
                id="order-success-continue-btn"
                onClick={() => setCompletedOrder(null)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer transition-colors"
              >
                Continue Shopping
              </button>

              {onSwitchToSeller && (
                <button
                  type="button"
                  id="order-success-view-seller-btn"
                  onClick={() => {
                    setCompletedOrder(null)
                    onSwitchToSeller()
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <Store size={14} />
                  <span>View in Seller Orders Tab</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer Order Tracking Modal */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600 text-white">
                  <PackageCheck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">Live Order Tracker</h3>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      PostgreSQL Database
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Query and track order status directly from the live database</p>
                </div>
              </div>
              <button
                type="button"
                id="close-track-modal-btn"
                onClick={() => {
                  setIsTrackModalOpen(false)
                  setTrackedOrder(null)
                  setTrackQuery('')
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Search Bar */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Enter Order Reference Number:</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      id="track-order-input"
                      value={trackQuery}
                      onChange={(e) => setTrackQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchOrder()}
                      placeholder="e.g. #ORD-59176 or #ORD-22041"
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    id="track-order-submit-btn"
                    disabled={isSearchingTrack}
                    onClick={() => handleSearchOrder()}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSearchingTrack ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Search size={14} />
                    )}
                    <span>Look Up</span>
                  </button>
                </div>

                {/* Quick select recent orders chips */}
                {recentOrderNumbers.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-400 font-medium">Recent Orders:</span>
                    {recentOrderNumbers.map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setTrackQuery(num)
                          handleSearchOrder(num)
                        }}
                        className="text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 font-mono font-semibold px-2 py-0.5 rounded-md text-slate-600 transition-colors cursor-pointer border border-slate-200/60"
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                )}

                {trackError && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    <AlertCircle size={14} /> {trackError}
                  </p>
                )}
              </div>

              {/* Order Status Display */}
              {trackedOrder ? (
                <div className="space-y-5 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                  {/* Order Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Order Reference</span>
                      <h4 className="text-lg font-black text-slate-900 font-mono">{trackedOrder.orderNumber}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                        {trackedOrder.status.replace(/_/g, ' ')}
                      </span>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
                        title="Print receipt"
                      >
                        <Printer size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Visual Tracker Timeline */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Fulfillment Timeline</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      {[
                        { step: 1, title: 'Order Recorded', desc: 'Saved to Database', done: true, icon: CheckCircle2 },
                        { step: 2, title: 'Payment Confirmed', desc: `$${trackedOrder.totalAmount.toFixed(2)} Paid`, done: true, icon: CheckCircle2 },
                        { step: 3, title: 'Warehouse Processing', desc: 'Quality Check', done: ['pickup', 'on_the_way', 'out_for_delivery', 'delivered'].includes(trackedOrder.status), icon: Clock },
                        { step: 4, title: 'Out For Delivery', desc: 'Arriving in 2 Days', done: ['out_for_delivery', 'delivered'].includes(trackedOrder.status), icon: Truck },
                      ].map((s) => {
                        const Icon = s.icon
                        return (
                          <div
                            key={s.step}
                            className={`p-3 rounded-xl border transition-all ${
                              s.done
                                ? 'bg-white border-emerald-300 text-slate-900 shadow-2xs'
                                : 'bg-slate-100 border-slate-200 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center justify-center mb-1">
                              <Icon size={16} className={s.done ? 'text-emerald-500' : 'text-slate-400'} />
                            </div>
                            <strong className="block text-[11px] font-bold leading-tight">{s.title}</strong>
                            <span className="text-[10px] text-slate-500 block mt-0.5">{s.desc}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Customer & Shipping Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 block font-semibold">Recipient:</span>
                      <strong className="text-slate-800">{trackedOrder.customerName}</strong>
                      <span className="text-slate-500 block">{trackedOrder.customerEmail}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Delivery Address:</span>
                      <span className="text-slate-700 font-medium">{trackedOrder.shippingAddress}</span>
                    </div>
                  </div>

                  {/* Items Ordered List */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Ordered Products ({trackedOrder.items.length})
                    </span>
                    <div className="space-y-1.5">
                      {trackedOrder.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={
                                item.image ||
                                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80'
                              }
                              alt={item.productTitle}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <strong className="text-slate-900 block truncate max-w-[240px]">
                                {item.productTitle}
                              </strong>
                              <span className="text-slate-400">Qty: {item.quantity}</span>
                            </div>
                          </div>
                          <span className="font-bold text-slate-900 tabular-nums">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total Paid Row */}
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-600">Total Recorded in Database:</span>
                    <span className="text-xl font-black text-blue-600">${trackedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 space-y-2">
                  <Clock size={28} className="mx-auto text-slate-300" />
                  <p className="text-xs">Enter your order reference above or pick a recent order to view live database status.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-8 px-4 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-[#0B192C] text-white flex items-center justify-center font-bold text-xs">
              U
            </div>
            <span className="font-bold text-slate-800">U Seller Store</span>
            <span>• Powered by official merchant infrastructure</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hover:text-slate-800 cursor-pointer">Buyer Protection</span>
            <span className="hover:text-slate-800 cursor-pointer">Shipping Rates</span>
            <span className="hover:text-slate-800 cursor-pointer">Privacy & Terms</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
