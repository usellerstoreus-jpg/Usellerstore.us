'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  MessageCircle,
  X,
  Send,
  Headphones,
  Bot,
  User,
  Sparkles,
  Check,
  Trash2,
} from 'lucide-react'
import { SellerProfile } from '@/lib/mock-data'
import {
  SupportMessage,
  getConversationMessages,
  sendSupportMessage,
  getSellerUnreadCount,
  markMessagesAsReadBySeller,
  deleteSupportMessage,
  clearConversationMessages,
} from '@/lib/support-chat'

export function SupportChatModal({
  sellerProfile,
  onToast,
}: {
  sellerProfile?: SellerProfile
  onToast: (msg: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotificationBanner, setShowNotificationBanner] = useState(false)
  const [latestAdminMsg, setLatestAdminMsg] = useState<SupportMessage | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Determine active seller email
  const activeEmail = (() => {
    if (sellerProfile?.email) return sellerProfile.email
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('u_seller_active_profile')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed?.email) return parsed.email
        }
      } catch {}
    }
    return ''
  })()

  // Load messages and listen for admin replies
  const loadMessages = () => {
    const list = getConversationMessages(activeEmail)
    setMessages(list)
    const count = getSellerUnreadCount(activeEmail)
    setUnreadCount(count)
    if (count > 0) {
      const lastAdmin = [...list].reverse().find((m) => m.sender === 'admin' && !m.read)
      if (lastAdmin) {
        setLatestAdminMsg(lastAdmin)
        setShowNotificationBanner(true)
      }
    } else {
      setShowNotificationBanner(false)
    }
  }

  useEffect(() => {
    loadMessages()

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent
      if (!customEvent.detail?.sellerEmail || customEvent.detail.sellerEmail.toLowerCase() === activeEmail.toLowerCase()) {
        loadMessages()
      }
    }

    window.addEventListener('u_support_chat_update', handleUpdate)
    window.addEventListener('storage', loadMessages)

    return () => {
      window.removeEventListener('u_support_chat_update', handleUpdate)
      window.removeEventListener('storage', loadMessages)
    }
  }, [activeEmail])

  useEffect(() => {
    if (isOpen) {
      markMessagesAsReadBySeller(activeEmail)
      setUnreadCount(0)
      setShowNotificationBanner(false)
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [isOpen, activeEmail, messages.length])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userText = input.trim()
    setInput('')

    try {
      sendSupportMessage(activeEmail, 'seller', userText)
      loadMessages()
      onToast('Message sent to Administrator Support')
    } catch (err: any) {
      onToast(err.message || 'Failed to send message')
    }
  }

  const handleDeleteMessage = (messageId: string) => {
    if (!activeEmail) return
    const success = deleteSupportMessage(activeEmail, messageId)
    if (success) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      loadMessages()
      onToast('Message deleted completely')
    }
  }

  const handleClearAll = () => {
    if (!activeEmail) return
    clearConversationMessages(activeEmail)
    setMessages([])
    setShowClearConfirm(false)
    loadMessages()
    onToast('All support messages deleted completely')
  }

  return (
    <>
      {/* Floating Chat Button & Live Notification Banner */}
      <div className="fixed bottom-18 md:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end pointer-events-none">
        {/* Floating Notification Popover when new message arrives & chat is closed */}
        {!isOpen && showNotificationBanner && latestAdminMsg && (
          <div className="mb-3 max-w-[280px] sm:max-w-xs bg-slate-900/95 backdrop-blur-md text-white text-xs p-3 rounded-2xl shadow-2xl border border-slate-700/80 animate-in fade-in slide-in-from-bottom-2 flex items-start gap-2.5 pointer-events-auto">
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Headphones size={13} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] text-blue-300">Support Agent</span>
                <span className="text-[9px] text-slate-400">{latestAdminMsg.time}</span>
              </div>
              <p className="truncate text-slate-200 mt-0.5 text-xs font-normal">{latestAdminMsg.text}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="text-blue-400 font-bold hover:text-blue-300 text-xs shrink-0 cursor-pointer ml-1"
            >
              Reply
            </button>
            <button
              type="button"
              onClick={() => setShowNotificationBanner(false)}
              className="text-slate-400 hover:text-white p-0.5 shrink-0 ml-1 cursor-pointer"
              aria-label="Dismiss message notification"
            >
              <X size={13} />
            </button>
          </div>
        )}

        <button
          type="button"
          id="seller-support-chat-btn"
          className="chat-fab-button pointer-events-auto relative w-12 h-12 sm:w-14 sm:h-14 bg-[#00bf87] hover:bg-[#00a876] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open seller support chat"
          title="Seller Support Chat"
        >
          {isOpen ? <X size={24} /> : <MessageCircle size={24} />}

          {/* Unread Message Badge on button */}
          {!isOpen && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white shadow-md animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Chat Drawer / Modal */}
      {isOpen && (
        <div className="fixed bottom-28 md:bottom-24 right-3 sm:right-6 w-[calc(100vw-24px)] sm:w-96 max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="bg-[#123d63] text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <Headphones size={20} className="text-emerald-300" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Merchant Support</h4>
                <span className="text-[11px] text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  Live 24/7 Agent
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="text-white/70 hover:text-rose-300 p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => setShowClearConfirm(true)}
                title="Clear all messages completely"
                aria-label="Clear chat history"
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 space-y-3 max-h-80 min-h-64 overflow-y-auto bg-slate-50 text-xs">
            {messages.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <p className="font-medium text-xs">No messages yet.</p>
                <p className="text-[11px] mt-1">Send a message to reach our 24/7 support team.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isSeller = m.sender === 'seller'
                return (
                  <div
                    key={m.id}
                    className={`flex gap-2 items-center group/msg relative ${isSeller ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* If seller message, delete button on left */}
                    {isSeller && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(m.id)}
                        className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-200/60 cursor-pointer shrink-0"
                        title="Delete message completely"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}

                    {!isSeller && (
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 self-start mt-0.5">
                        <Bot size={14} />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] p-3 rounded-2xl ${
                        isSeller
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs'
                      }`}
                    >
                      <p className="leading-relaxed m-0 font-normal">{m.text}</p>
                      <span
                        className={`text-[9px] block mt-1 ${
                          isSeller ? 'text-blue-200 text-right' : 'text-slate-400'
                        }`}
                      >
                        {m.time}
                      </span>
                    </div>

                    {/* If admin message, delete button on right */}
                    {!isSeller && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(m.id)}
                        className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-200/60 cursor-pointer shrink-0"
                        title="Delete message completely"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Clear Confirmation Prompt inside modal */}
          {showClearConfirm && (
            <div className="p-3.5 bg-rose-50 border-t border-rose-200 animate-in fade-in duration-150">
              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded-full bg-rose-100 text-rose-600 shrink-0">
                  <Trash2 size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-rose-900">Clear chat history completely?</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    All support messages will be permanently deleted.
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="px-2.5 py-1 bg-white border border-rose-200 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Delete All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Input Box */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
            <input
              type="text"
              placeholder="Ask for support or order help..."
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center shadow-xs cursor-pointer"
              title="Send Message"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
