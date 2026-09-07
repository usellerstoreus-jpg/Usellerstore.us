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
  ShieldCheck
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
            ? 'fixed inset-y-0 left-0 z-50 flex shadow-2xl translate-x-0 transition-transform duration-300 ease-in-out w-[280px] bg-white'
            : 'hidden md:flex'
        }`}
        aria-label="Seller Account Navigation"
      >
        {/* Brand Header */}
        <div className="brand flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
            onClick={() => handleSelect('Dashboard')}
          >
            <div className="brand-mark shrink-0">
              <ShoppingCart size={22} strokeWidth={2.4} />
            </div>
            <div className="brand-info truncate">
              <strong className="truncate">{shopName}</strong>
              <span className="truncate">{ownerName}</span>
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

        {/* Balance Card */}
        <button
          type="button"
          className="balance-card-btn text-left w-auto"
          onClick={() => {
            onBalanceClick()
            if (onCloseMobile) onCloseMobile()
          }}
          title="Click to view shop balance & withdrawals"
        >
          <div className="balance-card">
            <div className="flex justify-between items-center">
              <span>SHOP BALANCE</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white font-medium">USD</span>
            </div>
            <strong>${balance.toFixed(2)}</strong>
            <small>Guarantee: ${guarantee.toFixed(2)}</small>
          </div>
        </button>

        {/* Nav List */}
        <nav className="side-nav flex-1 overflow-y-auto" aria-label="Seller menu">
          {navItems.map(({ id, label, icon: Icon, badge }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                type="button"
                id={`seller-nav-${id.toLowerCase()}`}
                className={`nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleSelect(id)}
              >
                <Icon size={19} className="nav-icon shrink-0" />
                <span className="nav-label">{label}</span>
                {Boolean(badge && badge > 0) && (
                  <span className="nav-badge ml-auto bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Sign Out Button */}
        <button
          type="button"
          id="seller-sign-out-btn"
          className="sign-out mt-auto"
          onClick={() => {
            if (onCloseMobile) onCloseMobile()
            onSignOutClick()
          }}
        >
          <LogOut size={18} />
          <span>Sign out</span>
        </button>
      </aside>
    </>
  )
}
