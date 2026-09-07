'use client'

import React, { useState } from 'react'
import {
  Check,
  CheckCheck,
  Clock,
  ChevronRight,
  ShieldCheck,
  Bell,
  Trash2,
  X
} from 'lucide-react'
import { NotificationItem } from '@/lib/mock-data'

interface NotificationsViewProps {
  notifications: NotificationItem[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDeleteNotification: (id: string) => void
  onToast: (msg: string) => void
}

type TabType = 'all' | 'unread' | 'read'

export function NotificationsView({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onToast,
}: NotificationsViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null)

  const unreadCount = notifications.filter((n) => !n.read).length
  const readCount = notifications.filter((n) => n.read).length

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.read
    if (activeTab === 'read') return n.read
    return true
  })

  // Group notifications by date
  const groupedNotifications: { [date: string]: NotificationItem[] } = {}
  filteredNotifications.forEach((item) => {
    if (!groupedNotifications[item.date]) {
      groupedNotifications[item.date] = []
    }
    groupedNotifications[item.date].push(item)
  })

  const handleOpenDetail = (notif: NotificationItem) => {
    setSelectedNotif(notif)
    if (!notif.read) {
      onMarkAsRead(notif.id)
    }
  }

  return (
    <div className="notifications-view-container max-w-5xl mx-auto">
      {/* Top Tab Bar as shown in Screenshot 3 */}
      <div className="notifications-tabs-bar bg-white border border-slate-200 rounded-xl p-1 flex items-center justify-between mb-8 shadow-xs">
        <div className="flex items-center gap-1 w-full">
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-slate-100 text-slate-900 border border-slate-200 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('all')}
          >
            <span>All</span>
            <span className="font-bold">{notifications.length}</span>
          </button>

          <button
            type="button"
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'unread'
                ? 'bg-slate-100 text-slate-900 border border-slate-200 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('unread')}
          >
            <span>Unread</span>
            <span className="font-bold">{unreadCount}</span>
          </button>

          <button
            type="button"
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'read'
                ? 'bg-slate-100 text-slate-900 border border-slate-200 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            onClick={() => setActiveTab('read')}
          >
            <span>Read</span>
            <span className="font-bold">{readCount}</span>
          </button>
        </div>
      </div>

      {/* Notifications list grouped by date */}
      {filteredNotifications.length === 0 ? (
        <div className="empty-notif bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-3">
            <Bell size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No notifications here</h3>
          <p className="text-xs text-slate-500 mt-1">
            You are all caught up! New alerts and store updates will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(([date, items]) => (
            <div key={date} className="notif-date-group">
              {/* Date Header divider */}
              <div className="relative flex items-center justify-center my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative bg-[#f8fafc] px-4">
                  <span className="text-xs font-bold text-slate-600 tracking-wider uppercase">
                    {date}
                  </span>
                </div>
              </div>

              {/* Items in this date */}
              <div className="space-y-3">
                {items.map((notif) => (
                  <div
                    key={notif.id}
                    className="notif-card bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs rounded-2xl p-4 flex items-center justify-between gap-4 transition-all cursor-pointer"
                    onClick={() => handleOpenDetail(notif)}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Status Icon */}
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={20} strokeWidth={2.5} />
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900 mb-0.5">{notif.title}</h4>
                        <p className="text-xs text-slate-500 leading-normal">{notif.description}</p>

                        <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {notif.timeAgo}
                          </span>
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono text-[10px]">
                            {notif.refCode}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-slate-400 hover:text-slate-600 p-1">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notification Detail Modal */}
      {selectedNotif && (
        <div className="modal-backdrop fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="modal-content bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="font-bold text-base text-slate-900">{selectedNotif.title}</h3>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                onClick={() => setSelectedNotif(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-600">
              <p className="font-medium text-slate-800">{selectedNotif.description}</p>
              {selectedNotif.details && (
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-xs text-slate-600 leading-relaxed">
                  {selectedNotif.details}
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-100">
                <span>Timestamp: {selectedNotif.date} ({selectedNotif.timeAgo})</span>
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                  {selectedNotif.refCode}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl text-xs flex items-center gap-1"
                  onClick={() => {
                    onDeleteNotification(selectedNotif.id)
                    setSelectedNotif(null)
                    onToast('Notification deleted')
                  }}
                >
                  <Trash2 size={14} /> Delete
                </button>
                <button
                  type="button"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs"
                  onClick={() => setSelectedNotif(null)}
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
