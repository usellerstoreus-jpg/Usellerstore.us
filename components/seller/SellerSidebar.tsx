'use client'

import React from 'react'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Bell,
  User,
  LogOut,
  ShoppingCart,
  X,
  ShieldCheck,
  CreditCard,
  ExternalLink
} from 'lucide-react'

export interface SellerSidebarProps {
  activeTab: 'Dashboard' | 'Products' | 'Orders' | 'Notifications' | 'Profile'
  onSelectTab: (tab: 'Dashboard' | 'Products' | 'Orders' | 'Notifications' | 'Profile') => void
  onSignOutClick: () => void
  onBalanceClick: () => void
  unreadNotificationsCount: number
  shopName: string
  ownerName: string
  balance: number
  guarantee: number
  isOpenOnMobile?: boolean
  onCloseMobile?: () => void
}

export function SellerSidebar({
  activeTab,
  onSelectTab,
  onSignOutClick,
  onBalanceClick,
  unreadNotificationsCount,
  shopName,
  ownerName,
  balance,
  guarantee,
  isOpenOnMobile = false,
  onCloseMobile,
}: SellerSidebarProps) {
  const navItems = [
    { id: 'Dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'Products' as const, label: 'Products', icon: Package },
    { id: 'Orders' as const, label: 'Orders', icon: ShoppingBag },
    { id: 'Notifications' as const, label: 'Notifications', icon: Bell, badge: unreadNotificationsCount },
    { id: 'Profile' as const, label: 'Profile', icon: User },
  ]

  const handleSelect = (id: typeof activeTab) => {
    onSelectTab(id)
    if (onCloseMobile) onCloseMobile()
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenOnMobile && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar / Mobile Slide-Over Drawer */}
      <aside
        className={`sidebar seller-sidebar ${
          isOpenOnMobile
            ? 'fixed inset-y-0 left-0 z-50 flex shadow-2xl translate-x-0 transition-transform duration-300 ease-in-out w-[280px] bg-white border-r border-slate-200'
            : 'hidden md:flex'
        }`}
        aria-label="Seller Account Navigation"
      >
        {/* Brand Header */}
        <div className="brand flex items-center justify-between p-4 border-b border-slate-100">
          <div
            className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 group"
            onClick={() => handleSelect('Dashboard')}
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0B192C] to-[#0F52BA] text-white flex items-center justify-center shadow-md ring-1 ring-black/10 shrink-0 transition-transform group-hover:scale-105">
              <ShoppingCart size={20} strokeWidth={2.4} />
            </div>
            <div className="brand-info truncate min-w-0">
              <strong className="truncate block font-bold text-slate-900 text-sm">{shopName}</strong>
              <span className="truncate block text-xs text-slate-500 font-medium">{ownerName || 'Merchant'}</span>
            </div>
          </div>

          {/* Close button inside mobile drawer */}
          {isOpenOnMobile && (
            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0"
              onClick={onCloseMobile}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Balance Card matching usellerstore.com */}
        <button
          type="button"
          className="balance-card-btn text-left w-auto m-3"
          onClick={() => {
            onBalanceClick()
            if (onCloseMobile) onCloseMobile()
          }}
          title="Click to view shop balance & withdrawals"
        >
          <div className="balance-card rounded-2xl p-4 text-white shadow-md transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-200">SHOP BALANCE</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white font-semibold">USD</span>
            </div>
            <strong className="text-2xl font-black block tabular-nums text-white">${balance.toFixed(2)}</strong>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/15 text-[11px] text-cyan-100">
              <span>Guarantee: ${guarantee.toFixed(2)}</span>
              <span className="text-white/80 underline font-semibold">Manage →</span>
            </div>
          </div>
        </button>

        {/* Nav List */}
        <nav className="side-nav flex-1 overflow-y-auto px-2 py-2 space-y-1" aria-label="Seller menu">
          {navItems.map(({ id, label, icon: Icon, badge }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                type="button"
                id={`seller-nav-${id.toLowerCase()}`}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                onClick={() => handleSelect(id)}
              >
                <Icon
                  size={19}
                  className={`shrink-0 transition-colors ${
                    isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span className="truncate">{label}</span>
                {Boolean(badge && badge > 0) && (
                  <span className="ml-auto bg-rose-500 text-white text-[11px] px-2 py-0.5 rounded-full font-bold tabular-nums shadow-xs">
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Sign Out Button */}
        <div className="p-3 border-t border-slate-100 mt-auto">
          <button
            type="button"
            id="seller-sign-out-btn"
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            onClick={() => {
              if (onCloseMobile) onCloseMobile()
              onSignOutClick()
            }}
          >
            <LogOut size={18} className="text-rose-500" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
