'use client'

import React, { useState } from 'react'
import {
  Bell,
  X,
  CheckCheck,
  Tag,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  TrendingDown,
  Package,
  ShieldCheck,
  Truck,
  Trash2,
  ExternalLink,
  Percent,
} from 'lucide-react'
import { ExtendedNotificationItem } from '@/lib/notifications'
import { Product } from '@/lib/mock-data'

interface ShopNotificationsDrawerProps {
  isOpen: boolean
  onClose: () => void
  notifications: ExtendedNotificationItem[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDeleteNotification: (id: string) => void
  onSelectProduct?: (product: Product) => void
  allProducts?: Product[]
  onApplyPromoCode?: (code: string) => void
  onOpenOrderTracker?: () => void
  onToast?: (msg: string) => void
}

type TabType = 'all' | 'product' | 'store'

export function ShopNotificationsDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onSelectProduct,
  allProducts = [],
  onApplyPromoCode,
  onOpenOrderTracker,
  onToast,
}: ShopNotificationsDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all')

  if (!isOpen) return null

  const productNotifs = notifications.filter(
    (n) => n.category === 'product' || Boolean(n.productId) || (n.badgeText && ['Price Drop', 'New Arrival', 'Back in Stock', 'Hot Deal'].includes(n.badgeText))
  )
  const storeNotifs = notifications.filter(
    (n) => n.category === 'store' || Boolean(n.promoCode) || (n.badgeText && ['Store Promo', 'Free Shipping', 'Verified Store', 'Store Policy'].includes(n.badgeText))
  )

  const displayedNotifications = notifications.filter((notif) => {
    if (activeTab === 'product') {
      return notif.category === 'product' || Boolean(notif.productId) || (notif.badgeText && ['Price Drop', 'New Arrival', 'Back in Stock', 'Hot Deal'].includes(notif.badgeText))
    }
    if (activeTab === 'store') {
      return notif.category === 'store' || Boolean(notif.promoCode) || (notif.badgeText && ['Store Promo', 'Free Shipping', 'Verified Store', 'Store Policy'].includes(notif.badgeText))
    }
    return true
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleProductClick = (notif: ExtendedNotificationItem) => {
    onMarkAsRead(notif.id)
    if (notif.productId && onSelectProduct) {
      const found = allProducts.find(
        (p) =>
          p.id === notif.productId ||
          p.title.toLowerCase().includes((notif.title || '').toLowerCase().slice(0, 15))
      )
      if (found) {
        onSelectProduct(found)
        onClose()
        return
      }
    }
    if (onToast) {
      onToast(`Viewing ${notif.title}`)
    }
  }

  const handleApplyPromo = (code: string, notifId: string) => {
    onMarkAsRead(notifId)
    if (onApplyPromoCode) {
      onApplyPromoCode(code)
    } else if (onToast) {
      onToast(`Promo code ${code} copied to clipboard!`)
      try {
        navigator.clipboard.writeText(code)
      } catch {}
    }
  }

  const renderBadge = (notif: ExtendedNotificationItem) => {
    const text = notif.badgeText || (notif.category === 'product' ? 'Product Update' : 'Store Update')
    if (text === 'Price Drop' || text === 'Hot Deal') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
          <TrendingDown size={11} className="text-amber-600" />
          {text}
        </span>
      )
    }
    if (text === 'New Arrival') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          <Sparkles size={11} className="text-emerald-600" />
          {text}
        </span>
      )
    }
    if (text === 'Back in Stock') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
          <Package size={11} className="text-indigo-600" />
          {text}
        </span>
      )
    }
    if (text === 'Store Promo') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80">
          <Percent size={11} className="text-purple-600" />
          {text}
        </span>
      )
    }
    if (text === 'Free Shipping') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80">
          <Truck size={11} className="text-sky-600" />
          {text}
        </span>
      )
    }
    if (text === 'Verified Store') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
          <ShieldCheck size={11} className="text-blue-600" />
          {text}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        <Tag size={11} className="text-slate-500" />
        {text}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Dark Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center relative shadow-xs">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full ring-2 ring-white" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-base tracking-tight">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Product updates & store announcements
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck size={14} />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}
              <button
                type="button"
                id="close-notifications-drawer-btn"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Close notifications"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-5 pt-3 pb-2 bg-slate-50/70 border-b border-slate-100 flex items-center gap-1.5">
            <button
              type="button"
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
              onClick={() => setActiveTab('all')}
            >
              <span>All</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold">
                {notifications.length}
              </span>
            </button>

            <button
              type="button"
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'product'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
              onClick={() => setActiveTab('product')}
            >
              <Tag size={13} className="shrink-0" />
              <span>Products</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold">
                {productNotifs.length}
              </span>
            </button>

            <button
              type="button"
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'store'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
              onClick={() => setActiveTab('store')}
            >
              <Sparkles size={13} className="shrink-0" />
              <span>Store</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold">
                {storeNotifs.length}
              </span>
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
            {displayedNotifications.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                  <Bell size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">
                    No {activeTab !== 'all' ? `${activeTab} ` : ''}notifications
                  </h4>
                  <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed">
                    You are all caught up! We will notify you whenever new products arrive, prices drop, or store discounts launch.
                  </p>
                </div>
              </div>
            ) : (
              displayedNotifications.map((notif) => {
                const isProduct =
                  notif.category === 'product' ||
                  Boolean(notif.productId) ||
                  (notif.badgeText && ['Price Drop', 'New Arrival', 'Back in Stock', 'Hot Deal'].includes(notif.badgeText))

                return (
                  <div
                    key={notif.id}
                    className={`group relative p-3.5 rounded-2xl border transition-all ${
                      !notif.read
                        ? 'bg-blue-50/40 border-blue-200/90 shadow-xs hover:border-blue-300'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Left Icon or Product Thumbnail */}
                      {isProduct && notif.productImage ? (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/80 shadow-2xs">
                          <img
                            src={notif.productImage}
                            alt={notif.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isProduct
                              ? 'bg-amber-50 text-amber-600'
                              : notif.promoCode
                              ? 'bg-purple-50 text-purple-600'
                              : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          {isProduct ? (
                            <Tag size={18} />
                          ) : notif.promoCode ? (
                            <Percent size={18} />
                          ) : (
                            <Sparkles size={18} />
                          )}
                        </div>
                      )}

                      {/* Content Body */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {renderBadge(notif)}
                            {!notif.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            {notif.timeAgo || notif.date}
                          </span>
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                          {notif.title}
                        </h4>

                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {notif.description}
                        </p>

                        {/* Interactive Action Buttons */}
                        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100/80">
                          {isProduct ? (
                            <button
                              type="button"
                              onClick={() => handleProductClick(notif)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>View Product</span>
                              <ArrowRight size={13} />
                            </button>
                          ) : notif.promoCode ? (
                            <button
                              type="button"
                              onClick={() => handleApplyPromo(notif.promoCode!, notif.id)}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Tag size={13} />
                              <span>Apply Code: {notif.promoCode}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onMarkAsRead(notif.id)}
                              className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              {notif.read ? 'Read' : 'Mark as read'}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onDeleteNotification(notif.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors ml-auto cursor-pointer"
                            title="Dismiss notification"
                            aria-label="Dismiss notification"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Bottom Footer (Discreet Order Tracking Link) */}
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs">
            <div className="text-slate-500 text-[11px]">
              Looking to track an existing order?
            </div>
            {onOpenOrderTracker && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenOrderTracker()
                }}
                className="font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Track Order</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
