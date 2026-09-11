'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingDashboard } from '@/components/shop/ShoppingDashboard'
import {
  initialProducts,
  initialSellerProfile,
  Product,
  Order,
  SellerProfile
} from '@/lib/mock-data'
import {
  fetchProducts,
  fetchSellerProfile,
  createOrder,
  updateSellerProfile,
} from '@/lib/supabase/api'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { Check, X } from 'lucide-react'

export default function ShopPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('u_seller_products')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
      } catch {}
    }
    return initialProducts
  })

  const [profile, setProfile] = useState<SellerProfile>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('u_seller_active_profile')
        if (stored) return JSON.parse(stored)
      } catch {}
    }
    return initialSellerProfile
  })

  const [toast, setToast] = useState('')

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  useEffect(() => {
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
        console.warn('Failed to load shop data from Supabase:', err)
      }
    }
    loadData()
  }, [])

  const handlePlaceOrder = async (newOrder: Order) => {
    // 1. Save to Database (calls /api/orders and Supabase)
    const saved = await createOrder(newOrder)
    const activeOrder = saved || newOrder

    // 2. Decrement local product stock
    setProducts((prev) =>
      prev.map((p) => {
        const item = newOrder.items.find((i) => i.productTitle.toLowerCase().includes(p.title.slice(0, 25).toLowerCase()))
        if (item) {
          const newStock = Math.max(0, p.stock - item.quantity)
          return { ...p, stock: newStock, status: newStock === 0 ? 'out_of_stock' : p.status }
        }
        return p
      })
    )

    // 3. Update local seller balance and orders
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
        // Append to cached orders
        const savedOrders = localStorage.getItem('u_seller_orders')
        const ordersList = savedOrders ? JSON.parse(savedOrders) : []
        localStorage.setItem('u_seller_orders', JSON.stringify([activeOrder, ...ordersList.filter((o: Order) => o.id !== activeOrder.id)]))
      } catch {}
    }

    await updateSellerProfile({ balance: newBalance, totalOrders: newTotalOrders })
    showToast(`Order ${activeOrder.orderNumber} successfully saved and recorded in database!`)
  }

  return (
    <>
      <ShoppingDashboard
        products={products}
        sellerProfile={profile}
        onPlaceOrder={handlePlaceOrder}
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
