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
  X,
  Trash2,
  Ban,
  AlertTriangle,
  RefreshCw,
  Check
} from 'lucide-react'
import { Order } from '@/lib/mock-data'

interface OrdersViewProps {
  orders: Order[]
  onCreateDemoOrder?: () => void
  onUpdateOrderStatus?: (orderId: string, newStatus: Order['status']) => void
  onDeleteOrder?: (orderId: string) => void
  onToast: (msg: string) => void
}

type FilterStatus = 'all' | 'unpaid' | 'paid' | 'pickup' | 'on_the_way' | 'out_for_delivery' | 'delivered' | 'cancelled'

const statusTabs: { id: FilterStatus; label: string; dotColor: string }[] = [
  { id: 'all', label: 'All Orders', dotColor: 'bg-slate-400' },
  { id: 'unpaid', label: 'Unpaid', dotColor: 'bg-amber-500' },
  { id: 'paid', label: 'Paid', dotColor: 'bg-blue-600' },
  { id: 'pickup', label: 'Pickup', dotColor: 'bg-orange-500' },
  { id: 'on_the_way', label: 'On the way', dotColor: 'bg-indigo-600' },
  { id: 'out_for_delivery', label: 'Out for delivery', dotColor: 'bg-cyan-500' },
  { id: 'delivered', label: 'Delivered', dotColor: 'bg-emerald-500' },
  { id: 'cancelled', label: 'Cancelled', dotColor: 'bg-rose-500' },
]

export function OrdersView({
  orders,
  onCreateDemoOrder,
  onUpdateOrderStatus,
  onDeleteOrder,
  onToast,
}: OrdersViewProps) {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [isPurgingCancelled, setIsPurgingCancelled] = useState(false)

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === 'all') return true
    return order.status === activeFilter
  })

  const cancelledOrdersCount = orders.filter((o) => o.status === 'cancelled').length

  const renderStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Paid
          </span>
        )
      case 'unpaid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Unpaid
          </span>
        )
      case 'pickup':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Pickup
          </span>
        )
      case 'on_the_way':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> On the way
          </span>
        )
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> Out for delivery
          </span>
        )
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Delivered
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Cancelled
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        )
    }
  }

  const handleConfirmCancel = () => {
    if (!orderToCancel) return
    onUpdateOrderStatus?.(orderToCancel.id, 'cancelled')
    if (selectedOrder?.id === orderToCancel.id) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: 'cancelled' } : null))
    }
    onToast(`Order ${orderToCancel.orderNumber} has been cancelled`)
    setOrderToCancel(null)
  }

  const handleConfirmDelete = () => {
    if (!orderToDelete) return
    onDeleteOrder?.(orderToDelete.id)
    if (selectedOrder?.id === orderToDelete.id) {
      setSelectedOrder(null)
    }
    onToast(`Order ${orderToDelete.orderNumber} has been deleted`)
    setOrderToDelete(null)
  }

  const handlePurgeAllCancelled = () => {
    const cancelled = orders.filter((o) => o.status === 'cancelled')
    if (cancelled.length === 0) return
    cancelled.forEach((o) => onDeleteOrder?.(o.id))
    onToast(`Purged ${cancelled.length} cancelled/false order(s)`)
    setIsPurgingCancelled(false)
  }

  return (
    <div className="orders-view-container">
      {/* Top Filter Status Pill Bar & Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="orders-filter-bar flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-2 px-2 sm:mx-0 sm:px-0 flex-1">
          {statusTabs.map((tab) => {
            const isActive = activeFilter === tab.id
            const count = tab.id === 'all' ? orders.length : orders.filter((o) => o.status === tab.id).length
            return (
              <button
                key={tab.id}
                type="button"
                className={`filter-pill flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
                }`}
                onClick={() => setActiveFilter(tab.id)}
              >
                <span className={`w-2 h-2 rounded-full ${tab.dotColor}`} />
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Quick Actions: Assign Sample Order & Purge Cancelled */}
        <div className="flex items-center gap-2 shrink-0">
          {cancelledOrdersCount > 0 && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all cursor-pointer"
              onClick={() => setIsPurgingCancelled(true)}
              title="Delete all cancelled / false orders at once"
            >
              <Trash2 size={13} />
              <span>Purge Cancelled ({cancelledOrdersCount})</span>
            </button>
          )}

          {onCreateDemoOrder && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
              onClick={() => {
                onCreateDemoOrder()
                onToast('Simulated order generated!')
              }}
            >
              <Plus size={14} />
              <span>Simulate Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {filteredOrders.length === 0 ? (
        <div className="empty-orders-panel bg-white border border-slate-200/90 rounded-2xl min-h-[440px] flex flex-col items-center justify-center p-6 sm:p-8 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#eef3f8] text-[#557291] flex items-center justify-center mb-5">
            <ClipboardList size={28} strokeWidth={1.8} />
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
            No orders under this filter
          </h2>
          <p className="text-sm text-slate-500 max-w-md leading-relaxed mb-6">
            {activeFilter === 'all'
              ? 'When orders are placed for your store products, they will appear here.'
              : `There are currently no orders with "${activeFilter.replace(/_/g, ' ')}" status.`}
          </p>

          {onCreateDemoOrder && activeFilter === 'all' && (
            <button
              type="button"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
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
          {filteredOrders.map((order) => {
            const isCancelled = order.status === 'cancelled'
            return (
              <div
                key={order.id}
                className={`order-card bg-white border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  isCancelled
                    ? 'border-rose-200 bg-rose-50/20'
                    : 'border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isCancelled ? 'bg-rose-100 text-rose-600' : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    <Package size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <strong className="text-sm font-bold text-slate-900">{order.orderNumber}</strong>
                      <span className="text-xs text-slate-400">• {order.date}</span>
                      {renderStatusBadge(order.status)}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Customer: <span className="font-semibold text-slate-800">{order.customerName}</span> ({order.customerEmail})
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {order.items.length} item(s): {order.items.map((it) => it.productTitle).join(', ').slice(0, 45)}...
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-400 block">Total</span>
                    <strong className="text-base font-bold text-slate-900">${order.totalAmount.toFixed(2)}</strong>
                    <span
                      className={`text-xs font-semibold block ${
                        isCancelled ? 'text-slate-400 line-through' : 'text-emerald-600'
                      }`}
                    >
                      {isCancelled ? 'Profit Voided' : `Profit +$${order.profit.toFixed(2)}`}
                    </span>
                  </div>

                  {/* Actions: View Details, Cancel Order, Delete False Order */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="p-2 text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                      title="View full order details & history"
                    >
                      <Eye size={16} />
                    </button>

                    {!isCancelled ? (
                      <button
                        type="button"
                        className="p-2 text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-colors cursor-pointer"
                        onClick={() => setOrderToCancel(order)}
                        title="Cancel this false or mistaken order"
                      >
                        <Ban size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="p-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                        onClick={() => {
                          onUpdateOrderStatus?.(order.id, 'paid')
                          onToast(`Order ${order.orderNumber} restored to Paid`)
                        }}
                        title="Restore order to active paid status"
                      >
                        <RefreshCw size={15} />
                      </button>
                    )}

                    <button
                      type="button"
                      className="p-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                      onClick={() => setOrderToDelete(order)}
                      title="Delete false order permanently"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 1. Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-backdrop fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="modal-content bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-slate-900">{selectedOrder.orderNumber}</h3>
                  {renderStatusBadge(selectedOrder.status)}
                </div>
                <span className="text-xs text-slate-500">Placed on {selectedOrder.date}</span>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                onClick={() => setSelectedOrder(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {/* Order Status Controller */}
              <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-600 block">Change Order Status:</span>
                  <span className="text-[11px] text-slate-400">Update progress or cancel if false order</span>
                </div>
                <select
                  value={selectedOrder.status}
                  className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  onChange={(e) => {
                    const newSt = e.target.value as Order['status']
                    onUpdateOrderStatus?.(selectedOrder.id, newSt)
                    setSelectedOrder((prev) => (prev ? { ...prev, status: newSt } : null))
                    onToast(`Status updated to ${newSt.replace(/_/g, ' ')}`)
                  }}
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="pickup">Pickup</option>
                  <option value="on_the_way">On the way</option>
                  <option value="out_for_delivery">Out for delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled (False Order)</option>
                </select>
              </div>

              {/* Customer Info */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Customer Details</span>
                <p className="font-bold text-slate-900">{selectedOrder.customerName}</p>
                <p className="text-xs text-slate-600">{selectedOrder.customerEmail}</p>
                <p className="text-xs text-slate-500 mt-1.5 flex items-start gap-1">
                  <Truck size={13} className="shrink-0 mt-0.5 text-slate-400" />
                  <span>{selectedOrder.shippingAddress}</span>
                </p>
              </div>

              {/* Order Items */}
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Order Line Items</span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white border border-slate-100 p-2.5 rounded-xl shadow-2xs">
                      <img src={item.image} alt={item.productTitle} className="w-12 h-12 object-cover rounded-lg shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{item.productTitle}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Quantity: <span className="font-semibold text-slate-700">{item.quantity}</span> × ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-900">${(item.quantity * item.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Totals */}
              <div className="border-t border-slate-100 pt-3 space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span>${selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-emerald-600">
                  <span>Merchant Margin / Profit</span>
                  <span>+${selectedOrder.profit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                  <span className="font-bold text-slate-800 text-sm">Total Paid</span>
                  <span className="text-lg font-black text-slate-900">${selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons: Cancel, Delete, Close */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                {selectedOrder.status !== 'cancelled' ? (
                  <button
                    type="button"
                    className="flex-1 py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    onClick={() => {
                      const cur = selectedOrder
                      setSelectedOrder(null)
                      setOrderToCancel(cur)
                    }}
                  >
                    <Ban size={14} />
                    <span>Cancel Order</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="flex-1 py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    onClick={() => {
                      onUpdateOrderStatus?.(selectedOrder.id, 'paid')
                      setSelectedOrder((prev) => (prev ? { ...prev, status: 'paid' } : null))
                      onToast(`Order ${selectedOrder.orderNumber} restored to Paid`)
                    }}
                  >
                    <RefreshCw size={14} />
                    <span>Restore Order</span>
                  </button>
                )}

                <button
                  type="button"
                  className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  onClick={() => {
                    const cur = selectedOrder
                    setSelectedOrder(null)
                    setOrderToDelete(cur)
                  }}
                  title="Permanently remove false order"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>

                <button
                  type="button"
                  className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  onClick={() => setSelectedOrder(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Cancel Order Confirmation Modal */}
      {orderToCancel && (
        <div className="modal-backdrop fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="modal-content bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">Cancel Order {orderToCancel.orderNumber}?</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-5">
              Are you sure you want to cancel this order? If this was a false or duplicate order, its status will be changed to <strong>Cancelled</strong> and any associated profit will be reversed.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                onClick={() => setOrderToCancel(null)}
              >
                No, Keep Active
              </button>
              <button
                type="button"
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                onClick={handleConfirmCancel}
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Delete Order Confirmation Modal */}
      {orderToDelete && (
        <div className="modal-backdrop fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="modal-content bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">Permanently Delete Order?</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-5">
              Are you sure you want to permanently delete false order <strong className="text-slate-800">{orderToDelete.orderNumber}</strong>?
              This action cannot be undone and will purge the record from the database.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                onClick={() => setOrderToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1"
                onClick={handleConfirmDelete}
              >
                <Trash2 size={13} />
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Purge All Cancelled Orders Confirmation Modal */}
      {isPurgingCancelled && (
        <div className="modal-backdrop fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="modal-content bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">Purge All Cancelled Orders?</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-5">
              This will permanently delete all <strong>{cancelledOrdersCount}</strong> cancelled/false orders from your store database.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                onClick={() => setIsPurgingCancelled(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                onClick={handlePurgeAllCancelled}
              >
                Purge All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
