'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Search,
  ShoppingCart,
  Heart,
  Bell,
  User,
  Star,
  Check,
  X,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
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
  Package,
  LogOut,
  Trash2,
  Printer,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { Product, Order, SellerProfile, shopCategories } from '@/lib/mock-data'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { CustomerAccountPortal, AccountTab } from './CustomerAccountPortal'

export interface ShoppingDashboardProps {
  products: Product[]
  sellerProfile: SellerProfile
  initialNavTab?: 'home' | 'shop' | 'categories'
  initialAccountTab?: AccountTab | null
  onPlaceOrder?: (order: Order) => Promise<void> | void
  onSwitchToSeller?: () => void
  onSwitchToAdmin?: () => void
  onToast: (msg: string) => void
}

interface CartItem {
  product: Product
  quantity: number
}

// 6 Featured Carousel Slides
const heroSlides = [
  {
    id: 1,
    tag: 'NEW ARRIVALS',
    title: 'Elevate your everyday lifestyle',
    cta: 'Discover collection',
    category: 'All',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 2,
    tag: 'HOME & LIVING',
    title: 'Made for everyday comfort',
    cta: 'Shop the look',
    category: 'Home & Kitchen',
    image: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 3,
    tag: 'ELECTRONICS & SOUND',
    title: 'Pure acoustics, all day long',
    cta: 'Explore sound',
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 4,
    tag: 'ACTIVEWEAR & APPAREL',
    title: 'Designed for flexibility and style',
    cta: 'Shop essentials',
    category: 'Under Garments',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 5,
    tag: 'WELLNESS & SUPPORT',
    title: 'Engineered for healthy movement',
    cta: 'Shop wellness',
    category: 'Health & Wellness',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1920&q=85',
  },
  {
    id: 6,
    tag: 'SMART TECH & TABLETS',
    title: 'Next-generation power in your hands',
    cta: 'View tablets',
    category: 'Tablets',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1920&q=85',
  },
]

// Visual Categories Showcase matching the reference design
const visualCategories = [
  {
    id: 'cat-sweaters',
    title: 'Sweaters',
    categoryName: 'Apparel',
    bgColor: '#F5ECE5',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'cat-women',
    title: 'Fashion',
    categoryName: 'Fashion',
    bgColor: '#FFF9F2',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'cat-electronics',
    title: 'Electronics',
    categoryName: 'Electronics',
    bgColor: '#F1F5F9',
    image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'cat-activewear',
    title: 'Under Garments',
    categoryName: 'Under Garments',
    bgColor: '#FCECEE',
    image: 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'cat-bags',
    title: 'Accessories',
    categoryName: 'Home & Kitchen',
    bgColor: '#FBF0DC',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'cat-jewelry',
    title: 'Jewelry',
    categoryName: 'Health & Wellness',
    bgColor: '#FBF6EE',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'cat-audio',
    title: 'Smart Tech',
    categoryName: 'Electronics',
    bgColor: '#EBF3FC',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'cat-tablets',
    title: 'Tablets',
    categoryName: 'Tablets',
    bgColor: '#F3F4F6',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=500&q=80',
  },
]

export function ShoppingDashboard({
  products,
  sellerProfile,
  initialNavTab = 'shop',
  initialAccountTab = null,
  onPlaceOrder,
  onSwitchToSeller,
  onSwitchToAdmin,
  onToast,
}: ShoppingDashboardProps) {
  // Navigation & Carousel State
  const [activeNavTab, setActiveNavTab] = useState<'home' | 'shop' | 'categories'>(initialNavTab)
  const [accountTab, setAccountTab] = useState<AccountTab | null>(initialAccountTab)
  const [currentSlide, setCurrentSlide] = useState(1) // Default to slide 2 ("02 / 06 - Made for everyday comfort")
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [priceRange, setPriceRange] = useState<string>('all')
  const [inStockOnly, setInStockOnly] = useState<boolean>(false)
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest'>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  // Cart & Wishlist State (SSR-safe)
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [recentOrderNumbers, setRecentOrderNumbers] = useState<string[]>([])
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [isMounted, setIsMounted] = useState(false)

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

  // Checkout Form State
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

  // Load from localStorage on client mount
  useEffect(() => {
    setIsMounted(true)
    try {
      if (typeof window !== 'undefined') {
        const savedCart = localStorage.getItem('u_seller_cart')
        if (savedCart) {
          const parsed = JSON.parse(savedCart)
          if (Array.isArray(parsed)) setCart(parsed)
        }
        const savedWish = localStorage.getItem('u_seller_wishlist')
        if (savedWish) {
          const parsed = JSON.parse(savedWish)
          if (Array.isArray(parsed)) setWishlist(parsed)
        }
        const savedOrders = localStorage.getItem('u_recent_orders')
        if (savedOrders) {
          const parsed = JSON.parse(savedOrders)
          if (Array.isArray(parsed)) setRecentOrderNumbers(parsed)
        }
        const savedAllOrders = localStorage.getItem('u_seller_orders')
        if (savedAllOrders) {
          const parsed = JSON.parse(savedAllOrders)
          if (Array.isArray(parsed)) setAllOrders(parsed)
        }
      }
    } catch {}
  }, [])

  // Sync Cart to LocalStorage
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      localStorage.setItem('u_seller_cart', JSON.stringify(cart))
    }
  }, [cart, isMounted])

  // Sync Wishlist to LocalStorage
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      localStorage.setItem('u_seller_wishlist', JSON.stringify(wishlist))
    }
  }, [wishlist, isMounted])

  // Extract Distinct Categories
  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return ['All', ...Array.from(set)]
  }, [products])

  // Filter & Sort Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const query = searchQuery.toLowerCase().trim()
        const matchesSearch =
          !query ||
          product.title.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.sku?.toLowerCase().includes(query)

        const matchesCategory =
          selectedCategory === 'All' ||
          product.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          selectedCategory.toLowerCase().includes(product.category.toLowerCase())

        const matchesStock = !inStockOnly || Number(product.stock) > 0

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
        if (sortBy === 'rating') return (Number(b.rating) || 0) - (Number(a.rating) || 0)
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

  // Checkout order placement with database persistence
  const handleCompleteCheckout = async () => {
    if (cart.length === 0) return
    setIsPlacingOrder(true)

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
      setAllOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)])
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
      onToast(`Order ${newOrder.orderNumber} successfully placed and recorded in database!`)
    } catch (err) {
      console.error('Order placement error:', err)
      onToast('Order placement failed. Please try again.')
    } finally {
      setIsPlacingOrder(false)
    }
  }

  // Database Order Lookup
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

  // Carousel handlers
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1))
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1))
  }

  const activeSlideData = heroSlides[currentSlide]

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      {/* 1. TOP NAVIGATION BAR (Matching User Reference Image) */}
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur-md border-b border-slate-100 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 lg:gap-8">
          {/* Logo & Main Nav Links */}
          <div className="flex items-center gap-6 lg:gap-8 shrink-0">
            {/* Official U Seller Store Logo */}
            <BrandLogo size="md" onClick={() => {
              setAccountTab(null)
              setActiveNavTab('shop')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }} />

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold" aria-label="Main Store Navigation">
              <button
                type="button"
                id="nav-link-home"
                onClick={() => {
                  setAccountTab(null)
                  setActiveNavTab('home')
                  setSelectedCategory('All')
                  setSearchQuery('')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className={`transition-colors cursor-pointer ${
                  !accountTab && activeNavTab === 'home'
                    ? 'text-slate-950 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Home
              </button>
              <button
                type="button"
                id="nav-link-shop"
                onClick={() => {
                  setAccountTab(null)
                  setActiveNavTab('shop')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className={`transition-colors cursor-pointer ${
                  !accountTab && activeNavTab === 'shop'
                    ? 'text-slate-950 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Shop
              </button>
              <button
                type="button"
                id="nav-link-categories"
                onClick={() => {
                  setAccountTab(null)
                  setActiveNavTab('shop')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
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
                id="shop-search-input"
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

          {/* Right Action Icons (Heart, Bell, Cart with orange badge, User) */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Wishlist Heart Icon */}
            <button
              type="button"
              id="header-wishlist-btn"
              onClick={() => {
                setAccountTab('wishlist')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="p-1.5 text-slate-700 hover:text-rose-600 transition-colors relative cursor-pointer"
              title="Wishlist"
              aria-label="Wishlist"
            >
              <Heart size={20} className={wishlist.length > 0 ? 'fill-rose-500 text-rose-500' : ''} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Notifications Bell Icon */}
            <button
              type="button"
              id="header-notifications-btn"
              onClick={() => setIsTrackModalOpen(true)}
              className="p-1.5 text-slate-700 hover:text-blue-600 transition-colors relative cursor-pointer"
              title="Track Orders & Notifications"
              aria-label="Notifications"
            >
              <Bell size={20} />
            </button>

            {/* Shopping Cart with Signature Orange Badge (e.g. "1") */}
            <button
              type="button"
              id="header-cart-btn"
              onClick={() => {
                setAccountTab('cart')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="p-1.5 text-slate-700 hover:text-slate-900 transition-colors relative cursor-pointer group"
              title="Shopping Cart"
              aria-label="Shopping Cart"
            >
              <ShoppingCart size={21} className="group-hover:scale-105 transition-transform" />
              {isMounted && totalCartItems > 0 && (
                <span
                  suppressHydrationWarning
                  className="absolute -top-1.5 -right-1.5 bg-[#F97316] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs"
                >
                  {totalCartItems}
                </span>
              )}
            </button>

            {/* User Profile / Portal Menu Icon Matching Screenshot 1 */}
            <div className="relative">
              <button
                type="button"
                id="header-user-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-1.5 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer rounded-full hover:bg-slate-100"
                title="Account Menu"
                aria-label="Account Menu"
              >
                <User size={21} />
              </button>

              {/* User Dropdown Portal Switcher Matching Screenshot 1 */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-10 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs space-y-0.5 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <span className="block text-slate-900 font-bold text-xs truncate">
                      usellerstore.us@gmail.com
                    </span>
                  </div>

                  <button
                    type="button"
                    id="dropdown-menu-profile"
                    onClick={() => {
                      setAccountTab('profile')
                      setIsUserMenuOpen(false)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 font-medium text-slate-700 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <User size={16} className="text-slate-500" />
                    <span>Profile</span>
                  </button>

                  <button
                    type="button"
                    id="dropdown-menu-orders"
                    onClick={() => {
                      setAccountTab('orders')
                      setIsUserMenuOpen(false)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 font-medium text-slate-700 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <Package size={16} className="text-slate-500" />
                    <span>My Orders</span>
                  </button>

                  <button
                    type="button"
                    id="dropdown-menu-wishlist"
                    onClick={() => {
                      setAccountTab('wishlist')
                      setIsUserMenuOpen(false)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 font-medium text-slate-700 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <Heart size={16} className="text-slate-500" />
                    <span>Wishlist</span>
                  </button>

                  <div className="border-t border-slate-100 my-1 pt-1">
                    <button
                      type="button"
                      id="dropdown-menu-logout"
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        onToast('Logged out of usellerstore.us@gmail.com')
                        setAccountTab(null)
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 font-medium text-slate-700 hover:text-rose-600 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <LogOut size={16} className="text-slate-500" />
                      <span>Logout</span>
                    </button>
                  </div>

                  {/* Seller Console / Admin Portal Switcher */}
                  {(onSwitchToSeller || onSwitchToAdmin) && (
                    <div className="border-t border-slate-100 pt-1 mt-1 space-y-1">
                      {onSwitchToSeller && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false)
                            onSwitchToSeller()
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-blue-50 font-medium text-blue-700 flex items-center gap-2 cursor-pointer text-[11px]"
                        >
                          <Store size={13} />
                          <span>Seller Console</span>
                        </button>
                      )}
                      {onSwitchToAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false)
                            onSwitchToAdmin()
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-purple-50 font-medium text-purple-700 flex items-center gap-2 cursor-pointer text-[11px]"
                        >
                          <Building2 size={13} />
                          <span>Admin Panel</span>
                        </button>
                      )}
                    </div>
                  )}
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

      {accountTab !== null ? (
        <CustomerAccountPortal
          activeTab={accountTab}
          onSelectTab={(tab) => {
            setAccountTab(tab)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          onNavigate={(dest) => {
            setAccountTab(null)
            if (dest === 'home') {
              setActiveNavTab('home')
            } else {
              setActiveNavTab('shop')
            }
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          onBecomeSeller={() => {
            if (onSwitchToSeller) onSwitchToSeller()
            else onToast('Opening Merchant Onboarding & Seller Portal')
          }}
          onSellerLogin={() => {
            if (onSwitchToSeller) onSwitchToSeller()
            else onToast('Opening Seller Console')
          }}
          cart={cart}
          wishlist={wishlist}
          products={products}
          recentOrders={allOrders}
          onUpdateCartQuantity={updateCartQuantity}
          onRemoveFromCart={removeFromCart}
          onAddToCart={(prod, qty) => addToCart(prod, qty)}
          onToggleWishlist={toggleWishlist}
          onOpenCheckout={() => setIsCheckoutOpen(true)}
          onTrackOrder={(orderNum) => {
            if (orderNum) {
              setTrackQuery(orderNum)
              handleSearchOrder(orderNum)
            }
            setIsTrackModalOpen(true)
          }}
          onToast={onToast}
        />
      ) : activeNavTab === 'shop' ? (
        /* SHOP CATALOG VIEW MATCHING USER SCREENSHOT */
        <section id="shop-catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
          <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
            {/* Left Sidebar: Categories (Matching Screenshot) */}
            <aside className="w-full md:w-52 lg:w-56 shrink-0">
              <div className="sticky top-24 space-y-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight px-1 mb-3">Categories</h3>
                <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none">
                  {shopCategories.map((cat) => {
                    const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase()
                    return (
                      <button
                        key={cat}
                        type="button"
                        id={`shop-category-${cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full text-left px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                          isSelected
                            ? 'bg-[#E2E8F0]/70 text-slate-900 font-semibold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>
            </aside>

            {/* Right Content: All Products (5002) + 6-Column Grid */}
            <div className="flex-1 min-w-0 w-full space-y-5">
              {/* Header: All Products (5002) and Sort Dropdown */}
              <div className="flex items-center justify-between pb-3 pt-1 border-b border-slate-100">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-baseline gap-2">
                  <span>{selectedCategory === 'All' ? 'All Products' : selectedCategory}</span>
                  <span className="text-xs sm:text-sm font-normal text-slate-400">
                    ({filteredProducts.length})
                  </span>
                </h1>

                <div className="flex items-center gap-2">
                  <select
                    id="shop-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                  >
                    <option value="newest">Newest</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                    <option value="featured">Featured</option>
                  </select>
                </div>
              </div>

              {/* 6-Column Responsive Product Cards Grid */}
              {filteredProducts.length === 0 ? (
                <div className="bg-slate-50 rounded-3xl border border-slate-200 p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mx-auto text-slate-400">
                    <ShoppingBag size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">No matching products found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try adjusting your category or search term to discover more items from our catalog.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedCategory('All')
                    }}
                    className="px-5 py-2.5 bg-[#0F52BA] text-white rounded-full text-xs font-bold shadow-xs cursor-pointer hover:bg-blue-700"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-3.5">
                  {filteredProducts.map((product) => {
                    const isWishlisted = wishlist.includes(product.id)
                    const inStock = Number(product.stock) > 0
                    const discount =
                      product.discountPercent ||
                      (product.originalPrice
                        ? Math.round(((product.originalPrice - Number(product.sell)) / product.originalPrice) * 100)
                        : 0)
                    const origPrice = product.originalPrice
                    const ratingVal = product.rating || 4.7
                    const reviewNum = product.reviewCount || 26

                    return (
                      <div
                        key={product.id}
                        id={`product-card-${product.id}`}
                        className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-xl transition-all duration-300 p-3 flex flex-col justify-between relative"
                      >
                        {/* Image & Badges Container */}
                        <div className="relative mb-2">
                          {discount > 0 && (
                            <span className="absolute top-0.5 left-0.5 z-10 bg-[#E67E22] text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                              -{discount}%
                            </span>
                          )}

                          <div
                            className="aspect-square w-full bg-white rounded-xl overflow-hidden flex items-center justify-center cursor-pointer p-1"
                            onClick={() => setQuickViewProduct(product)}
                          >
                            <img
                              src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80'}
                              alt={product.title}
                              loading="lazy"
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>

                          {/* Wishlist Heart Button on bottom-right of image */}
                          <button
                            type="button"
                            onClick={(e) => toggleWishlist(product.id, e)}
                            className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-white/95 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-slate-300 shadow-2xs transition-all cursor-pointer"
                            title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                          >
                            <Heart size={13} className={isWishlisted ? 'fill-rose-500 text-rose-500' : ''} />
                          </button>
                        </div>

                        {/* Product Title & Rating */}
                        <div className="space-y-1 flex-1 flex flex-col justify-between">
                          <div>
                            <h4
                              onClick={() => setQuickViewProduct(product)}
                              className="font-medium text-slate-800 text-xs hover:text-[#0F52BA] line-clamp-2 leading-relaxed min-h-[34px] cursor-pointer transition-colors"
                              title={product.title}
                            >
                              {product.title}
                            </h4>

                            <div className="flex items-center gap-1 text-xs mt-1">
                              <Star size={11} className="fill-amber-400 stroke-amber-400 text-amber-500 shrink-0" />
                              <span className="font-bold text-slate-800 text-[11px]">{Number(ratingVal).toFixed(1)}</span>
                              <span className="text-slate-400 text-[11px]">({reviewNum})</span>
                            </div>
                          </div>

                          {/* Price & Add to Cart Circular Navy Button */}
                          <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                            <div className="flex items-baseline gap-1 min-w-0 flex-wrap">
                              <span className="font-black text-slate-900 text-xs sm:text-sm truncate">
                                ${Number(product.sell).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              {origPrice && (
                                <span className="text-[10px] text-slate-400 line-through font-normal shrink-0">
                                  ${Number(origPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              id={`shop-cart-btn-${product.id}`}
                              disabled={!inStock}
                              onClick={(e) => addToCart(product, 1, e)}
                              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                inStock
                                  ? 'bg-[#1E3A8A] hover:bg-[#0F52BA] text-white shadow-xs hover:scale-105 active:scale-95'
                                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                              }`}
                              title={inStock ? 'Add to cart' : 'Out of stock'}
                            >
                              <ShoppingCart size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* 2. HERO LIFESTYLE CAROUSEL (Matching "02 / 06 - Made for everyday comfort") */}
          <section className="relative w-full bg-[#EAE5DF] overflow-hidden min-h-[440px] sm:min-h-[500px] lg:min-h-[560px] flex items-center">
            {/* Background Image with Smooth Ambient Overlay */}
            <div className="absolute inset-0 z-0">
              <img
                src={activeSlideData.image}
            alt={activeSlideData.title}
            className="w-full h-full object-cover object-center brightness-[0.88] transition-opacity duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-transparent" />
        </div>

        {/* Slide Counter (Top-Right: "02 / 06") */}
        <div className="absolute top-6 right-6 sm:top-8 sm:right-10 z-20 text-white/90 text-xs sm:text-sm font-bold tracking-widest uppercase">
          {String(currentSlide + 1).padStart(2, '0')} / 06
        </div>

        {/* Left Arrow Navigation Button */}
        <button
          type="button"
          id="hero-carousel-prev-btn"
          onClick={prevSlide}
          className="absolute left-4 sm:left-6 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/85 hover:bg-white text-slate-900 flex items-center justify-center shadow-lg backdrop-blur-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Previous Slide"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Right Arrow Navigation Button */}
        <button
          type="button"
          id="hero-carousel-next-btn"
          onClick={nextSlide}
          className="absolute right-4 sm:right-6 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/85 hover:bg-white text-slate-900 flex items-center justify-center shadow-lg backdrop-blur-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Next Slide"
        >
          <ChevronRight size={22} />
        </button>

        {/* Hero Content Overlay (Left-Aligned) */}
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 w-full relative z-10 py-16">
          <div className="max-w-xl space-y-4 sm:space-y-6">
            {/* Tagline / Subtitle */}
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-white/90 flex items-center gap-2">
              <span>—</span>
              <span>{activeSlideData.tag}</span>
            </p>

            {/* Editorial Serif Headline (Exact Reference Typography) */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl text-white font-normal sm:font-medium tracking-tight leading-[1.12] drop-shadow-sm font-serif italic">
              {activeSlideData.title}
            </h1>

            {/* Pill CTA Button ("Shop the look →") */}
            <div className="pt-2">
              <button
                type="button"
                id="hero-cta-btn"
                onClick={() => {
                  setSelectedCategory(activeSlideData.category)
                  const el = document.getElementById('all-products-section')
                  el?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="inline-flex items-center gap-2 rounded-full bg-white text-slate-900 font-bold text-sm sm:text-base px-6 sm:px-7 py-3 sm:py-3.5 shadow-xl hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>{activeSlideData.cta}</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Center Pagination Dots */}
        <div className="absolute bottom-6 inset-x-0 z-20 flex items-center justify-center gap-2">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 transition-all duration-300 rounded-full cursor-pointer ${
                currentSlide === idx ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 3. CATEGORIES SECTION (Matching "| Categories" with "See all →") */}
      <section id="categories-section" className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-6 w-full space-y-6">
        {/* Section Header with Blue Accent Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-6 bg-[#0F52BA] rounded-full inline-block" />
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Categories</h2>
          </div>

          <button
            type="button"
            id="categories-see-all-btn"
            onClick={() => {
              setSelectedCategory('All')
              const el = document.getElementById('all-products-section')
              el?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="text-sm font-bold text-[#0F52BA] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>See all</span>
            <ArrowRight size={15} />
          </button>
        </div>

        {/* Visual Category Squircle Cards Horizontal Scroll / Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 overflow-x-auto pb-2">
          {visualCategories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.categoryName.toLowerCase()
            return (
              <div
                key={cat.id}
                id={`category-card-${cat.id}`}
                onClick={() => {
                  setSelectedCategory(cat.categoryName)
                  const el = document.getElementById('all-products-section')
                  el?.scrollIntoView({ behavior: 'smooth' })
                }}
                className={`group flex flex-col items-center cursor-pointer transition-all duration-300 ${
                  isSelected ? 'scale-105' : 'hover:-translate-y-1'
                }`}
              >
                {/* Rounded Squircle Container with Soft Pastel Background */}
                <div
                  style={{ backgroundColor: cat.bgColor }}
                  className={`w-full aspect-square rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 overflow-hidden border transition-all flex items-center justify-center relative shadow-2xs ${
                    isSelected
                      ? 'border-[#0F52BA] ring-3 ring-blue-500/20 shadow-md'
                      : 'border-slate-200/80 group-hover:border-slate-300 group-hover:shadow-md'
                  }`}
                >
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="w-full h-full object-cover rounded-xl sm:rounded-2xl group-hover:scale-108 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <span
                  className={`text-xs font-bold mt-2 text-center transition-colors truncate max-w-full ${
                    isSelected ? 'text-[#0F52BA]' : 'text-slate-800 group-hover:text-slate-950'
                  }`}
                >
                  {cat.title}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* 4. EDITOR'S PICKS SECTION (Matching User Reference Image 1) */}
      <section id="editors-picks-section" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Section Header Matching Screenshot 1: "| Editor's Picks" and "See all →" */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-6 bg-[#0F52BA] rounded-full inline-block" />
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Editor's Picks</h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Category Filter Pills */}
            <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto">
              {[
                { label: 'All', val: 'All' },
                { label: 'Garden', val: 'Home & Garden' },
                { label: 'Wellness', val: 'Health & Wellness' },
                { label: 'Accessories', val: 'Accessories' },
                { label: 'Pet Supplies', val: 'Pet Supplies' },
                { label: 'Beauty', val: 'Beauty & Personal Care' },
                { label: 'Toys', val: 'Toys & Games' },
              ].map((c) => (
                <button
                  key={c.val}
                  type="button"
                  onClick={() => setSelectedCategory(c.val)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === c.val
                      ? 'bg-[#0F52BA] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              id="editors-picks-see-all-btn"
              onClick={() => {
                setSelectedCategory('All')
                onToast('Showing all editor products')
              }}
              className="text-sm font-bold text-[#0F52BA] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>See all</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* 6-Column Responsive Product Cards Grid (Matching User Screenshot 1) */}
        {filteredProducts.length === 0 ? (
          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mx-auto text-slate-400">
              <ShoppingBag size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No matching products found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your category or search term to discover more items from our catalog.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('All')
              }}
              className="px-5 py-2.5 bg-[#0F52BA] text-white rounded-full text-xs font-bold shadow-xs cursor-pointer hover:bg-blue-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {filteredProducts.map((product) => {
              const isWishlisted = wishlist.includes(product.id)
              const inStock = Number(product.stock) > 0
              const discount =
                product.discountPercent ||
                (product.originalPrice
                  ? Math.round(((product.originalPrice - Number(product.sell)) / product.originalPrice) * 100)
                  : Math.round(12 + ((Number(product.sell) * 7) % 25)))
              const origPrice =
                product.originalPrice ||
                Number((Number(product.sell) / (1 - discount / 100)).toFixed(2))
              const ratingVal = product.rating || (4.5 + ((Number(product.sell) * 3) % 5) / 10).toFixed(1)
              const reviewNum = product.reviewCount || Math.floor(90 + ((Number(product.sell) * 5) % 210))

              return (
                <div
                  key={product.id}
                  id={`product-card-${product.id}`}
                  className="group bg-white rounded-2xl border border-slate-200/70 hover:border-blue-400 hover:shadow-xl transition-all duration-300 p-3 sm:p-3.5 flex flex-col justify-between relative"
                >
                  {/* Top Badges & Wishlist Row */}
                  <div className="flex items-center justify-between gap-1 mb-1 z-10">
                    <span className="bg-[#FEF3C7] text-[#D97706] text-[11px] font-extrabold px-2 py-0.5 rounded-md shadow-2xs">
                      -{discount}%
                    </span>

                    {/* Wishlist Heart Button */}
                    <button
                      type="button"
                      onClick={(e) => toggleWishlist(product.id, e)}
                      className={`w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center transition-all cursor-pointer ${
                        isWishlisted
                          ? 'text-rose-500 border-rose-200 shadow-sm scale-105'
                          : 'text-slate-400 hover:text-rose-500 hover:border-slate-300 shadow-2xs'
                      }`}
                      title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                    >
                      <Heart size={14} className={isWishlisted ? 'fill-rose-500' : ''} />
                    </button>
                  </div>

                  {/* Clean Aspect-Square Product Image */}
                  <div
                    className="relative aspect-square w-full bg-white rounded-xl overflow-hidden flex items-center justify-center cursor-pointer mb-2 p-1"
                    onClick={() => setQuickViewProduct(product)}
                  >
                    <img
                      src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80'}
                      alt={product.title}
                      loading="lazy"
                      className="w-full h-full object-contain group-hover:scale-106 transition-transform duration-300"
                    />
                  </div>

                  {/* Product Title & Rating */}
                  <div className="space-y-1 flex-1 flex flex-col justify-between">
                    <div>
                      <h4
                        onClick={() => setQuickViewProduct(product)}
                        className="font-medium text-slate-800 text-xs hover:text-[#0F52BA] line-clamp-2 leading-relaxed min-h-[34px] cursor-pointer transition-colors"
                        title={product.title}
                      >
                        {product.title}
                      </h4>

                      {/* Star Rating and Review Count */}
                      <div className="flex items-center gap-1 text-xs mt-1">
                        <Star size={12} className="fill-amber-400 stroke-amber-400 text-amber-500 shrink-0" />
                        <span className="font-bold text-slate-800 text-[11px]">{ratingVal}</span>
                        <span className="text-slate-400 text-[11px]">({reviewNum})</span>
                      </div>
                    </div>

                    {/* Price & Add to Cart Circular Button */}
                    <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <span className="font-black text-slate-900 text-sm sm:text-base truncate">
                          ${Number(product.sell).toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-400 line-through font-normal shrink-0">
                          ${Number(origPrice).toFixed(2)}
                        </span>
                      </div>

                      {/* Circular Navy Cart Button Matching Reference */}
                      <button
                        type="button"
                        id={`add-to-cart-${product.id}`}
                        disabled={!inStock}
                        onClick={(e) => addToCart(product, 1, e)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                          inStock
                            ? 'bg-[#1E3A8A] hover:bg-[#0F52BA] text-white shadow-xs hover:scale-105 active:scale-95'
                            : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        }`}
                        title={inStock ? 'Add to cart' : 'Out of stock'}
                      >
                        <ShoppingCart size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
        </>
      )}

      {/* Slide-out Shopping Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" onClick={() => setIsCartOpen(false)} />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-[#0F52BA]">
                    <ShoppingCart size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Your Cart</h3>
                    <p className="text-xs text-slate-500">{totalCartItems} item(s) in bag</p>
                  </div>
                </div>
                <button type="button" onClick={() => setIsCartOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <ShoppingBag size={28} />
                    </div>
                    <h4 className="font-bold text-slate-800 text-base">Your bag is empty</h4>
                    <button
                      type="button"
                      onClick={() => setIsCartOpen(false)}
                      className="px-5 py-2 bg-[#0F52BA] text-white font-bold text-xs rounded-full shadow-xs hover:bg-blue-700 cursor-pointer"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  cart.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <img src={product.image} alt={product.title} className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 bg-white" />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-xs text-slate-900 truncate">{product.title}</h5>
                        <p className="text-[11px] text-slate-500">${Number(product.sell).toFixed(2)} each</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
                            <button type="button" onClick={() => updateCartQuantity(product.id, -1)} className="p-1 hover:bg-slate-100 cursor-pointer">
                              <Minus size={12} />
                            </button>
                            <span className="px-2 text-xs font-bold text-slate-800">{quantity}</span>
                            <button type="button" onClick={() => updateCartQuantity(product.id, 1)} className="p-1 hover:bg-slate-100 cursor-pointer">
                              <Plus size={12} />
                            </button>
                          </div>
                          <span className="text-xs font-black text-slate-900 ml-auto">${(Number(product.sell) * quantity).toFixed(2)}</span>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeFromCart(product.id)} className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Estimated Tax</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                      <span>Total</span>
                      <span className="text-[#0F52BA] text-base">${grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    id="cart-proceed-checkout-btn"
                    onClick={() => {
                      setIsCartOpen(false)
                      setIsCheckoutOpen(true)
                    }}
                    className="w-full py-3 bg-[#0F52BA] hover:bg-blue-700 text-white rounded-full font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 relative p-6 sm:p-8 animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="aspect-square rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                <img src={quickViewProduct.image} alt={quickViewProduct.title} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-xs text-[#0F52BA] font-bold">{quickViewProduct.category}</span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">{quickViewProduct.title}</h3>
                  <div className="text-2xl font-black text-slate-900">${Number(quickViewProduct.sell).toFixed(2)}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Official product distributed directly by <strong>{sellerProfile.shopName}</strong>. 100% Genuine guaranteed.
                  </p>
                  <div className="text-xs text-slate-500 font-medium space-y-1">
                    <div>✓ In Stock: {quickViewProduct.stock} units available</div>
                    <div>✓ Free Standard Delivery on Orders Over $65</div>
                    <div>✓ 30-Day Money-Back Guarantee</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    addToCart(quickViewProduct, 1)
                    setQuickViewProduct(null)
                    setIsCartOpen(true)
                  }}
                  className="w-full py-3 bg-[#0F52BA] hover:bg-blue-700 text-white rounded-full font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingCart size={17} /> Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal with Database Persistence */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#0F52BA] text-white">
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
                  className="px-3 py-1 text-xs bg-blue-50 text-[#0F52BA] hover:bg-blue-100 rounded-full font-bold border border-blue-200 cursor-pointer"
                >
                  ⚡ Auto-Fill Demo Details
                </button>
                <button type="button" onClick={() => setIsCheckoutOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Truck size={16} className="text-[#0F52BA]" /> Shipping Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={customerInfo.city}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                      <input
                        type="text"
                        value={customerInfo.state}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, state: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Zip</label>
                      <input
                        type="text"
                        value={customerInfo.zip}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, zip: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-500 block">Total:</span>
                  <span className="text-2xl font-black text-slate-900">${grandTotal.toFixed(2)}</span>
                </div>
                <button
                  type="button"
                  id="checkout-place-order-btn"
                  disabled={isPlacingOrder}
                  onClick={handleCompleteCheckout}
                  className="w-full sm:w-auto px-8 py-3 bg-[#0F52BA] hover:bg-blue-700 text-white rounded-full font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isPlacingOrder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Order to Database...</span>
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

      {/* Order Success Modal */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check size={32} strokeWidth={3} />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900">Order Confirmed!</h3>
              <p className="text-xs text-slate-500">Saved and recorded in the database</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Reference:</span>
                <span className="font-mono font-bold text-slate-900">{completedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Charged:</span>
                <span className="font-bold text-[#0F52BA]">${completedOrder.totalAmount.toFixed(2)}</span>
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
                className="w-full py-2.5 bg-[#0F52BA] hover:bg-blue-700 text-white rounded-full font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <PackageCheck size={14} />
                <span>Track This Order Live in Database</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletedOrder(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full font-bold text-xs cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Live Order Tracking Modal */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 relative p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#0F52BA] text-white">
                  <PackageCheck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Live Database Order Tracker</h3>
                  <p className="text-xs text-slate-500">Real-time status recorded in PostgreSQL</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsTrackModalOpen(false)
                  setTrackedOrder(null)
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchOrder()}
                  placeholder="Enter order reference (e.g. #ORD-31472)..."
                  className="flex-1 px-4 py-2.5 rounded-full bg-slate-100 text-xs font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleSearchOrder()}
                  className="px-6 py-2.5 bg-[#0F52BA] hover:bg-blue-700 text-white rounded-full text-xs font-bold cursor-pointer"
                >
                  Search
                </button>
              </div>

              {recentOrderNumbers.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400">Recent:</span>
                  {recentOrderNumbers.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setTrackQuery(num)
                        handleSearchOrder(num)
                      }}
                      className="text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-[#0F52BA] font-mono font-semibold px-2 py-0.5 rounded-md text-slate-600 cursor-pointer"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}

              {trackError && <p className="text-xs text-rose-600">{trackError}</p>}
            </div>

            {trackedOrder && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Order Reference</span>
                    <h4 className="text-base font-black text-slate-900 font-mono">{trackedOrder.orderNumber}</h4>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full uppercase text-[10px]">
                    {trackedOrder.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  {[
                    { title: 'Order Saved', desc: 'In Database', done: true },
                    { title: 'Payment Confirmed', desc: `$${trackedOrder.totalAmount.toFixed(2)}`, done: true },
                    { title: 'Warehouse Processing', desc: 'Ready for Dispatch', done: true },
                    { title: 'In Transit', desc: '2-Day Delivery', done: trackedOrder.status === 'delivered' },
                  ].map((s, idx) => (
                    <div key={idx} className={`p-2.5 rounded-xl border ${s.done ? 'bg-white border-emerald-300 text-slate-900' : 'bg-slate-100 text-slate-400'}`}>
                      <strong className="block text-[11px] font-bold">{s.title}</strong>
                      <span className="text-[10px] text-slate-500">{s.desc}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5 pt-2">
                  <span className="font-bold text-slate-700 block">Items Purchased:</span>
                  {trackedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between p-2 bg-white rounded-lg border border-slate-200">
                      <span>{item.productTitle} x{item.quantity}</span>
                      <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm">
                  <span>Total Paid:</span>
                  <span className="text-[#0F52BA] font-black">${trackedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TRUST BADGES BAR (Matching User Reference Image 2) */}
      <section className="w-full bg-[#071120] text-white py-6 px-4 sm:px-6 border-b border-slate-800/70">
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

      {/* 6. COMPREHENSIVE DARK FOOTER (Matching User Reference Image 2) */}
      <footer className="w-full bg-[#030712] text-slate-300 pt-14 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
            {/* Col 1: Brand & Tagline */}
            <div className="md:col-span-5 space-y-4">
              {/* White pill/card container with BrandLogo matching screenshot */}
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
                    onClick={() => {
                      setSelectedCategory('All')
                      document.getElementById('editors-picks-section')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    All Products
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Categories
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountTab('wishlist')
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Wishlist {wishlist.length > 0 && `(${wishlist.length})`}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountTab('orders')
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    My Orders
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountTab('cart')
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Cart ({totalCartItems})
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
                      if (onSwitchToSeller) onSwitchToSeller()
                      else onToast('Sign in via top-right account icon')
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Login
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (onSwitchToSeller) onSwitchToSeller()
                      else onToast('Register as a merchant in Seller Console')
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Register
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountTab('profile')
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Profile
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    id="footer-track-order-btn"
                    onClick={() => setIsTrackModalOpen(true)}
                    className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Track Order</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: SELL WITH US */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-2">
                <Store size={15} className="text-blue-400" />
                <span>SELL WITH US</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Grow your business — reach thousands of customers.
              </p>
              <div className="flex items-center gap-2.5 pt-2 flex-wrap">
                <button
                  type="button"
                  id="footer-become-seller-btn"
                  onClick={() => {
                    if (onSwitchToSeller) {
                      onSwitchToSeller()
                      onToast('Opening Merchant Onboarding & Seller Portal')
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>Become a Seller</span>
                  <ArrowRight size={13} />
                </button>
                <button
                  type="button"
                  id="footer-seller-login-btn"
                  onClick={() => {
                    if (onSwitchToSeller) {
                      onSwitchToSeller()
                      onToast('Opening Seller Console')
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-xs border border-slate-700/90 transition-all cursor-pointer active:scale-95"
                >
                  Seller Login
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Copyright and Address Bar */}
          <div className="border-t border-slate-800/80 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-center sm:text-left">
              <span>© 2012 <strong className="text-slate-300 font-bold">U Seller Store</strong>. All rights reserved.</span>
              <span className="text-slate-700 hidden sm:inline">|</span>
              <div className="flex items-center gap-3">
                <span className="hover:text-slate-400 transition-colors cursor-pointer">Privacy</span>
                <span className="hover:text-slate-400 transition-colors cursor-pointer">Terms</span>
                <span className="hover:text-slate-400 transition-colors cursor-pointer">Cookies</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <span className="text-red-500">📍</span>
              <span>1401 Pennsylvania Ave NW, Washington, DC 20004 US</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
