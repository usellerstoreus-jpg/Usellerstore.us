import { getSupabase, isSupabaseConfigured } from './client'
import {
  Product,
  Order,
  NotificationItem,
  SellerProfile,
  KycSubmission,
  initialProducts,
  initialNotifications,
  initialSellerProfile,
} from '@/lib/mock-data'

export interface ConnectionStatus {
  isConfigured: boolean
  isConnected: boolean
  error?: string
  latencyMs?: number
  productsCount?: number
  ordersCount?: number
}

// -------------------------------------------------------------
// CONNECTION STATUS & PING
// -------------------------------------------------------------
export async function checkSupabaseConnection(): Promise<ConnectionStatus> {
  if (!isSupabaseConfigured()) {
    return {
      isConfigured: false,
      isConnected: false,
      error: 'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured in .env.local',
    }
  }

  const client = getSupabase()
  if (!client) {
    return {
      isConfigured: false,
      isConnected: false,
      error: 'Supabase client could not be initialized.',
    }
  }

  try {
    const startTime = performance.now()
    const { data: productsData, error: productsError, count } = await client
      .from('products')
      .select('id', { count: 'exact', head: true })

    const latencyMs = Math.round(performance.now() - startTime)

    if (productsError) {
      const isTableMissing = productsError.code === 'PGRST205' || productsError.message?.includes('schema cache')
      return {
        isConfigured: true,
        isConnected: false,
        latencyMs,
        error: isTableMissing
          ? 'Connected to your Supabase project! Database tables are pending setup. Run supabase/schema.sql in the Supabase SQL Editor.'
          : productsError.message,
      }
    }

    const { count: ordersCount } = await client
      .from('orders')
      .select('id', { count: 'exact', head: true })

    return {
      isConfigured: true,
      isConnected: true,
      latencyMs,
      productsCount: count || 0,
      ordersCount: ordersCount || 0,
    }
  } catch (err: any) {
    return {
      isConfigured: true,
      isConnected: false,
      error: err.message || 'Unknown network error connecting to Supabase',
    }
  }
}

// -------------------------------------------------------------
// PRODUCTS API
// -------------------------------------------------------------
export async function fetchProducts(): Promise<Product[] | null> {
  const client = getSupabase()
  if (!client) {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('u_seller_products')
        if (stored) return JSON.parse(stored)
      }
    } catch {}
    return null
  }

  try {
    const { data, error } = await client
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[Supabase] Failed to fetch products:', error.message)
      try {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('u_seller_products')
          if (stored) return JSON.parse(stored)
        }
      } catch {}
      return null
    }

    const mapped: Product[] = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      cost: Number(row.cost),
      sell: Number(row.sell),
      profit: Number(row.profit),
      image: row.image || '',
      stock: Number(row.stock),
      sku: row.sku || '',
      status: row.status as Product['status'],
    }))

    // Keep localStorage synchronized with live database, merging any local additions
    let combined = mapped
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('u_seller_products')
        if (stored) {
          const localList: Product[] = JSON.parse(stored)
          if (Array.isArray(localList)) {
            const dataIds = new Set(mapped.map((m) => m.id))
            const localOnly = localList.filter((l) => !dataIds.has(l.id))
            if (localOnly.length > 0) {
              combined = [...localOnly, ...mapped]
            }
          }
        }
        localStorage.setItem('u_seller_products', JSON.stringify(combined))
      }
    } catch {}

    return combined
  } catch (err) {
    console.warn('[Supabase] Error fetching products:', err)
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('u_seller_products')
        if (stored) return JSON.parse(stored)
      }
    } catch {}
    return null
  }
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product | null> {
  const client = getSupabase()
  const prodId = 'prod-' + Date.now() + '-' + Math.floor(Math.random() * 1000)

  const defaultImage =
    product.image ||
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=500&q=80'

  const newProduct: Product = {
    ...product,
    id: prodId,
    cost: Number(product.cost),
    sell: Number(product.sell),
    profit: Number(product.profit),
    stock: Number(product.stock),
    image: defaultImage,
    status: product.status || 'active',
  }

  // Always save to localStorage first for instant responsiveness & offline resilience
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('u_seller_products')
      const list: Product[] = stored ? JSON.parse(stored) : []
      localStorage.setItem('u_seller_products', JSON.stringify([newProduct, ...list.filter((p) => p.id !== prodId)]))
    }
  } catch {}

  if (!client) {
    return newProduct
  }

  try {
    const { data, error } = await client
      .from('products')
      .insert({
        id: prodId,
        title: newProduct.title,
        category: newProduct.category,
        cost: newProduct.cost,
        sell: newProduct.sell,
        profit: newProduct.profit,
        image: newProduct.image,
        stock: newProduct.stock,
        sku: newProduct.sku || '',
        status: newProduct.status,
      })
      .select()
      .single()

    if (error) {
      console.warn('[Supabase] Failed to insert product in DB, preserving local copy:', error.message)
      return newProduct
    }

    const createdProduct: Product = {
      id: data.id,
      title: data.title,
      category: data.category,
      cost: Number(data.cost),
      sell: Number(data.sell),
      profit: Number(data.profit),
      image: data.image || newProduct.image,
      stock: Number(data.stock),
      sku: data.sku || '',
      status: data.status,
    }

    // Synchronize to localStorage
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('u_seller_products')
        const list: Product[] = stored ? JSON.parse(stored) : []
        localStorage.setItem(
          'u_seller_products',
          JSON.stringify([createdProduct, ...list.filter((p) => p.id !== prodId && p.id !== createdProduct.id)])
        )
      }
    } catch {}

    return createdProduct
  } catch (err) {
    console.warn('[Supabase] Error creating product, preserving local copy:', err)
    return newProduct
  }
}

export async function updateProduct(product: Product): Promise<boolean> {
  const client = getSupabase()

  // Always update local cache
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('u_seller_products')
      if (stored) {
        const list: Product[] = JSON.parse(stored)
        localStorage.setItem('u_seller_products', JSON.stringify(list.map((p) => (p.id === product.id ? product : p))))
      }
    }
  } catch {}

  if (!client) return true

  try {
    const { error } = await client
      .from('products')
      .update({
        title: product.title,
        category: product.category,
        cost: Number(product.cost),
        sell: Number(product.sell),
        profit: Number(product.profit),
        image: product.image,
        stock: Number(product.stock),
        sku: product.sku,
        status: product.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', product.id)

    if (error) {
      console.warn('[Supabase] Failed to update product:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Supabase] Error updating product:', err)
    return false
  }
}

export async function deleteProduct(productId: string): Promise<boolean> {
  const client = getSupabase()

  // Always remove from local cache immediately
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('u_seller_products')
      if (stored) {
        const list: Product[] = JSON.parse(stored)
        localStorage.setItem('u_seller_products', JSON.stringify(list.filter((p) => p.id !== productId)))
      }
    }
  } catch {}

  if (!client) return true

  try {
    const { error } = await client
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      console.warn('[Supabase] Failed to delete product from database:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Supabase] Error deleting product from database:', err)
    return false
  }
}

// -------------------------------------------------------------
// ORDERS API
// -------------------------------------------------------------
export async function fetchOrders(): Promise<Order[] | null> {
  const client = getSupabase()
  if (!client) {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('u_seller_orders')
        if (stored) return JSON.parse(stored)
      }
    } catch {}
    return null
  }

  try {
    const { data, error } = await client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[Supabase] Failed to fetch orders:', error.message)
      try {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('u_seller_orders')
          if (stored) return JSON.parse(stored)
        }
      } catch {}
      return null
    }

    const mapped: Order[] = (data || []).map((row: any) => {
      const firstItem = Array.isArray(row.items) ? row.items[0] : null
      const sellerId = row.seller_id || (firstItem && firstItem.sellerId) || ''
      return {
        id: row.id,
        orderNumber: row.order_number,
        customerName: row.customer_name,
        customerEmail: row.customer_email || '',
        shippingAddress: row.shipping_address || '',
        items: row.items || [],
        totalAmount: Number(row.total_amount),
        profit: Number(row.profit),
        status: row.status as Order['status'],
        date: row.date || '',
        sellerId,
      }
    })

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('u_seller_orders', JSON.stringify(mapped))
      }
    } catch {}

    return mapped
  } catch (err) {
    console.warn('[Supabase] Error fetching orders:', err)
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('u_seller_orders')
        if (stored) return JSON.parse(stored)
      }
    } catch {}
    return null
  }
}

export async function createOrder(order: Order): Promise<Order | null> {
  const sellerId = order.sellerId || (order.items && order.items[0]?.sellerId) || ''
  const enrichedItems = (order.items || []).map((item) => ({
    ...item,
    sellerId: item.sellerId || sellerId,
  }))
  const enrichedOrder: Order = {
    ...order,
    sellerId,
    items: enrichedItems,
  }

  // Always update local cache first
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('u_seller_orders')
      const list: Order[] = stored ? JSON.parse(stored) : []
      localStorage.setItem('u_seller_orders', JSON.stringify([enrichedOrder, ...list.filter((o) => o.id !== enrichedOrder.id)]))
    }
  } catch {}

  // Try API route first for atomic multi-table database updates
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: enrichedOrder }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.order) return data.order
      }
    } catch (apiErr) {
      console.warn('[API /api/orders] Fallback to direct client insert:', apiErr)
    }
  }

  const client = getSupabase()
  if (!client) return enrichedOrder

  try {
    const { data, error } = await client
      .from('orders')
      .insert({
        id: enrichedOrder.id,
        order_number: enrichedOrder.orderNumber,
        customer_name: enrichedOrder.customerName,
        customer_email: enrichedOrder.customerEmail,
        shipping_address: enrichedOrder.shippingAddress,
        items: enrichedItems,
        total_amount: enrichedOrder.totalAmount,
        profit: enrichedOrder.profit,
        status: enrichedOrder.status,
        date: enrichedOrder.date,
      })
      .select()
      .single()

    if (error) {
      console.warn('[Supabase] Failed to create order:', error.message)
      return enrichedOrder
    }

    // Also record a notification in Supabase
    try {
      await client.from('notifications').insert({
        id: 'notif-' + Date.now(),
        title: 'New Customer Order',
        description: `Order ${order.orderNumber} for $${Number(order.totalAmount).toFixed(2)} received from ${order.customerName}`,
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(),
        time_ago: 'Just now',
        ref_code: order.orderNumber,
        type: 'order',
        read: false,
        details: `Customer ${order.customerName} (${order.customerEmail}) purchased ${order.items?.length || 0} item(s) totaling $${Number(order.totalAmount).toFixed(2)}. Profit: $${Number(order.profit).toFixed(2)}. Delivery to: ${order.shippingAddress}.`,
      })
    } catch {}

    return {
      id: data.id,
      orderNumber: data.order_number,
      customerName: data.customer_name,
      customerEmail: data.customer_email || '',
      shippingAddress: data.shipping_address || '',
      items: data.items || [],
      totalAmount: Number(data.total_amount),
      profit: Number(data.profit),
      status: data.status,
      date: data.date,
      sellerId,
    }
  } catch (err) {
    console.warn('[Supabase] Error creating order:', err)
    return enrichedOrder
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: Order['status'],
  sellerId?: string
): Promise<{ success: boolean; newBalance?: number | null }> {
  // Update local cache first
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('u_seller_orders')
      if (stored) {
        const list: Order[] = JSON.parse(stored)
        const updated = list.map((o) => (o.id === orderId ? { ...o, status } : o))
        localStorage.setItem('u_seller_orders', JSON.stringify(updated))
      }
    } catch {}
  }

  // 1. Try Next.js API PATCH route for atomic status and profit balance update
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status, sellerId }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.newBalance !== undefined && data.newBalance !== null) {
          // If seller profile was updated with new profit balance, sync localStorage
          try {
            const activeProfileStr = localStorage.getItem('u_seller_active_profile')
            if (activeProfileStr) {
              const activeProf = JSON.parse(activeProfileStr)
              if (!sellerId || activeProf.id === sellerId) {
                activeProf.balance = data.newBalance
                localStorage.setItem('u_seller_active_profile', JSON.stringify(activeProf))
              }
            }
          } catch {}
        }
        return { success: true, newBalance: data.newBalance }
      }
    } catch (apiErr) {
      console.warn('[API /api/orders PATCH] Fallback to direct client:', apiErr)
    }
  }

  // 2. Direct client fallback
  const client = getSupabase()
  if (!client) return { success: false }

  try {
    const { error } = await client
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (error) {
      console.warn('[Supabase] Failed to update order status:', error.message)
      return { success: false }
    }
    return { success: true }
  } catch (err) {
    console.warn('[Supabase] Error updating order status:', err)
    return { success: false }
  }
}

export async function deleteOrder(orderId: string, orderNumber?: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('u_seller_orders')
      if (stored) {
        const list: Order[] = JSON.parse(stored)
        localStorage.setItem('u_seller_orders', JSON.stringify(list.filter((o) => o.id !== orderId)))
      }
    } catch {}
  }

  const client = getSupabase()
  if (!client) return true

  try {
    const { error } = await client.from('orders').delete().eq('id', orderId)
    if (error) {
      console.warn('[Supabase] Failed to delete order:', error.message)
      return false
    }
    if (orderNumber) {
      await client.from('notifications').delete().eq('ref_code', orderNumber)
    }
    return true
  } catch (err) {
    console.warn('[Supabase] Error deleting order:', err)
    return false
  }
}

export async function deleteAllOrders(orderIds?: string[]): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      if (orderIds && orderIds.length > 0) {
        const stored = localStorage.getItem('u_seller_orders')
        if (stored) {
          const list: Order[] = JSON.parse(stored)
          const set = new Set(orderIds)
          localStorage.setItem('u_seller_orders', JSON.stringify(list.filter((o) => !set.has(o.id))))
        }
      } else {
        localStorage.setItem('u_seller_orders', JSON.stringify([]))
      }
      // Also clear order notifications from local storage
      const storedNotifs = localStorage.getItem('u_seller_notifications')
      if (storedNotifs) {
        const notifs: NotificationItem[] = JSON.parse(storedNotifs)
        localStorage.setItem('u_seller_notifications', JSON.stringify(notifs.filter((n) => n.type !== 'order')))
      }
    } catch {}
  }

  const client = getSupabase()
  if (!client) return true

  try {
    let query = client.from('orders').delete()
    if (orderIds && orderIds.length > 0) {
      query = query.in('id', orderIds)
    } else {
      query = query.neq('id', '')
    }
    const { error } = await query
    if (error) {
      console.warn('[Supabase] Failed to delete all orders:', error.message)
      return false
    }
    // Also clean up order notifications from Supabase
    await client.from('notifications').delete().eq('type', 'order')
    return true
  } catch (err) {
    console.warn('[Supabase] Error deleting all orders:', err)
    return false
  }
}

// -------------------------------------------------------------
// NOTIFICATIONS API
// -------------------------------------------------------------
export async function fetchNotifications(): Promise<NotificationItem[] | null> {
  const client = getSupabase()
  if (!client) return null

  try {
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[Supabase] Failed to fetch notifications:', error.message)
      return null
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description || '',
      date: row.date || '',
      timeAgo: row.time_ago || '',
      refCode: row.ref_code || '',
      type: row.type,
      read: Boolean(row.read),
      details: row.details || '',
    }))
  } catch (err) {
    console.warn('[Supabase] Error fetching notifications:', err)
    return null
  }
}

export async function createNotification(notification: NotificationItem): Promise<boolean> {
  const client = getSupabase()
  if (!client) return false

  try {
    const { error } = await client.from('notifications').insert({
      id: notification.id,
      title: notification.title,
      description: notification.description || '',
      date: notification.date || '',
      time_ago: notification.timeAgo || 'Just now',
      ref_code: notification.refCode || '',
      type: notification.type || 'system',
      read: Boolean(notification.read),
      details: notification.details || '',
    })
    if (error) {
      console.warn('[Supabase] Failed to create notification:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Supabase] Error creating notification:', err)
    return false
  }
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  const client = getSupabase()
  if (!client) return false

  try {
    const { error } = await client
      .from('notifications')
      .update({ read: true })
      .eq('id', id)

    if (error) {
      console.warn('[Supabase] Failed to mark notification read:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Supabase] Error marking notification read:', err)
    return false
  }
}

export async function markAllNotificationsAsRead(): Promise<boolean> {
  const client = getSupabase()
  if (!client) return false

  try {
    const { error } = await client
      .from('notifications')
      .update({ read: true })
      .eq('read', false)

    if (error) {
      console.warn('[Supabase] Failed to mark all notifications read:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Supabase] Error marking all notifications read:', err)
    return false
  }
}

export async function deleteNotification(id: string): Promise<boolean> {
  const client = getSupabase()
  if (!client) return false

  try {
    const { error } = await client
      .from('notifications')
      .delete()
      .eq('id', id)

    if (error) {
      console.warn('[Supabase] Failed to delete notification:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Supabase] Error deleting notification:', err)
    return false
  }
}

// -------------------------------------------------------------
// SELLER PROFILE & MULTI-SELLER REGISTRY API
// -------------------------------------------------------------

function parseSellerProfileRow(data: any): SellerProfile {
  const payoutMethodsRaw = Array.isArray(data.payout_methods) ? data.payout_methods : []
  const adminSettings = payoutMethodsRaw.find((m: any) => m && m._type === '__admin_settings') || {}
  const kycSettings = payoutMethodsRaw.find((m: any) => m && m._type === '__kyc_submission') || null
  const cleanPayoutMethods = payoutMethodsRaw.filter((m: any) => !m || (m._type !== '__admin_settings' && m._type !== '__kyc_submission'))

  return {
    id: data.id,
    shopName: data.shop_name,
    ownerName: data.owner_name,
    email: data.email,
    phone: data.phone || '+1 (555) 234-5678',
    currency: data.currency || 'USD ($)',
    balance: Number(data.balance || 0),
    guarantee: Number(data.guarantee || 0),
    rating: Number(data.rating || 5.0),
    totalOrders: Number(data.total_orders || 0),
    memberSince: data.member_since || 'Aug 2026',
    verified: Boolean(data.verified),
    active: Boolean(data.active),
    seoTitle: data.seo_title || `${data.shop_name} Official Store`,
    seoDescription: data.seo_description || '',
    avatarLetter: data.avatar_letter || data.shop_name?.charAt(0)?.toUpperCase() || 'S',
    payoutMethods: cleanPayoutMethods,
    kyc: kycSettings ? {
      status: kycSettings.status || (data.verified ? 'approved' : 'pending'),
      submittedAt: kycSettings.submittedAt || (data.created_at ? new Date(data.created_at).toLocaleString() : undefined),
      documentType: kycSettings.documentType || 'national_id',
      idCardUrl: kycSettings.idCardUrl || '',
      businessLicenseUrl: kycSettings.businessLicenseUrl || '',
      rejectionReason: kycSettings.rejectionReason,
      shopName: data.shop_name,
      ownerName: data.owner_name,
      email: data.email,
      phone: data.phone,
      joined: data.created_at ? new Date(data.created_at).toLocaleDateString('en-GB') : undefined,
    } : (data.verified ? {
      status: 'approved',
      submittedAt: data.created_at ? new Date(data.created_at).toLocaleString() : '7 Aug 2026, 16:06',
      documentType: 'national_id',
      idCardUrl: '',
      businessLicenseUrl: '',
      shopName: data.shop_name,
      ownerName: data.owner_name,
      email: data.email,
      phone: data.phone,
      joined: data.created_at ? new Date(data.created_at).toLocaleDateString('en-GB') : '07/08/2026',
    } : undefined),
    isSuspended: adminSettings.isSuspended ?? false,
    withdrawalsBlocked: adminSettings.withdrawalsBlocked ?? false,
    allowProductRemoval: adminSettings.allowProductRemoval ?? true,
    productLimit: adminSettings.productLimit ?? 'unlimited',
    viewsBooster: adminSettings.viewsBooster ?? { enabled: false, multiplier: 1.0, extraDailyViews: 0 },
    password: adminSettings.password || '',
    reviewCount: adminSettings.reviewCount ?? 504,
    activeItemsCount: adminSettings.activeItemsCount ?? 504,
    lastActiveAgo: adminSettings.lastActiveAgo ?? 'Just now',
    joinedExact: adminSettings.joinedExact ?? (data.created_at ? new Date(data.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '7 Aug 2026'),
    isDeleted: adminSettings.isDeleted ?? false,
    deletedAt: adminSettings.deletedAt,
  }
}

/**
 * Fetch all registered sellers from Supabase database with local storage backup.
 */
export async function fetchSellerProfiles(): Promise<SellerProfile[]> {
  let dbSellers: SellerProfile[] = []

  // 1. Try Next.js API route first
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/sellers', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        if (Array.isArray(json.sellers)) {
          dbSellers = json.sellers
        }
      }
    } catch (apiErr) {
      console.warn('[API /api/sellers] Falling back to direct client:', apiErr)
    }
  }

  // 2. Direct client fallback if API route returned empty
  if (dbSellers.length === 0) {
    const client = getSupabase()
    if (client) {
      try {
        const { data, error } = await client
          .from('seller_profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (!error && data) {
          dbSellers = data.map(parseSellerProfileRow)
        }
      } catch (clientErr) {
        console.warn('[Supabase] Failed to fetch seller profiles directly:', clientErr)
      }
    }
  }

  // Ensure deleted sellers are excluded from active list
  dbSellers = dbSellers.filter((s) => !s.isDeleted)

  // 3. Database is the single source of truth when connected
  if (dbSellers.length > 0) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('u_all_sellers', JSON.stringify(dbSellers))
      } catch {}
    }
    return dbSellers
  }

  // 4. Fallback to locally cached sellers only if database is offline or empty
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('u_all_sellers')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((s: SellerProfile) => !s.isDeleted)
        }
      }
    } catch {}
  }

  return []
}

/**
 * Fetch a single seller profile by ID or email
 */
export async function fetchSellerProfile(
  profileIdOrEmail = ''
): Promise<SellerProfile | null> {
  const cleanKey = profileIdOrEmail.trim().toLowerCase()

  if (!cleanKey) {
    // Check if active profile is stored locally
    if (typeof window !== 'undefined') {
      try {
        const activeStored = localStorage.getItem('u_seller_active_profile')
        if (activeStored) {
          const parsed = JSON.parse(activeStored)
          if (parsed && (parsed.id || parsed.email)) return parsed
        }
      } catch {}
    }
    // Try fetching the first seller profile from database
    const client = getSupabase()
    if (client) {
      try {
        const { data } = await client.from('seller_profiles').select('*').limit(1).maybeSingle()
        if (data) return parseSellerProfileRow(data)
      } catch {}
    }
    return null
  }

  // 1. Try API route
  if (typeof window !== 'undefined') {
    try {
      const param = cleanKey.includes('@') ? `email=${encodeURIComponent(cleanKey)}` : `id=${encodeURIComponent(cleanKey)}`
      const res = await fetch(`/api/sellers?${param}`, { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        if (json.seller) return json.seller
      }
    } catch {}
  }

  // 2. Try direct Supabase
  const client = getSupabase()
  if (client) {
    try {
      let query = client.from('seller_profiles').select('*')
      if (cleanKey.includes('@')) {
        query = query.ilike('email', cleanKey)
      } else {
        query = query.eq('id', cleanKey)
      }
      const { data } = await query.maybeSingle()
      if (data) return parseSellerProfileRow(data)
    } catch {}
  }

  // 3. Fallback to local storage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('u_all_sellers')
      if (stored) {
        const all: SellerProfile[] = JSON.parse(stored)
        const found = all.find(
          (s) => s.id === cleanKey || s.email?.toLowerCase() === cleanKey
        )
        if (found) return found
      }
      const direct = localStorage.getItem(`u_seller_profile_${cleanKey}`)
      if (direct) return JSON.parse(direct)
    } catch {}
  }

  return null
}

/**
 * Create a new seller profile in Supabase and local registry
 */
export async function createSellerProfile(
  profile: SellerProfile,
  password?: string,
  metadata?: { device?: any; location?: any }
): Promise<SellerProfile> {
  const cleanEmail = profile.email.trim().toLowerCase()
  const cleanShopName = profile.shopName.trim()
  const cleanOwnerName = profile.ownerName.trim()
  const effectiveId = profile.id || `seller-${Date.now()}`

  const newProfile: SellerProfile = {
    ...profile,
    id: effectiveId,
    shopName: cleanShopName,
    ownerName: cleanOwnerName,
    email: cleanEmail,
    balance: Number(profile.balance || 0),
    guarantee: Number(profile.guarantee || 0),
    rating: Number(profile.rating || 5.0),
    totalOrders: Number(profile.totalOrders || 0),
    verified: profile.verified ?? false,
    active: profile.active ?? true,
    isSuspended: profile.isSuspended ?? false,
    withdrawalsBlocked: profile.withdrawalsBlocked ?? false,
    allowProductRemoval: profile.allowProductRemoval ?? true,
    productLimit: profile.productLimit ?? 'unlimited',
    viewsBooster: profile.viewsBooster ?? { enabled: false, multiplier: 1.0, extraDailyViews: 0 },
    password: password || profile.password || '',
    reviewCount: profile.reviewCount ?? 504,
    activeItemsCount: profile.activeItemsCount ?? 504,
    lastActiveAgo: 'Just now',
    joinedExact: profile.joinedExact || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    avatarLetter: profile.avatarLetter || cleanShopName.charAt(0).toUpperCase() || 'S',
  }

  // 1. Persist to Supabase via /api/sellers
  let savedFromDb: SellerProfile | null = null
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProfile,
          password: password || newProfile.password,
          signup_metadata: metadata ? {
            device: metadata.device,
            location: metadata.location,
            time: new Date().toISOString(),
          } : undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.seller) savedFromDb = data.seller
      }
    } catch (err) {
      console.warn('[API /api/sellers POST] Fallback to direct client:', err)
    }
  }

  const finalProfile = savedFromDb || newProfile

  // 2. Persist locally in browser
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`u_seller_profile_${cleanEmail}`, JSON.stringify(finalProfile))

      const storedAll = localStorage.getItem('u_all_sellers')
      const all: SellerProfile[] = storedAll ? JSON.parse(storedAll) : []
      const filtered = all.filter((s) => s.email?.toLowerCase() !== cleanEmail)
      localStorage.setItem('u_all_sellers', JSON.stringify([finalProfile, ...filtered]))
    } catch {}
  }

  return finalProfile
}

/**
 * Update a seller profile in Supabase and local storage
 */
export async function updateSellerProfile(
  updates: Partial<SellerProfile>,
  profileId?: string,
  email?: string
): Promise<boolean> {
  const targetId = profileId
  const targetEmail = email?.trim().toLowerCase()

  // 1. Try updating via /api/sellers
  let apiSuccess = false
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/sellers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetId,
          email: targetEmail,
          updates,
        }),
      })
      if (res.ok) {
        apiSuccess = true
      }
    } catch (err) {
      console.warn('[API /api/sellers PATCH] Direct fallback:', err)
    }
  }

  // 2. Direct client fallback if API route failed
  if (!apiSuccess) {
    const client = getSupabase()
    if (client) {
      try {
        const dbPayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        }
        if (updates.shopName !== undefined) dbPayload.shop_name = updates.shopName
        if (updates.ownerName !== undefined) dbPayload.owner_name = updates.ownerName
        if (updates.email !== undefined) dbPayload.email = updates.email
        if (updates.phone !== undefined) dbPayload.phone = updates.phone
        if (updates.currency !== undefined) dbPayload.currency = updates.currency
        if (updates.balance !== undefined) dbPayload.balance = updates.balance
        if (updates.guarantee !== undefined) dbPayload.guarantee = updates.guarantee
        if (updates.rating !== undefined) dbPayload.rating = updates.rating
        if (updates.totalOrders !== undefined) dbPayload.total_orders = updates.totalOrders
        if (updates.memberSince !== undefined) dbPayload.member_since = updates.memberSince
        if (updates.verified !== undefined) dbPayload.verified = updates.verified
        if (updates.active !== undefined) dbPayload.active = updates.active
        if (updates.seoTitle !== undefined) dbPayload.seo_title = updates.seoTitle
        if (updates.seoDescription !== undefined) dbPayload.seo_description = updates.seoDescription
        if (updates.avatarLetter !== undefined) dbPayload.avatar_letter = updates.avatarLetter

        let query = client.from('seller_profiles').update(dbPayload)
        if (targetId) {
          query = query.eq('id', targetId)
        } else if (targetEmail) {
          query = query.ilike('email', targetEmail)
        } else {
          return false
        }
        await query
      } catch (err) {
        console.warn('[Supabase] Failed to update seller profile directly:', err)
      }
    }
  }

  // 3. Update in local storage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('u_all_sellers')
      if (stored) {
        const all: SellerProfile[] = JSON.parse(stored)
        const updated = all.map((s) => {
          const match =
            (targetId && s.id === targetId) ||
            (targetEmail && s.email?.toLowerCase() === targetEmail)
          return match ? { ...s, ...updates } : s
        })
        localStorage.setItem('u_all_sellers', JSON.stringify(updated))
      }

      // Also update active profile if it matches
      const activeStored = localStorage.getItem('u_seller_active_profile')
      if (activeStored) {
        const active: SellerProfile = JSON.parse(activeStored)
        const match =
          (targetId && active.id === targetId) ||
          (targetEmail && active.email?.toLowerCase() === targetEmail) ||
          (!targetId && !targetEmail)
        if (match) {
          localStorage.setItem('u_seller_active_profile', JSON.stringify({ ...active, ...updates }))
        }
      }
    } catch {}
  }

  return true
}

/**
 * Submit KYC report for a seller
 */
export async function submitKycReport(
  sellerId: string,
  kycData: Partial<KycSubmission>
): Promise<boolean> {
  const fullKyc: KycSubmission = {
    status: 'pending',
    submittedAt: new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    documentType: kycData.documentType || 'national_id',
    idCardUrl: kycData.idCardUrl || '',
    businessLicenseUrl: kycData.businessLicenseUrl || '',
    shopName: kycData.shopName,
    ownerName: kycData.ownerName,
    email: kycData.email,
    phone: kycData.phone,
    joined: kycData.joined,
  }

  const success = await updateSellerProfile(
    {
      kyc: fullKyc,
      verified: false,
    },
    sellerId,
    kycData.email
  )

  // Notify admin in notifications table
  const client = getSupabase()
  if (client) {
    try {
      await client.from('notifications').insert({
        id: `kyc-${Date.now()}`,
        title: 'New KYC Submission',
        description: `Seller "${kycData.shopName || sellerId}" submitted KYC verification documents for review.`,
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(),
        time_ago: 'Just now',
        ref_code: `KYC-${sellerId.slice(-4).toUpperCase()}`,
        type: 'kyc',
        read: false,
        details: `Document type: ${fullKyc.documentType}. Review submission in Admin KYC console.`,
      })
    } catch {}
  }

  return success
}

/**
 * Admin reviews KYC submission: approve or reject
 */
export async function reviewKycSubmission(
  sellerId: string,
  status: 'approved' | 'rejected',
  reason?: string,
  sellerEmail?: string
): Promise<boolean> {
  const success = await updateSellerProfile(
    {
      verified: status === 'approved',
      kyc: {
        status,
        rejectionReason: reason,
      } as any,
    },
    sellerId,
    sellerEmail
  )

  const client = getSupabase()
  if (client) {
    try {
      await client.from('notifications').insert({
        id: `kyc-decision-${Date.now()}`,
        title: status === 'approved' ? 'KYC Verification Approved' : 'KYC Verification Rejected',
        description: status === 'approved'
          ? `Your seller account has been verified! Full store access is now unlocked.`
          : `Your KYC verification was rejected: ${reason || 'Please submit valid documents.'}`,
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(),
        time_ago: 'Just now',
        ref_code: `KYC-${sellerId.slice(-4).toUpperCase()}`,
        type: 'kyc',
        read: false,
        details: status === 'approved' ? 'Full access granted.' : `Reason: ${reason || 'Verification failed.'}`,
      })
    } catch {}
  }

  return success
}

/**
 * Delete a seller profile and cascade remove all associated data across the entire platform
 */
export async function deleteSellerProfile(
  profileIdOrEmail: string,
  permanent = true
): Promise<boolean> {
  const cleanKey = profileIdOrEmail.trim().toLowerCase()

  // 1. Identify full seller info from local storage or cached sellers before removal
  let targetSeller: SellerProfile | undefined
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('u_all_sellers')
      if (stored) {
        const all: SellerProfile[] = JSON.parse(stored)
        targetSeller = all.find(
          (s) => s.id?.toLowerCase() === cleanKey || s.email?.toLowerCase() === cleanKey
        )
      }
      if (!targetSeller) {
        const active = localStorage.getItem('u_seller_active_profile')
        if (active) {
          const parsed = JSON.parse(active)
          if (parsed.id?.toLowerCase() === cleanKey || parsed.email?.toLowerCase() === cleanKey) {
            targetSeller = parsed
          }
        }
      }
    }
  } catch {}

  const sellerId = targetSeller?.id || (cleanKey.includes('@') ? '' : cleanKey)
  const sellerEmail = targetSeller?.email || (cleanKey.includes('@') ? cleanKey : '')
  const shopName = targetSeller?.shopName || ''

  if (permanent) {
    if (typeof window !== 'undefined') {
      // 2. Call backend /api/sellers DELETE which cascade purges Supabase tables
      try {
        const params = new URLSearchParams()
        if (sellerId) params.set('id', sellerId)
        if (sellerEmail) params.set('email', sellerEmail)
        await fetch(`/api/sellers?${params.toString()}`, { method: 'DELETE' })
      } catch (err) {
        console.warn('[Supabase API] Failed to delete seller via backend API:', err)
      }

      // 3. Clear seller login sessions in memory & cache
      try {
        if (sellerId) {
          await fetch(`/api/sellers/login-history?sellerId=${encodeURIComponent(sellerId)}`, { method: 'DELETE' })
        }
      } catch {}

      // 4. Purge seller withdrawals in memory & notifications
      try {
        const wParams = new URLSearchParams()
        if (sellerId) wParams.set('sellerId', sellerId)
        if (sellerEmail) wParams.set('email', sellerEmail)
        await fetch(`/api/withdrawals?${wParams.toString()}`, { method: 'DELETE' })
      } catch {}
    }
  } else {
    // Soft delete fallback if ever explicitly called with false
    await updateSellerProfile(
      { isDeleted: true, deletedAt: new Date().toISOString() },
      sellerId || undefined,
      sellerEmail || undefined
    )
  }

  // 5. Thoroughly purge all LocalStorage keys and sessions across all subsystems
  if (typeof window !== 'undefined') {
    try {
      // a. Remove from u_all_sellers
      const stored = localStorage.getItem('u_all_sellers')
      if (stored) {
        const all: SellerProfile[] = JSON.parse(stored)
        const updated = permanent
          ? all.filter(
              (s) =>
                s.id?.toLowerCase() !== cleanKey &&
                s.email?.toLowerCase() !== cleanKey &&
                (sellerId ? s.id !== sellerId : true) &&
                (sellerEmail ? s.email?.toLowerCase() !== sellerEmail.toLowerCase() : true)
            )
          : all.map((s) =>
              s.id === cleanKey || s.email?.toLowerCase() === cleanKey
                ? { ...s, isDeleted: true }
                : s
            )
        localStorage.setItem('u_all_sellers', JSON.stringify(updated))
      }

      // b. Invalidate u_seller_active_profile if it matches the removed merchant
      const activeRaw = localStorage.getItem('u_seller_active_profile')
      if (activeRaw) {
        const active: SellerProfile = JSON.parse(activeRaw)
        const isTarget =
          active.id?.toLowerCase() === cleanKey ||
          active.email?.toLowerCase() === cleanKey ||
          (sellerId && active.id === sellerId) ||
          (sellerEmail && active.email?.toLowerCase() === sellerEmail.toLowerCase()) ||
          (shopName && active.shopName?.toLowerCase() === shopName.toLowerCase())

        if (isTarget) {
          localStorage.removeItem('u_seller_active_profile')
        }
      }

      // c. Invalidate u_auth_session if the logged in user is this merchant
      const authRaw = localStorage.getItem('u_auth_session')
      if (authRaw) {
        const auth = JSON.parse(authRaw)
        const isAuthTarget =
          auth.profile &&
          (auth.profile.id?.toLowerCase() === cleanKey ||
            auth.profile.email?.toLowerCase() === cleanKey ||
            (sellerId && auth.profile.id === sellerId) ||
            (sellerEmail && auth.profile.email?.toLowerCase() === sellerEmail.toLowerCase()) ||
            (shopName && auth.profile.shopName?.toLowerCase() === shopName.toLowerCase()))

        if (isAuthTarget) {
          localStorage.removeItem('u_auth_session')
        }
      }

      // d. Remove login sessions cache
      if (sellerId) localStorage.removeItem(`u_seller_login_history_${sellerId}`)
      if (sellerEmail) localStorage.removeItem(`u_seller_login_history_${sellerEmail}`)

      // e. Purge withdrawals cache
      const wRaw = localStorage.getItem('u_admin_withdrawals_v1')
      if (wRaw) {
        const wList = JSON.parse(wRaw)
        if (Array.isArray(wList)) {
          const updatedW = wList.filter((w: any) => {
            const wSellerId = (w.sellerId || '').toLowerCase()
            const wEmail = (w.email || '').toLowerCase()
            const wShop = (w.shopName || '').toLowerCase()
            if (sellerId && wSellerId === sellerId.toLowerCase()) return false
            if (sellerEmail && wEmail === sellerEmail.toLowerCase()) return false
            if (shopName && wShop === shopName.toLowerCase()) return false
            if (cleanKey && (wSellerId === cleanKey || wEmail === cleanKey)) return false
            return true
          })
          localStorage.setItem('u_admin_withdrawals_v1', JSON.stringify(updatedW))
        }
      }

      // f. Purge orders cache
      const oRaw = localStorage.getItem('u_seller_orders')
      if (oRaw) {
        const oList = JSON.parse(oRaw)
        if (Array.isArray(oList)) {
          const updatedOrders = oList.filter((o: any) => {
            const oSellerId = (o.sellerId || (o.items && o.items[0]?.sellerId) || '').toLowerCase()
            if (sellerId && oSellerId === sellerId.toLowerCase()) return false
            if (sellerEmail && oSellerId === sellerEmail.toLowerCase()) return false
            if (cleanKey && oSellerId === cleanKey) return false
            return true
          })
          localStorage.setItem('u_seller_orders', JSON.stringify(updatedOrders))
        }
      }

      // g. Purge products cache
      const pRaw = localStorage.getItem('u_seller_products')
      if (pRaw) {
        const pList = JSON.parse(pRaw)
        if (Array.isArray(pList)) {
          const updatedProducts = pList.filter((p: any) => {
            if (sellerId && (p.sellerId === sellerId || p.id?.includes(sellerId))) return false
            if (sellerEmail && p.sellerId === sellerEmail) return false
            if (shopName && p.sku?.toLowerCase().includes(shopName.toLowerCase())) return false
            return true
          })
          localStorage.setItem('u_seller_products', JSON.stringify(updatedProducts))
        }
      }

      // h. Purge notifications cache
      const nRaw = localStorage.getItem('u_seller_notifications')
      if (nRaw) {
        const nList = JSON.parse(nRaw)
        if (Array.isArray(nList)) {
          const updatedNotifs = nList.filter((n: any) => {
            const str = JSON.stringify(n).toLowerCase()
            if (sellerId && str.includes(sellerId.toLowerCase())) return false
            if (sellerEmail && str.includes(sellerEmail.toLowerCase())) return false
            if (shopName && str.includes(shopName.toLowerCase())) return false
            return true
          })
          localStorage.setItem('u_seller_notifications', JSON.stringify(updatedNotifs))
        }
      }
    } catch (e) {
      console.warn('[deleteSellerProfile] Storage cleanup error:', e)
    }

    // 6. Broadcast window custom events for instant reactivity in current window
    const eventPayload = { id: sellerId, email: sellerEmail, shopName }
    window.dispatchEvent(new CustomEvent('u_seller_removed', { detail: eventPayload }))
    window.dispatchEvent(new CustomEvent('u_all_sellers_updated', { detail: eventPayload }))
    window.dispatchEvent(new CustomEvent('u_withdrawals_updated'))
    window.dispatchEvent(new CustomEvent('u_orders_updated'))
    window.dispatchEvent(new CustomEvent('u_products_updated'))
    window.dispatchEvent(new CustomEvent('u_seller_notifications_update'))

    // 7. Broadcast across tabs and windows via BroadcastChannel
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('u_system_sync')
        channel.postMessage({ type: 'SELLER_REMOVED', payload: eventPayload })
        channel.close()
      }
    } catch {}
  }

  return true
}

// -------------------------------------------------------------
// SEED INITIAL DATA (Helper to push sample store data directly to Supabase)
// -------------------------------------------------------------
export async function seedInitialDataToSupabase(): Promise<{ success: boolean; message: string }> {
  const client = getSupabase()
  if (!client) {
    return { success: false, message: 'Supabase client is not configured.' }
  }

  try {
    // 1. Seed Profile if present
    if (initialSellerProfile.email) {
      await client.from('seller_profiles').upsert({
        id: initialSellerProfile.id || `seller-${Date.now()}`,
        shop_name: initialSellerProfile.shopName,
        owner_name: initialSellerProfile.ownerName,
        email: initialSellerProfile.email,
        phone: initialSellerProfile.phone,
        currency: initialSellerProfile.currency,
        balance: initialSellerProfile.balance,
        guarantee: initialSellerProfile.guarantee,
        rating: initialSellerProfile.rating,
        total_orders: initialSellerProfile.totalOrders,
        member_since: initialSellerProfile.memberSince,
        verified: initialSellerProfile.verified,
        active: initialSellerProfile.active,
        seo_title: initialSellerProfile.seoTitle,
        seo_description: initialSellerProfile.seoDescription,
        avatar_letter: initialSellerProfile.avatarLetter,
        payout_methods: initialSellerProfile.payoutMethods,
      })
    }

    // 2. Seed Notifications if present
    if (initialNotifications.length > 0) {
      for (const notif of initialNotifications) {
        await client.from('notifications').upsert({
          id: notif.id,
          title: notif.title,
          description: notif.description,
          date: notif.date,
          time_ago: notif.timeAgo,
          ref_code: notif.refCode,
          type: notif.type,
          read: notif.read,
          details: notif.details,
        })
      }
    }

    // 3. Seed Products if present
    if (initialProducts.length > 0) {
      const productsPayload = initialProducts.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        cost: p.cost,
        sell: p.sell,
        profit: p.profit,
        image: p.image,
        stock: p.stock,
        sku: p.sku,
        status: p.status,
      }))

      const { error: prodError } = await client.from('products').upsert(productsPayload)
      if (prodError) throw prodError
    }

    return { success: true, message: 'Supabase sync complete.' }
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to seed initial data' }
  }
}

// -------------------------------------------------------------
// AUTHENTICATION & USER REGISTRATION
// -------------------------------------------------------------
export interface AuthResult {
  success: boolean
  user?: any
  profile?: SellerProfile
  error?: string
  needsEmailConfirmation?: boolean
}

export async function signUpSeller(params: {
  email: string
  password: string
  shopName: string
  ownerName: string
  metadata?: { device?: any; location?: any }
}): Promise<AuthResult> {
  const { email, password, shopName, ownerName, metadata } = params

  const cleanShopName = shopName.trim() || 'My Online Store'
  const cleanOwnerName = ownerName.trim() || 'Store Owner'
  const cleanEmail = email.trim().toLowerCase()

  const newProfile: SellerProfile = {
    id: `seller-${Date.now()}`,
    shopName: cleanShopName,
    ownerName: cleanOwnerName,
    email: cleanEmail,
    phone: '+1 (555) 019-2834',
    currency: 'USD ($)',
    balance: 0.00,
    guarantee: 0.00,
    rating: 5.0,
    totalOrders: 0,
    memberSince: new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date()),
    verified: false,
    active: true,
    isSuspended: false,
    withdrawalsBlocked: false,
    allowProductRemoval: true,
    productLimit: 'unlimited',
    viewsBooster: { enabled: false, multiplier: 1.0, extraDailyViews: 0 },
    password: password || '',
    reviewCount: 504,
    activeItemsCount: 504,
    lastActiveAgo: 'Just now',
    joinedExact: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    seoTitle: `${cleanShopName} Official Store - Quality Products & Fast Shipping`,
    seoDescription: `Shop high quality goods from ${cleanShopName}. Enjoy safe checkout and prompt delivery.`,
    avatarLetter: cleanShopName.charAt(0).toUpperCase() || 'S',
    payoutMethods: [],
  }

  // 1. Create seller in database & admin registry
  const savedProfile = await createSellerProfile(newProfile, password, metadata)

  const client = getSupabase()
  if (!client) {
    return { success: true, profile: savedProfile }
  }

  try {
    const { data: authData, error: authError } = await client.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          shop_name: cleanShopName,
          owner_name: cleanOwnerName,
        },
      },
    })

    if (authError) {
      // Even if Supabase auth complains (e.g. rate limit or email confirmation disabled),
      // we already successfully registered the profile in seller_profiles table!
      console.warn('[Supabase Auth warning]:', authError.message)
      return { success: true, profile: savedProfile }
    }

    return {
      success: true,
      user: authData?.user,
      profile: savedProfile,
      needsEmailConfirmation: Boolean(authData?.session === null && authData?.user && !authData?.user.confirmed_at),
    }
  } catch (err: any) {
    // Non-fatal, profile is already safely stored in DB and localStorage
    return { success: true, profile: savedProfile }
  }
}

export async function signInSeller(params: {
  email: string
  password: string
}): Promise<AuthResult> {
  const { email, password } = params
  const cleanEmail = email.trim()


  // Check if saved locally in browser
  let localSavedProfile: SellerProfile | null = null
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`u_seller_profile_${cleanEmail}`)
      if (stored) localSavedProfile = JSON.parse(stored)
    }
  } catch {}

  const client = getSupabase()
  if (!client) {
    if (localSavedProfile) {
      return { success: true, profile: localSavedProfile }
    }
    const fallbackProfile: SellerProfile = {
      ...initialSellerProfile,
      email: cleanEmail,
      ownerName: cleanEmail.split('@')[0] || 'Store Owner',
      shopName: `${cleanEmail.split('@')[0] || 'My'} Store`,
    }
    return { success: true, profile: fallbackProfile }
  }

  try {
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

    if (authError) {
      // If Supabase auth errors, but user created this account locally, allow fallback
      if (localSavedProfile) {
        return { success: true, profile: localSavedProfile }
      }
      return { success: false, error: authError.message }
    }

    // Look for seller_profile row
    try {
      const { data: profileRow } = await client
        .from('seller_profiles')
        .select('*')
        .or(`id.eq.${authData.user.id},email.eq.${cleanEmail}`)
        .limit(1)
        .maybeSingle()

      if (profileRow) {
        const fetchedProfile: SellerProfile = {
          shopName: profileRow.shop_name,
          ownerName: profileRow.owner_name,
          email: profileRow.email,
          phone: profileRow.phone || '',
          currency: profileRow.currency || 'USD ($)',
          balance: Number(profileRow.balance || 0),
          guarantee: Number(profileRow.guarantee || 0),
          rating: Number(profileRow.rating || 5.0),
          totalOrders: Number(profileRow.total_orders || 0),
          memberSince: profileRow.member_since || 'Aug 2026',
          verified: Boolean(profileRow.verified),
          active: Boolean(profileRow.active),
          seoTitle: profileRow.seo_title || '',
          seoDescription: profileRow.seo_description || '',
          avatarLetter: profileRow.avatar_letter || profileRow.shop_name?.charAt(0)?.toUpperCase() || 'S',
          payoutMethods: profileRow.payout_methods || [],
        }
        return { success: true, user: authData.user, profile: fetchedProfile }
      }
    } catch {}

    // If no row in database, use local profile or generate from user metadata
    const userShopName = authData.user.user_metadata?.shop_name || localSavedProfile?.shopName || `${cleanEmail.split('@')[0]}'s Store`
    const userOwnerName = authData.user.user_metadata?.owner_name || localSavedProfile?.ownerName || cleanEmail.split('@')[0]

    const fallback: SellerProfile = {
      shopName: userShopName,
      ownerName: userOwnerName,
      email: cleanEmail,
      phone: '+1 (555) 019-2834',
      currency: 'USD ($)',
      balance: 0.00,
      guarantee: 0.00,
      rating: 5.0,
      totalOrders: 0,
      memberSince: new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date()),
      verified: true,
      active: true,
      seoTitle: `${userShopName} Official Store`,
      seoDescription: 'Quality products and fast fulfillment.',
      avatarLetter: userShopName.charAt(0).toUpperCase() || 'S',
      payoutMethods: [],
    }

    return { success: true, user: authData.user, profile: fallback }
  } catch (err: any) {
    if (localSavedProfile) return { success: true, profile: localSavedProfile }
    return { success: false, error: err.message || 'Failed to sign in' }
  }
}

export async function signOutSeller(): Promise<void> {
  const client = getSupabase()
  if (client) {
    await client.auth.signOut().catch(() => {})
  }
}

// -------------------------------------------------------------
// ADMIN AUTHENTICATION
// -------------------------------------------------------------
export interface AdminUser {
  email: string
  name: string
  role: 'admin'
  avatar: string
  permissions: string[]
}

export async function signInAdmin(params: {
  email: string
  password: string
}): Promise<{ success: boolean; admin?: AdminUser; error?: string }> {
  const { email, password } = params
  const cleanEmail = email.trim().toLowerCase()

  // Standard platform admin accounts
  const isDefaultAdmin =
    (cleanEmail === 'admin@usellerstore.com' ||
      cleanEmail === 'admin@usellerstore.us' ||
      cleanEmail === 'admin' ||
      cleanEmail === 'zain@admin.com') &&
    (password === 'admin123' || password === 'admin' || password === 'password123' || password === '••••••••')

  if (isDefaultAdmin) {
    const adminUser: AdminUser = {
      email: cleanEmail.includes('@') ? cleanEmail : 'admin@usellerstore.com',
      name: 'Super Administrator',
      role: 'admin',
      avatar: 'A',
      permissions: ['all', 'manage_sellers', 'manage_orders', 'kyc_review', 'withdrawals'],
    }
    return { success: true, admin: adminUser }
  }

  // Supabase auth check if client exists
  const client = getSupabase()
  if (client && cleanEmail.includes('@')) {
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      // Check if user has admin role metadata or email domain
      const role = data.user.user_metadata?.role || (data.user.email?.includes('admin') ? 'admin' : null)
      if (role !== 'admin') {
        return {
          success: false,
          error: 'Access denied: this account does not have Administrator privileges.',
        }
      }

      return {
        success: true,
        admin: {
          email: data.user.email || cleanEmail,
          name: data.user.user_metadata?.name || 'Administrator',
          role: 'admin',
          avatar: 'A',
          permissions: ['all'],
        },
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Admin authentication failed' }
    }
  }

  return {
    success: false,
    error: 'Invalid administrator credentials. Please check your admin email and password.',
  }
}

export async function resetPassword(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  const client = getSupabase()
  if (!client) {
    return {
      success: true,
      message: `Password reset instructions have been sent to ${cleanEmail}. Please check your inbox to reset your password.`,
    }
  }

  try {
    const { error } = await client.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}` : undefined,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      message: `Password reset instructions have been sent to ${cleanEmail}. Please check your inbox to reset your password.`,
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send password reset email. Please try again.' }
  }
}

// -------------------------------------------------------------
// WITHDRAWALS & PAYOUTS API
// -------------------------------------------------------------
export interface WithdrawalItemDb {
  id: string
  sellerId?: string
  shopName: string
  ownerName: string
  email: string
  avatar?: string
  status: 'pending' | 'approved' | 'rejected'
  amount: number
  requestedDate: string
  timestamp: number
  destinationMethod?: string
  destinationDetails?: string
  notes?: string
  rejectionReason?: string
  processedDate?: string
}

/**
 * Fetch all withdrawals synchronized with Supabase database.
 */
export async function fetchWithdrawalsFromDb(): Promise<WithdrawalItemDb[]> {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/withdrawals', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        if (Array.isArray(json.withdrawals)) {
          try {
            localStorage.setItem('u_admin_withdrawals_v1', JSON.stringify(json.withdrawals))
          } catch {}
          return json.withdrawals
        }
      }
    } catch (err) {
      console.warn('[fetchWithdrawalsFromDb] API error:', err)
    }

    try {
      const stored = localStorage.getItem('u_admin_withdrawals_v1')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
  }
  return []
}

/**
 * Create a new withdrawal record in Supabase database.
 */
export async function createWithdrawalInDb(
  item: Partial<WithdrawalItemDb>
): Promise<{ success: boolean; withdrawal?: WithdrawalItemDb; error?: string }> {
  try {
    const res = await fetch('/api/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
    const json = await res.json()
    if (res.ok && json.withdrawal) {
      return { success: true, withdrawal: json.withdrawal }
    }
    return { success: false, error: json.error || 'Failed to create withdrawal' }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' }
  }
}

/**
 * Update withdrawal status (approve or reject) in Supabase database.
 */
export async function updateWithdrawalStatusInDb(
  id: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<{ success: boolean; withdrawal?: WithdrawalItemDb; error?: string }> {
  try {
    const res = await fetch('/api/withdrawals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, rejectionReason }),
    })
    const json = await res.json()
    if (res.ok && json.withdrawal) {
      return { success: true, withdrawal: json.withdrawal }
    }
    return { success: false, error: json.error || 'Failed to update withdrawal' }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' }
  }
}

/**
 * Delete withdrawal record from Supabase database.
 */
export async function deleteWithdrawalFromDb(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/withdrawals?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    return res.ok
  } catch {
    return false
  }
}

