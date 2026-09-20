import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

export interface WithdrawalRecord {
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
  decidedTimestamp?: number
  decidedDate?: string
}

const DEFAULT_INITIAL_WITHDRAWAL: WithdrawalRecord = {
  id: 'wd-001',
  sellerId: 'tester-seller-1',
  shopName: 'tester',
  ownerName: 'Zain',
  email: 'zain55@gmail.com',
  avatar: 'T',
  status: 'approved',
  amount: 20.0,
  requestedDate: '17 Sept 2026',
  timestamp: 1789661546000,
  decidedTimestamp: 1789664777000,
  decidedDate: '17/09/2026, 22:26:17',
  destinationMethod: '',
  destinationDetails: '',
  notes: 'Standard merchant payout request',
}

// In-memory fallback
let inMemoryWithdrawals: WithdrawalRecord[] = [DEFAULT_INITIAL_WITHDRAWAL]

// GET: Fetch all withdrawals from Supabase notifications (type: 'payout')
export async function GET() {
  const client = getAdminClient()

  if (!client) {
    return NextResponse.json({ withdrawals: inMemoryWithdrawals, count: inMemoryWithdrawals.length })
  }

  try {
    // 1. Fetch payout notifications from Supabase
    const { data: notifRows, error: notifError } = await client
      .from('notifications')
      .select('*')
      .eq('type', 'payout')
      .order('created_at', { ascending: false })

    if (notifError) {
      console.warn('[API /api/withdrawals GET] Error querying notifications:', notifError.message)
      return NextResponse.json({ withdrawals: inMemoryWithdrawals, count: inMemoryWithdrawals.length })
    }

    // 2. Fetch current seller profiles to keep seller details in sync
    const { data: sellerRows } = await client.from('seller_profiles').select('*')
    const sellerMap = new Map<string, any>()
    if (sellerRows) {
      sellerRows.forEach((s) => {
        if (s.id) sellerMap.set(s.id.toLowerCase(), s)
        if (s.email) sellerMap.set(s.email.toLowerCase(), s)
      })
    }

    const dbWithdrawals: WithdrawalRecord[] = []

    for (const row of notifRows || []) {
      if (!row.details) continue
      try {
        const parsed = JSON.parse(row.details)
        if (parsed && parsed.id && parsed.amount !== undefined) {
          // Sync with seller profile if available
          const seller =
            (parsed.sellerId && sellerMap.get(parsed.sellerId.toLowerCase())) ||
            (parsed.email && sellerMap.get(parsed.email.toLowerCase()))

          const shopName = seller?.shop_name || parsed.shopName || 'Store'
          const ownerName = seller?.owner_name || parsed.ownerName || 'Owner'
          const avatar =
            seller?.avatar_letter || parsed.avatar || shopName.charAt(0).toUpperCase() || 'T'

          dbWithdrawals.push({
            ...parsed,
            id: row.id || parsed.id,
            shopName,
            ownerName,
            avatar,
            amount: Number(parsed.amount),
          })
        }
      } catch {
        // Skip unparseable details
      }
    }

    // 3. If database has no payout records yet, seed the initial record into Supabase
    if (dbWithdrawals.length === 0) {
      // Find Zain / tester seller from DB if present
      const zainSeller = Array.from(sellerMap.values()).find(
        (s) => s.email === 'zain55@gmail.com' || s.id === 'tester-seller-1'
      )

      const seededRecord: WithdrawalRecord = {
        ...DEFAULT_INITIAL_WITHDRAWAL,
        sellerId: zainSeller?.id || 'tester-seller-1',
        shopName: zainSeller?.shop_name || 'tester',
        ownerName: zainSeller?.owner_name || 'Zain',
        email: zainSeller?.email || 'zain55@gmail.com',
        avatar: (zainSeller?.shop_name?.[0] || 'T').toUpperCase(),
      }

      try {
        await client.from('notifications').insert({
          id: seededRecord.id,
          title: `Withdrawal Request: $${seededRecord.amount.toFixed(2)}`,
          description: `${seededRecord.shopName} (${seededRecord.ownerName}) requested $${seededRecord.amount.toFixed(2)} payout.`,
          date: seededRecord.requestedDate,
          time_ago: 'Just now',
          ref_code: '#WD-001',
          type: 'payout',
          read: false,
          details: JSON.stringify(seededRecord),
        })
      } catch (insertErr) {
        console.warn('[API /api/withdrawals GET] Seed insert warning:', insertErr)
      }

      dbWithdrawals.push(seededRecord)
    }

    // Sort by timestamp desc
    dbWithdrawals.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    inMemoryWithdrawals = dbWithdrawals

    return NextResponse.json({ withdrawals: dbWithdrawals, count: dbWithdrawals.length })
  } catch (err: any) {
    console.error('[API /api/withdrawals GET] Unexpected error:', err)
    return NextResponse.json({ withdrawals: inMemoryWithdrawals, count: inMemoryWithdrawals.length })
  }
}

// POST: Create a new withdrawal record in Supabase
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const client = getAdminClient()

    const now = new Date()
    const requestedDate =
      body.requestedDate ||
      now.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })

    const newRecord: WithdrawalRecord = {
      id: body.id || `wd-${Date.now()}`,
      sellerId: body.sellerId || '',
      shopName: body.shopName || 'Store',
      ownerName: body.ownerName || 'Merchant',
      email: body.email || '',
      avatar: body.avatar || (body.shopName ? body.shopName[0].toUpperCase() : 'T'),
      status: body.status || 'pending',
      amount: Number(body.amount) || 0,
      requestedDate,
      timestamp: body.timestamp || Date.now(),
      destinationMethod: body.destinationMethod || 'Direct Bank Settlement (ACH)',
      destinationDetails: body.destinationDetails || 'Registered Bank Account',
      notes: body.notes || '',
      processedDate: body.status === 'approved' ? requestedDate : undefined,
    }

    // In-memory update
    inMemoryWithdrawals = [newRecord, ...inMemoryWithdrawals.filter((w) => w.id !== newRecord.id)]

    if (client) {
      // 1. Insert payout notification record
      try {
        await client.from('notifications').upsert({
          id: newRecord.id,
          title: `Withdrawal Request: $${newRecord.amount.toFixed(2)}`,
          description: `${newRecord.shopName} (${newRecord.ownerName}) requested $${newRecord.amount.toFixed(2)} payout.`,
          date: requestedDate,
          time_ago: 'Just now',
          ref_code: `#WD-${newRecord.id.slice(-6).toUpperCase()}`,
          type: 'payout',
          read: false,
          details: JSON.stringify(newRecord),
        })
      } catch (insertErr) {
        console.warn('[API /api/withdrawals POST] Notification insert error:', insertErr)
      }

      // 2. If approved on creation, deduct balance
      if (newRecord.status === 'approved' && newRecord.email) {
        try {
          const { data: seller } = await client
            .from('seller_profiles')
            .select('id, balance')
            .eq('email', newRecord.email)
            .maybeSingle()

          if (seller) {
            const updatedBal = Number(Math.max(0, (seller.balance || 0) - newRecord.amount).toFixed(2))
            await client.from('seller_profiles').update({ balance: updatedBal }).eq('id', seller.id)
          }
        } catch {}
      }

      // 3. Log activity
      try {
        await client.from('notifications').insert({
          id: `act-${Date.now()}`,
          title: 'Withdrawal Requested',
          description: `${newRecord.shopName} (${newRecord.email}) submitted a payout request for $${newRecord.amount.toFixed(2)}.`,
          date: requestedDate,
          time_ago: 'Just now',
          ref_code: `#ACT-${newRecord.id.slice(-6).toUpperCase()}`,
          type: 'system',
          read: false,
          details: JSON.stringify({
            action: 'withdrawal_requested',
            category: 'withdrawals_requested',
            user: {
              name: newRecord.ownerName,
              email: newRecord.email,
              shopName: newRecord.shopName,
              role: 'seller',
            },
            amount: newRecord.amount,
            status: 'info',
          }),
        })
      } catch {}
    }

    return NextResponse.json({ success: true, withdrawal: newRecord })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create withdrawal' }, { status: 500 })
  }
}

// PATCH: Update withdrawal status (Approve or Reject)
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status, rejectionReason } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
    }

    const client = getAdminClient()
    const now = new Date()
    const processedDate = now.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    // Find in memory or from DB
    let current = inMemoryWithdrawals.find((w) => w.id === id)

    if (client) {
      const { data: notif } = await client.from('notifications').select('*').eq('id', id).maybeSingle()
      if (notif && notif.details) {
        try {
          current = JSON.parse(notif.details)
        } catch {}
      }
    }

    if (!current) {
      return NextResponse.json({ error: 'Withdrawal record not found' }, { status: 404 })
    }

    // Approved requests cannot be undone or edited
    if (current.status === 'approved' && status !== 'approved') {
      return NextResponse.json(
        { error: 'Approved withdrawal requests are immutable and cannot be undone or edited.' },
        { status: 400 }
      )
    }

    const previousStatus = current.status
    const updated: WithdrawalRecord = {
      ...current,
      status,
      processedDate,
      decidedTimestamp: body.decidedTimestamp || (status === 'approved' ? now.getTime() : current.decidedTimestamp),
      decidedDate: body.decidedDate || (status === 'approved' ? current.decidedDate || processedDate : current.decidedDate),
      rejectionReason: status === 'rejected' ? rejectionReason || 'Information does not match' : undefined,
    }

    inMemoryWithdrawals = inMemoryWithdrawals.map((w) => (w.id === id ? updated : w))

    if (client) {
      // 1. Update the notification row in Supabase
      try {
        await client
          .from('notifications')
          .update({
            title:
              status === 'approved'
                ? `Withdrawal Approved: $${updated.amount.toFixed(2)}`
                : `Withdrawal Rejected: $${updated.amount.toFixed(2)}`,
            description:
              status === 'approved'
                ? `${updated.shopName} payout of $${updated.amount.toFixed(2)} approved and settled.`
                : `${updated.shopName} payout of $${updated.amount.toFixed(2)} rejected. Reason: ${updated.rejectionReason}`,
            details: JSON.stringify(updated),
          })
          .eq('id', id)
      } catch (err) {
        console.warn('[API /api/withdrawals PATCH] Update notif error:', err)
      }

      // 2. Update seller balance if required
      if (updated.email) {
        try {
          const { data: seller } = await client
            .from('seller_profiles')
            .select('id, balance')
            .eq('email', updated.email)
            .maybeSingle()

          if (seller) {
            // If rejected from pending or approved, refund back to seller balance
            if (status === 'rejected' && previousStatus !== 'rejected') {
              const refundedBal = Number(((seller.balance || 0) + updated.amount).toFixed(2))
              await client.from('seller_profiles').update({ balance: refundedBal }).eq('id', seller.id)
            } else if (status === 'approved' && previousStatus !== 'approved') {
              // If not already deducted, ensure balance reflects payout
              const newBal = Number(Math.max(0, (seller.balance || 0) - updated.amount).toFixed(2))
              await client.from('seller_profiles').update({ balance: newBal }).eq('id', seller.id)
            }
          }
        } catch (balErr) {
          console.warn('[API /api/withdrawals PATCH] Balance sync error:', balErr)
        }
      }

      // 3. Dispatch seller payout notification
      try {
        await client.from('notifications').insert({
          id: `notif-wd-status-${Date.now()}`,
          title:
            status === 'approved'
              ? 'Payout Approved & Sent'
              : 'Payout Request Rejected',
          description:
            status === 'approved'
              ? `Your withdrawal of $${updated.amount.toFixed(2)} has been authorized and dispatched.`
              : `Your withdrawal of $${updated.amount.toFixed(2)} was rejected: ${updated.rejectionReason}`,
          date: processedDate,
          time_ago: 'Just now',
          ref_code: `#WD-${id.slice(-6).toUpperCase()}`,
          type: 'payout',
          read: false,
          details: JSON.stringify({
            withdrawalId: id,
            status,
            amount: updated.amount,
            processedDate,
            rejectionReason: updated.rejectionReason,
          }),
        })
      } catch {}

      // 4. Log admin activity
      try {
        await client.from('notifications').insert({
          id: `act-${Date.now()}`,
          title: status === 'approved' ? 'Withdrawal Approved' : 'Withdrawal Rejected',
          description: `Admin ${status} withdrawal of $${updated.amount.toFixed(2)} for ${updated.shopName}.`,
          date: processedDate,
          time_ago: 'Just now',
          ref_code: `#ACT-${id.slice(-6).toUpperCase()}`,
          type: 'system',
          read: false,
          details: JSON.stringify({
            action: status === 'approved' ? 'withdrawal_approved' : 'withdrawal_rejected',
            category: status === 'approved' ? 'withdrawals_approved' : 'withdrawals_rejected',
            user: {
              name: 'Admin Console',
              email: 'admin@usellerstore.com',
              role: 'admin',
              shopName: updated.shopName,
            },
            amount: updated.amount,
            status: status === 'approved' ? 'success' : 'warning',
          }),
        })
      } catch {}
    }

    return NextResponse.json({ success: true, withdrawal: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update withdrawal' }, { status: 500 })
  }
}

// DELETE: Delete a withdrawal record
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing withdrawal id' }, { status: 400 })
    }

    inMemoryWithdrawals = inMemoryWithdrawals.filter((w) => w.id !== id)

    const client = getAdminClient()
    if (client) {
      await client.from('notifications').delete().eq('id', id)
    }

    return NextResponse.json({ success: true, id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete' }, { status: 500 })
  }
}
