'use client'

import React from 'react'
import {
  Sparkles,
  Plus,
  ShoppingCart,
  ArrowUpRight,
  CircleDollarSign,
  TrendingUp,
  Eye,
  ClipboardList,
  Box,
  Package,
  CalendarDays
} from 'lucide-react'
import { Product, Order, SellerProfile } from '@/lib/mock-data'

interface DashboardViewProps {
  profile: SellerProfile
  products: Product[]
  orders: Order[]
  onNavigate: (tab: 'Dashboard' | 'Products' | 'Orders' | 'Notifications' | 'Profile') => void
  onOpenBalanceModal: () => void
  onToast: (msg: string) => void
}

export function DashboardView({
  profile,
  products,
  orders,
  onNavigate,
  onOpenBalanceModal,
  onToast,
}: DashboardViewProps) {
  // Category breakdown calculation
  const categoryCounts: { [cat: string]: number } = {}
  products.forEach((p) => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1
  })

  const totalProducts = products.length
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const dotColors = ['blue-dot', 'green-dot', 'purple-dot', 'orange-dot', 'pink-dot']

  return (
    <div className="dashboard-content-wrap space-y-6">
      {/* Prototype / Mode banner */}
      <div className="prototype-bar flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
        <span>SELLER VIEW</span>
        <button
          type="button"
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors"
          onClick={() => onToast('Seller control panel is fully active')}
        >
          <Sparkles size={14} /> Interactive Storefront Active
        </button>
      </div>

      {/* Welcome Hero Banner */}
      <section className="welcome-hero">
        <div className="welcome-person">
          <div className="avatar hero-avatar">
            {profile.avatarLetter}
            <span className="online-dot" />
          </div>
          <div>
            <span className="eyebrow">WELCOME BACK</span>
            <h1>{profile.shopName}</h1>
            <p>
              <span className="star">★</span> <b>{profile.rating.toFixed(1)}</b>
              <i /> {orders.length} orders all-time
            </p>
          </div>
        </div>

        <div className="hero-balances">
          <div className="cursor-pointer" onClick={onOpenBalanceModal} title="Click to view details">
            <span>▣ &nbsp; BALANCE</span>
            <strong>${profile.balance.toFixed(2)}</strong>
          </div>
          <div>
            <span>◈ &nbsp; GUARANTEE</span>
            <strong>${profile.guarantee.toFixed(2)}</strong>
          </div>
        </div>

        <div className="hero-actions">
          <button type="button" onClick={() => onNavigate('Products')}>
            <Plus size={17} /> Add product
          </button>
          <button type="button" onClick={() => onNavigate('Orders')}>
            <ShoppingCart size={17} /> View orders
          </button>
          <button type="button" onClick={onOpenBalanceModal}>
            <ArrowUpRight size={17} /> Withdraw
          </button>
        </div>
      </section>

      {/* Summary 3-Card Grid */}
      <div className="summary-grid">
        <div className="summary-card blue">
          <CircleDollarSign />
          <div>
            <span>TOTAL REVENUE</span>
            <strong>${profile.balance.toFixed(2)}</strong>
          </div>
        </div>
        <div className="summary-card green">
          <TrendingUp />
          <div>
            <span>TOTAL PROFIT</span>
            <strong>$0.00</strong>
          </div>
        </div>
        <div className="summary-card purple">
          <ShoppingCart />
          <div>
            <span>TOTAL ORDERS</span>
            <strong>{orders.length}</strong>
          </div>
        </div>
      </div>

      {/* 6-Metric Mini Cards */}
      <div className="metrics-grid">
        <div className="metric-card blue">
          <div className="metric-icon">
            <Eye size={19} />
          </div>
          <div>
            <strong>12</strong>
            <span>Total Views</span>
          </div>
        </div>

        <div className="metric-card green">
          <div className="metric-icon">
            <Eye size={19} />
          </div>
          <div>
            <strong>4</strong>
            <span>Today Views</span>
          </div>
        </div>

        <div className="metric-card orange">
          <div className="metric-icon">
            <ClipboardList size={19} />
          </div>
          <div>
            <strong>0</strong>
            <span>Pending</span>
          </div>
        </div>

        <div className="metric-card green">
          <div className="metric-icon">
            <Box size={19} />
          </div>
          <div>
            <strong>0</strong>
            <span>Delivered</span>
          </div>
        </div>

        <div className="metric-card gray">
          <div className="metric-icon">
            <Package size={19} />
          </div>
          <div>
            <strong>{totalProducts}</strong>
            <span>Products</span>
          </div>
        </div>

        <div className="metric-card peach">
          <div className="metric-icon">
            <CalendarDays size={19} />
          </div>
          <div>
            <strong>$0.00</strong>
            <span>This Month</span>
            <small>Profit $0.00</small>
          </div>
        </div>
      </div>

      {/* Lower 2 Panels: Sales Stats & Products by Category */}
      <div className="lower-grid">
        <section className="panel sales-panel">
          <div className="panel-title">
            <div>
              <span className="panel-icon">
                <TrendingUp size={17} />
              </span>
              <h2>Sales Stats</h2>
            </div>
            <b>↗ 0% margin</b>
          </div>
          <div className="stat-lines">
            <div>
              <span>Total Revenue</span>
              <b>${profile.balance.toFixed(2)}</b>
            </div>
            <div>
              <span>Total Cost</span>
              <b>$0.00</b>
            </div>
            <div>
              <span>Total Profit</span>
              <b className="green-text">$0.00</b>
            </div>
            <div>
              <span>This Month Revenue</span>
              <b>$0.00</b>
            </div>
          </div>
        </section>

        <section className="panel category-panel">
          <div className="panel-title">
            <div>
              <span className="panel-icon">
                <Box size={17} />
              </span>
              <h2>Products by Category</h2>
            </div>
            <b>{totalProducts} total</b>
          </div>
          <ul className="category-list">
            {topCategories.map(([catName, count], idx) => {
              const percent = Math.round((count / (totalProducts || 1)) * 100)
              const dotClass = dotColors[idx % dotColors.length]
              return (
                <li key={catName}>
                  <i className={`dot ${dotClass}`} />
                  <span>{catName}</span>
                  <b>
                    {count} <small>{percent}%</small>
                  </b>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}
