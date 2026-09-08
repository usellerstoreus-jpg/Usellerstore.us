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

    // Keep localStorage synchronized with live database
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('u_seller_products', JSON.stringify(mapped))
      }
    } catch {}

    return mapped
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

export async function createProduct(product: Omit<Product, 'id'> & { id?: string }): Promise<Product | null> {
  const client = getSupabase()
  const prodId = product.id || `prod-${Date.now()}`

  const newProduct: Product = {
    ...product,
    id: prodId,
    cost: Number(product.cost),
    sell: Number(product.sell),
    profit: Number(product.profit),
    stock: Number(product.stock),
  }

  if (!client) {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('u_seller_products')
        const list: Product[] = stored ? JSON.parse(stored) : []
        localStorage.setItem('u_seller_products', JSON.stringify([newProduct, ...list.filter((p) => p.id !== prodId)]))
      }
    } catch {}
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
        image: newProduct.image || '',
        stock: newProduct.stock,
        sku: newProduct.sku || '',
        status: newProduct.status || 'active',
      })
      .select()
      .single()

    if (error) {
      console.warn('[Supabase] Failed to insert product:', error.message)
      return null
    }

    const createdProduct: Product = {
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

    // Synchronize to localStorage
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('u_seller_products')
        const list: Product[] = stored ? JSON.parse(stored) : []
        localStorage.setItem('u_seller_products', JSON.stringify([createdProduct, ...list.filter((p) => p.id !== createdProduct.id)]))
      }
    } catch {}

    return createdProduct
  } catch (err) {
    console.warn('[Supabase] Error creating product:', err)
    return null
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

export async function deleteOrder(orderId: string): Promise<boolean> {
  const client = getSupabase()
  if (!client) return true

  try {
    const { error } = await client.from('orders').delete().eq('id', orderId)
    if (error) {
      console.warn('[Supabase] Failed to delete order:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Supabase] Error deleting order:', err)
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
}): Promise<AuthResult> {
  const client = getSupabase()
  const { email, password, shopName, ownerName } = params

  const cleanShopName = shopName.trim() || 'My Online Store'
  const cleanOwnerName = ownerName.trim() || 'Store Owner'
  const cleanEmail = email.trim()

  const newProfile: SellerProfile = {
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
    verified: true,
    active: true,
    seoTitle: `${cleanShopName} Official Store - Quality Products & Fast Shipping`,
    seoDescription: `Shop high quality goods from ${cleanShopName}. Enjoy safe checkout and prompt delivery.`,
    avatarLetter: cleanShopName.charAt(0).toUpperCase() || 'S',
    payoutMethods: [],
  }

  if (!client) {
    // If Supabase not yet configured, save locally and allow instant store entry
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`u_seller_profile_${cleanEmail}`, JSON.stringify(newProfile))
      }
    } catch {}
    return { success: true, profile: newProfile }
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
      return { success: false, error: authError.message }
    }

    const effectiveId = authData.user?.id || `seller-${Date.now()}`

    // Insert new seller profile into Supabase
    try {
      await client.from('seller_profiles').upsert({
        id: effectiveId,
        shop_name: newProfile.shopName,
        owner_name: newProfile.ownerName,
        email: newProfile.email,
        phone: newProfile.phone,
        currency: newProfile.currency,
        balance: 0.00,
        guarantee: 0.00,
        rating: 5.0,
        total_orders: 0,
        member_since: newProfile.memberSince,
        verified: true,
        active: true,
        seo_title: newProfile.seoTitle,
        seo_description: newProfile.seoDescription,
        avatar_letter: newProfile.avatarLetter,
        payout_methods: [],
      })

      // Insert welcoming notification for this store
      await client.from('notifications').upsert({
        id: `notif-${Date.now()}`,
        title: 'Welcome to U Seller Store',
        description: `Your store "${newProfile.shopName}" is now active and ready for business.`,
        date: new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()).toUpperCase(),
        time_ago: 'Just now',
        ref_code: `#store-${Date.now().toString().slice(-6)}`,
        type: 'system',
        read: false,
        details: `Congratulations on launching ${newProfile.shopName}! You can now add products to your catalog, monitor real-time orders, and manage payouts.`,
      })
    } catch (dbErr) {
      console.warn('[Supabase] Non-fatal error creating profile record:', dbErr)
    }

    // Also persist profile locally
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`u_seller_profile_${cleanEmail}`, JSON.stringify(newProfile))
      }
    } catch {}

    return {
      success: true,
      user: authData.user,
      profile: newProfile,
      needsEmailConfirmation: Boolean(authData.session === null && authData.user && !authData.user.confirmed_at),
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create account' }
  }
}

export async function signInSeller(params: {
  email: string
  password: string
}): Promise<AuthResult> {
  const { email, password } = params
  const cleanEmail = email.trim()

  // Demo shortcut credentials
  if (cleanEmail.toLowerCase().includes('tester') || cleanEmail.toLowerCase() === 'zain55@gmail.com') {
    return { success: true, profile: initialSellerProfile }
  }

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
