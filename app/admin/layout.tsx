'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  ShieldAlert,
  Lock,
  KeyRound,
  ArrowRight,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Store
} from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'
import {
  isAdminAuthenticated,
  claimAdminInvite,
  verifyInviteCode,
  getActiveInviteCode
} from '@/lib/admin-invite'
import { signInAdmin } from '@/lib/supabase/api'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [authMethod, setAuthMethod] = useState<'credentials' | 'invite'>('credentials')

  // Credentials form state
  const [email, setEmail] = useState('admin@usellerstore.com')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)

  // Invite code form state
  const [inviteCode, setInviteCode] = useState(getActiveInviteCode())

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    // If on the invite or login/signin page, don't block
    if (
      pathname &&
      (pathname.startsWith('/admin/invite') ||
        pathname.startsWith('/admin/login') ||
        pathname.startsWith('/admin/signin'))
    ) {
      setIsAuthenticated(true)
      return
    }

    const checkAuth = () => {
      const authed = isAdminAuthenticated()
      setIsAuthenticated(authed)
    }

    checkAuth()

    const handleLoginSuccess = () => setIsAuthenticated(true)
    const handleLogout = () => setIsAuthenticated(false)

    window.addEventListener('u_admin_login_success', handleLoginSuccess)
    window.addEventListener('u_admin_logout', handleLogout)
    window.addEventListener('storage', checkAuth)

    return () => {
      window.removeEventListener('u_admin_login_success', handleLoginSuccess)
      window.removeEventListener('u_admin_logout', handleLogout)
      window.removeEventListener('storage', checkAuth)
    }
  }, [pathname])

  // Handle direct admin login via credentials
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!email.trim()) {
      setErrorMessage('Please enter your administrator email')
      return
    }
    if (!password) {
      setErrorMessage('Please enter your password')
      return
    }

    setIsLoading(true)
    try {
      const res = await signInAdmin({ email, password })
      if (res.success && res.admin) {
        localStorage.setItem(
          'u_auth_session',
          JSON.stringify({
            role: 'admin',
            adminEmail: res.admin.email,
            name: res.admin.name,
            avatar: res.admin.avatar,
            permissions: res.admin.permissions,
          })
        )
        setSuccessMessage(`Welcome back, ${res.admin.name}!`)
        window.dispatchEvent(new CustomEvent('u_admin_login_success', { detail: res.admin }))
        setIsAuthenticated(true)
      } else {
        setErrorMessage(res.error || 'Invalid administrator credentials. Please check your details.')
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error authenticating administrator.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle direct admin login via invite code
  const handleInviteLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const verification = verifyInviteCode(inviteCode)
    if (!verification.valid) {
      setErrorMessage('Invalid or expired invite code. Please check or request a new code.')
      return
    }

    setIsLoading(true)
    try {
      const res = await claimAdminInvite({
        code: inviteCode,
        name: 'Administrator',
        email: 'admin@usellerstore.com',
      })
      if (res.success && res.admin) {
        setSuccessMessage('Invitation verified! Access granted.')
        setIsAuthenticated(true)
      } else {
        setErrorMessage(res.error || 'Could not verify invite code.')
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to claim invitation.')
    } finally {
      setIsLoading(false)
    }
  }

  // If path is invite or login or signin, allow direct render
  if (
    pathname &&
    (pathname.startsWith('/admin/invite') ||
      pathname.startsWith('/admin/login') ||
      pathname.startsWith('/admin/signin'))
  ) {
    return <>{children}</>
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-semibold">
        <div className="flex items-center gap-2">
          <Loader2 size={18} className="animate-spin text-purple-400" />
          <span>Verifying Administrator Access…</span>
        </div>
      </div>
    )
  }

  // If authenticated, render normal admin page
  if (isAuthenticated) {
    return <>{children}</>
  }

  // Unauthorized: render access restricted screen
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-purple-600/15 via-rose-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center mb-6 text-center">
        <BrandLogo size="md" variant="light" subtitle="Admin Access Restricted" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/40">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-white shadow-md">
            <Lock size={20} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold uppercase tracking-wider">
              <ShieldAlert size={11} className="text-rose-400" />
              Restricted Area
            </div>
            <h1 className="text-base font-bold text-white mt-0.5">Administrator Authentication</h1>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
          Access to platform operations, financial settlements, and seller KYC requires verified Administrator privileges or an authorized invitation key.
        </p>

        {/* Method Switcher */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 mb-5">
          <button
            type="button"
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              authMethod === 'credentials'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => {
              setAuthMethod('credentials')
              setErrorMessage('')
              setSuccessMessage('')
            }}
          >
            Admin Sign In
          </button>
          <button
            type="button"
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              authMethod === 'invite'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => {
              setAuthMethod('invite')
              setErrorMessage('')
              setSuccessMessage('')
            }}
          >
            Redeem Invite Link / Key
          </button>
        </div>

        {/* Error / Success Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {authMethod === 'credentials' ? (
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="admin-layout-email">
                Admin Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="admin-layout-email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@usellerstore.com"
                  required
                  className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="admin-layout-password">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="admin-layout-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying credentials…</span>
                </>
              ) : (
                <>
                  <span>Sign In as Administrator</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleInviteLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="admin-layout-invite">
                Invite Code or Secret Key
              </label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="admin-layout-invite"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MXSVHSDL"
                  required
                  className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono text-xs font-bold text-white uppercase placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Active platform key is <span className="font-mono text-purple-300 font-bold">MXSVHSDL</span>.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Redeeming invite code…</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Redeem Key &amp; Enter Console</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Back Link */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => router.push('/?mode=login')}
            className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Store size={13} />
            <span>Seller Login</span>
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/invite')}
            className="text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Open Invite Page</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
