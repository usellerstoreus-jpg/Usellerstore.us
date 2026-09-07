'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Check,
  X,
  ChevronDown,
  Sparkles,
  Users,
  Search,
  LogIn,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  CalendarDays,
  Store,
  ArrowUpRight,
  Copy,
  Pencil,
  RefreshCw,
  ShoppingBag,
  ShieldCheck,
  HeartPulse,
  WalletCards,
  Activity,
  Grid2X2
} from 'lucide-react'
import {
  initialProducts,
  initialOrders,
  initialNotifications,
  initialSellerProfile,
  Product,
  Order,
  NotificationItem,
  SellerProfile
} from '@/lib/mock-data'
import { SellerSidebar } from '@/components/seller/SellerSidebar'
import { DashboardView } from '@/components/seller/DashboardView'
import { ProductsView } from '@/components/seller/ProductsView'
import { OrdersView } from '@/components/seller/OrdersView'
import { NotificationsView } from '@/components/seller/NotificationsView'
import { ProfileView } from '@/components/seller/ProfileView'
import { BalanceModal } from '@/components/seller/BalanceModal'
import { SupportChatModal } from '@/components/seller/SupportChatModal'
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchOrders,
  createOrder,
  updateOrderStatus,
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  fetchSellerProfile,
  updateSellerProfile,
  signUpSeller,
  signInSeller,
  signOutSeller,
} from '@/lib/supabase/api'
import { isSupabaseConfigured } from '@/lib/supabase/client'

type Mode = 'seller' | 'admin' | 'login'
type SellerTab = 'Dashboard' | 'Products' | 'Orders' | 'Notifications' | 'Profile'

const adminNav = [
  { label: 'Dashboard', icon: Grid2X2, group: 'Manage' },
  { label: 'Sellers', icon: Users, group: 'Manage' },
  { label: 'KYC', icon: ShieldCheck, group: 'Manage' },
  { label: 'Orders', icon: ShoppingBag, group: 'Manage' },
  { label: 'Support', icon: HeartPulse, group: 'Communication' },
  { label: 'Withdrawals', icon: WalletCards, group: 'Finance' },
  { label: 'Recent Actions', icon: Activity, group: 'Activity' },
]

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="toast" role="status">
      <Check size={16} />
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Close notification">
        <X size={15} />
      </button>
    </div>
  )
}

function AdminSidebar({
  active,
  onNavigate,
  onSignOut,
}: {
  active: string
  onNavigate: (label: string) => void
  onSignOut: () => void
}) {
  return (
    <aside className="sidebar admin-sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Grid2X2 size={22} strokeWidth={2.4} />
        </div>
        <div className="brand-info">
          <strong>U Seller Store</strong>
          <span>Management Console</span>
        </div>
      </div>

      <div className="admin-user">
        <div className="avatar admin-avatar">
          Z<span className="online-dot" />
        </div>
        <div>
          <strong>zain</strong>
          <span>Administrator</span>
        </div>
      </div>

      <div className="invite">
        <span>
          INVITE <b>MXSVHSDL</b>
        </span>
        <Copy size={16} className="cursor-pointer" />
        <Pencil size={16} className="cursor-pointer" />
        <RefreshCw size={16} className="cursor-pointer" />
      </div>

      <nav className="admin-nav" aria-label="Admin navigation">
        {adminNav.map(({ label, icon: Icon, group }, index) => (
          <div key={label}>
            {(index === 0 || adminNav[index - 1].group !== group) && (
              <span className="nav-group">{group}</span>
            )}
            <button
              type="button"
              className={active === label ? 'active' : ''}
              onClick={() => onNavigate(label)}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          </div>
        ))}
      </nav>

      <button type="button" className="sign-out" onClick={onSignOut}>
        <span>Sign Out</span>
      </button>
    </aside>
  )
}

function AdminPanel({
  onToast,
  onSignOut,
  onSwitchToSeller,
}: {
  onToast: (message: string) => void
  onSignOut: () => void
  onSwitchToSeller: () => void
}) {
  const [active, setActive] = useState('Sellers')
  const [search, setSearch] = useState('')
  const [deleted, setDeleted] = useState(false)
  const [menu, setMenu] = useState(false)

  const sellerVisible = useMemo(() => 'tester'.includes(search.toLowerCase()), [search])

  return (
    <div className="app-shell admin-shell">
      <AdminSidebar
        active={active}
        onNavigate={(label) => {
          setActive(label)
          onToast(`${label} view selected`)
        }}
        onSignOut={onSignOut}
      />
      <main className="admin-main">
        <div className="admin-topbar">
          <div className="admin-heading">
            <span className="section-mark">
              <Users size={22} />
            </span>
            <div>
              <h1>{active}</h1>
              <p>All sellers who registered with your invitation code. Click a row to manage.</p>
            </div>
          </div>
          <div className="admin-tools">
            <label className="search-box">
              <Search size={18} />
              <input
                aria-label="Search sellers"
                placeholder="Search shop, name, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <span className="results">
              RESULTS <b>{sellerVisible ? 1 : 0}</b>
            </span>
            <button
              type="button"
              className={`toggle ${deleted ? 'on' : ''}`}
              onClick={() => setDeleted(!deleted)}
            >
              <span>Deleted</span> <i />
            </button>
          </div>
        </div>

        {active === 'Sellers' ? (
          <section className="seller-list">
            {sellerVisible && !deleted ? (
              <div className="seller-row">
                <div className="row-identity">
                  <div className="avatar seller-avatar">
                    T<span className="online-dot" />
                  </div>
                  <div>
                    <strong>
                      tester <em>Online</em>
                    </strong>
                    <span>zain55@gmail.com</span>
                    <small>
                      <CalendarDays size={13} /> Joined 7 Aug 2026
                    </small>
                  </div>
                </div>
                <div className="seller-rating">
                  <b>★ 5.00</b>
                  <span>500 Active Items</span>
                </div>
                <div className="seller-verification">
                  <b>VERIFIED</b>
                  <span>ACCOUNT TIER</span>
                </div>
                <div className="row-actions">
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToSeller()
                      onToast('Switched to seller account dashboard')
                    }}
                  >
                    <LogIn size={16} /> Login
                  </button>
                  <button
                    type="button"
                    className="more"
                    onClick={() => setMenu(!menu)}
                    aria-label="More seller actions"
                  >
                    <MoreVertical size={18} />
                  </button>
                  {menu && (
                    <div className="more-menu">
                      <button
                        type="button"
                        onClick={() => {
                          onToast('Seller details opened')
                          setMenu(false)
                        }}
                      >
                        View details
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onToast('Seller suspended')
                          setMenu(false)
                        }}
                      >
                        Suspend seller
                      </button>
                    </div>
                  )}
                </div>
                <div className="seller-balance">
                  <span>BALANCE</span>
                  <b>$0.00</b>
                  <small>Guarantee $0.00</small>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <Search size={30} />
                <strong>No sellers found</strong>
                <span>Try changing your search or deleted filter.</span>
              </div>
            )}
          </section>
        ) : (
          <div className="admin-placeholder">
            <Sparkles size={28} />
            <h2>{active}</h2>
            <p>This workspace is ready for your next management action.</p>
          </div>
        )}
      </main>
    </div>
  )
}

function AuthScreen({
  onLoginSuccess,
  onAdmin,
  onToast,
}: {
  onLoginSuccess: (profile: SellerProfile) => void
  onAdmin: () => void
  onToast: (msg: string) => void
}) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  const [signInEmail, setSignInEmail] = useState('zain55@gmail.com')
  const [signInPassword, setSignInPassword] = useState('••••••••')

  const [fullName, setFullName] = useState('')
  const [shopName, setShopName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!signInEmail.trim()) {
      setErrorMessage('Please enter your email address')
      return
    }
    if (!signInPassword) {
      setErrorMessage('Please enter your password')
      return
    }

    setIsLoading(true)
    try {
      const res = await signInSeller({
        email: signInEmail,
        password: signInPassword,
      })

      if (res.success && res.profile) {
        onToast(`Welcome back, ${res.profile.ownerName || res.profile.shopName}!`)
        onLoginSuccess(res.profile)
      } else {
        setErrorMessage(res.error || 'Invalid credentials. Please check your email and password.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error signing in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name')
      return
    }
    if (!shopName.trim()) {
      setErrorMessage('Please enter your shop or store name')
      return
    }
    if (!signUpEmail.trim() || !signUpEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address')
      return
    }
    if (signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)
    try {
      const res = await signUpSeller({
        email: signUpEmail,
        password: signUpPassword,
        shopName,
        ownerName: fullName,
      })

      if (res.success && res.profile) {
        if (res.needsEmailConfirmation) {
          setSuccessMessage('Registration successful! Please check your email inbox to confirm your account.')
          onToast('Account created! Please verify your email.')
        } else {
          onToast(`Store created! Welcome to U Seller Store, ${res.profile.ownerName}`)
          onLoginSuccess(res.profile)
        }
      } else {
        setErrorMessage(res.error || 'Failed to create store account. Please try again.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error creating account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-visual">
        <div className="brand" style={{ padding: 0, border: 0 }}>
          <div className="brand-mark" style={{ color: '#fff', borderColor: '#7197ad' }}>
            <Store size={22} />
          </div>
          <div className="brand-info">
            <strong style={{ color: '#fff' }}>U Seller Store</strong>
            <span style={{ color: '#adc9e4' }}>Merchant Portal</span>
          </div>
        </div>
        <div className="login-copy">
          <span className="eyebrow">THE SIMPLE WAY TO SELL ONLINE</span>
          <h1>
            Build your store.
            <br />
            <em>Grow your business.</em>
          </h1>
          <p>
            Everything you need to find products, manage orders, track payouts, and turn your ideas into a thriving
            store.
          </p>
          <div className="login-features">
            <span>
              <Check size={16} /> Curated products
            </span>
            <span>
              <Check size={16} /> Simple fulfillment
            </span>
            <span>
              <Check size={16} /> Real-time database
            </span>
          </div>
        </div>
        <div className="visual-orbit">
          <Store size={70} />
          <span>U</span>
        </div>
      </div>

      <div className="login-form-wrap">
        <button type="button" className="admin-switch" onClick={onAdmin}>
          <span>Admin panel</span> <ArrowUpRight size={15} />
        </button>

        <div className="login-form">
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={authMode === 'signin'}
              className={`auth-tab-btn ${authMode === 'signin' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('signin')
                setErrorMessage('')
                setSuccessMessage('')
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={authMode === 'signup'}
              className={`auth-tab-btn ${authMode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('signup')
                setErrorMessage('')
                setSuccessMessage('')
              }}
            >
              Create Account
            </button>
          </div>

          {errorMessage && (
            <div className="auth-error-banner" role="alert">
              <AlertCircle size={17} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="auth-success-banner" role="alert">
              <CheckCircle2 size={17} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {authMode === 'signin' ? (
            <form onSubmit={handleSignIn}>
              <div className="form-intro">
                <span className="form-icon">
                  <LogIn size={20} />
                </span>
                <span className="eyebrow">WELCOME BACK</span>
                <h2>Sign in to your store</h2>
                <p>Enter your credentials to access your merchant dashboard.</p>
              </div>

              <label>
                Email address
                <input
                  type="email"
                  placeholder="you@yourstore.com"
                  required
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  placeholder="Enter your password"
                  required
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                />
              </label>

              <div className="form-row">
                <label className="remember">
                  <input type="checkbox" defaultChecked /> Remember me
                </label>
                <button
                  type="button"
                  className="forgot"
                  onClick={() => onToast('Password reset link sent if account exists')}
                >
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="login-submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span> <ArrowUpRight size={17} />
                  </>
                )}
              </button>

              <p className="login-foot">
                Don&apos;t have a store yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup')
                    setErrorMessage('')
                  }}
                >
                  Create account
                </button>
              </p>

              <p className="login-foot" style={{ marginTop: '10px' }}>
                Demo prototype ·{' '}
                <button
                  type="button"
                  onClick={() => {
                    setSignInEmail('zain55@gmail.com')
                    setSignInPassword('password123')
                    onToast('Demo store access granted')
                    onLoginSuccess(initialSellerProfile)
                  }}
                >
                  Continue as tester
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignUp}>
              <div className="form-intro">
                <span className="form-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                  <UserPlus size={20} />
                </span>
                <span className="eyebrow">START SELLING TODAY</span>
                <h2>Create store account</h2>
                <p>Register your merchant profile and launch your online store.</p>
              </div>

              <label>
                Your Full Name
                <input
                  type="text"
                  placeholder="e.g. Alex Miller"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </label>

              <label>
                Shop / Store Name
                <input
                  type="text"
                  placeholder="e.g. Apex Trends Store"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                />
              </label>

              <label>
                Email address
                <input
                  type="email"
                  placeholder="alex@yourstore.com"
                  required
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                />
              </label>

              <button type="submit" className="login-submit" disabled={isLoading} style={{ marginTop: '8px' }}>
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Creating store...</span>
                  </>
                ) : (
                  <>
                    <span>Create Store & Account</span> <ArrowUpRight size={17} />
                  </>
                )}
              </button>

              <p className="login-foot">
                Already have a store account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin')
                    setErrorMessage('')
                  }}
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}

export default function Page() {
  const [mode, setMode] = useState<Mode>('login')
  const [sellerTab, setSellerTab] = useState<SellerTab>('Products')
  const [toast, setToast] = useState('')
  const [modeOpen, setModeOpen] = useState(false)
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false)

  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications)
  const [profile, setProfile] = useState<SellerProfile>(initialSellerProfile)

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  const loadSupabaseData = async () => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('u_seller_active_profile')
        if (saved) {
          setProfile(JSON.parse(saved))
        }
      }
    } catch {}

    if (!isSupabaseConfigured()) return
    try {
      const [supaProds, supaOrders, supaNotifs, supaProfile] = await Promise.all([
        fetchProducts(),
        fetchOrders(),
        fetchNotifications(),
        fetchSellerProfile(),
      ])
      if (supaProds && supaProds.length > 0) setProducts(supaProds)
      if (supaOrders && supaOrders.length > 0) setOrders(supaOrders)
      if (supaNotifs && supaNotifs.length > 0) setNotifications(supaNotifs)
      if (supaProfile) setProfile(supaProfile)
    } catch (err) {
      console.warn('[Supabase] Sync error:', err)
    }
  }

  useEffect(() => {
    loadSupabaseData()
  }, [])

  const signOut = async () => {
    await signOutSeller()
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('u_seller_active_profile')
      }
    } catch {}
    setMode('login')
    showToast('You have been signed out')
  }

  const handleAuthSuccess = (newProfile: SellerProfile) => {
    setProfile(newProfile)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('u_seller_active_profile', JSON.stringify(newProfile))
      }
    } catch {}
    setMode('seller')
    setSellerTab('Dashboard')
  }

  const handleAddProduct = async (newProd: Omit<Product, 'id'>) => {
    const created = await createProduct(newProd)
    if (created) {
      setProducts((prev) => [created, ...prev])
    }
  }

  const handleUpdateProduct = async (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    await updateProduct(updated)
  }

  const handleDeleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
    await deleteProduct(id)
  }

  const handleCreateDemoOrder = async () => {
    const demoOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber: '#ORD-' + Math.floor(10000 + Math.random() * 90000),
      customerName: 'Sarah Jenkins',
      customerEmail: 'sarah.j@example.com',
      shippingAddress: '742 Evergreen Terrace, Springfield, OR',
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'paid',
      totalAmount: 59.95,
      profit: 12.42,
      items: [
        {
          productTitle: 'Superfeet All-Purpose Support Medium Arch Insoles',
          quantity: 1,
          price: 59.95,
          image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=500&q=80',
        },
      ],
    }
    const saved = await createOrder(demoOrder)
    setOrders((prev) => [saved || demoOrder, ...prev])
    const newBalance = Number((profile.balance + 12.42).toFixed(2))
    const newTotalOrders = profile.totalOrders + 1
    setProfile((prev) => ({
      ...prev,
      balance: newBalance,
      totalOrders: newTotalOrders,
    }))
    await updateSellerProfile({ balance: newBalance, totalOrders: newTotalOrders })
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
    await updateOrderStatus(orderId, newStatus)
  }

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    await markNotificationAsRead(id)
  }

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    showToast('All notifications marked as read')
    await markAllNotificationsAsRead()
  }

  const handleDeleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    await deleteNotification(id)
  }

  const handleUpdateProfile = async (updates: Partial<SellerProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }))
    await updateSellerProfile(updates)
  }

  const handleWithdraw = async (amount: number) => {
    const newBal = Number(Math.max(0, profile.balance - amount).toFixed(2))
    setProfile((prev) => ({
      ...prev,
      balance: newBal,
    }))
    await updateSellerProfile({ balance: newBal })
  }

  const unreadNotifCount = notifications.filter((n) => !n.read).length

  return (
    <>
      {mode !== 'login' && (
        <header className="mode-switcher flex items-center gap-2">
          <button
            type="button"
            className="mode-trigger"
            onClick={() => setModeOpen(!modeOpen)}
          >
            <span className="mode-dot" />
            <span>U Seller Store ({mode.toUpperCase()})</span>
            <ChevronDown size={15} />
          </button>
          {modeOpen && (
            <div className="mode-menu">
              <button
                type="button"
                onClick={() => {
                  setMode('seller')
                  setModeOpen(false)
                }}
              >
                Seller account
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('admin')
                  setModeOpen(false)
                }}
              >
                Admin panel
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setModeOpen(false)
                }}
              >
                Sign out / Switch account
              </button>
            </div>
          )}
        </header>
      )}

      {mode === 'seller' ? (
        <div className="app-shell seller-shell">
          <SellerSidebar
            activeTab={sellerTab}
            onSelectTab={(tab) => {
              setSellerTab(tab)
              showToast(`${tab} opened`)
            }}
            onSignOutClick={signOut}
            onBalanceClick={() => setIsBalanceModalOpen(true)}
            unreadNotificationsCount={unreadNotifCount}
            shopName={profile.shopName}
            ownerName={profile.ownerName}
            balance={profile.balance}
            guarantee={profile.guarantee}
          />

          <main className="seller-main">
            {sellerTab === 'Dashboard' && (
              <DashboardView
                profile={profile}
                products={products}
                orders={orders}
                onNavigate={(tab) => {
                  setSellerTab(tab)
                  showToast(`${tab} opened`)
                }}
                onOpenBalanceModal={() => setIsBalanceModalOpen(true)}
                onToast={showToast}
              />
            )}

            {sellerTab === 'Products' && (
              <ProductsView
                products={products}
                maxSlots={500}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onToast={showToast}
              />
            )}

            {sellerTab === 'Orders' && (
              <OrdersView
                orders={orders}
                onCreateDemoOrder={handleCreateDemoOrder}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onToast={showToast}
              />
            )}

            {sellerTab === 'Notifications' && (
              <NotificationsView
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                onDeleteNotification={handleDeleteNotification}
                onToast={showToast}
              />
            )}

            {sellerTab === 'Profile' && (
              <ProfileView
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                onSignOut={signOut}
                onOpenBalanceModal={() => setIsBalanceModalOpen(true)}
                onToast={showToast}
              />
            )}
          </main>

          <SupportChatModal onToast={showToast} />

          <BalanceModal
            isOpen={isBalanceModalOpen}
            profile={profile}
            onClose={() => setIsBalanceModalOpen(false)}
            onWithdraw={handleWithdraw}
            onToast={showToast}
          />
        </div>
      ) : mode === 'admin' ? (
        <AdminPanel
          onToast={showToast}
          onSignOut={signOut}
          onSwitchToSeller={() => {
            setMode('seller')
            setSellerTab('Dashboard')
          }}
        />
      ) : (
        <AuthScreen
          onLoginSuccess={handleAuthSuccess}
          onAdmin={() => setMode('admin')}
          onToast={showToast}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </>
  )
}
