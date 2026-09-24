'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Loader2,
  Lock,
  Mail,
  User,
  ExternalLink,
  Store
} from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'
import {
  verifyInviteCode,
  claimAdminInvite,
  getActiveInviteCode,
  isAdminAuthenticated
} from '@/lib/admin-invite'

function InviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [code, setCode] = useState('')
  const [name, setName] = useState('Administrator')
  const [email, setEmail] = useState('admin@usellerstore.com')
  const [password, setPassword] = useState('admin123')
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false)

  useEffect(() => {
    // Check if user is already logged in as admin
    if (isAdminAuthenticated()) {
      setAlreadyLoggedIn(true)
    }

    const paramCode = searchParams.get('code')
    if (paramCode) {
      setCode(paramCode.trim().toUpperCase())
    } else {
      // Default to the current active platform code
      setCode(getActiveInviteCode())
    }
  }, [searchParams])

  const verification = verifyInviteCode(code)

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusMessage(null)

    if (!code.trim()) {
      setStatusMessage({ type: 'error', text: 'Please provide a valid invite code.' })
      return
    }

    if (!verification.valid) {
      setStatusMessage({
        type: 'error',
        text: 'The invitation code is invalid, expired, or has not been authorized by platform owners.',
      })
      return
    }

    setIsLoading(true)
    try {
      const res = await claimAdminInvite({
        code,
        name: name.trim() || 'Administrator',
        email: email.trim().toLowerCase() || 'admin@usellerstore.com',
      })

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: 'Invitation accepted! Redirecting to Management Console…',
        })
        setTimeout(() => {
          router.replace('/admin/dashboard')
        }, 900)
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Failed to claim invitation. Please try again.',
        })
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'An unexpected error occurred while claiming your invitation.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-purple-600/20 via-blue-600/20 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header with Brand */}
      <div className="relative z-10 flex flex-col items-center mb-8 text-center">
        <BrandLogo size="lg" variant="light" subtitle="Administration Invitation" />
        <p className="text-xs text-slate-400 mt-2 max-w-sm">
          Join the platform leadership team with full merchant oversight, settlement permissions, and compliance controls.
        </p>
      </div>

      {/* Main Invitation Card */}
      <div className="relative z-10 w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/30">
        {alreadyLoggedIn && (
          <div className="mb-5 p-3 rounded-2xl bg-indigo-950/60 border border-indigo-700/50 flex items-center justify-between text-xs text-indigo-200">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              You have an active admin session.
            </span>
            <button
              type="button"
              onClick={() => router.push('/admin/dashboard')}
              className="text-xs font-bold text-white underline hover:text-indigo-100 cursor-pointer"
            >
              Open Console →
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <KeyRound size={22} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/60 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles size={11} className="text-purple-400" />
              Direct Invite Link
            </div>
            <h1 className="text-lg font-bold text-white mt-0.5">Admin Access Portal</h1>
          </div>
        </div>

        {/* Verification Status Pill */}
        <div
          className={`p-3.5 rounded-2xl border mb-6 flex items-start gap-3 transition-all ${
            verification.valid
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
              : code
              ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
              : 'bg-slate-800/50 border-slate-700 text-slate-300'
          }`}
        >
          {verification.valid ? (
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
          ) : code ? (
            <AlertCircle size={20} className="text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <KeyRound size={20} className="text-slate-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs flex-1">
            <div className="font-bold">
              {verification.valid
                ? 'Authorized Administrator Invitation'
                : code
                ? 'Unrecognized Invite Code'
                : 'Invitation Code Required'}
            </div>
            <p className="mt-0.5 opacity-90 leading-relaxed text-[11px]">
              {verification.valid
                ? `Code "${verification.normalizedCode}" is verified with Super Administrator privileges.`
                : code
                ? 'This code is not in the active platform registry. Please check for typos or ask for a fresh link.'
                : 'Enter or paste the secret invite code provided to you.'}
            </p>
          </div>
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div
            className={`p-3 rounded-2xl border text-xs mb-5 flex items-center gap-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                : 'bg-rose-950/80 border-rose-700 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleClaim} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="invite-code">
              Invite Key / Code
            </label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="invite-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. MXSVHSDL"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-white font-mono text-sm font-bold tracking-wider uppercase focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600 placeholder:normal-case placeholder:font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="admin-name">
              Your Administrator Name
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="admin-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. zain or Alex Administrator"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="admin-email">
              Admin Contact Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@usellerstore.com"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !verification.valid}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Activating Administrator Access…</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                <span>Accept Invite & Launch Console</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Alternate Navigation */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-center space-y-2">
          <button
            type="button"
            onClick={() => router.push('/?mode=login')}
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
          >
            <Store size={14} />
            <span>Go to Seller / Storefront Login</span>
          </button>
        </div>
      </div>

      <footer className="relative z-10 mt-8 text-[11px] text-slate-500 text-center">
        U Seller Store Platform • Enterprise Compliance &amp; Multi-Vendor Management Console
      </footer>
    </div>
  )
}

export default function AdminInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-xs">
          <Loader2 size={24} className="animate-spin text-purple-500" />
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  )
}
