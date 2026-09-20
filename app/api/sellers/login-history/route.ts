import { NextResponse } from 'next/server'

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

// In-memory persistent cache per seller for the runtime
const memoryHistory = new Map<string, SellerLoginSession[]>()

function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const day = pad(date.getDate())
  const month = pad(date.getMonth() + 1)
  const year = date.getFullYear()
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())
  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`
}

function parseUserAgent(ua: string): string {
  let os = 'Windows'
  if (/Windows NT 10/i.test(ua)) os = 'Windows'
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS'
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/Linux/i.test(ua)) os = 'Linux'

  let browser = 'Chrome'
  if (/Edg\//i.test(ua)) browser = 'Edge'
  else if (/Firefox\//i.test(ua)) browser = 'Firefox'
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari'
  else if (/Chrome\//i.test(ua)) browser = 'Chrome'

  let type = 'Desktop'
  if (/Mobile|Android|iPhone/i.test(ua)) type = 'Mobile'
  else if (/Tablet|iPad/i.test(ua)) type = 'Tablet'

  return `${type} • ${os} • ${browser}`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sellerId = searchParams.get('sellerId') || 'all'

  if (sellerId === 'all') {
    const all: SellerLoginSession[] = []
    memoryHistory.forEach((sessions) => all.push(...sessions))
    return NextResponse.json({ sessions: all, count: all.length })
  }

  const sessions = memoryHistory.get(sellerId) || []
  return NextResponse.json({ sessions, count: sessions.length })
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const sellerId = body.sellerId || 'unknown-seller'
    const sellerName = body.sellerName || 'Merchant'
    const sellerEmail = body.sellerEmail || ''

    // 1. Resolve client IP from headers
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const cfIp = request.headers.get('cf-connecting-ip')
    let clientIp = cfIp || realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : '')

    const isLocal =
      !clientIp ||
      clientIp === '::1' ||
      clientIp === '127.0.0.1' ||
      clientIp.startsWith('192.168.') ||
      clientIp.startsWith('10.') ||
      clientIp.startsWith('172.16.')

    let targetIp = isLocal ? '' : clientIp

    // If local dev environment, resolve public outbound IPv4
    if (isLocal) {
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) })
        if (ipRes.ok) {
          const ipData = await ipRes.json()
          if (ipData.ip) targetIp = ipData.ip
        }
      } catch {}
    }

    // 2. Query geolocation engine to pinpoint coordinates, city, ISP
    let city = 'Islamabad'
    let region = 'Islamabad'
    let country = 'Pakistan'
    let countryCode = 'PK'
    let latitude = 33.7215
    let longitude = 73.0433
    let isp = 'Naya Tel Pvt. Limited'
    let finalIp = targetIp || '154.192.21.105'

    try {
      const geoUrl = targetIp ? `https://ipwho.is/${targetIp}` : 'https://ipwho.is/'
      const geoRes = await fetch(geoUrl, {
        signal: AbortSignal.timeout(4000),
        headers: { 'User-Agent': 'USellerStore-GeoTracker/1.0' },
      })
      if (geoRes.ok) {
        const geoData = await geoRes.json()
        if (geoData && geoData.success !== false) {
          finalIp = targetIp || geoData.ip || finalIp
          city = geoData.city || city
          region = geoData.region || region
          country = geoData.country || country
          countryCode = (geoData.country_code || countryCode).toUpperCase()
          if (typeof geoData.latitude === 'number') latitude = geoData.latitude
          if (typeof geoData.longitude === 'number') longitude = geoData.longitude
          if (geoData.connection?.isp) isp = geoData.connection.isp
        }
      }
    } catch {}

    const ua = request.headers.get('user-agent') || body.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152.0.0.0 Safari/537.36'
    const device = parseUserAgent(ua)
    const now = new Date()

    const locationFormatted = region && region !== city ? `${city}, ${region}, ${country}` : `${city}, ${country}`
    const mapUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=14/${latitude}/${longitude}`

    const session: SellerLoginSession = {
      id: `sess-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sellerId,
      sellerName,
      sellerEmail,
      timestamp: formatTimestamp(now),
      rawDate: now.toISOString(),
      ip: finalIp,
      city,
      region,
      country,
      countryCode,
      latitude,
      longitude,
      isp,
      locationFormatted,
      device,
      userAgent: ua,
      status: 'Success',
      mapUrl,
    }

    const existing = memoryHistory.get(sellerId) || []
    const updated = [session, ...existing.filter((s) => s.id !== session.id)].slice(0, 50)
    memoryHistory.set(sellerId, updated)

    return NextResponse.json({ success: true, session, total: updated.length })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to record login session' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const sellerId = searchParams.get('sellerId') || 'all'

  if (sellerId === 'all') {
    memoryHistory.clear()
  } else {
    memoryHistory.delete(sellerId)
  }

  return NextResponse.json({ success: true, message: 'Seller login history cleared successfully' })
}
