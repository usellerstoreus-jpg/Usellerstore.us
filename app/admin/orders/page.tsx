'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  initialProducts,
  initialOrders,
  initialSellerProfile,
  Product,
  Order,
  NotificationItem,
  SellerProfile
} from '@/lib/mock-data'
import {
  fetchProducts,
  fetchOrders,
  fetchSellerProfile,
  fetchSellerProfiles,
  createOrder,
  createNotification,
  updateOrderStatus,
  deleteOrder,
  updateSellerProfile,
} from '@/lib/supabase/api'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { AdminOrdersView } from '@/components/admin/AdminOrdersView'
import { BrandLogo } from '@/components/ui/BrandLogo'
import {
  Grid2X2,
  Users,
  ShieldCheck,
  ShoppingBag,
  MessageSquare,
  WalletCards,
  Activity,
  FileText,
  LogOut,
  Copy,
  Pencil,
  RefreshCw,
  Menu,
  X,
  Store,
  Check
} from 'lucide-react'

const adminNav = [
  { label: 'Dashboard', icon: Grid2X2, group: 'Manage' },
  { label: 'Sellers', icon: Users, group: 'Manage' },
  { label: 'KYC', icon: ShieldCheck, group: 'Manage' },
  { label: 'Orders', icon: ShoppingBag, group: 'Manage' },
  { label: 'Support', icon: MessageSquare, group: 'Communication' },
  { label: 'Withdrawals', icon: WalletCards, group: 'Finance' },
  { label: 'Recent Actions', icon: Activity, group: 'Activity' },
  { label: 'My Logs', icon: FileText, group: 'Activity' },
]

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [profile, setProfile] = useState<SellerProfile>(initialSellerProfile)
  const [sellers, setSellers] = useState<SellerProfile[]>([])
  const [activeTab, setActiveTab] = useState('Orders')
  const [toast, setToast] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(''), 2800)
  }

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const storedOrders = localStorage.getItem('u_seller_orders')
        if (storedOrders) {
          const parsed = JSON.parse(storedOrders)
          if (Array.isArray(parsed)) setOrders(parsed)
        }
        const storedProducts = localStorage.getItem('u_seller_products')
        if (storedProducts) {
          const parsed = JSON.parse(storedProducts)
          if (Array.isArray(parsed)) {
            setProducts(parsed)
          }
        }
        const storedProfile = localStorage.getItem('u_seller_active_profile')
        if (storedProfile) setProfile(JSON.parse(storedProfile))
      }
    } catch {}

    async function syncSupabase() {
      if (!isSupabaseConfigured()) return
      try {
        const [supaOrders, supaProds, supaProfile, supaSellers] = await Promise.all([
          fetchOrders(),
          fetchProducts(),
          fetchSellerProfile(),
          fetchSellerProfiles(),
        ])
        if (supaOrders) setOrders(supaOrders)
        if (supaProds) setProducts(supaProds)
        if (supaProfile) setProfile(supaProfile)
        if (supaSellers) setSellers(supaSellers)
      } catch (err) {
        console.warn('[AdminOrders] Sync error:', err)
      }
    }
    syncSupabase()
  }, [])

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: Order['status'],
    targetSellerId?: string
  ) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return

    const oldStatus = order.status
    if (oldStatus === newStatus) return

    // Enforce stage progression: direct transition to delivered without passing stages is blocked
    if (newStatus === 'delivered') {
      const normStatus = oldStatus === 'unpaid' ? 'paid' : oldStatus
      if (normStatus !== 'out_for_delivery') {
        showToast('Order must be paid to process before it can be completed.')
        return
      }
    }

    // Find the target seller to credit or debit
    const sellerToUpdate = sellers.find((s) => s.id === (targetSellerId || order.sellerId)) || profile
    let updatedBalance = sellerToUpdate.balance
    const profit = Number(order.profit) || 0

    // Moving to delivered from non-delivered: CREDIT PROFIT TO DASHBOARD
    if (newStatus === 'delivered' && oldStatus !== 'delivered') {
      updatedBalance = Number((sellerToUpdate.balance + profit).toFixed(2))
      if (sellerToUpdate.id === profile.id || !sellerToUpdate.id) {
        setProfile((prev) => ({ ...prev, balance: updatedBalance }))
      }
      setSellers((prev) =>
        prev.map((s) => (s.id === sellerToUpdate.id ? { ...s, balance: updatedBalance } : s))
      )
      await updateSellerProfile({ balance: updatedBalance }, sellerToUpdate.id)
      showToast(`🎉 Order ${order.orderNumber} DELIVERED! +$${profit.toFixed(2)} profit added to dashboard`)
    }
    // Moving from delivered to cancelled: REVERSE PROFIT
    else if (oldStatus === 'delivered' && newStatus === 'cancelled') {
      updatedBalance = Number(Math.max(0, sellerToUpdate.balance - profit).toFixed(2))
      if (sellerToUpdate.id === profile.id || !sellerToUpdate.id) {
        setProfile((prev) => ({ ...prev, balance: updatedBalance }))
      }
      setSellers((prev) =>
        prev.map((s) => (s.id === sellerToUpdate.id ? { ...s, balance: updatedBalance } : s))
      )
      await updateSellerProfile({ balance: updatedBalance }, sellerToUpdate.id)
      showToast(`Order ${order.orderNumber} cancelled. Profit reversed from dashboard`)
    } else {
      showToast(`Order ${order.orderNumber} status updated to ${newStatus.replace(/_/g, ' ')}`)
    }

    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
    await updateOrderStatus(orderId, newStatus, sellerToUpdate.id)
  }

  const handleDeleteOrder = async (orderId: string) => {
    const orderToDelete = orders.find((o) => o.id === orderId)
    if (!orderToDelete) return

    setOrders((prev) => prev.filter((o) => o.id !== orderId))

    const targetSeller = sellers.find((s) => s.id === orderToDelete.sellerId) || profile
    let newBalance = targetSeller.balance || 0
    if (orderToDelete.status === 'delivered') {
      const profitToDeduct = Number(orderToDelete.profit) || 0
      newBalance = Number(Math.max(0, newBalance - profitToDeduct).toFixed(2))
    }
    const newTotalOrders = Math.max(0, (targetSeller.totalOrders || 1) - 1)

    if (targetSeller.id === profile.id || !targetSeller.id) {
      setProfile((prev) => ({
        ...prev,
        balance: newBalance,
        totalOrders: newTotalOrders,
      }))
    }
    setSellers((prev) =>
      prev.map((s) =>
        s.id === targetSeller.id
          ? { ...s, balance: newBalance, totalOrders: newTotalOrders }
          : s
      )
    )

    await Promise.all([
      deleteOrder(orderId),
      updateSellerProfile({ balance: newBalance, totalOrders: newTotalOrders }, targetSeller.id),
    ])
    showToast(`Order ${orderToDelete.orderNumber} removed from database`)
  }

  const handleCreateOrder = async (newOrder: Order) => {
    const saved = await createOrder(newOrder)
    const activeOrder = saved || newOrder

    setOrders((prev) => [activeOrder, ...prev.filter((o) => o.id !== activeOrder.id)])

    const targetSeller = sellers.find((s) => s.id === activeOrder.sellerId) || profile
    const profitToAdd = Number(activeOrder.profit) || 0
    const newBalance = activeOrder.status === 'delivered'
      ? Number(((targetSeller.balance || 0) + profitToAdd).toFixed(2))
      : (targetSeller.balance || 0)
    const newTotalOrders = (targetSeller.totalOrders || 0) + 1

    if (targetSeller.id === profile.id || !targetSeller.id) {
      setProfile((prev) => ({
        ...prev,
        balance: newBalance,
        totalOrders: newTotalOrders,
      }))
    }
    setSellers((prev) =>
      prev.map((s) =>
        s.id === targetSeller.id
          ? { ...s, balance: newBalance, totalOrders: newTotalOrders }
          : s
      )
    )
    await updateSellerProfile({ balance: newBalance, totalOrders: newTotalOrders }, targetSeller.id)

    const newNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      title: 'New Customer Order',
      description: `Order ${activeOrder.orderNumber} for $${Number(activeOrder.totalAmount).toFixed(2)} assigned by Admin.`,
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(),
      timeAgo: 'Just now',
      refCode: activeOrder.orderNumber,
      type: 'order',
      read: false,
      details: `Customer ${activeOrder.customerName} (${activeOrder.customerEmail}) order #${activeOrder.orderNumber} assigned to ${targetSeller.shopName}. Profit: $${profitToAdd.toFixed(2)}. Delivery: ${activeOrder.shippingAddress}.`,
    }

    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('u_seller_notifications')
        const list = stored ? JSON.parse(stored) : []
        localStorage.setItem('u_seller_notifications', JSON.stringify([newNotif, ...list]))
        window.dispatchEvent(new CustomEvent('u_seller_notifications_update', { detail: { notification: newNotif } }))
      }
    } catch {}
    createNotification(newNotif).catch(() => {})

    if (activeOrder.status === 'delivered') {
      showToast(`Order ${activeOrder.orderNumber} placed & delivered for ${targetSeller.shopName}! (+$${profitToAdd.toFixed(2)} profit)`)
    } else {
      showToast(`Order ${activeOrder.orderNumber} created for ${targetSeller.shopName} in Pending stage.`)
    }
  }

  return (
    <div className="app-shell admin-shell min-h-screen flex flex-col md:flex-row bg-[#F8FAFC]">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Admin Sidebar matching screenshot */}
      <aside
        className={`sidebar admin-sidebar ${
          isMobileMenuOpen
            ? 'fixed inset-y-0 left-0 z-50 flex flex-col shadow-2xl translate-x-0 w-[270px] bg-white border-r border-slate-100'
            : 'hidden md:flex flex-col w-[270px] bg-white border-r border-slate-100 min-h-screen shrink-0'
        }`}
      >
        <div className="brand flex items-center justify-between p-4 border-b border-slate-100">
          <BrandLogo size="md" subtitle="Management Console" />
          {isMobileMenuOpen && (
            <button
              type="button"
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Administrator User Card */}
        <div className="admin-user p-4 flex items-center gap-3">
          <div className="avatar admin-avatar relative w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
            Z<span className="online-dot absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white" />
          </div>
          <div>
            <strong className="text-sm font-bold text-slate-900 block leading-tight">zain</strong>
            <span className="text-xs text-slate-400 font-medium block leading-tight">Administrator</span>
          </div>
        </div>

        {/* Invite Code Widget */}
        <div className="invite mx-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span>
            INVITE <b className="text-slate-900 font-bold ml-1">MXSVHSDL</b>
          </span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Copy size={14} className="hover:text-slate-700 cursor-pointer" onClick={() => showToast('Invite code copied')} />
            <Pencil size={14} className="hover:text-slate-700 cursor-pointer" onClick={() => showToast('Edit invite code')} />
            <RefreshCw size={14} className="hover:text-slate-700 cursor-pointer" onClick={() => showToast('Refreshed invite code')} />
          </div>
        </div>

        {/* Nav Links */}
        <nav className="admin-nav flex-1 overflow-y-auto p-3 space-y-1" aria-label="Admin navigation">
          {adminNav.map(({ label, icon: Icon, group }, index) => {
            const isFirstInGroup = index === 0 || adminNav[index - 1].group !== group
            const isActive = activeTab === label
            return (
              <div key={label}>
                {isFirstInGroup && (
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 pt-3 pb-1">
                    {group}
                  </div>
                )}
                <button
                  type="button"
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#EEF2FF] text-indigo-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  onClick={() => {
                    setActiveTab(label)
                    if (label === 'Dashboard') {
                      router.push('/admin/dashboard')
                    } else if (label === 'Sellers') {
                      router.push('/admin/sellers')
                    } else if (label === 'KYC') {
                      router.push('/admin/kyc')
                    } else if (label === 'Support') {
                      router.push('/admin/support')
                    } else if (label === 'Recent Actions' || label === 'My Logs') {
                      router.push(`/admin/activity?tab=${encodeURIComponent(label)}`)
                    } else if (label !== 'Orders') {
                      router.push(`/?mode=admin&tab=${label}`)
                    }
                  }}
                >
                  <Icon size={17} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                  <span>{label}</span>
                </button>
              </div>
            )
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-3 border-t border-slate-100 mt-auto">
          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
            onClick={() => router.push('/')}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main flex-1 overflow-y-auto pb-16">
        {/* Mobile Top Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="p-1.5 -ml-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
            <BrandLogo size="sm" variant="light" showText={false} />
            <div>
              <strong className="text-xs font-bold text-white block leading-tight">Admin Console</strong>
              <span className="text-[10px] text-purple-300 font-semibold">Orders</span>
            </div>
          </div>
          <button
            type="button"
            className="px-2.5 py-1 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors flex items-center gap-1"
            onClick={() => router.push('/')}
          >
            <Store size={13} /> Storefront
          </button>
        </div>

        <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
          <AdminOrdersView
            orders={orders}
            products={products}
            sellerProfile={profile}
            sellers={sellers}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onDeleteOrder={handleDeleteOrder}
            onCreateOrder={handleCreateOrder}
            onToast={showToast}
            onSwitchToSeller={() => router.push('/')}
          />
        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check size={16} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}
