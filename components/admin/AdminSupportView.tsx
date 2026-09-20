'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Search,
  Mail,
  Archive,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  Store,
  ArrowRight,
  MoreVertical,
  Check,
  Headphones,
  User,
  ShieldCheck,
  ChevronLeft,
  X,
  Trash2,
} from 'lucide-react'
import { SellerProfile } from '@/lib/mock-data'
import {
  SupportConversation,
  SupportMessage,
  getSupportConversations,
  getConversationMessages,
  sendSupportMessage,
  toggleArchiveConversation,
  markConversationAsRead,
  deleteSupportMessage,
  clearConversationMessages,
  deleteConversationCompletely,
} from '@/lib/support-chat'

export interface AdminSupportViewProps {
  sellers?: SellerProfile[]
  activeSeller?: SellerProfile
  onToast?: (message: string) => void
  onSwitchToSeller?: (seller?: SellerProfile) => void
}

const QUICK_REPLY_TEMPLATES = [
  'How can we assist your seller store today?',
  'Your KYC verification has been reviewed and approved!',
  'Balance adjustment has been credited to your store account.',
  'Please provide the buyer order ID for expedited support.',
  'Withdrawal lock has been cleared. You may proceed with payouts.',
]

export function AdminSupportView({
  sellers = [],
  activeSeller,
  onToast,
  onSwitchToSeller,
}: AdminSupportViewProps) {
  const [conversations, setConversations] = useState<SupportConversation[]>([])
  const [filterTab, setFilterTab] = useState<'active' | 'archived'>('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)
  const [convToDelete, setConvToDelete] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  // 1. Load conversations and listen for real-time events
  const refreshConversations = () => {
    const list = getSupportConversations(sellers)
    setConversations(list)
  }

  useEffect(() => {
    refreshConversations()

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent
      refreshConversations()
      if (selectedEmail && customEvent.detail?.sellerEmail?.toLowerCase() === selectedEmail.toLowerCase()) {
        const msgs = getConversationMessages(selectedEmail)
        setMessages(msgs)
      }
    }

    window.addEventListener('u_support_chat_update', handleUpdate)
    window.addEventListener('storage', refreshConversations)

    return () => {
      window.removeEventListener('u_support_chat_update', handleUpdate)
      window.removeEventListener('storage', refreshConversations)
    }
  }, [sellers, selectedEmail])

  // 2. When selected email changes, load its message thread
  useEffect(() => {
    if (selectedEmail) {
      const msgs = getConversationMessages(selectedEmail)
      setMessages(msgs)
      markConversationAsRead(selectedEmail)
      refreshConversations()
    } else {
      setMessages([])
    }
  }, [selectedEmail])

  // Scroll to bottom when messages update
  useEffect(() => {
    if (selectedEmail && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, selectedEmail])

  // Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 3. Filtered conversations based on tab & search
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const matchesTab = filterTab === 'archived' ? c.isArchived : !c.isArchived
      if (!matchesTab) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        c.shopName.toLowerCase().includes(q) ||
        c.sellerName.toLowerCase().includes(q) ||
        c.sellerEmail.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
      )
    })
  }, [conversations, filterTab, searchQuery])

  const currentConversation = useMemo(() => {
    if (!selectedEmail) return null
    return conversations.find((c) => c.sellerEmail.toLowerCase() === selectedEmail.toLowerCase()) || null
  }, [conversations, selectedEmail])

  const targetSellerProfile = useMemo(() => {
    if (!selectedEmail) return null
    return sellers.find((s) => s.email.toLowerCase() === selectedEmail.toLowerCase()) || null
  }, [sellers, selectedEmail])

  // 4. Send Message Handler
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!selectedEmail || !inputText.trim()) return

    setIsSending(true)
    try {
      sendSupportMessage(selectedEmail, 'admin', inputText.trim())
      const updated = getConversationMessages(selectedEmail)
      setMessages(updated)
      setInputText('')
      if (onToast) onToast('Message sent to seller')
    } catch (err: any) {
      if (onToast) onToast(err.message || 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  const handleQuickReply = (template: string) => {
    setInputText(template)
  }

  const handleToggleArchive = () => {
    if (!selectedEmail) return
    const archived = toggleArchiveConversation(selectedEmail)
    refreshConversations()
    if (onToast) {
      onToast(archived ? 'Conversation archived' : 'Conversation moved to active')
    }
  }

  // Delete an individual message completely
  const handleDeleteSingleMessage = (messageId: string) => {
    if (!selectedEmail) return
    const success = deleteSupportMessage(selectedEmail, messageId)
    if (success) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      refreshConversations()
      if (onToast) onToast('Message deleted completely')
    }
  }

  // Clear all messages in current conversation
  const handleClearAllMessages = () => {
    if (!selectedEmail) return
    clearConversationMessages(selectedEmail)
    setMessages([])
    refreshConversations()
    setIsClearModalOpen(false)
    if (onToast) onToast('All messages in conversation deleted completely')
  }

  // Delete entire conversation completely
  const handleDeleteConversation = (email: string) => {
    deleteConversationCompletely(email)
    if (selectedEmail?.toLowerCase() === email.toLowerCase()) {
      setSelectedEmail(null)
      setMessages([])
    }
    refreshConversations()
    setConvToDelete(null)
    if (onToast) onToast('Conversation deleted completely')
  }

  const truncateEmail = (email: string) => {
    if (email.length <= 9) return email
    return email.slice(0, 5) + '...'
  }

  return (
    <div className="admin-support-container w-full h-[calc(100vh-130px)] min-h-[620px] max-h-[880px] bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row overflow-hidden">
      {/* ========================================================================= */}
      {/* Left Column: Search, Active/Archived Tabs, Seller Conversations List       */}
      {/* ========================================================================= */}
      <div
        className={`w-full md:w-[330px] lg:w-[360px] flex flex-col border-r border-slate-200/80 bg-white shrink-0 ${
          selectedEmail ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Search Bar matching screenshot */}
        <div className="p-3 border-b border-slate-100">
          <div className="relative flex items-center bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
            <Search size={14} className="text-slate-400 mr-2 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search sellers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-xs text-slate-800 placeholder:text-slate-400 font-medium"
            />
            <kbd className="text-[10px] font-semibold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 bg-white shadow-2xs ml-1 shrink-0">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Filter Toggle Buttons: Active / Archived matching screenshot */}
        <div className="px-3 pt-2.5 pb-2 border-b border-slate-100">
          <div className="w-full bg-slate-100/90 p-1 rounded-xl flex gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterTab('active')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                filterTab === 'active'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Mail size={13} className={filterTab === 'active' ? 'text-indigo-600' : 'text-slate-400'} />
              <span>Active</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('archived')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                filterTab === 'archived'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Archive size={13} className={filterTab === 'archived' ? 'text-indigo-600' : 'text-slate-400'} />
              <span>Archived</span>
            </button>
          </div>
        </div>

        {/* Seller Conversations List matching screenshot */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-50">
          {filteredConversations.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <p className="text-xs text-slate-400 font-medium">
                {searchQuery ? 'No sellers match your search' : `No ${filterTab} conversations`}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedEmail?.toLowerCase() === conv.sellerEmail.toLowerCase()
              const avatarLetter = (conv.shopName || 'S').charAt(0).toUpperCase()

              return (
                <div
                  key={conv.sellerEmail}
                  onClick={() => setSelectedEmail(conv.sellerEmail)}
                  className={`p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 select-none group relative ${
                    isSelected
                      ? 'bg-indigo-50/80 border border-indigo-200/80 shadow-2xs'
                      : 'hover:bg-slate-50/80 border border-transparent'
                  }`}
                >
                  {/* Round Avatar with Initial & Status Dot */}
                  <div
                    className="relative w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-slate-800 shrink-0 shadow-2xs"
                    style={{ backgroundColor: conv.avatarColor || '#7FE3C7' }}
                  >
                    <span>{avatarLetter}</span>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                        conv.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center min-w-0 truncate">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {conv.shopName}
                        </span>
                        <span className="text-slate-400 mx-1 text-xs">·</span>
                        <span className="text-[11px] text-slate-400 truncate">
                          {truncateEmail(conv.sellerEmail)}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                        {conv.lastMessageTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-slate-500 truncate m-0 font-normal">
                        {conv.lastMessage}
                      </p>
                      <div className="flex items-center gap-1 ml-1.5 shrink-0">
                        {conv.unreadCount > 0 && (
                          <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center shadow-2xs">
                            {conv.unreadCount}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setConvToDelete(conv.sellerEmail)
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Delete conversation completely"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Right Column: Empty State OR Active Chat Panel                             */}
      {/* ========================================================================= */}
      <div className={`flex-1 flex flex-col bg-white overflow-hidden ${!selectedEmail ? 'hidden md:flex' : 'flex'}`}>
        {!selectedEmail ? (
          /* ========================================================================= */
          /* Empty State matching screenshot                                            */
          /* ========================================================================= */
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white min-h-[480px] select-none">
            {/* Custom SVG Graphic matching reference screenshot */}
            <div className="relative w-56 h-40 flex items-center justify-center">
              {/* Confetti / Particle dots around graphic */}
              <div className="absolute top-4 left-6 w-2 h-2 rounded-full bg-rose-400/80 animate-pulse" />
              <div className="absolute bottom-6 left-12 w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
              <div className="absolute top-8 right-10 w-2 h-2 rounded-full bg-emerald-400/80" />
              <div className="absolute bottom-8 right-8 w-2 h-2 rounded-full bg-amber-400/80" />

              {/* Background Card (Soft pastel blue with indicator lines) */}
              <div className="w-44 h-28 bg-[#E0F2FE]/90 rounded-2xl p-3.5 shadow-xs border border-sky-200/50 flex flex-col justify-between transform -rotate-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <div className="h-2 bg-blue-200 rounded-full w-20" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                    <div className="h-2 bg-indigo-200 rounded-full w-14" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <div className="h-2 bg-emerald-200 rounded-full w-16" />
                  </div>
                </div>
              </div>

              {/* Overlapping Pink/Lavender Card */}
              <div className="absolute -bottom-2 -right-2 w-32 h-20 bg-[#FCE7F3] rounded-2xl p-3 shadow-md border border-pink-200/60 flex flex-col justify-center space-y-2 transform rotate-3">
                <div className="h-2 bg-pink-300 rounded-full w-16" />
                <div className="h-2 bg-pink-200 rounded-full w-20" />
              </div>

              {/* Floating Blue Circle Badge with Chat Bubble */}
              <div className="absolute top-1 right-8 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg transform -translate-y-1 hover:scale-105 transition-transform">
                <div className="w-6 h-5 bg-white rounded-lg rounded-bl-none flex items-center justify-center gap-0.5">
                  <div className="w-1 h-1 bg-blue-600 rounded-full" />
                  <div className="w-1 h-1 bg-blue-600 rounded-full" />
                  <div className="w-1 h-1 bg-blue-600 rounded-full" />
                </div>
              </div>
            </div>

            {/* Typography matching reference screenshot */}
            <h3 className="text-xl font-bold text-slate-800 mt-6 mb-2 text-center tracking-tight">
              Select a conversation to start chatting
            </h3>
            <p className="text-sm text-slate-400 max-w-md text-center leading-relaxed font-normal">
              Manage customer inquiries, view KYC status, and resolve issues in real-time.
            </p>
          </div>
        ) : (
          /* ========================================================================= */
          /* Active Chat Interface                                                     */
          /* ========================================================================= */
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Active Header */}
            <div className="p-3.5 px-4 border-b border-slate-200/80 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedEmail(null)}
                  className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-slate-700 rounded-lg"
                  aria-label="Back to conversations list"
                >
                  <ChevronLeft size={20} />
                </button>

                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-slate-800 shrink-0 shadow-2xs"
                  style={{ backgroundColor: currentConversation?.avatarColor || '#7FE3C7' }}
                >
                  {(currentConversation?.shopName || 'S').charAt(0).toUpperCase()}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900 leading-tight">
                      {currentConversation?.shopName}
                    </h4>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck size={11} /> Verified Seller
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    {currentConversation?.sellerEmail} · {currentConversation?.lastSeen}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {targetSellerProfile && onSwitchToSeller && (
                  <button
                    type="button"
                    onClick={() => onSwitchToSeller(targetSellerProfile)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Masquerade login into this seller's console"
                  >
                    <Store size={13} />
                    <span className="hidden sm:inline">Store Console</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleToggleArchive}
                  className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                    currentConversation?.isArchived
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  title={currentConversation?.isArchived ? 'Unarchive conversation' : 'Archive conversation'}
                >
                  <Archive size={14} />
                  <span className="hidden sm:inline">
                    {currentConversation?.isArchived ? 'Unarchive' : 'Archive'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsClearModalOpen(true)}
                  className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Clear all messages in this conversation completely"
                >
                  <Trash2 size={14} />
                  <span className="hidden sm:inline">Clear Chat</span>
                </button>
              </div>
            </div>

            {/* Chat Messages History */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8FAFC]">
              {/* Date Header */}
              <div className="flex items-center justify-center my-2">
                <span className="text-[11px] font-semibold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200/70 shadow-2xs">
                  {currentConversation?.lastSeen || 'Active Conversation'}
                </span>
              </div>

              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-400">No messages exchanged yet. Send the first greeting!</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isAdmin = m.sender === 'admin'
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2.5 items-center group/msg relative ${isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* If admin message, show delete button on the left of bubble */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSingleMessage(m.id)}
                          className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                          title="Delete message completely"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}

                      {!isAdmin && (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-slate-800 shrink-0 self-start mt-0.5"
                          style={{ backgroundColor: currentConversation?.avatarColor || '#7FE3C7' }}
                        >
                          {(currentConversation?.shopName || 'S').charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div
                        className={`max-w-[78%] sm:max-w-[70%] p-3.5 rounded-2xl shadow-2xs text-xs leading-relaxed ${
                          isAdmin
                            ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-tr-xs'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                        }`}
                      >
                        <p className="m-0 whitespace-pre-wrap font-normal">{m.text}</p>
                        <div
                          className={`flex items-center gap-1 mt-1 text-[10px] ${
                            isAdmin ? 'text-indigo-200 justify-end' : 'text-slate-400 justify-start'
                          }`}
                        >
                          <span>{m.time}</span>
                          {isAdmin && <Check size={11} className="text-indigo-200 ml-0.5" />}
                        </div>
                      </div>

                      {/* If seller message, show delete button on the right of bubble */}
                      {!isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSingleMessage(m.id)}
                          className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                          title="Delete message completely"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Reply Pills */}
            <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
                <Sparkles size={12} className="text-amber-500" /> Quick Replies:
              </span>
              {QUICK_REPLY_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl}
                  type="button"
                  onClick={() => handleQuickReply(tmpl)}
                  className="px-2.5 py-1 rounded-full bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 text-slate-600 text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer"
                >
                  {tmpl}
                </button>
              ))}
            </div>

            {/* Message Input Form */}
            <form
              onSubmit={handleSendMessage}
              className="p-3.5 px-4 bg-white border-t border-slate-200/80 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                placeholder={`Type a message to ${currentConversation?.shopName || 'seller'}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-normal"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <span>Send</span>
                <Send size={13} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Confirmation Modal: Clear all messages in current chat */}
      {isClearModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 shadow-2xl max-w-sm w-full space-y-4 border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 size={24} />
            </div>
            <div className="text-center space-y-1">
              <h4 className="font-bold text-slate-900 text-base">Clear All Messages?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                All messages in this conversation with <span className="font-semibold text-slate-700">{currentConversation?.shopName}</span> will be permanently deleted. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAllMessages}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete entire conversation completely */}
      {convToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 shadow-2xl max-w-sm w-full space-y-4 border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 size={24} />
            </div>
            <div className="text-center space-y-1">
              <h4 className="font-bold text-slate-900 text-base">Delete Entire Conversation?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                This will permanently delete the conversation and message history for <span className="font-semibold text-slate-700">{convToDelete}</span>.
              </p>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setConvToDelete(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteConversation(convToDelete)}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Delete Completely
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
