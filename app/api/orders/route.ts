import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Order, NotificationItem } from '@/lib/mock-data'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
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

// GET: Fetch all orders or search by orderNumber / id
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orderNumber = searchParams.get('orderNumber')
  const orderId = searchParams.get('id')
  const email = searchParams.get('email')

  const client = getAdminClient()
  if (!client) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    let query = client.from('orders').select('*').order('created_at', { ascending: false })

    if (orderNumber) {
      query = query.ilike('order_number', `%${orderNumber.trim()}%`)
    } else if (orderId) {
      query = query.eq('id', orderId)
    } else if (email) {
      query = query.ilike('customer_email', `%${email.trim()}%`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const mappedOrders: Order[] = (data || []).map((row: any) => ({
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

    return NextResponse.json({ orders: mappedOrders })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

// POST: Save new order into database and record related updates (stock, notification, seller balance)
export async function POST(request: Request) {
  const client = getAdminClient()
  if (!client) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const order: Order = body.order || body

    if (!order.id || !order.orderNumber) {
      return NextResponse.json({ error: 'Invalid order data provided' }, { status: 400 })
    }

    // 1. Insert order record into 'orders' table
    const { data: insertedOrder, error: orderError } = await client
      .from('orders')
      .insert({
        id: order.id,
        order_number: order.orderNumber,
        customer_name: order.customerName,
        customer_email: order.customerEmail || '',
        shipping_address: order.shippingAddress || '',
        items: order.items || [],
        total_amount: Number(order.totalAmount),
        profit: Number(order.profit),
        status: order.status || 'paid',
        date: order.date || new Date().toLocaleDateString('en-US'),
      })
      .select()
      .single()

    if (orderError) {
      console.error('[API /api/orders] Order insert failed:', orderError)
      return NextResponse.json({ error: orderError.message }, { status: 400 })
    }

    // 2. Decrement stock for each purchased item in 'products' table
    if (Array.isArray(order.items) && order.items.length > 0) {
      for (const item of order.items) {
        try {
          // Find matching product by title or id
          const { data: matchingProducts } = await client
            .from('products')
            .select('id, stock, status')
            .ilike('title', item.productTitle ? `%${item.productTitle.slice(0, 30)}%` : '')
            .limit(1)

          if (matchingProducts && matchingProducts.length > 0) {
            const prod = matchingProducts[0]
            const currentStock = Number(prod.stock) || 0
            const newStock = Math.max(0, currentStock - (Number(item.quantity) || 1))
            const newStatus = newStock === 0 ? 'out_of_stock' : prod.status

            await client
              .from('products')
              .update({
                stock: newStock,
                status: newStatus,
                updated_at: new Date().toISOString(),
              })
              .eq('id', prod.id)
          }
        } catch (stockErr) {
          console.warn('[API /api/orders] Error decrementing stock for item:', item.productTitle, stockErr)
        }
      }
    }

    // 3. Record new order notification in 'notifications' table
    try {
      const notifId = 'notif-' + Date.now()
      await client.from('notifications').insert({
        id: notifId,
        title: 'New Customer Order',
        description: `Order ${order.orderNumber} for $${Number(order.totalAmount).toFixed(2)} received from ${order.customerName}`,
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(),
        time_ago: 'Just now',
        ref_code: order.orderNumber,
        type: 'order',
        read: false,
        details: `Customer ${order.customerName} (${order.customerEmail}) purchased ${order.items?.length || 0} item(s) totaling $${Number(order.totalAmount).toFixed(2)}. Profit: $${Number(order.profit).toFixed(2)}. Delivery to: ${order.shippingAddress}.`,
      })
    } catch (notifErr) {
      console.warn('[API /api/orders] Error inserting notification:', notifErr)
    }

    // 4. Update seller balance and total_orders in 'seller_profiles' table
    try {
      const { data: profileData } = await client
        .from('seller_profiles')
        .select('id, balance, total_orders')
        .limit(1)
        .single()

      if (profileData) {
        const currentBalance = Number(profileData.balance) || 0
        const currentOrders = Number(profileData.total_orders) || 0
        const profitToAdd = Number(order.profit) || 0

        const newBalance = Number((currentBalance + profitToAdd).toFixed(2))
        const newTotalOrders = currentOrders + 1

        await client
          .from('seller_profiles')
          .update({
            balance: newBalance,
            total_orders: newTotalOrders,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profileData.id)
      }
    } catch (profErr) {
      console.warn('[API /api/orders] Error updating seller profile:', profErr)
    }

    const finalOrder: Order = {
      id: insertedOrder.id,
      orderNumber: insertedOrder.order_number,
      customerName: insertedOrder.customer_name,
      customerEmail: insertedOrder.customer_email || '',
      shippingAddress: insertedOrder.shipping_address || '',
      items: insertedOrder.items || [],
      totalAmount: Number(insertedOrder.total_amount),
      profit: Number(insertedOrder.profit),
      status: insertedOrder.status,
      date: insertedOrder.date,
    }

    return NextResponse.json({
      success: true,
      message: `Order ${order.orderNumber} successfully saved and recorded in database`,
      order: finalOrder,
    })
  } catch (err: any) {
    console.error('[API /api/orders] POST error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
