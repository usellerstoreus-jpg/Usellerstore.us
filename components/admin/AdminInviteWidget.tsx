'use client'

import React, { useState, useEffect } from 'react'
import { Copy, Pencil, RefreshCw } from 'lucide-react'
import {
  getActiveInviteCode,
  generateNewInviteCode,
  setCustomInviteCode,
  getAdminInviteLink,
} from '@/lib/admin-invite'

export function AdminInviteWidget({
  className = '',
  onToast,
}: {
  className?: string
  onToast?: (msg: string) => void
}) {
  const [inviteCode, setInviteCode] = useState(() => getActiveInviteCode())

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail?.code) setInviteCode(e.detail.code)
    }
    window.addEventListener('u_admin_invite_code_updated', handleUpdate)
    return () => window.removeEventListener('u_admin_invite_code_updated', handleUpdate)
  }, [])

  const handleCopy = () => {
    const link = getAdminInviteLink(inviteCode)
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(link)
    }
    if (onToast) onToast(`Admin invite link copied: ${inviteCode}`)
  }

  const handleRefresh = () => {
    const { code } = generateNewInviteCode()
    setInviteCode(code)
    if (onToast) onToast(`New admin invite code generated: ${code}`)
  }

  const handleEdit = () => {
    const custom = window.prompt('Enter new custom admin invite code (min 4 chars):', inviteCode)
    if (custom && custom.trim()) {
      const res = setCustomInviteCode(custom)
      if (res.success) {
        setInviteCode(res.code)
        if (onToast) onToast(`Invite code updated: ${res.code}`)
      } else if (res.error && onToast) {
        onToast(res.error)
      }
    }
  }

  return (
    <div
      className={`invite flex items-center justify-between text-xs text-slate-600 ${className}`}
    >
      <span>
        INVITE <b className="text-slate-900 font-bold ml-1 font-mono tracking-wider">{inviteCode}</b>
      </span>
      <div className="flex items-center gap-1.5 text-slate-400">
        <button
          type="button"
          onClick={handleCopy}
          title="Copy shareable invite link"
          aria-label="Copy shareable invite link"
          className="hover:text-slate-700 cursor-pointer p-0.5 rounded transition-colors"
        >
          <Copy size={14} />
        </button>
        <button
          type="button"
          onClick={handleEdit}
          title="Customize invite code"
          aria-label="Customize invite code"
          className="hover:text-slate-700 cursor-pointer p-0.5 rounded transition-colors"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={handleRefresh}
          title="Generate new invite code"
          aria-label="Generate new invite code"
          className="hover:text-slate-700 cursor-pointer p-0.5 rounded transition-colors"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    </div>
  )
}
