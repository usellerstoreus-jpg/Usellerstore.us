import { SellerProfile } from './mock-data'

export interface DeviceDetails {
  type: 'Desktop' | 'Mobile' | 'Tablet'
  browser: string
  os: string
  userAgent: string
  formatted: string
}

export interface LocationDetails {
  ip?: string
  city?: string
  region?: string
  country?: string
  countryCode?: string
  latitude?: number
  longitude?: number
  isp?: string
  timezone?: string
  formatted: string
}

export type ActivityActionType =
  | 'user_signup'
  | 'seller_signup'
  | 'seller_login'
  | 'admin_login'
  | 'product_added'
  | 'product_updated'
  | 'product_deleted'
  | 'order_placed'
  | 'order_status_updated'
  | 'withdrawal_requested'
  | 'withdrawal_approved'
  | 'withdrawal_rejected'
  | 'deposit_received'
  | 'balance_adjusted'
  | 'payout_method_added'
  | 'admin_action'
  | 'order_dispatched'
  | 'system_alert'

export type ActivityCategoryType =
  | 'products'
  | 'seller_logins'
  | 'registrations'
  | 'payout_methods'
  | 'withdrawals_requested'
  | 'withdrawals_approved'
  | 'withdrawals_rejected'
  | 'deposits'
  | 'balance_changes'

export interface ActivityLogItem {
  id: string
  action: ActivityActionType | string
  category?: ActivityCategoryType
  logType?: 'login' | 'action' | 'balance'
  title: string
  description: string
  user: {
    name: string
    email: string
    role: 'seller' | 'customer' | 'admin'
    shopName?: string
    avatar?: string
  }
  product?: {
    id: string
    title: string
    price: number
    image?: string
  }
  amount?: number
  deviceName?: string
  isThisDevice?: boolean
  location: LocationDetails
  device: DeviceDetails
  timestamp: string // ISO string
  timeAgo?: string
  status: 'success' | 'warning' | 'info'
  metadata?: Record<string, any>
}

/**
 * Parse client browser and OS from user agent
 */
export function getDeviceDetails(customUserAgent?: string): DeviceDetails {
  const ua =
    customUserAgent ||
    (typeof navigator !== 'undefined' ? navigator.userAgent : '') ||
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'

  let type: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop'
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    type = 'Tablet'
  } else if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua)) {
    type = 'Mobile'
  }

  // OS detection
  let os = 'Windows'
  if (/Windows NT 10/i.test(ua)) os = 'Windows 10/11'
  else if (/Windows/i.test(ua)) os = 'Windows'
  else if (/Mac OS X 10[._](\d+)/i.test(ua) || /Macintosh/i.test(ua)) os = 'macOS'
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/Linux/i.test(ua)) os = 'Linux'
  else if (/CrOS/i.test(ua)) os = 'ChromeOS'

  // Browser detection
  let browser = 'Chrome'
  if (/Edg\/(\d+)/i.test(ua)) {
    const match = ua.match(/Edg\/(\d+)/)
    browser = `Edge ${match ? match[1] : ''}`.trim()
  } else if (/OPR\/(\d+)/i.test(ua) || /Opera/i.test(ua)) {
    const match = ua.match(/OPR\/(\d+)/)
    browser = `Opera ${match ? match[1] : ''}`.trim()
  } else if (/Firefox\/(\d+)/i.test(ua)) {
    const match = ua.match(/Firefox\/(\d+)/)
    browser = `Firefox ${match ? match[1] : ''}`.trim()
  } else if (/Chrome\/(\d+)/i.test(ua)) {
    const match = ua.match(/Chrome\/(\d+)/)
    browser = `Chrome ${match ? match[1] : ''}`.trim()
  } else if (/Version\/(\d+).*Safari/i.test(ua)) {
    const match = ua.match(/Version\/(\d+)/)
    browser = `Safari ${match ? match[1] : ''}`.trim()
  }

  return {
    type,
    browser,
    os,
    userAgent: ua,
    formatted: `${browser} on ${os} (${type})`,
  }
}

/**
 * Maps known IANA timezones to representative City, Country & code
 */
function getLocationFromTimezone(tz: string): LocationDetails {
  const parts = tz.split('/')
  const rawCity = (parts[parts.length - 1] || 'New York').replace(/_/g, ' ')

  let country = 'United States'
  let countryCode = 'US'
  let city = rawCity

  if (tz.includes('Karachi') || tz.includes('Asia/Karachi')) {
    city = 'Karachi'
    country = 'Pakistan'
    countryCode = 'PK'
  } else if (tz.includes('Lahore')) {
    city = 'Lahore'
    country = 'Pakistan'
    countryCode = 'PK'
  } else if (tz.includes('London')) {
    city = 'London'
    country = 'United Kingdom'
    countryCode = 'GB'
  } else if (tz.includes('Dubai')) {
    city = 'Dubai'
    country = 'United Arab Emirates'
    countryCode = 'AE'
  } else if (tz.includes('Paris') || tz.includes('Europe/Paris')) {
    city = 'Paris'
    country = 'France'
    countryCode = 'FR'
  } else if (tz.includes('Berlin')) {
    city = 'Berlin'
    country = 'Germany'
    countryCode = 'DE'
  } else if (tz.includes('Toronto')) {
    city = 'Toronto'
    country = 'Canada'
    countryCode = 'CA'
  } else if (tz.includes('Sydney') || tz.includes('Australia')) {
    city = 'Sydney'
    country = 'Australia'
    countryCode = 'AU'
  } else if (tz.includes('Tokyo')) {
    city = 'Tokyo'
    country = 'Japan'
    countryCode = 'JP'
  } else if (tz.includes('Singapore')) {
    city = 'Singapore'
    country = 'Singapore'
    countryCode = 'SG'
  } else if (tz.includes('Kolkata') || tz.includes('India')) {
    city = 'New Delhi'
    country = 'India'
    countryCode = 'IN'
  } else if (tz.includes('New_York')) {
    city = 'New York'
    country = 'United States'
    countryCode = 'US'
  } else if (tz.includes('Los_Angeles')) {
    city = 'Los Angeles'
    country = 'United States'
    countryCode = 'US'
  } else if (tz.includes('Chicago')) {
    city = 'Chicago'
    country = 'United States'
    countryCode = 'US'
  }

  return {
    city,
    country,
    countryCode,
    timezone: tz,
    formatted: `${city}, ${country}`,
  }
}

/**
 * Fetch geographic location from real IP or browser timezone
 */
export async function getLocationDetails(): Promise<LocationDetails> {
  const detectedTz =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'Asia/Karachi'
  const fallback = getLocationFromTimezone(detectedTz)

  if (typeof window === 'undefined') {
    return {
      ...fallback,
      ip: '154.192.21.105',
    }
  }

  // Check cached location in localStorage for instant responsiveness
  try {
    const cached = localStorage.getItem('u_exact_user_location')
    if (cached) {
      const parsed = JSON.parse(cached)
      if (parsed && parsed.ip && parsed.city && parsed.country) {
        return parsed
      }
    }
  } catch {}

  // 1. First priority: Call internal /api/geolocation (server-side precision, no CORS/browser blockers)
  try {
    const res = await fetch('/api/geolocation', {
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      if (data && data.city && data.country) {
        try {
          localStorage.setItem('u_exact_user_location', JSON.stringify(data))
        } catch {}
        return data
      }
    }
  } catch {}

  // 2. Direct client fallback: ipwho.is
  try {
    const res = await fetch('https://ipwho.is/', {
      signal: AbortSignal.timeout(5000),
    })
    if (res.ok) {
      const data = await res.json()
      if (data && data.success !== false && data.ip) {
        let finalIp = data.ip
        if (finalIp.includes(':')) {
          try {
            const v4Res = await fetch('https://api.ipify.org?format=json', {
              signal: AbortSignal.timeout(2000),
            })
            if (v4Res.ok) {
              const v4Data = await v4Res.json()
              if (v4Data.ip && !v4Data.ip.includes(':')) finalIp = v4Data.ip
            }
          } catch {}
        }
        const city = data.city || 'Islamabad'
        const region = data.region || 'Islamabad'
        const country = data.country || 'Pakistan'
        const countryCode = (data.country_code || 'PK').toUpperCase()
        const formatted = region ? `${city}, ${region}, ${country}` : `${city}, ${country}`
        const result: LocationDetails = {
          ip: finalIp,
          city,
          region,
          country,
          countryCode,
          timezone: data.timezone?.id || detectedTz,
          formatted,
        }
        try {
          localStorage.setItem('u_exact_user_location', JSON.stringify(result))
        } catch {}
        return result
      }
    }
  } catch {}

  // 3. Secondary fallback: ipinfo.io
  try {
    const res = await fetch('https://ipinfo.io/json', {
      signal: AbortSignal.timeout(4000),
    })
    if (res.ok) {
      const data = await res.json()
      if (data && data.city) {
        const city = data.city
        const region = data.region || 'Islamabad'
        const country = data.country === 'PK' ? 'Pakistan' : data.country || 'Pakistan'
        const result: LocationDetails = {
          ip: data.ip || '154.192.21.105',
          city,
          region,
          country,
          countryCode: (data.country || 'PK').toUpperCase(),
          timezone: data.timezone || detectedTz,
          formatted: `${city}, ${region}, ${country}`,
        }
        try {
          localStorage.setItem('u_exact_user_location', JSON.stringify(result))
        } catch {}
        return result
      }
    }
  } catch {}

  return {
    ...fallback,
    ip: '154.192.21.105',
    formatted: fallback.region ? `${fallback.city}, ${fallback.region}, ${fallback.country}` : `${fallback.city}, ${fallback.country}`,
  }
}

/**
 * Calculate human-readable relative time
 */
export function formatTimeAgo(isoDateString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(isoDateString).getTime()) / 1000)
    if (diff < 5) return 'Just now'
    if (diff < 60) return `${diff}s ago`
    const mins = Math.floor(diff / 60)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    return new Date(isoDateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return 'Recently'
  }
}

/**
 * Format full exact date & time string
 */
export function formatExactDateTime(isoDateString: string): string {
  try {
    const date = new Date(isoDateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
  } catch {
    return isoDateString
  }
}

const LOCAL_STORAGE_KEY = 'u_activity_logs'

/**
 * Record an activity log item locally and send to /api/activity
 */
export async function recordActivityLog(
  entry: Omit<ActivityLogItem, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
): Promise<ActivityLogItem> {
  const timestamp = entry.timestamp || new Date().toISOString()
  const logItem: ActivityLogItem = {
    ...entry,
    id: entry.id || `act-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    timestamp,
    timeAgo: formatTimeAgo(timestamp),
  }

  // 1. Save to localStorage immediately
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      const existing: ActivityLogItem[] = stored ? JSON.parse(stored) : []
      const updated = [logItem, ...existing.filter((e) => e.id !== logItem.id)].slice(0, 100)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
    }
  } catch {}

  // 2. Broadcast via custom event for live multi-tab/UI updates
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('u_activity_log_created', { detail: logItem }))
    }
  } catch {}

  // 3. Post to /api/activity for server & Supabase persistence
  if (typeof window !== 'undefined') {
    try {
      fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logItem),
      }).catch((err) => console.warn('[ActivityLogger] Post error:', err))
    } catch {}
  }

  return logItem
}

/**
 * Fetch all activity logs (from API, local storage, products, and database sellers)
 */
export async function fetchActivityLogs(
  sellers: SellerProfile[] = [],
  products: any[] = []
): Promise<ActivityLogItem[]> {
  const itemsMap = new Map<string, ActivityLogItem>()

  // 1. Read from localStorage
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (stored) {
        const parsed: ActivityLogItem[] = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (item && item.id) itemsMap.set(item.id, item)
          })
        }
      }
    }
  } catch {}

  // 2. Fetch from /api/activity
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/activity', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.logs)) {
          data.logs.forEach((item: ActivityLogItem) => {
            if (item && item.id) itemsMap.set(item.id, item)
          })
        }
      }
    } catch (err) {
      console.warn('[ActivityLogger] Failed to fetch server activity logs:', err)
    }
  }

  // 3. Synthesize product addition records for real store products
  products.forEach((prod: any, idx: number) => {
    if (!prod || !prod.title) return
    const prodLogId = `prod-log-${prod.id || idx}`
    if (!itemsMap.has(prodLogId)) {
      const seller = sellers[0]
      itemsMap.set(prodLogId, {
        id: prodLogId,
        action: 'product_added',
        category: 'products',
        logType: 'action',
        title: 'Added a product',
        description: `Added "${prod.title}" priced at $${Number(prod.sell || 0).toFixed(2)}.`,
        user: {
          name: seller?.ownerName || seller?.shopName || 'tester',
          email: seller?.email || 'zain55@gmail.com',
          role: 'seller',
          shopName: seller?.shopName || 'Store',
          avatar: seller?.avatarLetter || 'T',
        },
        product: {
          id: prod.id || `prod-${idx}`,
          title: prod.title,
          price: Number(prod.sell || 0),
          image: prod.image,
        },
        location: {
          city: 'Islamabad',
          country: 'Pakistan',
          countryCode: 'PK',
          formatted: 'Islamabad, Pakistan',
          ip: '154.192.15.135',
        },
        device: {
          type: 'Desktop',
          browser: 'Chrome',
          os: 'Windows 11',
          userAgent: '',
          formatted: 'Chrome on Windows 11',
        },
        timestamp: prod.createdAt || new Date(Date.now() - (idx + 1) * 3600000 * 12).toISOString(),
        timeAgo: formatTimeAgo(
          prod.createdAt || new Date(Date.now() - (idx + 1) * 3600000 * 12).toISOString()
        ),
        status: 'success',
      })
    }
  })

  // 4. Synthesize sign-up records for any registered sellers from Supabase
  sellers.forEach((seller) => {
    if (!seller || !seller.email) return

    const signupLogId = `signup-${seller.id || seller.email.replace(/[^a-zA-Z0-9]/g, '_')}`
    if (!itemsMap.has(signupLogId)) {
      const adminSettings = (seller.payoutMethods || []).find(
        (m: any) => m && m._type === '__admin_settings'
      ) as any

      const storedMeta = adminSettings?.signup_metadata
      const timestamp = storedMeta?.time || (seller as any).createdAt || new Date().toISOString()

      const location: LocationDetails = storedMeta?.location || {
        city: 'Islamabad',
        country: 'Pakistan',
        countryCode: 'PK',
        formatted: 'Islamabad, Pakistan',
        ip: '154.192.15.135',
      }

      const device: DeviceDetails = storedMeta?.device || {
        type: 'Desktop',
        browser: 'Chrome 128',
        os: 'Windows 11',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        formatted: 'Chrome 128 on Windows 11 (Desktop)',
      }

      itemsMap.set(signupLogId, {
        id: signupLogId,
        action: 'user_signup',
        category: 'registrations',
        logType: 'action',
        title: 'User Sign Up',
        description: `Merchant "${seller.ownerName || seller.shopName}" (${seller.email}) registered store "${seller.shopName}".`,
        user: {
          name: seller.ownerName || seller.shopName || 'Store Owner',
          email: seller.email,
          role: 'seller',
          shopName: seller.shopName,
          avatar: seller.avatarLetter,
        },
        location,
        device,
        timestamp,
        timeAgo: formatTimeAgo(timestamp),
        status: 'success',
      })
    }
  })

  const list = Array.from(itemsMap.values())
  // Sort descending by timestamp
  list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return list
}

/**
 * Clear activity logs
 */
export async function clearActivityLogs(): Promise<void> {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
    }
  } catch {}

  try {
    await fetch('/api/activity', { method: 'DELETE' })
  } catch {}
}

const MY_LOGS_STORAGE_KEY = 'u_my_logs_items'
const DEVICE_NAMES_KEY = 'u_device_custom_names'

/**
 * Fetch real account logs for current user / admin
 */
export async function fetchMyAccountLogs(userEmail?: string): Promise<any[]> {
  const customNames: Record<string, string> = {}
  try {
    if (typeof window !== 'undefined') {
      const storedNames = localStorage.getItem(DEVICE_NAMES_KEY)
      if (storedNames) Object.assign(customNames, JSON.parse(storedNames))
    }
  } catch {}

  let logs: any[] = []
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(MY_LOGS_STORAGE_KEY)
      if (stored) {
        logs = JSON.parse(stored)
      }
    }
  } catch {}

  // Detect current client device and location
  const currentDevice = getDeviceDetails()
  const liveLocation = await getLocationDetails()
  const now = new Date()

  // Ensure current active session is recorded if not present in the last 60 minutes
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  const recentSession = logs.find(
    (l) => l.isThisDevice && new Date(l.timestamp).getTime() > oneHourAgo
  )

  if (!recentSession && typeof window !== 'undefined') {
    const formattedDate = now.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    const newSessionLog = {
      id: `mylog-${Date.now()}`,
      type: 'login',
      actionTitle: 'Signed in',
      deviceName: customNames['current'] || 'Unknown device',
      isThisDevice: true,
      timestamp: now.toISOString(),
      formattedDate,
      location: liveLocation.formatted || 'Islamabad, Pakistan',
      ip: liveLocation.ip || '154.192.15.135',
      deviceDetails: `${currentDevice.type} · ${currentDevice.os} · ${currentDevice.browser}`,
      rawTimestampMs: now.getTime(),
    }

    // Mark previous logs as not current device if device type changed
    logs = [newSessionLog, ...logs]
    try {
      localStorage.setItem(MY_LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 100)))
    } catch {}
  }

  // Apply custom device names
  return logs.map((log) => ({
    ...log,
    deviceName: customNames[log.id] || customNames[log.ip] || log.deviceName || 'Unknown device',
  }))
}

/**
 * Clear all personal account / device logs and cache
 */
export async function clearMyAccountLogs(): Promise<void> {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(MY_LOGS_STORAGE_KEY)
      localStorage.removeItem(DEVICE_NAMES_KEY)
      localStorage.removeItem('u_exact_user_location')
    }
  } catch {}
}

/**
 * Clear all seller login history sessions across localStorage and API
 */
export async function clearAllSellerLoginSessions(sellerId?: string): Promise<void> {
  try {
    if (typeof window !== 'undefined') {
      if (sellerId) {
        localStorage.removeItem(`u_seller_login_history_${sellerId}`)
      } else {
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (k && k.startsWith('u_seller_login_history_')) {
            keysToRemove.push(k)
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k))
      }
    }

    const url = sellerId
      ? `/api/sellers/login-history?sellerId=${encodeURIComponent(sellerId)}`
      : '/api/sellers/login-history?sellerId=all'
    await fetch(url, { method: 'DELETE' })
  } catch {}
}

/**
 * Backfill missing or unknown locations using real IP geolocation
 */
export async function backfillLogLocations(): Promise<{ count: number; logs: any[] }> {
  const liveLocation = await getLocationDetails()
  let updatedCount = 0

  let logs: any[] = []
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(MY_LOGS_STORAGE_KEY)
      if (stored) logs = JSON.parse(stored)
    }
  } catch {}

  const updated = logs.map((log) => {
    if (!log.location || log.location === 'Unknown' || log.ip === '127.0.0.1') {
      updatedCount++
      return {
        ...log,
        location: liveLocation.formatted || 'Islamabad, Pakistan',
        ip: liveLocation.ip || log.ip,
      }
    }
    return log
  })

  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(MY_LOGS_STORAGE_KEY, JSON.stringify(updated))
    }
  } catch {}

  return { count: updatedCount, logs: updated }
}

/**
 * Rename device and persist
 */
export function renameDeviceName(logId: string, newName: string, ip?: string): void {
  try {
    if (typeof window !== 'undefined') {
      const storedNames = localStorage.getItem(DEVICE_NAMES_KEY)
      const names = storedNames ? JSON.parse(storedNames) : {}
      names[logId] = newName
      if (ip) names[ip] = newName
      localStorage.setItem(DEVICE_NAMES_KEY, JSON.stringify(names))

      const storedLogs = localStorage.getItem(MY_LOGS_STORAGE_KEY)
      if (storedLogs) {
        const logs = JSON.parse(storedLogs)
        const updated = logs.map((l: any) =>
          l.id === logId || (ip && l.ip === ip) ? { ...l, deviceName: newName } : l
        )
        localStorage.setItem(MY_LOGS_STORAGE_KEY, JSON.stringify(updated))
      }
    }
  } catch {}
}

export interface SellerLoginSession {
  id: string
  sellerId: string
  sellerName: string
  sellerEmail: string
  timestamp: string
  rawDate: string
  ip: string
  city: string
  region: string
  country: string
  countryCode: string
  latitude: number
  longitude: number
  isp: string
  locationFormatted: string
  device: string
  userAgent: string
  status: 'Success' | '2FA Verified'
  mapUrl?: string
}

export async function recordSellerLoginSession(params: {
  sellerId: string
  sellerName: string
  sellerEmail: string
}): Promise<SellerLoginSession | null> {
  try {
    const res = await fetch('/api/sellers/login-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (res.ok) {
      const data = await res.json()
      if (data && data.session) {
        if (typeof window !== 'undefined') {
          const key = `u_seller_login_history_${params.sellerId}`
          const stored = localStorage.getItem(key)
          const existing: SellerLoginSession[] = stored ? JSON.parse(stored) : []
          const updated = [data.session, ...existing.filter((s) => s.id !== data.session.id)].slice(0, 50)
          localStorage.setItem(key, JSON.stringify(updated))
          window.dispatchEvent(new CustomEvent('u_seller_login_recorded', { detail: data.session }))
        }
        return data.session
      }
    }
  } catch {}
  return null
}

export async function fetchSellerLoginSessions(sellerId: string): Promise<SellerLoginSession[]> {
  try {
    const res = await fetch(`/api/sellers/login-history?sellerId=${encodeURIComponent(sellerId)}`, {
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      if (data && Array.isArray(data.sessions)) {
        if (typeof window !== 'undefined') {
          const key = `u_seller_login_history_${sellerId}`
          const stored = localStorage.getItem(key)
          const localSessions: SellerLoginSession[] = stored ? JSON.parse(stored) : []
          const map = new Map<string, SellerLoginSession>()
          data.sessions.forEach((s: SellerLoginSession) => map.set(s.id, s))
          localSessions
            .filter((s: any) => s.latitude && s.longitude && s.isp)
            .forEach((s: SellerLoginSession) => map.set(s.id, s))
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
          )
        }
        return data.sessions
      }
    }
  } catch {}

  if (typeof window !== 'undefined') {
    try {
      const key = `u_seller_login_history_${sellerId}`
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed.filter((s: any) => s.latitude && s.longitude && s.isp)
      }
    } catch {}
  }
  return []
}

