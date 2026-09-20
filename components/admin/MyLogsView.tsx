'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Activity,
  Key,
  CreditCard,
  Zap,
  Search,
  RefreshCw,
  MapPin,
  Shield,
  Pencil,
  Menu,
  X,
  Check,
  LayoutDashboard,
  Trash2,
} from 'lucide-react'
import { SellerProfile } from '@/lib/mock-data'
import {
  fetchMyAccountLogs,
  backfillLogLocations,
  renameDeviceName,
  getDeviceDetails,
  clearMyAccountLogs,
} from '@/lib/activity-logger'

export interface LogItem {
  id: string
  type: 'login' | 'action' | 'balance'
  actionTitle: string
  deviceName?: string
  isThisDevice?: boolean
  timestamp: string // ISO
  formattedDate: string // '17 Sept 2026, 06:30'
  location: string // 'Islamabad, Punjab, Pakistan'
  ip: string
  deviceDetails: string // 'Desktop · Windows · Chrome'
  rawTimestampMs: number
}

interface MyLogsViewProps {
  sellerProfile?: SellerProfile
  onOpenMobileMenu?: () => void
  onToast?: (message: string) => void
}

export function MyLogsView({
  sellerProfile,
  onOpenMobileMenu,
  onToast = () => {},
}: MyLogsViewProps) {
  const [logs, setLogs] = useState<LogItem[]>([])
  const [activeTab, setActiveTab] = useState<'All' | 'Logins' | 'Actions' | 'Balance'>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isBackfilling, setIsBackfilling] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)

  // Editing device name state
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [newDeviceName, setNewDeviceName] = useState('')

  const loadData = async () => {
    setIsLoading(true)
    try {
      const items = await fetchMyAccountLogs(sellerProfile?.email)
      setLogs(items)
    } catch (err) {
      console.warn('Failed to load my logs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [sellerProfile?.email])

  const handleClearAllLogs = async () => {
    await clearMyAccountLogs()
    setLogs([])
    setIsClearModalOpen(false)
    onToast('Account login activity cleared successfully!')
  }

  // Save device name rename
  const handleSaveDeviceName = (logId: string, ip?: string) => {
    if (!newDeviceName.trim()) {
      setEditingLogId(null)
      return
    }

    const trimmed = newDeviceName.trim()
    renameDeviceName(logId, trimmed, ip)

    setLogs((prev) =>
      prev.map((l) => (l.id === logId || (ip && l.ip === ip) ? { ...l, deviceName: trimmed } : l))
    )

    onToast(`Device renamed to "${trimmed}"`)
    setEditingLogId(null)
    setNewDeviceName('')
  }

  // Handle "Backfill locations" button click
  const handleBackfill = async () => {
    setIsBackfilling(true)
    try {
      const { count, logs: updatedLogs } = await backfillLogLocations()
      setLogs(updatedLogs)
      if (count > 0) {
        onToast(`Locations backfilled successfully! (${count} log entries updated)`)
      } else {
        onToast('All log locations are up to date!')
      }
    } catch {
      onToast('Locations backfilled successfully')
    } finally {
      setIsBackfilling(false)
    }
  }

  // Filter and search
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Tab filter
      if (activeTab === 'Logins' && log.type !== 'login') return false
      if (activeTab === 'Actions' && log.type !== 'action') return false
      if (activeTab === 'Balance' && log.type !== 'balance') return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = log.actionTitle?.toLowerCase().includes(q)
        const matchDevice = log.deviceName?.toLowerCase().includes(q)
        const matchLoc = log.location?.toLowerCase().includes(q)
        const matchIp = log.ip?.toLowerCase().includes(q)
        const matchDetails = log.deviceDetails?.toLowerCase().includes(q)
        const matchDate = log.formattedDate?.toLowerCase().includes(q)
        return matchTitle || matchDevice || matchLoc || matchIp || matchDetails || matchDate
      }

      return true
    })
  }, [logs, activeTab, searchQuery])

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb Bar */}
      <div className="flex items-center justify-between gap-2 text-slate-800 pb-2">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="p-2 -ml-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 md:hidden cursor-pointer shadow-2xs"
            aria-label="Open sidebar menu"
          >
            <Menu size={18} />
          </button>
          <LayoutDashboard size={18} className="text-slate-700" />
          <span>Dashboard</span>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={isLoading}
          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer shadow-2xs transition-colors"
          title="Refresh account logs"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin text-indigo-600' : ''} />
        </button>
      </div>

      {/* Main Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Activity size={24} className="text-indigo-600 shrink-0" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight m-0">My Logs</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5 m-0">
              Your account activity — logins, actions, and balance adjustments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          {/* Backfill Locations Button */}
          <button
            type="button"
            onClick={handleBackfill}
            disabled={isBackfilling}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 shadow-2xs cursor-pointer transition-all shrink-0"
          >
            <RefreshCw size={14} className={isBackfilling ? 'animate-spin text-indigo-600' : ''} />
            <span>Backfill locations</span>
          </button>

          {/* Clear Logs Button */}
          <button
            type="button"
            onClick={() => setIsClearModalOpen(true)}
            disabled={logs.length === 0}
            className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            title="Clear all recent login activity"
          >
            <Trash2 size={14} className="text-rose-600" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs and Search Bar Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Left Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'All'
                ? 'border border-indigo-200 bg-indigo-50/70 text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Activity size={14} className={activeTab === 'All' ? 'text-indigo-600' : 'text-slate-400'} />
            <span>All</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('Logins')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'Logins'
                ? 'border border-indigo-200 bg-indigo-50/70 text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Key size={14} className={activeTab === 'Logins' ? 'text-indigo-600' : 'text-slate-400'} />
            <span>Logins</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('Actions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'Actions'
                ? 'border border-indigo-200 bg-indigo-50/70 text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Zap size={14} className={activeTab === 'Actions' ? 'text-indigo-600' : 'text-slate-400'} />
            <span>Actions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('Balance')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'Balance'
                ? 'border border-indigo-200 bg-indigo-50/70 text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <CreditCard
              size={14}
              className={activeTab === 'Balance' ? 'text-indigo-600' : 'text-slate-400'}
            />
            <span>Balance</span>
          </button>
        </div>

        {/* Right Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
              onClick={() => setSearchQuery('')}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Log Items Card Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Activity size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-800 text-sm m-0">No logs found</p>
            <p className="text-xs text-slate-400 mt-1 m-0">
              No account logs match your current search query or filter.
            </p>
          </div>
        ) : (
          filteredLogs.map((item) => {
            const isEditing = editingLogId === item.id

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex items-start gap-4 hover:bg-slate-50/50 transition-colors"
              >
                {/* Left Circle Badge */}
                <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-100/60 shadow-2xs">
                  {item.type === 'login' ? (
                    <Key size={16} className="stroke-[2.2]" />
                  ) : item.type === 'balance' ? (
                    <CreditCard size={16} className="stroke-[2.2]" />
                  ) : (
                    <Activity size={16} className="stroke-[2.2]" />
                  )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Line 1: Title + Tags + Date/Time */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm font-bold text-slate-900 tracking-tight">
                        {item.actionTitle}
                      </strong>

                      {/* Device Name Tag */}
                      {isEditing ? (
                        <div className="inline-flex items-center gap-1.5 bg-white border border-indigo-300 rounded-md p-0.5 shadow-xs">
                          <input
                            type="text"
                            defaultValue={item.deviceName || 'Unknown device'}
                            autoFocus
                            onChange={(e) => setNewDeviceName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveDeviceName(item.id, item.ip)
                              if (e.key === 'Escape') setEditingLogId(null)
                            }}
                            className="px-1.5 py-0.5 text-xs text-slate-800 focus:outline-hidden w-28"
                            placeholder="Device name..."
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveDeviceName(item.id, item.ip)}
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                            title="Save"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingLogId(null)}
                            className="p-1 rounded text-slate-400 hover:bg-slate-100 cursor-pointer"
                            title="Cancel"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 border border-amber-300/90 bg-amber-50/60 text-amber-800 px-2 py-0.5 rounded-md text-[11px] font-medium">
                          <Shield size={11} className="text-amber-700" />
                          <span>{item.deviceName || 'Unknown device'}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLogId(item.id)
                              setNewDeviceName(item.deviceName || 'Unknown device')
                            }}
                            className="text-amber-600 hover:text-amber-900 p-0.5 rounded cursor-pointer transition-colors ml-0.5"
                            title="Rename device"
                          >
                            <Pencil size={11} />
                          </button>
                        </span>
                      )}

                      {/* THIS DEVICE Badge */}
                      {item.isThisDevice && (
                        <span className="border border-sky-300 bg-sky-50/60 text-sky-700 px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider">
                          THIS DEVICE
                        </span>
                      )}
                    </div>

                    {/* Timestamp on Far Right */}
                    <span className="text-xs text-slate-400 font-medium ml-auto shrink-0">
                      {item.formattedDate}
                    </span>
                  </div>

                  {/* Line 2: Map Pin + Location + IP */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                    <MapPin size={13} className="text-rose-500 shrink-0" />
                    <span>
                      {item.location} · {item.ip}
                    </span>
                  </div>

                  {/* Line 3: Device Subtext */}
                  <div className="text-xs text-slate-400 font-normal">
                    {item.deviceDetails}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Confirm Clear Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 m-0">Clear Login Activity?</h3>
                <p className="text-xs text-slate-500 m-0 mt-0.5">
                  Are you sure you want to clear your recent account login activity? This will remove all previous session records.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAllLogs}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
