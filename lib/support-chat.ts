import { SellerProfile } from './mock-data'

export interface SupportMessage {
  id: string
  sender: 'seller' | 'admin'
  text: string
  time: string
  timestamp: number
  read: boolean
}

export interface SupportConversation {
  sellerEmail: string
  sellerName: string
  shopName: string
  avatarColor: string
  lastMessage: string
  lastMessageTime: string
  lastSeen: string
  isArchived: boolean
  unreadCount: number
  isOnline: boolean
}

const STORAGE_CONVERSATIONS_KEY = 'u_support_conversations_v1'
const STORAGE_MESSAGES_PREFIX = 'u_support_messages_'

function getStorageSafe<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function setStorageSafe(key: string, value: any): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

const AVATAR_COLORS = [
  '#7FE3C7', // Mint green
  '#A78BFA', // Purple
  '#F472B6', // Pink
  '#60A5FA', // Blue
  '#FBBF24', // Amber
  '#34D399', // Emerald
]

export function getSupportConversations(registeredSellers?: SellerProfile[]): SupportConversation[] {
  let convs = getStorageSafe<SupportConversation[]>(STORAGE_CONVERSATIONS_KEY, [])

  // Merge in any registered sellers from DB / local state
  if (registeredSellers && registeredSellers.length > 0) {
    let changed = false
    registeredSellers.forEach((s, idx) => {
      const email = (s.email || '').toLowerCase()
      if (!email) return
      const existing = convs.find((c) => c.sellerEmail.toLowerCase() === email)
      if (!existing) {
        const initialColor = AVATAR_COLORS[(idx + 1) % AVATAR_COLORS.length]
        const newConv: SupportConversation = {
          sellerEmail: s.email,
          sellerName: s.ownerName || s.shopName,
          shopName: s.shopName,
          avatarColor: initialColor,
          lastMessage: 'Store joined the platform',
          lastMessageTime: 'Just now',
          lastSeen: 'Recently active',
          isArchived: false,
          unreadCount: 0,
          isOnline: true,
        }
        convs.push(newConv)
        changed = true

        // Create welcome message
        const welcomeMsg: SupportMessage = {
          id: `welcome-${Date.now()}-${idx}`,
          sender: 'admin',
          text: `Hello ${s.shopName}! Welcome to U Seller Store Management. Our merchant support team is available 24/7.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
          read: true,
        }
        setStorageSafe(`${STORAGE_MESSAGES_PREFIX}${email}`, [welcomeMsg])
      } else {
        // Update names if changed
        if (existing.shopName !== s.shopName || existing.sellerName !== (s.ownerName || s.shopName)) {
          existing.shopName = s.shopName
          existing.sellerName = s.ownerName || s.shopName
          changed = true
        }
      }
    })

    if (changed) {
      setStorageSafe(STORAGE_CONVERSATIONS_KEY, convs)
    }
  } else {
    setStorageSafe(STORAGE_CONVERSATIONS_KEY, convs)
  }

  return convs
}

export function getConversationMessages(sellerEmail: string): SupportMessage[] {
  const email = (sellerEmail || '').toLowerCase()
  if (!email) return []

  const key = `${STORAGE_MESSAGES_PREFIX}${email}`
  return getStorageSafe<SupportMessage[]>(key, [])
}

export function sendSupportMessage(
  sellerEmail: string,
  sender: 'seller' | 'admin',
  text: string
): SupportMessage {
  const email = (sellerEmail || '').toLowerCase()
  const trimmed = text.trim()
  if (!trimmed || !email) {
    throw new Error('Invalid message or recipient email')
  }

  const now = new Date()
  const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const newMsg: SupportMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sender,
    text: trimmed,
    time: timeFormatted,
    timestamp: Date.now(),
    read: false, // New message is unread for the recipient
  }

  // 1. Append to message history
  const key = `${STORAGE_MESSAGES_PREFIX}${email}`
  const messages = getConversationMessages(email)
  messages.push(newMsg)
  setStorageSafe(key, messages)

  // 2. Update conversation summary
  const convs = getStorageSafe<SupportConversation[]>(STORAGE_CONVERSATIONS_KEY, [])
  const conv = convs.find((c) => c.sellerEmail.toLowerCase() === email)
  if (conv) {
    conv.lastMessage = trimmed
    conv.lastMessageTime = timeFormatted
    conv.lastSeen = 'Online'
    if (sender === 'seller') {
      conv.unreadCount = (conv.unreadCount || 0) + 1
    }
    setStorageSafe(STORAGE_CONVERSATIONS_KEY, convs)
  }

  // 3. Dispatch broadcast event for live reactive UI updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('u_support_chat_update', {
        detail: {
          sellerEmail: email,
          message: newMsg,
          sender,
        },
      })
    )
  }

  return newMsg
}

export function toggleArchiveConversation(sellerEmail: string): boolean {
  const email = (sellerEmail || '').toLowerCase()
  const convs = getStorageSafe<SupportConversation[]>(STORAGE_CONVERSATIONS_KEY, [])
  const conv = convs.find((c) => c.sellerEmail.toLowerCase() === email)
  if (!conv) return false

  conv.isArchived = !conv.isArchived
  setStorageSafe(STORAGE_CONVERSATIONS_KEY, convs)

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('u_support_chat_update', { detail: { sellerEmail: email } }))
  }
  return conv.isArchived
}

export function markConversationAsRead(sellerEmail: string): void {
  const email = (sellerEmail || '').toLowerCase()
  const convs = getStorageSafe<SupportConversation[]>(STORAGE_CONVERSATIONS_KEY, [])
  const conv = convs.find((c) => c.sellerEmail.toLowerCase() === email)
  if (conv && conv.unreadCount > 0) {
    conv.unreadCount = 0
    setStorageSafe(STORAGE_CONVERSATIONS_KEY, convs)
  }

  const key = `${STORAGE_MESSAGES_PREFIX}${email}`
  const messages = getStorageSafe<SupportMessage[]>(key, [])
  let updated = false
  messages.forEach((m) => {
    if (!m.read && m.sender === 'seller') {
      m.read = true
      updated = true
    }
  })
  if (updated) {
    setStorageSafe(key, messages)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('u_support_chat_update', { detail: { sellerEmail: email } }))
    }
  }
}

export function getSellerUnreadCount(sellerEmail: string): number {
  const messages = getConversationMessages(sellerEmail)
  return messages.filter((m) => m.sender === 'admin' && !m.read).length
}

export function markMessagesAsReadBySeller(sellerEmail: string): void {
  const email = (sellerEmail || '').toLowerCase()
  const key = `${STORAGE_MESSAGES_PREFIX}${email}`
  const messages = getStorageSafe<SupportMessage[]>(key, [])
  let updated = false
  messages.forEach((m) => {
    if (!m.read && m.sender === 'admin') {
      m.read = true
      updated = true
    }
  })
  if (updated) {
    setStorageSafe(key, messages)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('u_support_chat_update', {
          detail: { sellerEmail: email, action: 'seller_read' },
        })
      )
    }
  }
}

export { playNotificationSound } from './notification-sound'

/**
 * Delete a single support message completely
 */
export function deleteSupportMessage(sellerEmail: string, messageId: string): boolean {
  const email = (sellerEmail || '').toLowerCase()
  if (!email || !messageId) return false

  const key = `${STORAGE_MESSAGES_PREFIX}${email}`
  const messages = getStorageSafe<SupportMessage[]>(key, [])
  const filtered = messages.filter((m) => m.id !== messageId)

  if (filtered.length === messages.length) return false

  setStorageSafe(key, filtered)

  // Update last message in conversation
  const convs = getStorageSafe<SupportConversation[]>(STORAGE_CONVERSATIONS_KEY, [])
  const conv = convs.find((c) => c.sellerEmail.toLowerCase() === email)
  if (conv) {
    if (filtered.length > 0) {
      const lastMsg = filtered[filtered.length - 1]
      conv.lastMessage = lastMsg.text
      conv.lastMessageTime = lastMsg.time
    } else {
      conv.lastMessage = 'No messages'
      conv.lastMessageTime = ''
    }
    setStorageSafe(STORAGE_CONVERSATIONS_KEY, convs)
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('u_support_chat_update', {
        detail: { sellerEmail: email, action: 'delete_message', messageId },
      })
    )
  }

  return true
}

/**
 * Delete all messages in a conversation completely
 */
export function clearConversationMessages(sellerEmail: string): boolean {
  const email = (sellerEmail || '').toLowerCase()
  if (!email) return false

  const key = `${STORAGE_MESSAGES_PREFIX}${email}`
  setStorageSafe(key, [])

  const convs = getStorageSafe<SupportConversation[]>(STORAGE_CONVERSATIONS_KEY, [])
  const conv = convs.find((c) => c.sellerEmail.toLowerCase() === email)
  if (conv) {
    conv.lastMessage = 'No messages'
    conv.lastMessageTime = ''
    conv.unreadCount = 0
    setStorageSafe(STORAGE_CONVERSATIONS_KEY, convs)
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('u_support_chat_update', {
        detail: { sellerEmail: email, action: 'clear_messages' },
      })
    )
  }

  return true
}

/**
 * Delete conversation completely (messages + conversation entry)
 */
export function deleteConversationCompletely(sellerEmail: string): boolean {
  const email = (sellerEmail || '').toLowerCase()
  if (!email) return false

  // Clear messages
  const key = `${STORAGE_MESSAGES_PREFIX}${email}`
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key)
  }

  // Remove conversation
  let convs = getStorageSafe<SupportConversation[]>(STORAGE_CONVERSATIONS_KEY, [])
  convs = convs.filter((c) => c.sellerEmail.toLowerCase() !== email)
  setStorageSafe(STORAGE_CONVERSATIONS_KEY, convs)

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('u_support_chat_update', {
        detail: { sellerEmail: email, action: 'delete_conversation' },
      })
    )
  }

  return true
}

