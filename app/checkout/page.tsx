'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingDashboard } from '@/components/shop/ShoppingDashboard'
import {
  initialProducts,
  initialSellerProfile,
  Product,
  Order,
  SellerProfile,
} from '@/lib/mock-data'
import {
  fetchProducts,
  fetchSellerProfile,
  createOrder,
  updateSellerProfile,
} from '@/lib/supabase/api'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { Check, X } from 'lucide-react'

export default function CheckoutPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [profile, setProfile] = useState<SellerProfile>(initialSellerProfile)
  const [toast, setToast] = useState('')

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('u_seller_products')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProducts(parsed)
          }
        }
        const storedProfile = localStorage.getItem('u_seller_active_profile')
        if (storedProfile) {
          setProfile(JSON.parse(storedProfile))
        }
      }
    } catch {}

    async function loadData() {
      if (!isSupabaseConfigured()) return
      try {
        const [supaProds, supaProfile] = await Promise.all([
          fetchProducts(),
          fetchSellerProfile(),
        ])
        if (supaProds && supaProds.length > 0) {
          setProducts(supaProds)
        }
        if (supaProfile) {
          setProfile(supaProfile)
        }
      } catch (err) {
        console.warn('Failed to load checkout data from Supabase:', err)
      }
    }
    loadData()
  }, [])

  const handlePlaceOrder = async (orderData: Order) => {
    let activeOrder = { ...orderData }

    if (isSupabaseConfigured()) {
      try {
        const savedOrder = await createOrder(activeOrder)
        if (savedOrder) {
          activeOrder = savedOrder
        }
      } catch (err) {
        console.warn('Could not save order in Supabase:', err)
      }
    }

    const newBalance = Number((profile.balance + Number(activeOrder.profit || 0)).toFixed(2))
    const newTotalOrders = profile.totalOrders + 1

    const updatedProfile = {
      ...profile,
      balance: newBalance,
      totalOrders: newTotalOrders,
    }
    setProfile(updatedProfile)

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('u_seller_active_profile', JSON.stringify(updatedProfile))
        const savedOrders = localStorage.getItem('u_seller_orders')
        const ordersList = savedOrders ? JSON.parse(savedOrders) : []
        localStorage.setItem(
          'u_seller_orders',
          JSON.stringify([
            activeOrder,
            ...ordersList.filter((o: Order) => o.id !== activeOrder.id && o.orderNumber !== activeOrder.orderNumber),
          ])
        )

        // Create seller notification
        const newNotif = {
          id: `notif-${Date.now()}`,
          title: 'New Customer Order',
          description: `Order ${activeOrder.orderNumber} for $${Number(activeOrder.totalAmount).toFixed(2)} received from ${activeOrder.customerName}`,
          date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(),
          timeAgo: 'Just now',
          refCode: activeOrder.orderNumber,
          type: 'order',
          read: false,
          details: `Customer ${activeOrder.customerName} placed order ${activeOrder.orderNumber} for ${activeOrder.items?.length || 0} item(s) totaling $${Number(activeOrder.totalAmount).toFixed(2)}. Delivery to: ${activeOrder.shippingAddress}.`,
        }
        const notifList = JSON.parse(localStorage.getItem('u_seller_notifications') || '[]')
        localStorage.setItem('u_seller_notifications', JSON.stringify([newNotif, ...notifList.filter((n: any) => n.id !== newNotif.id)]))

        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('u_seller_orders_update', { detail: { order: activeOrder } }))
          window.dispatchEvent(new CustomEvent('u_seller_notifications_update', { detail: { notification: newNotif } }))
          window.dispatchEvent(new CustomEvent('u_seller_profile_update', { detail: { profile: updatedProfile } }))
        }, 0)
      } catch {}
    }

    await updateSellerProfile({ balance: newBalance, totalOrders: newTotalOrders })
    showToast(`Order ${activeOrder.id || activeOrder.orderNumber} successfully placed!`)
  }

  return (
    <>
      <ShoppingDashboard
        products={products}
        sellerProfile={profile}
        initialNavTab="checkout"
        onPlaceOrder={handlePlaceOrder}
        onSwitchToLogin={() => router.push('/?mode=login')}
        onSwitchToSignUp={() => router.push('/?mode=login&tab=signup')}
        onSwitchToSeller={() => router.push('/')}
        onSwitchToAdmin={() => router.push('/')}
        onToast={showToast}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-2">
          <Check size={16} className="text-emerald-400" />
          <span className="text-xs font-semibold">{toast}</span>
          <button
            type="button"
            onClick={() => setToast('')}
            className="text-slate-400 hover:text-white p-0.5 rounded-md"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </>
  )
}
