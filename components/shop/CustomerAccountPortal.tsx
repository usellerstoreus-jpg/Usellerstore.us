'use client'

import React, { useState } from 'react'
import {
  Home,
  LayoutGrid,
  UserCircle,
  Package,
  Heart,
  ShoppingCart,
  LogOut,
  Store,
  LogIn,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Bell,
  MapPin,
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Truck,
} from 'lucide-react'
import {
  Product,
  Order,
  CustomerProfile,
  CustomerAddress,
  defaultCustomerProfile,
} from '@/lib/mock-data'

export type AccountTab = 'profile' | 'orders' | 'wishlist' | 'cart'

interface CartItem {
  product: Product
  quantity: number
}

export interface CustomerAccountPortalProps {
  activeTab: AccountTab
  onSelectTab: (tab: AccountTab) => void
  onNavigate: (destination: 'home' | 'shop' | 'categories') => void
  onBecomeSeller: () => void
  onSellerLogin: () => void
  cart: CartItem[]
  wishlist: string[]
  products: Product[]
  recentOrders?: Order[]
  onUpdateCartQuantity: (productId: string, delta: number) => void
  onRemoveFromCart: (productId: string) => void
  onAddToCart: (product: Product, quantity?: number) => void
  onToggleWishlist: (productId: string) => void
  onOpenCheckout: () => void
  onTrackOrder: (orderNumber?: string) => void
  onToast: (message: string) => void
}

export function CustomerAccountPortal({
  activeTab,
  onSelectTab,
  onNavigate,
  onBecomeSeller,
  onSellerLogin,
  cart,
  wishlist,
  products,
  recentOrders = [],
  onUpdateCartQuantity,
  onRemoveFromCart,
  onAddToCart,
  onToggleWishlist,
  onOpenCheckout,
  onTrackOrder,
  onToast,
}: CustomerAccountPortalProps) {
  // Customer Profile State (SSR safe & persisted in localStorage)
  const [customer, setCustomer] = useState<CustomerProfile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('u_customer_profile')
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return defaultCustomerProfile
  })

  // Modals for the 4 Settings Rows
  const [activeModal, setActiveModal] = useState<
    'personal' | 'security' | 'notifications' | 'address' | null
  >(null)

  // Forms State
  const [personalForm, setPersonalForm] = useState({
    name: customer.name,
    username: customer.username,
    phone: customer.phone,
    avatarLetter: customer.avatarLetter,
  })

  const [securityForm, setSecurityForm] = useState({
    email: customer.email,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [notificationsForm, setNotificationsForm] = useState(customer.notifications)

  const [newAddressForm, setNewAddressForm] = useState<Omit<CustomerAddress, 'id'>>({
    title: 'Home',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    isDefault: false,
  })
  const [isAddingAddress, setIsAddingAddress] = useState(false)

  // Save profile to localStorage helper
  const saveCustomerProfile = (updated: CustomerProfile) => {
    setCustomer(updated)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('u_customer_profile', JSON.stringify(updated))
      } catch {}
    }
  }

  // Cart Calculations
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0)
  const subtotal = cart.reduce((acc, item) => acc + Number(item.product.sell) * item.quantity, 0)
  const shipping = subtotal > 0 ? (subtotal >= 65 ? 0 : 5.0) : 0
  const taxAmount = Number((subtotal * 0.05).toFixed(2))
  const savings = cart.reduce((acc, item) => {
    const orig = item.product.originalPrice || Number(item.product.sell) * 1.15
    const diff = Math.max(0, orig - Number(item.product.sell))
    return acc + diff * item.quantity
  }, 0)
  const total = Number((subtotal + shipping + taxAmount).toFixed(2))

  // Wishlist products
  const wishlistProducts = products.filter((p) => wishlist.includes(p.id))

  // Handlers for Settings
  const handleSavePersonalInfo = (e: React.FormEvent) => {
    e.preventDefault()
    const updated: CustomerProfile = {
      ...customer,
      name: personalForm.name.trim() || customer.name,
      username: personalForm.username.trim() || customer.username,
      phone: personalForm.phone.trim() || customer.phone,
      avatarLetter: personalForm.name.charAt(0).toUpperCase() || customer.avatarLetter,
    }
    saveCustomerProfile(updated)
    setActiveModal(null)
    onToast('Personal info updated successfully!')
  }

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault()
    if (securityForm.newPassword && securityForm.newPassword !== securityForm.confirmPassword) {
      onToast('New passwords do not match')
      return
    }
    const updated: CustomerProfile = {
      ...customer,
      email: securityForm.email.trim() || customer.email,
    }
    saveCustomerProfile(updated)
    setActiveModal(null)
    setSecurityForm((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
    onToast('Security credentials updated successfully!')
  }

  const handleSaveNotifications = () => {
    const updated: CustomerProfile = {
      ...customer,
      notifications: notificationsForm,
    }
    saveCustomerProfile(updated)
    setActiveModal(null)
    onToast('Notification preferences saved!')
  }

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAddressForm.street || !newAddressForm.city) {
      onToast('Please fill out street and city')
      return
    }
    const newAddr: CustomerAddress = {
      id: 'addr-' + Date.now(),
      ...newAddressForm,
    }
    let updatedAddresses = [...customer.addresses]
    if (newAddr.isDefault) {
      updatedAddresses = updatedAddresses.map((a) => ({ ...a, isDefault: false }))
    }
    updatedAddresses.push(newAddr)
    const updated: CustomerProfile = {
      ...customer,
      addresses: updatedAddresses,
    }
    saveCustomerProfile(updated)
    setIsAddingAddress(false)
    setNewAddressForm({
      title: 'Home',
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'United States',
      isDefault: false,
    })
    onToast('Address added to your address book!')
  }

  const handleDeleteAddress = (id: string) => {
    const updated: CustomerProfile = {
      ...customer,
      addresses: customer.addresses.filter((a) => a.id !== id),
    }
    saveCustomerProfile(updated)
    onToast('Address removed')
  }

  const handleSetDefaultAddress = (id: string) => {
    const updated: CustomerProfile = {
      ...customer,
      addresses: customer.addresses.map((a) => ({
        ...a,
        isDefault: a.id === id,
      })),
    }
    saveCustomerProfile(updated)
    onToast('Default shipping address updated')
  }

  const handleSignOut = () => {
    onToast('Signed out of usellerstore.us@gmail.com')
    onNavigate('home')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
      <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
        {/* =========================================================================
            LEFT SIDEBAR ("SIDE LINE") - MATCHING USER SCREENSHOTS 1, 2, 3
            4 Stacked Cards:
            1. Account Summary Card
            2. BROWSE Card
            3. MY ACCOUNT Card
            4. SELL WITH US Card
        ========================================================================= */}
        <aside className="w-full md:w-64 lg:w-72 shrink-0 space-y-3.5">
          {/* CARD 1: ACCOUNT SUMMARY */}
          <div
            id="sidebar-account-card"
            className="bg-[#F8FAFC] border border-slate-200/90 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs"
          >
            <div className="w-11 h-11 rounded-full bg-[#0F294A] text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
              {customer.avatarLetter || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight leading-snug">
                My Account
              </h3>
              <p className="text-xs text-slate-500 truncate leading-snug font-normal">
                {customer.email}
              </p>
            </div>
          </div>

          {/* CARD 2: BROWSE */}
          <div
            id="sidebar-browse-card"
            className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs space-y-0.5"
          >
            <div className="text-[11px] font-bold text-slate-400 tracking-wider px-3 py-1 uppercase">
              BROWSE
            </div>
            <button
              type="button"
              id="sidebar-browse-home"
              onClick={() => onNavigate('home')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Home size={18} className="text-slate-500" />
              <span>Home</span>
            </button>
            <button
              type="button"
              id="sidebar-browse-categories"
              onClick={() => onNavigate('categories')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <LayoutGrid size={18} className="text-slate-500" />
              <span>Categories</span>
            </button>
          </div>

          {/* CARD 3: MY ACCOUNT */}
          <div
            id="sidebar-my-account-card"
            className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs space-y-0.5"
          >
            <div className="text-[11px] font-bold text-slate-400 tracking-wider px-3 py-1 uppercase">
              MY ACCOUNT
            </div>

            {/* My Profile */}
            <button
              type="button"
              id="sidebar-nav-profile"
              onClick={() => onSelectTab('profile')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-[#EEF2F6] text-slate-900 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <UserCircle
                  size={18}
                  className={activeTab === 'profile' ? 'text-slate-900' : 'text-slate-500'}
                />
                <span>My Profile</span>
              </div>
              {activeTab === 'profile' && <ChevronRight size={16} className="text-slate-700" />}
            </button>

            {/* My Orders */}
            <button
              type="button"
              id="sidebar-nav-orders"
              onClick={() => onSelectTab('orders')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#EEF2F6] text-slate-900 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package
                  size={18}
                  className={activeTab === 'orders' ? 'text-slate-900' : 'text-slate-500'}
                />
                <span>My Orders</span>
              </div>
              {activeTab === 'orders' && <ChevronRight size={16} className="text-slate-700" />}
            </button>

            {/* Wishlist */}
            <button
              type="button"
              id="sidebar-nav-wishlist"
              onClick={() => onSelectTab('wishlist')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                activeTab === 'wishlist'
                  ? 'bg-[#EEF2F6] text-slate-900 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Heart
                  size={18}
                  className={activeTab === 'wishlist' ? 'text-slate-900' : 'text-slate-500'}
                />
                <span>Wishlist</span>
              </div>
              {activeTab === 'wishlist' && <ChevronRight size={16} className="text-slate-700" />}
            </button>

            {/* Cart */}
            <button
              type="button"
              id="sidebar-nav-cart"
              onClick={() => onSelectTab('cart')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                activeTab === 'cart'
                  ? 'bg-[#EEF2F6] text-slate-900 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingCart
                  size={18}
                  className={activeTab === 'cart' ? 'text-slate-900' : 'text-slate-500'}
                />
                <span>Cart</span>
              </div>
              <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {totalCartCount}
              </span>
            </button>

            {/* Sign Out */}
            <div className="pt-2">
              <button
                type="button"
                id="sidebar-nav-signout"
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut size={18} className="text-rose-500" />
                <span>Sign out</span>
              </button>
            </div>
          </div>

          {/* CARD 4: SELL WITH US */}
          <div
            id="sidebar-sell-with-us-card"
            className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-2.5"
          >
            <div className="text-[11px] font-bold text-slate-400 tracking-wider px-2 py-0.5 uppercase flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-500" />
              <span>SELL WITH US</span>
            </div>

            {/* Become a Seller Button */}
            <button
              type="button"
              id="sidebar-btn-become-seller"
              onClick={onBecomeSeller}
              className="w-full bg-slate-100/90 hover:bg-slate-200/80 text-slate-800 text-xs font-bold px-3 py-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Store size={16} className="text-slate-700" />
                <span>Become a Seller</span>
              </div>
              <ArrowRight size={14} className="text-slate-600" />
            </button>

            {/* Seller Login Button */}
            <button
              type="button"
              id="sidebar-btn-seller-login"
              onClick={onSellerLogin}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogIn size={15} className="text-slate-500" />
              <span>Seller Login</span>
            </button>
          </div>
        </aside>

        {/* =========================================================================
            MAIN RIGHT CONTENT AREA:
            View 1: My account (Profile)
            View 2: My Orders
            View 3: My Wishlist
            View 4: Your Cart
        ========================================================================= */}
        <main className="flex-1 min-w-0 w-full">
          {/* VIEW 1: MY ACCOUNT / PROFILE */}
          {activeTab === 'profile' && (
            <div id="account-profile-view" className="space-y-6">
              {/* Header Title & Subtitle */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  My account
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Manage your profile, security, and preferences.
                </p>
              </div>

              {/* Profile Banner Card */}
              <div className="bg-[#ECEFF3] rounded-2xl p-6 flex items-center gap-4 sm:gap-5 shadow-2xs">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0F294A] text-white flex items-center justify-center font-bold text-2xl sm:text-3xl shrink-0 shadow-xs">
                  {customer.avatarLetter || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    {customer.email}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    {customer.role || 'Customer account'}
                  </p>
                </div>
              </div>

              {/* 4 Settings Rows Matching Screenshot 1 */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
                {/* 1. Personal info */}
                <button
                  type="button"
                  id="setting-row-personal-info"
                  onClick={() => {
                    setPersonalForm({
                      name: customer.name,
                      username: customer.username,
                      phone: customer.phone,
                      avatarLetter: customer.avatarLetter,
                    })
                    setActiveModal('personal')
                  }}
                  className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <UserCircle size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        Personal info
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Name, username, avatar & phone
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-700" />
                </button>

                {/* 2. Email & security */}
                <button
                  type="button"
                  id="setting-row-email-security"
                  onClick={() => {
                    setSecurityForm({
                      email: customer.email,
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    })
                    setActiveModal('security')
                  }}
                  className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                        Email & security
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Email address and password
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-700" />
                </button>

                {/* 3. Notifications */}
                <button
                  type="button"
                  id="setting-row-notifications"
                  onClick={() => {
                    setNotificationsForm(customer.notifications)
                    setActiveModal('notifications')
                  }}
                  className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                      <Bell size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                        Notifications
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Email & in-app alerts
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-700" />
                </button>

                {/* 4. Address book */}
                <button
                  type="button"
                  id="setting-row-address-book"
                  onClick={() => setActiveModal('address')}
                  className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                        Address book
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Saved shipping addresses ({customer.addresses.length})
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-700" />
                </button>
              </div>
            </div>
          )}

          {/* VIEW 2: MY ORDERS (Matching Screenshot 2) */}
          {activeTab === 'orders' && (
            <div id="account-orders-view" className="space-y-6">
              {/* Header Title & Subtitle */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  My Orders
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Track your orders and view past purchases.
                </p>
              </div>

              {recentOrders.length === 0 ? (
                /* Empty state matching Screenshot 2 */
                <div className="border border-slate-200/90 rounded-2xl p-16 flex items-center justify-center min-h-[340px] bg-white shadow-2xs">
                  <p className="text-sm text-slate-600">
                    No orders yet.{' '}
                    <button
                      type="button"
                      id="orders-empty-shop-now-link"
                      onClick={() => onNavigate('shop')}
                      className="font-semibold text-slate-900 underline hover:text-blue-600 cursor-pointer ml-1"
                    >
                      Shop now
                    </button>
                  </p>
                </div>
              ) : (
                /* Orders List */
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                          <div className="text-xs text-slate-400 font-medium">Order Number</div>
                          <span className="font-extrabold text-sm text-slate-900">
                            {order.orderNumber}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 font-medium">Date Placed</div>
                          <span className="text-xs font-semibold text-slate-700">
                            {order.date}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 font-medium">Status</div>
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {order.status.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 font-medium">Total Amount</div>
                          <span className="font-black text-sm text-slate-900">
                            ${Number(order.totalAmount).toFixed(2)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onTrackOrder(order.orderNumber)}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Truck size={14} />
                          <span>Track Package</span>
                        </button>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-xs">
                            {item.image && item.image.trim() ? (
                              <img
                                src={item.image}
                                alt={item.productTitle}
                                className="w-12 h-12 rounded-lg object-contain bg-slate-50 border border-slate-200 p-1 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-300">
                                <Package size={18} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 truncate">
                                {item.productTitle}
                              </p>
                              <p className="text-slate-500">
                                Qty: {item.quantity} × ${Number(item.price).toFixed(2)}
                              </p>
                            </div>
                            <span className="font-bold text-slate-900">
                              ${(Number(item.price) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: MY WISHLIST (Matching Screenshot 3) */}
          {activeTab === 'wishlist' && (
            <div id="account-wishlist-view" className="space-y-6">
              {/* Header Title & Subtitle */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  My Wishlist
                </h1>
                <p className="text-sm text-slate-500 mt-1">Save products you love for later.</p>
              </div>

              {wishlistProducts.length === 0 ? (
                /* Empty state matching Screenshot 3 */
                <div className="border border-slate-200/90 rounded-2xl p-16 flex flex-col items-center justify-center min-h-[340px] bg-white shadow-2xs text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-1">
                    <Heart size={24} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Your wishlist is empty</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Save products you love and come back to them anytime.
                  </p>
                  <button
                    type="button"
                    id="wishlist-continue-shopping-btn"
                    onClick={() => onNavigate('shop')}
                    className="bg-[#0F294A] hover:bg-[#153a66] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer flex items-center gap-2 mt-2 transition-colors"
                  >
                    <ShoppingBag size={14} />
                    <span>Continue shopping</span>
                  </button>
                </div>
              ) : (
                /* Wishlist Grid */
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {wishlistProducts.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-slate-200 p-3.5 flex flex-col justify-between shadow-2xs relative group"
                    >
                      <button
                        type="button"
                        onClick={() => onToggleWishlist(p.id)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center text-rose-500 hover:scale-110 transition-transform cursor-pointer shadow-xs z-10"
                        title="Remove from wishlist"
                      >
                        <Trash2 size={13} />
                      </button>

                      <div className="aspect-square w-full rounded-xl bg-white flex items-center justify-center p-2 mb-2">
                        {p.image && p.image.trim() ? (
                          <img
                            src={p.image}
                            alt={p.title}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <Package size={32} className="text-slate-300" />
                        )}
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-xs text-slate-900 line-clamp-2 min-h-[32px]">
                          {p.title}
                        </h4>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-black text-sm text-slate-900">
                            ${Number(p.sell).toFixed(2)}
                          </span>
                          {p.originalPrice && (
                            <span className="text-xs text-slate-400 line-through">
                              ${Number(p.originalPrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onAddToCart(p, 1)
                            onToast(`Added "${p.title.slice(0, 20)}..." to cart`)
                          }}
                          className="w-full py-2 bg-[#0F294A] hover:bg-[#153a66] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <ShoppingCart size={13} />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 4: YOUR CART (Matching Screenshot 4) */}
          {activeTab === 'cart' && (
            <div id="account-cart-view" className="space-y-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Your Cart
              </h1>

              {cart.length === 0 ? (
                /* Empty Cart State */
                <div className="border border-slate-200/90 rounded-2xl p-16 flex flex-col items-center justify-center min-h-[340px] bg-white shadow-2xs text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-1">
                    <ShoppingCart size={24} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Your cart is empty</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Looks like you haven't added any items to your cart yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('shop')}
                    className="bg-[#0F294A] hover:bg-[#153a66] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer flex items-center gap-2 mt-2 transition-colors"
                  >
                    <ShoppingBag size={14} />
                    <span>Start Shopping</span>
                  </button>
                </div>
              ) : (
                /* 2-Column Cart Layout Matching Screenshot 4 */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Cart Items (8 cols) */}
                  <div className="lg:col-span-8 space-y-3">
                    {cart.map(({ product, quantity }) => (
                      <div
                        key={product.id}
                        id={`cart-item-${product.id}`}
                        className="border border-slate-200/90 rounded-2xl p-4 sm:p-5 bg-white flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-2xs"
                      >
                        {/* Product Image */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-white border border-slate-100 p-2 flex items-center justify-center shrink-0">
                          {product.image && product.image.trim() ? (
                            <img
                              src={product.image}
                              alt={product.title}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Package size={28} className="text-slate-300" />
                          )}
                        </div>

                        {/* Title & Price */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <h3 className="font-semibold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-2">
                            {product.title}
                          </h3>
                          <div className="font-bold text-sm sm:text-base text-slate-900">
                            ${Number(product.sell).toFixed(2)}
                          </div>

                          {/* Stepper & Trash Row */}
                          <div className="flex items-center gap-4 pt-2">
                            {/* Quantity Stepper [ - 1 + ] */}
                            <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                              <button
                                type="button"
                                onClick={() => onUpdateCartQuantity(product.id, -1)}
                                className="px-2.5 py-1 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="px-3 text-xs font-bold text-slate-900 min-w-[28px] text-center">
                                {quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateCartQuantity(product.id, 1)}
                                className="px-2.5 py-1 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                              >
                                <Plus size={13} />
                              </button>
                            </div>

                            {/* Trash Icon */}
                            <button
                              type="button"
                              onClick={() => onRemoveFromCart(product.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right Column: Order Summary (4 cols) */}
                  <div className="lg:col-span-4">
                    <div
                      id="cart-order-summary-card"
                      className="border border-slate-200/90 rounded-2xl p-5 sm:p-6 bg-white shadow-2xs space-y-4 sticky top-24"
                    >
                      <h2 className="font-bold text-base text-slate-900 tracking-tight">
                        Order Summary
                      </h2>

                      <div className="space-y-2.5 text-xs sm:text-sm">
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Subtotal</span>
                          <span className="font-semibold text-slate-900">
                            ${subtotal.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Shipping</span>
                          <span className="font-semibold text-slate-900">
                            {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Tax (5%)</span>
                          <span className="font-semibold text-slate-900">
                            ${taxAmount.toFixed(2)}
                          </span>
                        </div>
                        {savings > 0 && (
                          <div className="flex items-center justify-between text-emerald-600 font-semibold">
                            <span>You save</span>
                            <span>-${savings.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                        <span className="font-bold text-base text-slate-900">Total</span>
                        <span className="font-black text-xl text-slate-900">
                          ${total.toFixed(2)}
                        </span>
                      </div>

                      {/* Checkout Button Matching Screenshot 4 */}
                      <button
                        type="button"
                        id="cart-summary-checkout-btn"
                        onClick={onOpenCheckout}
                        className="w-full py-3 bg-[#0F294A] hover:bg-[#153a66] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        <span>Checkout</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* =========================================================================
          MODALS FOR THE 4 SETTING ROWS:
          1. Personal info modal
          2. Email & security modal
          3. Notifications modal
          4. Address book modal
      ========================================================================= */}

      {/* 1. PERSONAL INFO MODAL */}
      {activeModal === 'personal' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <UserCircle size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Personal Info</h3>
                <p className="text-xs text-slate-500">Update your name, handle and phone</p>
              </div>
            </div>

            <form onSubmit={handleSavePersonalInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={personalForm.name}
                  onChange={(e) => setPersonalForm({ ...personalForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  value={personalForm.username}
                  onChange={(e) => setPersonalForm({ ...personalForm, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={personalForm.phone}
                  onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#153a66] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. EMAIL & SECURITY MODAL */}
      {activeModal === 'security' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Email & Security</h3>
                <p className="text-xs text-slate-500">Update account email and credentials</p>
              </div>
            </div>

            <form onSubmit={handleSaveSecurity} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={securityForm.email}
                  onChange={(e) => setSecurityForm({ ...securityForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password (Optional)
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={securityForm.newPassword}
                  onChange={(e) =>
                    setSecurityForm({ ...securityForm, newPassword: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {securityForm.newPassword && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={securityForm.confirmPassword}
                    onChange={(e) =>
                      setSecurityForm({ ...securityForm, confirmPassword: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#153a66] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Security
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. NOTIFICATIONS MODAL */}
      {activeModal === 'notifications' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Bell size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Notifications</h3>
                <p className="text-xs text-slate-500">Configure email and in-app alert delivery</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-900">Email Alerts</div>
                  <div className="text-[11px] text-slate-500">Receive receipt & summary via email</div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationsForm.emailAlerts}
                  onChange={(e) =>
                    setNotificationsForm({ ...notificationsForm, emailAlerts: e.target.checked })
                  }
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-900">Order Updates</div>
                  <div className="text-[11px] text-slate-500">Real-time status on fulfillment & shipping</div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationsForm.orderUpdates}
                  onChange={(e) =>
                    setNotificationsForm({ ...notificationsForm, orderUpdates: e.target.checked })
                  }
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-900">Promotions & Discounts</div>
                  <div className="text-[11px] text-slate-500">Special seasonal discounts and promo codes</div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationsForm.promotions}
                  onChange={(e) =>
                    setNotificationsForm({ ...notificationsForm, promotions: e.target.checked })
                  }
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-900">In-App Alerts</div>
                  <div className="text-[11px] text-slate-500">Notifications banner inside storefront</div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationsForm.inAppAlerts}
                  onChange={(e) =>
                    setNotificationsForm({ ...notificationsForm, inAppAlerts: e.target.checked })
                  }
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </label>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNotifications}
                  className="px-5 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#153a66] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. ADDRESS BOOK MODAL */}
      {activeModal === 'address' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setActiveModal(null)
                setIsAddingAddress(false)
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MapPin size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Address Book</h3>
                <p className="text-xs text-slate-500">Manage your saved shipping addresses</p>
              </div>
            </div>

            {/* List of saved addresses */}
            <div className="space-y-3 mb-5">
              {customer.addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{addr.title}</span>
                      {addr.isDefault && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{addr.street}</p>
                    <p className="text-xs text-slate-500">
                      {addr.city}, {addr.state} {addr.zip}, {addr.country}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        Set Default
                      </button>
                    )}
                    {customer.addresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Delete address"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Address Form */}
            {isAddingAddress ? (
              <form onSubmit={handleAddAddress} className="space-y-3 border-t border-slate-200 pt-4">
                <h4 className="font-bold text-xs text-slate-900">Add New Shipping Address</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Address Label (e.g. Home, Work)
                    </label>
                    <input
                      type="text"
                      placeholder="Home"
                      value={newAddressForm.title}
                      onChange={(e) =>
                        setNewAddressForm({ ...newAddressForm, title: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      placeholder="123 Market St, Apt 4"
                      value={newAddressForm.street}
                      onChange={(e) =>
                        setNewAddressForm({ ...newAddressForm, street: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      placeholder="New York"
                      value={newAddressForm.city}
                      onChange={(e) =>
                        setNewAddressForm({ ...newAddressForm, city: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      State / Province
                    </label>
                    <input
                      type="text"
                      placeholder="NY"
                      value={newAddressForm.state}
                      onChange={(e) =>
                        setNewAddressForm({ ...newAddressForm, state: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Postal / ZIP Code
                    </label>
                    <input
                      type="text"
                      placeholder="10001"
                      value={newAddressForm.zip}
                      onChange={(e) =>
                        setNewAddressForm({ ...newAddressForm, zip: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      placeholder="United States"
                      value={newAddressForm.country}
                      onChange={(e) =>
                        setNewAddressForm({ ...newAddressForm, country: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 pt-1 text-xs text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAddressForm.isDefault}
                    onChange={(e) =>
                      setNewAddressForm({ ...newAddressForm, isDefault: e.target.checked })
                    }
                    className="accent-blue-600 rounded cursor-pointer"
                  />
                  <span>Set as default shipping address</span>
                </label>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(false)}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#0F294A] hover:bg-[#153a66] text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingAddress(true)}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Plus size={15} />
                <span>Add New Address</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
