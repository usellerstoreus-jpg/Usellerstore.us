import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // 1. Check client IP from incoming request headers
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const cfIp = request.headers.get('cf-connecting-ip')
    let clientIp = cfIp || realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : '')

    // Check if clientIp is local/private/empty
    const isLocal =
      !clientIp ||
      clientIp === '::1' ||
      clientIp === '127.0.0.1' ||
      clientIp.startsWith('192.168.') ||
      clientIp.startsWith('10.') ||
      clientIp.startsWith('172.16.')

    let targetIp = isLocal ? '' : clientIp

    // If local development, get public IP first
    if (isLocal) {
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json', {
          signal: AbortSignal.timeout(3000),
        })
        if (ipRes.ok) {
          const ipData = await ipRes.json()
          if (ipData.ip) {
            targetIp = ipData.ip
          }
        }
      } catch {}
    }

    // Query ipwho.is for exact location data
    const geoUrl = targetIp ? `https://ipwho.is/${targetIp}` : 'https://ipwho.is/'
    const geoRes = await fetch(geoUrl, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'USellerStore-Geo/1.0' },
    })

    if (geoRes.ok) {
      const data = await geoRes.json()
      if (data && data.success !== false) {
        let finalIp = targetIp || data.ip || '154.192.21.105'
        // If ip is IPv6, try to resolve IPv4
        if (finalIp.includes(':')) {
          try {
            const v4Res = await fetch('https://api.ipify.org?format=json', {
              signal: AbortSignal.timeout(2000),
            })
            if (v4Res.ok) {
              const v4Data = await v4Res.json()
              if (v4Data.ip && !v4Data.ip.includes(':')) {
                finalIp = v4Data.ip
              }
            }
          } catch {}
        }

        const city = data.city || 'Islamabad'
        const region = data.region || 'Islamabad'
        const country = data.country || 'Pakistan'
        const countryCode = (data.country_code || 'PK').toUpperCase()
        const latitude = typeof data.latitude === 'number' ? data.latitude : 33.7215
        const longitude = typeof data.longitude === 'number' ? data.longitude : 73.0433
        const isp = data.connection?.isp || data.connection?.org || 'Naya Tel Pvt. Limited'
        const formatted = region && region !== city
          ? `${city}, ${region}, ${country}`
          : `${city}, ${region || country}, ${country}`

        return NextResponse.json({
          ip: finalIp,
          city,
          region,
          country,
          countryCode,
          latitude,
          longitude,
          isp,
          timezone: data.timezone?.id || 'Asia/Karachi',
          formatted: region ? `${city}, ${region}, ${country}` : `${city}, ${country}`,
        })
      }
    }

    // Secondary fallback: ipinfo.io
    try {
      const infoRes = await fetch('https://ipinfo.io/json', {
        signal: AbortSignal.timeout(4000),
      })
      if (infoRes.ok) {
        const info = await infoRes.json()
        const city = info.city || 'Islamabad'
        const region = info.region || 'Islamabad'
        const country = info.country === 'PK' ? 'Pakistan' : info.country || 'Pakistan'
        const countryCode = (info.country || 'PK').toUpperCase()
        let latitude = 33.7215
        let longitude = 73.0433
        if (info.loc && typeof info.loc === 'string') {
          const [lat, lon] = info.loc.split(',')
          if (lat && lon) {
            latitude = parseFloat(lat)
            longitude = parseFloat(lon)
          }
        }
        return NextResponse.json({
          ip: info.ip || targetIp || '154.192.21.105',
          city,
          region,
          country,
          countryCode,
          latitude,
          longitude,
          isp: info.org || 'Naya Tel Pvt. Limited',
          timezone: info.timezone || 'Asia/Karachi',
          formatted: region ? `${city}, ${region}, ${country}` : `${city}, ${country}`,
        })
      }
    } catch {}

    // Default fallback based on detected environment
    return NextResponse.json({
      ip: targetIp || '154.192.21.105',
      city: 'Islamabad',
      region: 'Islamabad',
      country: 'Pakistan',
      countryCode: 'PK',
      latitude: 33.7215,
      longitude: 73.0433,
      isp: 'Naya Tel Pvt. Limited',
      timezone: 'Asia/Karachi',
      formatted: 'Islamabad, Islamabad, Pakistan',
    })
  } catch (err: any) {
    return NextResponse.json({
      ip: '154.192.21.105',
      city: 'Islamabad',
      region: 'Islamabad',
      country: 'Pakistan',
      countryCode: 'PK',
      latitude: 33.7215,
      longitude: 73.0433,
      isp: 'Naya Tel Pvt. Limited',
      timezone: 'Asia/Karachi',
      formatted: 'Islamabad, Islamabad, Pakistan',
    })
  }
}
