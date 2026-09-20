'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Activity,
  UserPlus,
  MapPin,
  Laptop,
  Smartphone,
  Tablet,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Download,
  ShieldCheck,
  Globe,
  Monitor,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  X,
  Copy,
  Check,
} from 'lucide-react'
import {
  ActivityLogItem,
  fetchActivityLogs,
  clearActivityLogs,
  formatTimeAgo,
  formatExactDateTime,
} from '@/lib/activity-logger'
import { SellerProfile, Product } from '@/lib/mock-data'
import { RecentActionsView } from './RecentActionsView'
import { MyLogsView } from './MyLogsView'

interface AdminActivityViewProps {
  sellers?: SellerProfile[]
  products?: Product[]
  activeTab?: string
  onOpenMobileMenu?: () => void
  onToast?: (message: string) => void
  onSwitchToSeller?: (seller?: SellerProfile) => void
}

export function AdminActivityView({
  sellers = [],
  products = [],
  activeTab = 'Recent Actions',
  onOpenMobileMenu,
  onToast = () => {},
  onSwitchToSeller,
}: AdminActivityViewProps) {
  if (activeTab === 'Recent Actions') {
    return (
      <RecentActionsView
        sellers={sellers}
        products={products}
        onOpenMobileMenu={onOpenMobileMenu}
        onToast={onToast}
        onSwitchToSeller={onSwitchToSeller}
      />
    )
  }

  if (activeTab === 'My Logs') {
    return (
      <MyLogsView
        sellerProfile={sellers[0]}
        onOpenMobileMenu={onOpenMobileMenu}
        onToast={onToast}
      />
    )
  }

  const [logs, setLogs] = useState<ActivityLogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState<'all' | 'user_signup' | 'admin_action'>('all')
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'Desktop' | 'Mobile' | 'Tablet'>('all')
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null)
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadLogs = async () => {
    setIsLoading(true)
    try {
      const items = await fetchActivityLogs(sellers)
      setLogs(items)
    } catch (err) {
      console.warn('Failed to load activity logs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()

    // Listen for real-time activity events
    const handleNewLog = (e: Event) => {
      const customEvent = e as CustomEvent<ActivityLogItem>
      if (customEvent.detail) {
        setLogs((prev) => [customEvent.detail, ...prev.filter((l) => l.id !== customEvent.detail.id)])
      }
    }

    window.addEventListener('u_activity_log_created', handleNewLog)
    return () => window.removeEventListener('u_activity_log_created', handleNewLog)
  }, [sellers])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text)
    setCopiedId(id)
    onToast('Copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Action filter
      if (actionFilter !== 'all' && log.action !== actionFilter) return false

      // Device filter
      if (deviceFilter !== 'all' && log.device?.type !== deviceFilter) return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = log.user?.name?.toLowerCase().includes(q)
        const matchEmail = log.user?.email?.toLowerCase().includes(q)
        const matchShop = log.user?.shopName?.toLowerCase().includes(q)
        const matchCity = log.location?.city?.toLowerCase().includes(q)
        const matchCountry = log.location?.country?.toLowerCase().includes(q)
        const matchIp = log.location?.ip?.toLowerCase().includes(q)
        const matchBrowser = log.device?.browser?.toLowerCase().includes(q)
        const matchOs = log.device?.os?.toLowerCase().includes(q)
        const matchTitle = log.title?.toLowerCase().includes(q)
        return (
          matchName ||
          matchEmail ||
          matchShop ||
          matchCity ||
          matchCountry ||
          matchIp ||
          matchBrowser ||
          matchOs ||
          matchTitle
        )
      }
      return true
    })
  }, [logs, actionFilter, deviceFilter, searchQuery])

  // Metric calculations
  const totalSignups = useMemo(() => {
    return logs.filter((l) => l.action === 'user_signup' || l.action === 'seller_signup').length
  }, [logs])

  const uniqueCountries = useMemo(() => {
    const set = new Set<string>()
    logs.forEach((l) => {
      if (l.location?.country) set.add(l.location.country)
    })
    return set.size
  }, [logs])

  const desktopRatio = useMemo(() => {
    if (logs.length === 0) return 100
    const desktops = logs.filter((l) => l.device?.type === 'Desktop').length
    return Math.round((desktops / logs.length) * 100)
  }, [logs])

  const handleClearLogs = async () => {
    await clearActivityLogs()
    setLogs([])
    setIsClearModalOpen(false)
    onToast('Activity logs cleared successfully')
  }

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `useller_activity_logs_${Date.now()}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    onToast('Activity logs exported to JSON')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center">
              <Activity size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 m-0">Platform Activity &amp; Audit Log</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Surveillance Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 m-0">
                Every user sign-up, merchant onboarding, and administrative change recorded with geographic location, device fingerprint, and exact timestamp.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            onClick={loadLogs}
            title="Refresh logs from database"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            onClick={handleExportJSON}
            title="Download log history"
          >
            <Download size={14} />
            <span>Export</span>
          </button>

          <button
            type="button"
            className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            onClick={() => setIsClearModalOpen(true)}
            title="Clear all stored logs"
          >
            <Trash2 size={14} />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* 4 Metric / KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">User Sign-Ups</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center">
              <UserPlus size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-slate-900">{totalSignups}</strong>
            <span className="text-xs text-emerald-600 font-bold">100% verified</span>
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Registered merchants &amp; users</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Geographic Reach</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 grid place-items-center">
              <Globe size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-slate-900">{uniqueCountries}</strong>
            <span className="text-xs text-blue-600 font-bold">Countries</span>
          </div>
          <span className="text-xs text-slate-400 mt-1 block">IP &amp; location fingerprints</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Device Split</span>
            <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 grid place-items-center">
              <Monitor size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-slate-900">{desktopRatio}%</strong>
            <span className="text-xs text-purple-600 font-bold">Desktop</span>
          </div>
          <span className="text-xs text-slate-400 mt-1 block">{100 - desktopRatio}% Mobile / Tablets</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Audit Security</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 grid place-items-center">
              <ShieldCheck size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-slate-900">{logs.length}</strong>
            <span className="text-xs text-amber-600 font-bold">Audit Events</span>
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Continuous security monitoring</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user, email, store, city, IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                actionFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setActionFilter('all')}
            >
              All Events ({logs.length})
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                actionFilter === 'user_signup'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setActionFilter('user_signup')}
            >
              <UserPlus size={13} />
              <span>User Sign-Ups ({totalSignups})</span>
            </button>
          </div>

          {/* Device Filter */}
          <select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white font-semibold cursor-pointer focus:outline-hidden"
          >
            <option value="all">All Devices</option>
            <option value="Desktop">Desktop Only</option>
            <option value="Mobile">Mobile Only</option>
            <option value="Tablet">Tablet Only</option>
          </select>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[850px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Event Type</th>
                <th className="py-3.5 px-4">User / Merchant</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Device &amp; Browser</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400">
                    <Activity size={36} className="mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-bold text-slate-700 text-sm m-0">No activity logs recorded yet</p>
                    <p className="text-xs text-slate-400 mt-1 m-0">
                      When a new user signs up or an action takes place, their location, device, and time will appear here in real-time.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isSignup = log.action === 'user_signup' || log.action === 'seller_signup'
                  const deviceIcon =
                    log.device?.type === 'Mobile' ? (
                      <Smartphone size={14} />
                    ) : log.device?.type === 'Tablet' ? (
                      <Tablet size={14} />
                    ) : (
                      <Laptop size={14} />
                    )

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Event Type */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-7 h-7 rounded-lg grid place-items-center shrink-0 ${
                              isSignup ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {isSignup ? <UserPlus size={14} /> : <Activity size={14} />}
                          </span>
                          <div>
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider inline-block ${
                                isSignup
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {isSignup ? 'User Sign Up' : 'Platform Action'}
                            </span>
                            <span className="text-slate-400 text-[10px] block mt-0.5">#{log.id.slice(-6)}</span>
                          </div>
                        </div>
                      </td>

                      {/* User / Merchant */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-start gap-2.5">
                          <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white grid place-items-center text-xs font-extrabold shrink-0 shadow-xs">
                            {log.user?.avatar || (log.user?.name ? log.user.name.charAt(0).toUpperCase() : 'U')}
                          </span>
                          <div>
                            <strong className="text-xs font-bold text-slate-900 block leading-tight">
                              {log.user?.name || 'New Merchant'}
                            </strong>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-slate-500 text-[11px]">{log.user?.email || '—'}</span>
                              {log.user?.email && (
                                <button
                                  type="button"
                                  className="text-slate-300 hover:text-slate-600 p-0.5 rounded"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    copyToClipboard(log.user.email, log.id + '-email')
                                  }}
                                  title="Copy email"
                                >
                                  {copiedId === log.id + '-email' ? (
                                    <Check size={11} className="text-emerald-600" />
                                  ) : (
                                    <Copy size={11} />
                                  )}
                                </button>
                              )}
                            </div>
                            {log.user?.shopName && (
                              <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-100">
                                Store: {log.user.shopName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-start gap-2">
                          <span className="p-1 rounded-md bg-rose-50 text-rose-600 shrink-0 mt-0.5">
                            <MapPin size={13} />
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <strong className="text-xs font-bold text-slate-900">
                                {log.location?.city || 'New York'}, {log.location?.country || 'United States'}
                              </strong>
                              {log.location?.countryCode && (
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[9px] font-mono font-bold">
                                  {log.location.countryCode}
                                </span>
                              )}
                            </div>
                            <span className="text-slate-400 text-[10px] font-mono block mt-0.5">
                              IP: {log.location?.ip || '127.0.0.1'}
                            </span>
                            {log.location?.timezone && (
                              <span className="text-slate-400 text-[10px] block">
                                TZ: {log.location.timezone}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Device & Browser */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-start gap-2">
                          <span className="p-1 rounded-md bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                            {deviceIcon}
                          </span>
                          <div>
                            <strong className="text-xs font-bold text-slate-900 block">
                              {log.device?.browser || 'Chrome'} on {log.device?.os || 'Windows'}
                            </strong>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                                {log.device?.type || 'Desktop'}
                              </span>
                              <span className="text-slate-400 text-[10px]">{log.device?.os || 'Windows 11'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-start gap-1.5">
                          <Clock size={13} className="text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-xs font-bold text-slate-900 block">
                              {log.timeAgo || formatTimeAgo(log.timestamp)}
                            </strong>
                            <span className="text-slate-400 text-[10px] block mt-0.5">
                              {formatExactDateTime(log.timestamp)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Inspect button */}
                      <td className="py-4 px-4 text-right align-middle">
                        <button
                          type="button"
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-[11px] cursor-pointer inline-flex items-center gap-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedLog(log)
                          }}
                        >
                          <span>Inspect</span>
                          <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 grid place-items-center font-bold">
                  <UserPlus size={20} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 m-0">Activity Inspector</h3>
                  <span className="text-xs text-slate-400 font-mono">Log ID: {selectedLog.id}</span>
                </div>
              </div>
              <button
                type="button"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                onClick={() => setSelectedLog(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto flex-1">
              {/* User Profile section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  User Account Information
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Full Name</span>
                    <strong className="text-slate-900 font-bold">{selectedLog.user?.name || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Email Address</span>
                    <strong className="text-slate-900 font-bold">{selectedLog.user?.email || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Shop Name</span>
                    <strong className="text-indigo-600 font-bold">{selectedLog.user?.shopName || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Role</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                      {selectedLog.user?.role || 'Seller'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Geographic Location &amp; Network
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">City &amp; Country</span>
                    <strong className="text-slate-900 font-bold">
                      {selectedLog.location?.city}, {selectedLog.location?.country}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">IP Address</span>
                    <span className="font-mono font-bold text-slate-900">{selectedLog.location?.ip || '127.0.0.1'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Country Code</span>
                    <span className="font-mono text-slate-700">{selectedLog.location?.countryCode || 'US'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Client Timezone</span>
                    <span className="text-slate-700">{selectedLog.location?.timezone || 'Local'}</span>
                  </div>
                </div>
              </div>

              {/* Device details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Device &amp; Operating System
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Browser</span>
                    <strong className="text-slate-900 font-bold">{selectedLog.device?.browser || 'Chrome'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Operating System</span>
                    <strong className="text-slate-900 font-bold">{selectedLog.device?.os || 'Windows'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Device Form Factor</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 text-[10px] font-bold">
                      {selectedLog.device?.type || 'Desktop'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Timestamp</span>
                    <span className="text-slate-700 font-medium">
                      {formatExactDateTime(selectedLog.timestamp)}
                    </span>
                  </div>
                </div>

                {selectedLog.device?.userAgent && (
                  <div className="mt-3 pt-3 border-t border-slate-200/60">
                    <span className="text-slate-400 block text-[10px] mb-1">User Agent Header</span>
                    <pre className="p-2 rounded-xl bg-slate-900 text-emerald-400 text-[10px] font-mono overflow-x-auto whitespace-pre-wrap break-all m-0">
                      {selectedLog.device.userAgent}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {onSwitchToSeller && selectedLog.user?.email && (
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors cursor-pointer"
                  onClick={() => {
                    const matched = sellers.find((s) => s.email === selectedLog.user.email)
                    if (matched) {
                      onSwitchToSeller(matched)
                      onToast(`Switched to seller ${matched.shopName}`)
                      setSelectedLog(null)
                    } else {
                      onToast('Seller account not active in database')
                    }
                  }}
                >
                  Log In As This Seller
                </button>
              )}
              <button
                type="button"
                className="ml-auto px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                onClick={() => setSelectedLog(null)}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Clear Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 grid place-items-center mx-auto mb-3">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 m-0">Clear Activity Logs?</h3>
            <p className="text-xs text-slate-500 mt-2 m-0">
              Are you sure you want to clear the activity log history? This will delete all cached event logs from the admin view.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                onClick={() => setIsClearModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold cursor-pointer"
                onClick={handleClearLogs}
              >
                Yes, Clear Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
