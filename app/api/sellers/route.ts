import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SellerProfile } from '@/lib/mock-data'

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

function parseSellerRow(row: any): SellerProfile {
  const payoutMethodsRaw = Array.isArray(row.payout_methods) ? row.payout_methods : []
  const adminSettings = payoutMethodsRaw.find((m: any) => m && m._type === '__admin_settings') || {}
  const kycSettings = payoutMethodsRaw.find((m: any) => m && m._type === '__kyc_submission') || null
  const cleanPayoutMethods = payoutMethodsRaw.filter((m: any) => !m || (m._type !== '__admin_settings' && m._type !== '__kyc_submission'))

  return {
    id: row.id,
    shopName: row.shop_name || 'Store',
    ownerName: row.owner_name || 'Owner',
    email: row.email || '',
    phone: row.phone || '+1 (555) 234-5678',
    currency: row.currency || 'USD ($)',
    balance: Number(row.balance || 0),
    guarantee: Number(row.guarantee || 0),
    rating: Number(row.rating || 5.0),
    totalOrders: Number(row.total_orders || 0),
    memberSince: row.member_since || 'Aug 2026',
    verified: Boolean(row.verified),
    active: Boolean(row.active),
    seoTitle: row.seo_title || `${row.shop_name} Official Store`,
    seoDescription: row.seo_description || '',
    avatarLetter: row.avatar_letter || row.shop_name?.charAt(0)?.toUpperCase() || 'S',
    payoutMethods: cleanPayoutMethods,
    kyc: kycSettings ? {
      status: kycSettings.status || (row.verified ? 'approved' : 'pending'),
      submittedAt: kycSettings.submittedAt || (row.created_at ? new Date(row.created_at).toLocaleString() : undefined),
      documentType: kycSettings.documentType || 'national_id',
      idCardUrl: kycSettings.idCardUrl || '',
      businessLicenseUrl: kycSettings.businessLicenseUrl || '',
      rejectionReason: kycSettings.rejectionReason,
      shopName: row.shop_name,
      ownerName: row.owner_name,
      email: row.email,
      phone: row.phone,
      joined: row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB') : undefined,
    } : (row.verified ? {
      status: 'approved',
      submittedAt: row.created_at ? new Date(row.created_at).toLocaleString() : '7 Aug 2026, 16:06',
      documentType: 'national_id',
      idCardUrl: '',
      businessLicenseUrl: '',
      shopName: row.shop_name,
      ownerName: row.owner_name,
      email: row.email,
      phone: row.phone,
      joined: row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB') : '07/08/2026',
    } : undefined),
    // Admin settings from jsonb
    isSuspended: adminSettings.isSuspended ?? false,
    withdrawalsBlocked: adminSettings.withdrawalsBlocked ?? false,
    allowProductRemoval: adminSettings.allowProductRemoval ?? true,
    productLimit: adminSettings.productLimit ?? 'unlimited',
    viewsBooster: adminSettings.viewsBooster ?? { enabled: false, multiplier: 1.0, extraDailyViews: 0 },
    password: adminSettings.password || '',
    reviewCount: adminSettings.reviewCount ?? 504,
    activeItemsCount: adminSettings.activeItemsCount ?? 504,
    lastActiveAgo: adminSettings.lastActiveAgo ?? 'Just now',
    joinedExact: adminSettings.joinedExact ?? (row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '7 Aug 2026'),
    isDeleted: adminSettings.isDeleted ?? false,
    deletedAt: adminSettings.deletedAt,
  }
}

// GET: List all sellers or query single seller
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const email = searchParams.get('email')

  const client = getAdminClient()
  if (!client) {
    return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 })
  }

  try {
    let query = client.from('seller_profiles').select('*').order('created_at', { ascending: false })

    if (id) {
      query = query.eq('id', id)
      const { data, error } = await query.maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      if (!data) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
      return NextResponse.json({ seller: parseSellerRow(data) })
    }

    if (email) {
      query = query.ilike('email', email.trim())
      const { data, error } = await query.maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      if (!data) return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
      return NextResponse.json({ seller: parseSellerRow(data) })
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const sellers = (data || []).map(parseSellerRow)
    return NextResponse.json({ sellers, count: sellers.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

// POST: Register / Onboard a new seller
export async function POST(request: Request) {
  const client = getAdminClient()
  if (!client) {
    return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const {
      shopName,
      ownerName,
      email,
      phone = '+1 (555) 234-5678',
      currency = 'USD ($)',
      balance = 0,
      guarantee = 0,
      rating = 5.0,
      password = '',
      memberSince,
      seoTitle,
      seoDescription,
      avatarLetter,
      id,
    } = body

    if (!shopName || !email) {
      return NextResponse.json({ error: 'shopName and email are required' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const effectiveId = id || `seller-${Date.now()}`
    const cleanShopName = shopName.trim()
    const cleanOwnerName = (ownerName || shopName).trim()

    const rawIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || ''

    const signupMetadata = body.signup_metadata || body.registrationMetadata || {
      device: {
        type: /mobile|iphone|android/i.test(userAgent) ? 'Mobile' : 'Desktop',
        browser: /Edg/i.test(userAgent) ? 'Edge' : /Firefox/i.test(userAgent) ? 'Firefox' : /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent) ? 'Safari' : 'Chrome',
        os: /Windows/i.test(userAgent) ? 'Windows 10/11' : /Macintosh|Mac OS/i.test(userAgent) ? 'macOS' : /Android/i.test(userAgent) ? 'Android' : /iPhone|iPad/i.test(userAgent) ? 'iOS' : 'Linux',
        userAgent,
        formatted: 'Web Browser',
      },
      location: {
        ip: rawIp,
        city: 'New York',
        country: 'United States',
        countryCode: 'US',
        formatted: 'New York, United States',
      },
      time: new Date().toISOString(),
    }

    const adminSettings = {
      _type: '__admin_settings',
      password: password || '',
      isSuspended: false,
      withdrawalsBlocked: false,
      allowProductRemoval: true,
      productLimit: 'unlimited',
      viewsBooster: { enabled: false, multiplier: 1.0, extraDailyViews: 0 },
      reviewCount: 504,
      activeItemsCount: 504,
      lastActiveAgo: 'Just now',
      joinedExact: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      signup_metadata: signupMetadata,
    }

    const payload = {
      id: effectiveId,
      shop_name: cleanShopName,
      owner_name: cleanOwnerName,
      email: cleanEmail,
      phone,
      currency,
      balance: Number(balance),
      guarantee: Number(guarantee),
      rating: Number(rating),
      total_orders: 0,
      member_since: memberSince || new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date()),
      verified: true,
      active: true,
      seo_title: seoTitle || `${cleanShopName} Official Store`,
      seo_description: seoDescription || `Shop top quality products from ${cleanShopName}.`,
      avatar_letter: avatarLetter || cleanShopName.charAt(0).toUpperCase() || 'S',
      payout_methods: [adminSettings],
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await client.from('seller_profiles').upsert(payload).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Insert user sign up activity & welcome notification
    try {
      await client.from('notifications').insert({
        id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: 'User Sign Up',
        description: `Store "${cleanShopName}" (${cleanEmail}) registered successfully.`,
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(),
        time_ago: 'Just now',
        ref_code: `#ACT-${effectiveId.slice(-6).toUpperCase()}`,
        type: 'system',
        read: false,
        details: JSON.stringify({
          action: 'user_signup',
          userId: effectiveId,
          user: {
            name: cleanOwnerName,
            email: cleanEmail,
            role: 'seller',
            shopName: cleanShopName,
            avatar: cleanShopName.charAt(0).toUpperCase() || 'S',
          },
          location: signupMetadata.location,
          device: signupMetadata.device,
          timestamp: signupMetadata.time || new Date().toISOString(),
          status: 'success',
        }),
      })
    } catch {}

    return NextResponse.json({ seller: parseSellerRow(data) }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

// PATCH: Update seller account attributes / settings / balances
export async function PATCH(request: Request) {
  const client = getAdminClient()
  if (!client) {
    return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { id, email, updates } = body

    if (!id && !email) {
      return NextResponse.json({ error: 'Either id or email is required to update a seller' }, { status: 400 })
    }

    // Fetch existing row to merge payout_methods & adminSettings
    let query = client.from('seller_profiles').select('*')
    if (id) {
      query = query.eq('id', id)
    } else {
      query = query.ilike('email', email.trim())
    }

    const { data: existing, error: fetchErr } = await query.maybeSingle()
    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 400 })
    }
    if (!existing) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    const existingPayouts = Array.isArray(existing.payout_methods) ? existing.payout_methods : []
    const existingAdminSettings = existingPayouts.find((m: any) => m && m._type === '__admin_settings') || {}
    const existingKycSettings = existingPayouts.find((m: any) => m && m._type === '__kyc_submission') || null
    const cleanPayouts = existingPayouts.filter((m: any) => !m || (m._type !== '__admin_settings' && m._type !== '__kyc_submission'))

    // Prepare updated admin settings
    const updatedAdminSettings = {
      ...existingAdminSettings,
      _type: '__admin_settings',
    }
    if (updates.isSuspended !== undefined) updatedAdminSettings.isSuspended = updates.isSuspended
    if (updates.withdrawalsBlocked !== undefined) updatedAdminSettings.withdrawalsBlocked = updates.withdrawalsBlocked
    if (updates.allowProductRemoval !== undefined) updatedAdminSettings.allowProductRemoval = updates.allowProductRemoval
    if (updates.productLimit !== undefined) updatedAdminSettings.productLimit = updates.productLimit
    if (updates.viewsBooster !== undefined) updatedAdminSettings.viewsBooster = updates.viewsBooster
    if (updates.password !== undefined) updatedAdminSettings.password = updates.password
    if (updates.reviewCount !== undefined) updatedAdminSettings.reviewCount = updates.reviewCount
    if (updates.activeItemsCount !== undefined) updatedAdminSettings.activeItemsCount = updates.activeItemsCount
    if (updates.isDeleted !== undefined) updatedAdminSettings.isDeleted = updates.isDeleted
    if (updates.deletedAt !== undefined) updatedAdminSettings.deletedAt = updates.deletedAt

    // Prepare updated kyc settings
    let updatedKycSettings = existingKycSettings
    if (updates.kyc !== undefined) {
      updatedKycSettings = {
        ...(existingKycSettings || {}),
        ...updates.kyc,
        _type: '__kyc_submission',
      }
    }

    const extraMetadata: any[] = [updatedAdminSettings]
    if (updatedKycSettings) extraMetadata.push(updatedKycSettings)

    const dbPayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
      payout_methods: [...cleanPayouts, ...extraMetadata],
    }

    if (updates.shopName !== undefined) dbPayload.shop_name = updates.shopName
    if (updates.ownerName !== undefined) dbPayload.owner_name = updates.ownerName
    if (updates.email !== undefined) dbPayload.email = updates.email
    if (updates.phone !== undefined) dbPayload.phone = updates.phone
    if (updates.currency !== undefined) dbPayload.currency = updates.currency
    if (updates.balance !== undefined) dbPayload.balance = Number(updates.balance)
    if (updates.guarantee !== undefined) dbPayload.guarantee = Number(updates.guarantee)
    if (updates.rating !== undefined) dbPayload.rating = Number(updates.rating)
    if (updates.totalOrders !== undefined) dbPayload.total_orders = Number(updates.totalOrders)
    if (updates.memberSince !== undefined) dbPayload.member_since = updates.memberSince
    if (updates.verified !== undefined) dbPayload.verified = Boolean(updates.verified)
    if (updates.active !== undefined) dbPayload.active = Boolean(updates.active)
    if (updates.seoTitle !== undefined) dbPayload.seo_title = updates.seoTitle
    if (updates.seoDescription !== undefined) dbPayload.seo_description = updates.seoDescription
    if (updates.avatarLetter !== undefined) dbPayload.avatar_letter = updates.avatarLetter
    if (updates.payoutMethods !== undefined && Array.isArray(updates.payoutMethods)) {
      dbPayload.payout_methods = [...updates.payoutMethods, ...extraMetadata]
    }

    const { data: updatedRow, error: updateErr } = await client
      .from('seller_profiles')
      .update(dbPayload)
      .eq('id', existing.id)
      .select()
      .single()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, seller: parseSellerRow(updatedRow) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

// DELETE: Delete seller profile from Supabase
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const email = searchParams.get('email')

  const client = getAdminClient()
  if (!client) {
    return NextResponse.json({ error: 'Supabase client not configured' }, { status: 500 })
  }

  try {
    let query = client.from('seller_profiles').delete()
    if (id) {
      query = query.eq('id', id)
    } else if (email) {
      query = query.ilike('email', email.trim())
    } else {
      return NextResponse.json({ error: 'id or email is required' }, { status: 400 })
    }

    const { error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Seller profile deleted from database' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
