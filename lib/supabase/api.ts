import { getSupabase, isSupabaseConfigured } from './client'
import {
  Product,
  Order,
  NotificationItem,
  SellerProfile,
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
  if (!client) return null

  try {
    const { data, error } = await client
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[Supabase] Failed to fetch products:', error.message)
      return null
    }

    return (data || []).map((row: any) => ({
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
  } catch (err) {
    console.warn('[Supabase] Error fetching products:', err)
    return null
  }
}

export async function createProduct(product: Omit<Product, 'id'> & { id?: string }): Promise<Product | null> {
  const client = getSupabase()
  const prodId = product.id || `prod-${Date.now()}`

  const newProduct: Product = {
    ...product,
    id: prodId,
  }

  if (!client) return newProduct

  try {
    const { data, error } = await client
      .from('products')
      .insert({
        id: prodId,
        title: product.title,
        category: product.category,
        cost: product.cost,
        sell: product.sell,
        profit: product.profit,
        image: product.image,
        stock: product.stock,
        sku: product.sku,
        status: product.status,
      })
      .select()
      .single()

    if (error) {
      console.warn('[Supabase] Failed to insert product:', error.message)
      return newProduct
    }

    return {
      id: data.id,
      title: data.title,
      category: data.category,
      cost: Number(data.cost),
      sell: Number(data.sell),
      profit: Number(data.profit),
      image: data.image || '',
      stock: Number(data.stock),
      sku: data.sku || '',
      status: data.status,
    }
  } catch (err) {
    console.warn('[Supabase] Error creating product:', err)
    return newProduct
  }
}

export async function updateProduct(product: Product): Promise<boolean> {
  const client = getSupabase()
  if (!client) return false

  try {
    const { error } = await client
      .from('products')
      .update({
        title: product.title,
        category: product.category,
        cost: product.cost,
        sell: product.sell,
        profit: product.profit,
        image: product.image,
        stock: product.stock,
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
  if (!client) return false

  try {
    const { error } = await client
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      console.warn('[Supabase] Failed to delete product:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Supabase] Error deleting product:', err)
    return false
  }
}

// -------------------------------------------------------------
// ORDERS API
// -------------------------------------------------------------
export async function fetchOrders(): Promise<Order[] | null> {
  const client = getSupabase()
  if (!client) return null

  try {
    const { data, error } = await client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[Supabase] Failed to fetch orders:', error.message)
      return null
    }

    return (data || []).map((row: any) => ({
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
    }))
  } catch (err) {
    console.warn('[Supabase] Error fetching orders:', err)
    return null
  }
}

export async function createOrder(order: Order): Promise<Order | null> {
  const client = getSupabase()
  if (!client) return order

  try {
    const { data, error } = await client
      .from('orders')
      .insert({
        id: order.id,
        order_number: order.orderNumber,
        customer_name: order.customerName,
        customer_email: order.customerEmail,
        shipping_address: order.shippingAddress,
        items: order.items,
        total_amount: order.totalAmount,
        profit: order.profit,
        status: order.status,
        date: order.date,
      })
      .select()
      .single()

    if (error) {
      console.warn('[Supabase] Failed to create order:', error.message)
      return order
    }

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
    }
  } catch (err) {
    console.warn('[Supabase] Error creating order:', err)
    return order
  }
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<boolean> {
  const client = getSupabase()
  if (!client) return false

  try {
    const { error } = await client
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (error) {
      console.warn('[Supabase] Failed to update order status:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Supabase] Error updating order status:', err)
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
// SELLER PROFILE API
// -------------------------------------------------------------
export async function fetchSellerProfile(profileId = 'tester-seller-1'): Promise<SellerProfile | null> {
  const client = getSupabase()
  if (!client) return null

  try {
    const { data, error } = await client
      .from('seller_profiles')
      .select('*')
      .eq('id', profileId)
      .maybeSingle()

    if (error) {
      console.warn('[Supabase] Failed to fetch seller profile:', error.message)
      return null
    }

    if (!data) return null

    return {
      shopName: data.shop_name,
      ownerName: data.owner_name,
      email: data.email,
      phone: data.phone || '',
      currency: data.currency || 'USD ($)',
      balance: Number(data.balance || 0),
      guarantee: Number(data.guarantee || 0),
      rating: Number(data.rating || 5.0),
      totalOrders: Number(data.total_orders || 0),
      memberSince: data.member_since || 'Aug 2026',
      verified: Boolean(data.verified),
      active: Boolean(data.active),
      seoTitle: data.seo_title || '',
      seoDescription: data.seo_description || '',
      avatarLetter: data.avatar_letter || data.shop_name?.charAt(0)?.toUpperCase() || 'S',
      payoutMethods: data.payout_methods || [],
    }
  } catch (err) {
    console.warn('[Supabase] Error fetching seller profile:', err)
    return null
  }
}

export async function updateSellerProfile(
  updates: Partial<SellerProfile>,
  profileId = 'tester-seller-1'
): Promise<boolean> {
  const client = getSupabase()
  if (!client) return false

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
    if (updates.payoutMethods !== undefined) dbPayload.payout_methods = updates.payoutMethods

    const { error } = await client
      .from('seller_profiles')
      .update(dbPayload)
      .eq('id', profileId)

    if (error) {
      console.warn('[Supabase] Failed to update seller profile:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Supabase] Error updating seller profile:', err)
    return false
  }
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
    // 1. Seed Profile
    await client.from('seller_profiles').upsert({
      id: 'tester-seller-1',
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

    // 2. Seed Notifications
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

    // 3. Seed Products
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

    return { success: true, message: `Successfully seeded ${productsPayload.length} products and seller profile to Supabase!` }
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to seed initial data' }
  }
}
