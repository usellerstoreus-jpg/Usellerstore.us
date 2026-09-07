'use client'

import React from 'react'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Bell,
  User,
  LogOut,
  ShoppingCart
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
}: SellerSidebarProps) {
  const navItems = [
    { id: 'Dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'Products' as const, label: 'Products', icon: Package },
    { id: 'Orders' as const, label: 'Orders', icon: ShoppingBag },
    { id: 'Notifications' as const, label: 'Notifications', icon: Bell, badge: unreadNotificationsCount },
    { id: 'Profile' as const, label: 'Profile', icon: User },
  ]

  return (
    <aside className="sidebar seller-sidebar" aria-label="Seller Account Navigation">
      {/* Brand Header */}
      <div className="brand cursor-pointer" onClick={() => onSelectTab('Dashboard')}>
        <div className="brand-mark">
          <ShoppingCart size={22} strokeWidth={2.4} />
        </div>
        <div className="brand-info">
          <strong>{shopName}</strong>
          <span>{ownerName}</span>
        </div>
      </div>

      {/* Balance Card */}
      <button
        type="button"
        className="balance-card-btn text-left w-auto"
        onClick={onBalanceClick}
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
      <nav className="side-nav" aria-label="Seller menu">
        {navItems.map(({ id, label, icon: Icon, badge }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              type="button"
              id={`seller-nav-${id.toLowerCase()}`}
              className={`nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(id)}
            >
              <Icon size={19} className="nav-icon" />
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
        className="sign-out"
        onClick={onSignOutClick}
      >
        <LogOut size={18} />
        <span>Sign out</span>
      </button>
    </aside>
  )
}
