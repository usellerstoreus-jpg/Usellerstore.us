import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ActivityLogItem, getDeviceDetails } from '@/lib/activity-logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dwmcfrulcorbcfmhqxco.supabase.co'
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''

function getAdminClient() {
  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })
}

// In-memory fallback cache for fast responses
let inMemoryLogs: ActivityLogItem[] = []

export async function GET() {
  const client = getAdminClient()

  if (!client) {
    return NextResponse.json({ logs: inMemoryLogs, count: inMemoryLogs.length })
  }

  try {
    // 1. Fetch system activity notifications from Supabase
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('type', 'system')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ logs: inMemoryLogs, count: inMemoryLogs.length })
    }

    const dbLogs: ActivityLogItem[] = []

    for (const row of data || []) {
      if (!row.details) continue
      try {
        const parsed = JSON.parse(row.details)
        if (parsed && (parsed.action || parsed.location || parsed.device)) {
          dbLogs.push({
            id: row.id || `act-${Date.now()}`,
            action: parsed.action || 'user_signup',
            title: row.title || 'Platform Activity',
            description: row.description || '',
            user: parsed.user || {
              name: parsed.name || 'Merchant',
              email: parsed.email || '',
              role: parsed.role || 'seller',
              shopName: parsed.shopName,
            },
            location: parsed.location || {
              city: 'New York',
              country: 'United States',
              formatted: 'New York, United States',
            },
            device: parsed.device || {
              type: 'Desktop',
              browser: 'Chrome',
              os: 'Windows',
              formatted: 'Chrome on Windows',
              userAgent: '',
            },
            timestamp: parsed.timestamp || row.created_at || new Date().toISOString(),
            status: parsed.status || 'success',
            metadata: parsed.metadata,
          })
        }
      } catch {
        // Not a JSON details string, skip
      }
    }

    // Merge in-memory logs with db logs, deduplicating by ID
    const map = new Map<string, ActivityLogItem>()
    inMemoryLogs.forEach((l) => map.set(l.id, l))
    dbLogs.forEach((l) => map.set(l.id, l))

    const merged = Array.from(map.values())
    merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({ logs: merged, count: merged.length })
  } catch (err: any) {
    return NextResponse.json({ logs: inMemoryLogs, count: inMemoryLogs.length })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rawIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || ''

    const clientDevice = body.device?.browser ? body.device : getDeviceDetails(userAgent)
    const clientLocation = body.location?.city
      ? body.location
      : {
          ip: rawIp,
          city: 'New York',
          country: 'United States',
          countryCode: 'US',
          formatted: 'New York, United States',
        }

    const timestamp = body.timestamp || new Date().toISOString()
    const logItem: ActivityLogItem = {
      id: body.id || `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action: body.action || 'user_signup',
      title: body.title || 'User Sign Up',
      description: body.description || `${body.user?.name || 'User'} (${body.user?.email}) registered on the platform.`,
      user: {
        name: body.user?.name || 'Merchant',
        email: body.user?.email || '',
        role: body.user?.role || 'seller',
        shopName: body.user?.shopName || '',
        avatar: body.user?.avatar || (body.user?.name ? body.user.name.charAt(0).toUpperCase() : 'U'),
      },
      location: {
        ...clientLocation,
        ip: clientLocation.ip || rawIp,
      },
      device: clientDevice,
      timestamp,
      status: body.status || 'success',
      metadata: body.metadata || {},
    }

    // Keep in-memory copy
    inMemoryLogs = [logItem, ...inMemoryLogs.filter((l) => l.id !== logItem.id)].slice(0, 100)

    // Save to Supabase notifications table
    const client = getAdminClient()
    if (client) {
      try {
        await client.from('notifications').insert({
          id: logItem.id,
          title: logItem.title,
          description: logItem.description,
          date: new Date(timestamp)
            .toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
            .toUpperCase(),
          time_ago: 'Just now',
          ref_code: `#ACT-${logItem.id.slice(-6).toUpperCase()}`,
          type: 'system',
          read: false,
          details: JSON.stringify(logItem),
        })
      } catch (dbErr) {
        console.warn('[API /api/activity POST] DB insert warning:', dbErr)
      }
    }

    return NextResponse.json({ success: true, log: logItem }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to record activity' }, { status: 400 })
  }
}

export async function DELETE() {
  inMemoryLogs = []
  const client = getAdminClient()
  if (client) {
    try {
      await client
        .from('notifications')
        .delete()
        .like('id', 'act-%')
    } catch {}
  }
  return NextResponse.json({ success: true, message: 'Activity logs cleared' })
}
