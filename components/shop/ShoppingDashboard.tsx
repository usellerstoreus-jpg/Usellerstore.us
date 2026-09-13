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
  Trash2,
  Printer,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { Product, Order, SellerProfile } from '@/lib/mock-data'
import { BrandLogo } from '@/components/ui/BrandLogo'

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
  onPlaceOrder,
  onSwitchToSeller,
  onSwitchToAdmin,
  onToast,
}: ShoppingDashboardProps) {
  // Navigation & Carousel State
  const [currentSlide, setCurrentSlide] = useState(1) // Default to slide 2 ("02 / 06 - Made for everyday comfort")
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [priceRange, setPriceRange] = useState<string>('all')
  const [inStockOnly, setInStockOnly] = useState<boolean>(false)
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest'>('featured')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

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
        if (sortBy === 'newest') return b.id.localeCompare(a.id)
        if (sortBy === 'rating') return Number(b.stock) - Number(a.stock)
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
            <BrandLogo size="md" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-700" aria-label="Main Store Navigation">
              <button
                type="button"
                id="nav-link-home"
                onClick={() => {
                  setSelectedCategory('All')
                  setSearchQuery('')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="text-[#0F52BA] font-bold hover:opacity-80 transition-opacity cursor-pointer"
              >
                Home
              </button>
              <button
                type="button"
                id="nav-link-shop"
                onClick={() => {
                  const el = document.getElementById('all-products-section')
                  el?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="hover:text-slate-900 transition-colors cursor-pointer"
              >
                Shop
              </button>
              <button
                type="button"
                id="nav-link-categories"
                onClick={() => {
                  const el = document.getElementById('categories-section')
                  el?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="hover:text-slate-900 transition-colors cursor-pointer"
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
                if (wishlist.length === 0) {
                  onToast('Your wishlist is currently empty')
                } else {
                  onToast(`You have ${wishlist.length} item(s) in your wishlist`)
                }
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
              onClick={() => setIsCartOpen(true)}
              className="p-1.5 text-slate-700 hover:text-slate-900 transition-colors relative cursor-pointer group"
              title="Shopping Cart"
              aria-label="Shopping Cart"
            >
              <ShoppingCart size={21} className="group-hover:scale-105 transition-transform" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#F97316] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {totalCartItems}
                </span>
              )}
            </button>

            {/* User Profile / Portal Menu Icon */}
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

              {/* User Dropdown Portal Switcher */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-10 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <strong className="block text-slate-900 font-bold">{sellerProfile.shopName}</strong>
                    <span className="text-slate-400">{sellerProfile.email}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsTrackModalOpen(true)
                      setIsUserMenuOpen(false)
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-2 cursor-pointer"
                  >
                    <PackageCheck size={15} className="text-blue-600" />
                    <span>Track My Order</span>
                  </button>

                  {onSwitchToSeller && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        onSwitchToSeller()
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50 font-semibold text-blue-700 flex items-center gap-2 cursor-pointer"
                    >
                      <Store size={15} />
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
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-purple-50 font-semibold text-purple-700 flex items-center gap-2 cursor-pointer"
                    >
                      <Building2 size={15} />
                      <span>Admin Panel</span>
                    </button>
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

      {/* 4. ALL PRODUCTS CATALOG SECTION */}
      <section id="all-products-section" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-6 bg-[#0F52BA] rounded-full inline-block" />
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">All Products</h2>
            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full">
              {filteredProducts.length} Items
            </span>
          </div>

          {/* Filters & Sorting Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['All', 'Electronics', 'Tablets', 'Home & Kitchen', 'Under Garments', 'Health & Wellness'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === c
                      ? 'bg-[#0F52BA] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <select
              id="shop-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-100 border border-transparent hover:border-slate-200 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Stock / Popularity</option>
              <option value="newest">Newest Additions</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-full border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="List View"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
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
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map((product) => {
              const isWishlisted = wishlist.includes(product.id)
              const inStock = Number(product.stock) > 0
              const originalMSRP = Number((Number(product.sell) * 1.25).toFixed(2))
              const discountPercent = Math.round(((originalMSRP - Number(product.sell)) / originalMSRP) * 100)

              return (
                <div
                  key={product.id}
                  id={`product-card-${product.id}`}
                  className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative"
                >
                  {/* Image Container with Badges */}
                  <div className="relative aspect-square bg-[#F8FAFC] overflow-hidden cursor-pointer">
                    <img
                      src={product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80'}
                      alt={product.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onClick={() => setQuickViewProduct(product)}
                    />

                    {/* Category & Discount Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                      <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                        {product.category}
                      </span>
                      {discountPercent > 0 && (
                        <span className="bg-[#F97316] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs w-fit">
                          {discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    {/* Wishlist Heart Button */}
                    <button
                      type="button"
                      onClick={(e) => toggleWishlist(product.id, e)}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all z-10 cursor-pointer ${
                        isWishlisted
                          ? 'bg-white text-rose-500 shadow-md scale-110'
                          : 'bg-white/80 hover:bg-white text-slate-600 hover:text-rose-500 shadow-xs'
                      }`}
                      title="Wishlist"
                    >
                      <Heart size={16} className={isWishlisted ? 'fill-rose-500' : ''} />
                    </button>

                    {/* Quick View Hover Button */}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-slate-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setQuickViewProduct(product)}
                        className="bg-white/95 hover:bg-white text-slate-900 px-3.5 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-md hover:scale-105 transition-transform cursor-pointer"
                      >
                        <Eye size={14} />
                        <span>Quick View</span>
                      </button>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star size={13} className="fill-amber-400 stroke-amber-400" />
                          <span>4.9</span>
                          <span className="text-slate-400 font-normal">({Number(product.stock) * 2 + 12})</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            inStock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {inStock ? `In Stock (${product.stock})` : 'Sold Out'}
                        </span>
                      </div>

                      <h4
                        onClick={() => setQuickViewProduct(product)}
                        className="font-bold text-slate-900 text-sm hover:text-blue-600 line-clamp-2 cursor-pointer transition-colors leading-snug"
                        title={product.title}
                      >
                        {product.title}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono">SKU: {product.sku}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-slate-900">${Number(product.sell).toFixed(2)}</span>
                          <span className="text-xs text-slate-400 line-through">${originalMSRP.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        type="button"
                        id={`add-to-cart-${product.id}`}
                        disabled={!inStock}
                        onClick={(e) => addToCart(product, 1, e)}
                        className={`p-2.5 rounded-full font-bold transition-all flex items-center justify-center cursor-pointer ${
                          inStock
                            ? 'bg-[#0F52BA] hover:bg-blue-700 text-white shadow-xs hover:shadow-md hover:scale-105 active:scale-95'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                        title={inStock ? 'Add to cart' : 'Out of stock'}
                      >
                        <ShoppingCart size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col sm:flex-row items-center gap-4"
              >
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full sm:w-32 h-32 rounded-xl object-cover border border-slate-200 shrink-0"
                  onClick={() => setQuickViewProduct(product)}
                />
                <div className="flex-1 space-y-1.5 w-full">
                  <span className="text-xs text-[#0F52BA] font-bold">{product.category}</span>
                  <h4
                    onClick={() => setQuickViewProduct(product)}
                    className="font-bold text-slate-900 text-base hover:text-blue-600 cursor-pointer"
                  >
                    {product.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-amber-500 font-bold flex items-center gap-1">
                      <Star size={13} className="fill-amber-400 stroke-amber-400" /> 4.9
                    </span>
                    <span className="text-slate-400 font-mono">SKU: {product.sku}</span>
                    <span className="text-emerald-600 font-bold">In Stock: {product.stock}</span>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                  <span className="text-xl font-black text-slate-900">${Number(product.sell).toFixed(2)}</span>
                  <button
                    type="button"
                    onClick={() => addToCart(product, 1)}
                    className="px-4 py-2 bg-[#0F52BA] hover:bg-blue-700 text-white font-bold text-xs rounded-full flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingCart size={15} /> Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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

      {/* Footer with Official Logo */}
      <footer className="bg-white border-t border-slate-200 py-10 px-4 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <span className="text-slate-400">| © 2026 Official Merchant Store</span>
          </div>

          <div className="flex items-center gap-6 font-medium text-slate-600">
            <span className="hover:text-slate-900 cursor-pointer">Buyer Protection</span>
            <span className="hover:text-slate-900 cursor-pointer">Track Order</span>
            <span className="hover:text-slate-900 cursor-pointer">Shipping & Returns</span>
            <span className="hover:text-slate-900 cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
