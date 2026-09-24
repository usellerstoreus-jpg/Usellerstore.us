import { NotificationItem, SellerProfile, Order } from './mock-data'
import { playNotificationSound } from './notification-sound'

export type NotificationCategory =
  | 'order'
  | 'store'
  | 'product'
  | 'kyc'
  | 'payout'
  | 'system'
  | 'security'
  | 'seller'

export interface ExtendedNotificationItem extends NotificationItem {
  category?: NotificationCategory
  targetRole?: 'seller' | 'admin' | 'shop' | 'all'
  sellerId?: string
  sellerEmail?: string
  shopName?: string
  productId?: string
  productImage?: string
  productPrice?: number
  promoCode?: string
  badgeText?: string
}

const STORAGE_ALL_NOTIFICATIONS = 'u_all_notifications'
const STORAGE_LEGACY_SELLER_NOTIFICATIONS = 'u_seller_notifications'
export const STORAGE_SHOP_NOTIFICATIONS = 'u_shop_notifications'

/**
 * Default seed notifications for both Seller and Admin.
 * - Seller gets Store & Order updates.
 * - Admin gets everything across the platform.
 */
export const DEFAULT_PLATFORM_NOTIFICATIONS: ExtendedNotificationItem[] = [
  // 1. Order Updates (Belonging to default demo seller)
  {
    id: 'notif-ord-101',
    title: 'Order Delivered Successfully',
    description: 'Order #ORD-8921 has been marked delivered! Profit of $14.50 credited.',
    date: 'TODAY',
    timeAgo: '12m ago',
    refCode: 'ORD-8921',
    type: 'order',
    category: 'order',
    targetRole: 'all',
    sellerId: 'seller-1',
    sellerEmail: 'zain55@gmail.com',
    shopName: 'tester',
    read: false,
    details: 'Order #ORD-8921 placed by Emma Watson has completed delivery. $14.50 net profit has been automatically reflected in your store dashboard balance.',
  },
  {
    id: 'notif-ord-102',
    title: 'New Customer Order Received',
    description: 'Order #ORD-8940 for $59.95 received from Michael Davis.',
    date: 'TODAY',
    timeAgo: '45m ago',
    refCode: 'ORD-8940',
    type: 'order',
    category: 'order',
    targetRole: 'all',
    sellerId: 'seller-1',
    sellerEmail: 'zain55@gmail.com',
    shopName: 'tester',
    read: false,
    details: 'Customer Michael Davis (m.davis@example.com) purchased 1x Superfeet All-Purpose Medium Arch Insoles. Order is currently in Pending stage waiting for fulfillment.',
  },
  // 2. Store Updates (Belonging to default demo seller)
  {
    id: 'notif-str-201',
    title: 'Store KYC Verified & Approved',
    description: 'Congratulations! Your merchant store identity verification has been approved.',
    date: 'TODAY',
    timeAgo: '2h ago',
    refCode: 'KYC-OK',
    type: 'kyc',
    category: 'store',
    targetRole: 'all',
    sellerId: 'seller-1',
    sellerEmail: 'zain55@gmail.com',
    shopName: 'tester',
    read: true,
    details: 'Your business documentation and ID card have been reviewed and approved by Platform Administration. Your store now enjoys verified merchant status with unrestricted product listings and instant payout capabilities.',
  },
  {
    id: 'notif-str-202',
    title: 'Product Published to Store',
    description: 'New product "11 inch 2 in 1 Tablet Android 16" published to catalog.',
    date: 'YESTERDAY',
    timeAgo: '1d ago',
    refCode: 'TAB-2IN1',
    type: 'system',
    category: 'store',
    targetRole: 'all',
    sellerId: 'seller-1',
    sellerEmail: 'zain55@gmail.com',
    shopName: 'tester',
    read: true,
    details: 'Product SKU TAB-2IN1-11PK with $15.73 estimated profit margin was published. It is now actively visible to customers in your storefront.',
  },
  // 3. Platform & Other Seller Events (Admin gets these, regular seller does NOT see them)
  {
    id: 'notif-adm-301',
    title: 'New Seller Onboarded',
    description: 'Merchant "Marcus Aurelius" created a new store: "Apex Tech Gear".',
    date: 'TODAY',
    timeAgo: '1h ago',
    refCode: 'REG-882',
    type: 'system',
    category: 'seller',
    targetRole: 'admin',
    sellerId: 'seller-apex',
    sellerEmail: 'marcus@apextech.io',
    shopName: 'Apex Tech Gear',
    read: false,
    details: 'New merchant account registered. Email: marcus@apextech.io, Store Name: Apex Tech Gear. Initial KYC submission is pending.',
  },
  {
    id: 'notif-adm-302',
    title: 'Withdrawal Request Submitted',
    description: 'Store "Urban Aura" submitted payout request for $450.00 via Bank Wire.',
    date: 'TODAY',
    timeAgo: '3h ago',
    refCode: 'WTH-450',
    type: 'payout',
    category: 'payout',
    targetRole: 'admin',
    sellerId: 'seller-urban',
    sellerEmail: 'finance@urbanaura.com',
    shopName: 'Urban Aura',
    read: false,
    details: 'Seller Urban Aura requested $450.00 withdrawal to JPMorgan Chase account ending in 4492. Requires admin review and approval in Finance & Withdrawals.',
  },
  {
    id: 'notif-adm-303',
    title: 'KYC Documents Pending Review',
    description: 'Store "Elite Outfitters" uploaded National ID for verification.',
    date: 'YESTERDAY',
    timeAgo: '1d ago',
    refCode: 'KYC-REV',
    type: 'kyc',
    category: 'kyc',
    targetRole: 'admin',
    sellerId: 'seller-elite',
    sellerEmail: 'owner@eliteoutfitters.com',
    shopName: 'Elite Outfitters',
    read: true,
    details: 'Merchant submitted national identity card photos. Please review documents in KYC Management Console.',
  },
  {
    id: 'notif-adm-304',
    title: 'Admin Invite Code Redeemed',
    description: 'Secret invite key "MXSVHSDL" was claimed from 154.192.21.105.',
    date: 'YESTERDAY',
    timeAgo: '1d ago',
    refCode: 'SEC-KEY',
    type: 'system',
    category: 'security',
    targetRole: 'admin',
    read: true,
    details: 'Authorized administrator claimed invite key. Session granted with full root privileges.',
  },
]

/**
 * Read all platform notifications from storage.
 */
export function getAllStoredNotifications(): ExtendedNotificationItem[] {
  if (typeof window === 'undefined') return DEFAULT_PLATFORM_NOTIFICATIONS

  try {
    const rawAll = localStorage.getItem(STORAGE_ALL_NOTIFICATIONS)
    if (rawAll) {
      const parsed = JSON.parse(rawAll)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }

    // Fallback to legacy key
    const rawLegacy = localStorage.getItem(STORAGE_LEGACY_SELLER_NOTIFICATIONS)
    if (rawLegacy) {
      const parsed = JSON.parse(rawLegacy)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}

  // Initialize with seed data if empty
  try {
    localStorage.setItem(STORAGE_ALL_NOTIFICATIONS, JSON.stringify(DEFAULT_PLATFORM_NOTIFICATIONS))
    localStorage.setItem(STORAGE_LEGACY_SELLER_NOTIFICATIONS, JSON.stringify(DEFAULT_PLATFORM_NOTIFICATIONS))
  } catch {}

  return DEFAULT_PLATFORM_NOTIFICATIONS
}

/**
 * Save notifications to local storage and sync cross-tabs.
 */
export function saveAllStoredNotifications(items: ExtendedNotificationItem[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_ALL_NOTIFICATIONS, JSON.stringify(items))
    localStorage.setItem(STORAGE_LEGACY_SELLER_NOTIFICATIONS, JSON.stringify(items))
  } catch {}
}

/**
 * Default seed notifications for the customer / buyer storefront:
 * STRICTLY PRODUCT updates and STORE updates.
 */
export const DEFAULT_SHOP_NOTIFICATIONS: ExtendedNotificationItem[] = [
  // 1. Product Updates
  {
    id: 'shop-notif-prod-1',
    title: 'Price Drop: Sony WH-1000XM5 Wireless Headphones',
    description: 'Limited-time offer! Price reduced to $348.00 (was $399.99). Industry-leading noise cancellation now in stock.',
    date: 'TODAY',
    timeAgo: '15m ago',
    refCode: 'PRD-SONY',
    type: 'system',
    category: 'product',
    targetRole: 'all',
    productId: 'prod-18',
    productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80',
    productPrice: 348.0,
    badgeText: 'Price Drop',
    read: false,
    details: 'Save $51.99 on the premium Sony WH-1000XM5 wireless noise cancelling headphones with 30-hour battery life.',
  },
  {
    id: 'shop-notif-prod-2',
    title: 'New Arrival: 11" 2-in-1 Tablet Android 16',
    description: 'New product just added to our catalog: 20GB RAM + 128GB ROM with included protective keyboard case.',
    date: 'TODAY',
    timeAgo: '1h ago',
    refCode: 'PRD-TAB11',
    type: 'system',
    category: 'product',
    targetRole: 'all',
    productId: 'prod-2',
    productImage: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=500&q=80',
    productPrice: 74.99,
    badgeText: 'New Arrival',
    read: false,
    details: 'Powerful 11-inch Android 16 tablet with IPS display, quad speakers, and 1TB TF card expansion support.',
  },
  {
    id: 'shop-notif-prod-3',
    title: 'Back in Stock: bmani Wireless Earbuds (80H Playtime)',
    description: 'Restocked by popular demand! High-durability Bluetooth sport earbuds with dual digital power display.',
    date: 'YESTERDAY',
    timeAgo: '1d ago',
    refCode: 'PRD-BMANI',
    type: 'system',
    category: 'product',
    targetRole: 'all',
    productId: 'prod-4',
    productImage: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=500&q=80',
    productPrice: 35.99,
    badgeText: 'Back in Stock',
    read: true,
    details: 'IPX7 waterproof earbuds with ear hooks, crisp stereo sound, and 80-hour total playback with charging case.',
  },
  // 2. Store Updates
  {
    id: 'shop-notif-store-1',
    title: 'Storewide Promo: 10% Off With Code SAVE10',
    description: 'Store celebration! Apply coupon code SAVE10 during checkout for an instant 10% discount on your entire order.',
    date: 'TODAY',
    timeAgo: '30m ago',
    refCode: 'STR-PROMO10',
    type: 'system',
    category: 'store',
    targetRole: 'all',
    promoCode: 'SAVE10',
    badgeText: 'Store Promo',
    read: false,
    details: 'Valid storewide for all categories including audio, electronics, and home essentials. Can be combined with free shipping.',
  },
  {
    id: 'shop-notif-store-2',
    title: 'Store Update: Free Priority Shipping Over $50',
    description: 'We have updated our store policy! Enjoy zero delivery fees on any cart total of $50 or more across the US.',
    date: 'TODAY',
    timeAgo: '3h ago',
    refCode: 'STR-SHP50',
    type: 'system',
    category: 'store',
    targetRole: 'all',
    badgeText: 'Free Shipping',
    read: true,
    details: 'All shipments are expedited via USPS/FedEx with full live GPS tracking numbers issued immediately upon fulfillment.',
  },
  {
    id: 'shop-notif-store-3',
    title: 'Store Verification & Buyer Protection',
    description: 'Our storefront has been awarded Verified Merchant status. Shop with full 30-day money-back guarantee.',
    date: 'YESTERDAY',
    timeAgo: '2d ago',
    refCode: 'STR-VERIFY',
    type: 'system',
    category: 'store',
    targetRole: 'all',
    badgeText: 'Verified Store',
    read: true,
    details: 'Our merchant identity and payment rails are authenticated. Your purchases are safeguarded with full buyer protection.',
  },
]

/**
 * Retrieve notifications strictly for the SHOP storefront (Customer / Visitor).
 */
export function getShopStoredNotifications(): ExtendedNotificationItem[] {
  if (typeof window === 'undefined') return DEFAULT_SHOP_NOTIFICATIONS

  try {
    const raw = localStorage.getItem(STORAGE_SHOP_NOTIFICATIONS)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return filterShopNotifications(parsed)
      }
    }
  } catch {}

  // Initialize with seed data
  try {
    localStorage.setItem(STORAGE_SHOP_NOTIFICATIONS, JSON.stringify(DEFAULT_SHOP_NOTIFICATIONS))
  } catch {}

  return DEFAULT_SHOP_NOTIFICATIONS
}

/**
 * Save storefront notifications.
 */
export function saveShopStoredNotifications(items: ExtendedNotificationItem[]): void {
  if (typeof window === 'undefined') return
  try {
    const filtered = filterShopNotifications(items)
    localStorage.setItem(STORAGE_SHOP_NOTIFICATIONS, JSON.stringify(filtered))
    window.dispatchEvent(new CustomEvent('u_shop_notifications_update', { detail: { notifications: filtered } }))
  } catch {}
}

/**
 * Filter notifications strictly for the SHOP / STOREFRONT:
 * "Notification button should show notification only regarding the products or store updates"
 * 
 * Rules:
 * 1. Must be either a PRODUCT update or a STORE update.
 * 2. Strictly EXCLUDES orders, seller kyc, payouts, internal admin logs, and system audits.
 */
export function filterShopNotifications(
  allNotifications: ExtendedNotificationItem[]
): ExtendedNotificationItem[] {
  if (!Array.isArray(allNotifications)) return []

  return allNotifications.filter((notif) => {
    // 1. Explicitly exclude admin-only or internal notifications
    if (notif.targetRole === 'admin') return false

    // 2. Explicitly exclude order tracking, customer individual order receipts, KYC doc audits, payouts, admin keys
    const isOrderOrInternal =
      notif.category === 'order' ||
      notif.type === 'order' ||
      notif.category === 'kyc' ||
      notif.category === 'payout' ||
      notif.category === 'security' ||
      notif.category === 'seller' ||
      (notif.refCode && notif.refCode.toUpperCase().startsWith('ORD-')) ||
      (notif.title && notif.title.toLowerCase().includes('withdrawal')) ||
      (notif.title && notif.title.toLowerCase().includes('kyc document')) ||
      (notif.title && notif.title.toLowerCase().includes('admin invite'))

    if (isOrderOrInternal) return false

    // 3. Must be strictly a PRODUCT update or a STORE update
    const isProduct =
      notif.category === 'product' ||
      Boolean(notif.productId) ||
      (notif.badgeText && ['Price Drop', 'New Arrival', 'Back in Stock', 'Hot Deal'].includes(notif.badgeText)) ||
      notif.title.toLowerCase().includes('price drop') ||
      notif.title.toLowerCase().includes('new arrival') ||
      notif.title.toLowerCase().includes('back in stock') ||
      notif.title.toLowerCase().includes('hot deal')

    const isStore =
      notif.category === 'store' ||
      Boolean(notif.promoCode) ||
      (notif.badgeText && ['Store Promo', 'Free Shipping', 'Verified Store', 'Store Policy'].includes(notif.badgeText)) ||
      notif.title.toLowerCase().includes('store') ||
      notif.title.toLowerCase().includes('shipping') ||
      notif.title.toLowerCase().includes('code save')

    return isProduct || isStore
  })
}

/**
 * Filter notifications strictly for the SELLER:
 * "A seller will get notified with ONLY store and order updates"
 * 
 * Rules:
 * 1. Must be either an ORDER update or a STORE update.
 * 2. Must belong to THIS active seller (matching shopName, email, sellerId, or order numbers).
 * 3. Never includes platform admin logs, other sellers' activity, global security events, or admin invite redemptions.
 */
export function filterSellerNotifications(
  allNotifications: ExtendedNotificationItem[],
  profile?: SellerProfile | null,
  orders?: Order[]
): ExtendedNotificationItem[] {
  if (!Array.isArray(allNotifications)) return []

  const cleanShop = (profile?.shopName || '').trim().toLowerCase()
  const cleanEmail = (profile?.email || '').trim().toLowerCase()
  const cleanOwner = (profile?.ownerName || '').trim().toLowerCase()
  const cleanId = (profile?.id || '').trim().toLowerCase()

  const sellerOrderNumbers = new Set(
    (orders || []).map((o) => (o.orderNumber || '').trim().toLowerCase())
  )

  return allNotifications.filter((notif) => {
    // A. Explicitly exclude admin-only notifications
    if (notif.targetRole === 'admin') return false

    // B. Check if notification is an Order Update
    const isOrderCategory =
      notif.category === 'order' ||
      notif.type === 'order' ||
      notif.title.toLowerCase().includes('order') ||
      (notif.refCode && notif.refCode.toUpperCase().startsWith('ORD-'))

    if (isOrderCategory) {
      // Must belong to this seller's orders or reference this seller
      const ref = (notif.refCode || '').trim().toLowerCase()
      if (ref && sellerOrderNumbers.has(ref)) return true

      const notifSellerId = (notif.sellerId || '').toLowerCase()
      const notifEmail = (notif.sellerEmail || '').toLowerCase()
      const notifShop = (notif.shopName || '').toLowerCase()

      if (cleanId && notifSellerId === cleanId) return true
      if (cleanEmail && notifEmail === cleanEmail) return true
      if (cleanShop && notifShop === cleanShop) return true

      // If text mentions this seller's shop or email
      const text = `${notif.title} ${notif.description} ${notif.details || ''}`.toLowerCase()
      if (cleanShop && text.includes(cleanShop)) return true
      if (cleanEmail && text.includes(cleanEmail)) return true

      // If no orders match and it's another seller's order, hide it
      return false
    }

    // C. Check if notification is a Store Update
    // Store updates include:
    // - Store KYC approvals/rejections for THIS store
    // - Store settings/policy updates for THIS store (product limits, views boost, warnings)
    // - Products published/modified in THIS store
    // - Payouts/withdrawals requested or processed for THIS store
    // - Direct admin messages dispatched to THIS store
    // - Welcome onboarding message for THIS store
    const isStoreCategory =
      notif.category === 'store' ||
      notif.category === 'kyc' ||
      notif.category === 'payout' ||
      notif.type === 'kyc' ||
      notif.type === 'payout' ||
      notif.title.toLowerCase().includes('store') ||
      notif.title.toLowerCase().includes('product') ||
      notif.title.toLowerCase().includes('kyc') ||
      notif.title.toLowerCase().includes('payout') ||
      notif.title.toLowerCase().includes('withdrawal') ||
      notif.title.toLowerCase().includes('support')

    if (isStoreCategory) {
      const notifSellerId = (notif.sellerId || '').toLowerCase()
      const notifEmail = (notif.sellerEmail || '').toLowerCase()
      const notifShop = (notif.shopName || '').toLowerCase()

      if (cleanId && notifSellerId && notifSellerId === cleanId) return true
      if (cleanEmail && notifEmail && notifEmail === cleanEmail) return true
      if (cleanShop && notifShop && notifShop === cleanShop) return true

      const text = `${notif.title} ${notif.description} ${notif.details || ''}`.toLowerCase()
      if (cleanShop && text.includes(cleanShop)) return true
      if (cleanEmail && text.includes(cleanEmail)) return true
      if (cleanOwner && text.includes(cleanOwner)) return true

      // Welcome message for this store
      if (notif.title === 'Welcome to U Seller Store') {
        if (!cleanShop && !cleanEmail) return true
        return (cleanShop && text.includes(cleanShop)) || (cleanEmail && text.includes(cleanEmail))
      }

      // Default seed store updates fallback if user is on default profile
      if (
        (cleanShop === 'tester' || cleanEmail.includes('zain')) &&
        (notif.id === 'notif-str-201' || notif.id === 'notif-str-202')
      ) {
        return true
      }

      return false
    }

    // D. Exclude any generic system, admin audit, or third-party seller events
    return false
  })
}

/**
 * Filter notifications for the ADMIN:
 * "Admin will get notified with EVERYTHING, EACH AND EVERY THING"
 * 
 * Rules:
 * - Returns all notifications across the platform.
 * - Orders, store changes, registrations, KYC, withdrawals, system logs, security keys, products.
 */
export function filterAdminNotifications(
  allNotifications: ExtendedNotificationItem[]
): ExtendedNotificationItem[] {
  if (!Array.isArray(allNotifications)) return []
  // Admin sees all notifications chronologically
  return allNotifications
}

/**
 * Dispatch a new notification into the platform.
 * Updates storage and alerts both listeners and audio.
 */
export async function dispatchNotification(params: {
  title: string
  description: string
  details?: string
  refCode?: string
  type?: 'kyc' | 'order' | 'system' | 'payout'
  category?: NotificationCategory
  targetRole?: 'seller' | 'admin' | 'all'
  sellerId?: string
  sellerEmail?: string
  shopName?: string
  playSound?: boolean
}): Promise<ExtendedNotificationItem> {
  const {
    title,
    description,
    details = '',
    refCode = '',
    type = 'system',
    category = 'store',
    targetRole = 'all',
    sellerId,
    sellerEmail,
    shopName,
    playSound = true,
  } = params

  const now = new Date()
  const dateFormatted = now
    .toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    .toUpperCase()

  const newNotif: ExtendedNotificationItem = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title,
    description,
    details,
    date: dateFormatted,
    timeAgo: 'Just now',
    refCode: refCode || (category === 'order' ? 'ORDER' : 'STORE'),
    type,
    category,
    targetRole,
    sellerId,
    sellerEmail,
    shopName,
    read: false,
  }

  // 1. Update stored notifications
  if (typeof window !== 'undefined') {
    try {
      const current = getAllStoredNotifications()
      const updated = [newNotif, ...current.filter((n) => n.id !== newNotif.id)].slice(0, 200)
      saveAllStoredNotifications(updated)

      // 2. Dispatch live update events for Seller and Admin
      window.dispatchEvent(
        new CustomEvent('u_seller_notifications_update', { detail: { notification: newNotif } })
      )
      window.dispatchEvent(
        new CustomEvent('u_admin_notifications_update', { detail: { notification: newNotif } })
      )
    } catch {}

    // 3. Play audio chime
    if (playSound) {
      try {
        playNotificationSound({ volume: 0.25, tone: 'chime' })
      } catch {}
    }
  }

  return newNotif
}
