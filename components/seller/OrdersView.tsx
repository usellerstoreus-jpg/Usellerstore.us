'use client'

import React, { useState } from 'react'
import {
  ClipboardList,
  Plus,
  Package,
  CheckCircle,
  Truck,
  Eye,
  Clock,
  X
} from 'lucide-react'
import { Order } from '@/lib/mock-data'

interface OrdersViewProps {
  orders: Order[]
  onCreateDemoOrder?: () => void
  onUpdateOrderStatus?: (orderId: string, newStatus: Order['status']) => void
  onToast: (msg: string) => void
}

type FilterStatus = 'all' | 'unpaid' | 'paid' | 'pickup' | 'on_the_way' | 'out_for_delivery' | 'delivered' | 'cancelled'

const statusTabs: { id: FilterStatus; label: string; dotColor: string }[] = [
  { id: 'all', label: 'All', dotColor: 'bg-slate-400' },
  { id: 'unpaid', label: 'Unpaid', dotColor: 'bg-red-500' },
  { id: 'paid', label: 'Paid', dotColor: 'bg-blue-600' },
  { id: 'pickup', label: 'Pickup', dotColor: 'bg-amber-500' },
  { id: 'on_the_way', label: 'On the way', dotColor: 'bg-indigo-600' },
  { id: 'out_for_delivery', label: 'Out for delivery', dotColor: 'bg-cyan-500' },
  { id: 'delivered', label: 'Delivered', dotColor: 'bg-emerald-500' },
  { id: 'cancelled', label: 'Cancelled', dotColor: 'bg-slate-500' },
]

export function OrdersView({
  orders,
  onCreateDemoOrder,
  onUpdateOrderStatus,
  onToast,
}: OrdersViewProps) {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === 'all') return true
    return order.status === activeFilter
  })

  return (
    <div className="orders-view-container">
      {/* Top Filter Status Pill Bar */}
      <div className="orders-filter-bar flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
        {statusTabs.map((tab) => {
          const isActive = activeFilter === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              className={`filter-pill flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-200 text-slate-800 shadow-xs ring-1 ring-slate-300'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
              }`}
              onClick={() => setActiveFilter(tab.id)}
            >
              <span className={`w-2 h-2 rounded-full ${tab.dotColor}`} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Main Content Area */}
      {filteredOrders.length === 0 ? (
        <div className="empty-orders-panel bg-white border border-slate-200/90 rounded-2xl min-h-[440px] flex flex-col items-center justify-center p-8 text-center shadow-xs">
          {/* Clipboard Icon */}
          <div className="w-14 h-14 rounded-2xl bg-[#eef3f8] text-[#557291] flex items-center justify-center mb-5">
            <ClipboardList size={28} strokeWidth={1.8} />
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
            No orders here yet
          </h2>
          <p className="text-sm text-slate-500 max-w-md leading-relaxed mb-6">
            When your admin assigns an order to your shop it will appear in this list.
          </p>

          {onCreateDemoOrder && (
            <button
              type="button"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-all"
              onClick={() => {
                onCreateDemoOrder()
                onToast('Simulated order assigned to your store!')
              }}
            >
              <Plus size={15} />
              <span>Assign Sample Order (Demo)</span>
            </button>
          )}
        </div>
      ) : (
        <div className="orders-list space-y-3.5">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="order-card bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Package size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-bold text-slate-900">{order.orderNumber}</strong>
                    <span className="text-xs text-slate-500">• {order.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">Customer: {order.customerName}</p>
                  <p className="text-xs text-slate-400">{order.items.length} item(s)</p>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-5">
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total</span>
                  <strong className="text-base font-bold text-slate-900">${order.totalAmount.toFixed(2)}</strong>
                  <span className="text-xs font-semibold text-emerald-600 block">Profit +${order.profit.toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-2 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-200"
                    onClick={() => setSelectedOrder(order)}
                    title="View Order Details"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-backdrop fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{selectedOrder.orderNumber}</h3>
                <span className="text-xs text-slate-500">Order Details</span>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                onClick={() => setSelectedOrder(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-xs font-bold text-slate-500 block mb-1">Customer Info</span>
                <p className="font-semibold text-slate-800">{selectedOrder.customerName}</p>
                <p className="text-xs text-slate-500">{selectedOrder.customerEmail}</p>
                <p className="text-xs text-slate-500 mt-1">{selectedOrder.shippingAddress}</p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-500 block mb-2">Order Items</span>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white border border-slate-100 p-2 rounded-lg">
                      <img src={item.image} alt={item.productTitle} className="w-10 h-10 object-cover rounded-lg" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{item.productTitle}</p>
                        <p className="text-xs text-slate-500">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                <span className="font-bold text-slate-700">Total Order Amount</span>
                <span className="text-lg font-extrabold text-slate-900">${selectedOrder.totalAmount.toFixed(2)}</span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm"
                  onClick={() => {
                    setSelectedOrder(null)
                    onToast('Order status acknowledged')
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
