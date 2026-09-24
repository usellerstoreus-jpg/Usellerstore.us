'use client'

import React from 'react'
import {
  LayoutDashboard,
  Box,
  CheckSquare,
  Bell,
  User,
  LogOut,
  X,
  Store,
} from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'

export interface SellerSidebarProps {
  activeTab: 'Dashboard' | 'Products' | 'Orders' | 'Notifications' | 'Profile' | 'Withdraw'
  onSelectTab: (tab: 'Dashboard' | 'Products' | 'Orders' | 'Notifications' | 'Profile' | 'Withdraw') => void
  onSignOutClick: () => void
  onBalanceClick: () => void
  onOpenStorefront?: () => void
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
  onOpenStorefront,
  unreadNotificationsCount,
  shopName,
  ownerName,
  balance,
  guarantee,
  isOpenOnMobile = false,
  onCloseMobile,
}: SellerSidebarProps) {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const navItems = [
    { id: 'Dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'Products' as const, label: 'Products', icon: Box },
    { id: 'Orders' as const, label: 'Orders', icon: CheckSquare },
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

      {/* Sidebar Matching Screenshot */}
      <aside
        className={`sidebar seller-sidebar ${
          isOpenOnMobile
            ? 'fixed inset-y-0 left-0 z-50 flex flex-col shadow-2xl translate-x-0 transition-transform duration-300 ease-in-out w-[260px] bg-white border-r border-slate-100'
            : 'hidden md:flex flex-col w-60 lg:w-64 bg-white border-r border-slate-100/90 min-h-screen shrink-0'
        }`}
        aria-label="Seller Account Navigation"
      >
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between">
          <div
            className="cursor-pointer flex items-center gap-3 min-w-0"
            onClick={() => handleSelect('Dashboard')}
          >
            <BrandLogo size="md" showText={false} />
            <div className="min-w-0">
              <span suppressHydrationWarning className="font-bold text-slate-900 text-sm block leading-tight truncate">
                {shopName}
              </span>
              <span suppressHydrationWarning className="text-xs text-slate-400 font-normal block leading-tight mt-0.5">
                {ownerName}
              </span>
            </div>
          </div>

          {/* Close button inside mobile drawer */}
          {isOpenOnMobile && (
            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0 cursor-pointer"
              onClick={onCloseMobile}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Blue Shop Balance Card Matching Screenshot */}
        <div className="px-3 pt-1 pb-3">
          <button
            type="button"
            className="w-full text-left bg-[#0E3D69] hover:bg-[#0B345A] transition-colors rounded-2xl p-4 text-white shadow-sm cursor-pointer"
            onClick={() => {
              onBalanceClick()
              if (onCloseMobile) onCloseMobile()
            }}
            title="Click to view shop balance & withdrawals"
          >
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-300">
              SHOP BALANCE
            </div>
            <strong suppressHydrationWarning className="text-2xl font-bold block tabular-nums text-white my-0.5">
              ${balance.toFixed(2)}
            </strong>
            <div className="text-xs text-slate-300 font-normal" suppressHydrationWarning>
              Guarantee: ${guarantee.toFixed(2)}
            </div>
          </button>
        </div>

        {/* Nav List Matching Screenshot */}
        <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-1" aria-label="Seller menu">
          {navItems.map(({ id, label, icon: Icon, badge }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                type="button"
                id={`seller-nav-${id.toLowerCase()}`}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#EEF2F6] text-slate-900 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
                onClick={() => handleSelect(id)}
              >
                <Icon
                  size={18}
                  className={`shrink-0 transition-colors ${
                    isActive ? 'text-slate-900' : 'text-slate-500'
                  }`}
                />
                <span className="truncate">{label}</span>
                {Boolean(isMounted && badge && badge > 0) && (
                  <span
                    suppressHydrationWarning
                    className="ml-auto bg-rose-500 text-white text-[11px] px-2 py-0.5 rounded-full font-bold tabular-nums shadow-xs"
                  >
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Visit Storefront Action */}
        {onOpenStorefront && (
          <div className="px-3 pt-2">
            <button
              type="button"
              id="seller-nav-storefront"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50/70 hover:bg-blue-100/70 transition-colors cursor-pointer"
              onClick={() => {
                if (onCloseMobile) onCloseMobile()
                onOpenStorefront()
              }}
            >
              <Store size={18} className="text-blue-600 shrink-0" />
              <span className="truncate">Visit Storefront</span>
            </button>
          </div>
        )}

        {/* Sign Out Button Matching Screenshot */}
        <div className="p-3 border-t border-slate-100 mt-auto">
          <button
            type="button"
            id="seller-sign-out-btn"
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
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
