'use client'

import React, { useState } from 'react'
import {
  MessageCircle,
  X,
  Send,
  Headphones,
  Bot,
  User,
  Sparkles
} from 'lucide-react'

interface Message {
  id: string
  sender: 'user' | 'agent'
  text: string
  time: string
}

export function SupportChatModal({
  onToast,
}: {
  onToast: (msg: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'agent',
      text: 'Hello tester! How can we assist you with your seller store today?',
      time: 'Just now',
    },
  ])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    const currentInput = input
    setInput('')

    // Simulated quick agent reply
    setTimeout(() => {
      const replyMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: `Thanks for reaching out about "${currentInput.slice(0, 30)}...". Our merchant support team is on standby and your request has been logged!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, replyMsg])
    }, 800)
  }

  return (
    <>
      {/* Floating Chat Button (Matching the green bubble in screenshots) */}
      <button
        type="button"
        id="seller-support-chat-btn"
        className="chat-fab-button fixed bottom-6 right-6 w-14 h-14 bg-[#00bf87] hover:bg-[#00a876] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all z-40"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open seller support chat"
        title="Seller Support Chat"
      >
        {isOpen ? <X size={26} /> : <MessageCircle size={26} />}
      </button>

      {/* Chat Drawer / Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
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
            <button
              type="button"
              className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
              onClick={() => setIsOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 space-y-3 max-h-80 min-h-64 overflow-y-auto bg-slate-50 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'agent' && (
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot size={14} />
                  </div>
                )}
                <div
                  className={`max-w-[75%] p-3 rounded-2xl ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs'
                  }`}
                >
                  <p className="leading-relaxed">{m.text}</p>
                  <span
                    className={`text-[9px] block mt-1 ${
                      m.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

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
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center shadow-xs"
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
