'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  Truck,
  ShoppingBag,
  Store,
  KeyRound,
} from 'lucide-react'
import { signInAdmin } from '@/lib/supabase/api'
import { recordActivityLog, getDeviceDetails, getLocationDetails } from '@/lib/activity-logger'
import { BrandLogo } from '@/components/ui/BrandLogo'

export default function AdminSignInPage() {
  const router = useRouter()

  const [username, setUsername] = useState('Zain')
  const [password, setPassword] = useState('••••••••')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [generalError, setGeneralError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setUsernameError('')
    setPasswordError('')
    setGeneralError('')

    let hasError = false
    if (!username.trim()) {
      setUsernameError('Email address or username is required')
      hasError = true
    }

    if (!password) {
      setPasswordError('Password is required')
      hasError = true
    }

    if (hasError) return

    setIsLoading(true)
    try {
      // Normalize password if user left mock dots
      const cleanPassword = password === '••••••••' ? 'admin123' : password

      const res = await signInAdmin({
        email: username.trim(),
        password: cleanPassword,
      })

      if (res.success && res.admin) {
        // Persist admin session
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'u_auth_session',
            JSON.stringify({
              role: 'admin',
              adminEmail: res.admin.email,
              name: res.admin.name || username,
              avatar: res.admin.avatar || 'Z',
              permissions: res.admin.permissions || ['all'],
            })
          )
          window.dispatchEvent(new CustomEvent('u_admin_login_success', { detail: res.admin }))
        }

        // Record audit activity log
        try {
          const [device, location] = await Promise.all([
            Promise.resolve(getDeviceDetails()),
            getLocationDetails(),
          ])
          await recordActivityLog({
            action: 'admin_login',
            category: 'seller_logins',
            logType: 'login',
            title: 'Admin Sign In',
            description: `Administrator "${res.admin.name || username}" logged in from ${location.formatted}.`,
            user: {
              name: res.admin.name || username,
              email: res.admin.email,
              role: 'admin',
              avatar: res.admin.avatar || 'Z',
            },
            location,
            device,
            status: 'success',
            isThisDevice: true,
          })
        } catch {}

        router.replace('/admin/dashboard')
      } else {
        setGeneralError(res.error || 'Invalid credentials. Please check your email and password.')
      }
    } catch (err: any) {
      setGeneralError(err?.message || 'Error signing in. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white">
      {/* ------------------------------------------------------------- */}
      {/* LEFT COLUMN: Midnight Purple Hero Panel (Matching Screenshot) */}
      {/* ------------------------------------------------------------- */}
      <div className="lg:col-span-6 xl:col-span-6 min-h-[500px] lg:min-h-screen bg-gradient-to-br from-[#060411] via-[#14082B] to-[#340A61] text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative overflow-hidden">
        {/* Subtle Ambient Stars / Glowing Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          <div className="absolute top-[26%] right-[22%] w-1.5 h-1.5 rounded-full bg-white/40 blur-[0.5px]" />
          <div className="absolute top-[34%] left-[18%] w-1.5 h-1.5 rounded-full bg-purple-300/40 blur-[0.5px]" />
          <div className="absolute bottom-[28%] right-[16%] w-1 h-1 rounded-full bg-white/30" />
          <div className="absolute top-[18%] left-[28%] w-1 h-1 rounded-full bg-purple-200/20" />
          <div className="absolute bottom-[20%] left-[24%] w-1.5 h-1.5 rounded-full bg-purple-400/30 blur-[0.5px]" />
        </div>

        {/* Center Content Block */}
        <div className="relative z-10 my-auto py-8 text-center max-w-lg mx-auto w-full">
          {/* White Squircle with U Seller Store Cart Logo */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-white shadow-2xl flex items-center justify-center p-3 sm:p-3.5 mx-auto mb-3.5">
            <BrandLogo size="md" showText={false} />
          </div>

          {/* Brand Titles */}
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight m-0">
            U Seller Store
          </h2>
          <p className="text-[10px] sm:text-[11px] font-bold text-purple-200/70 tracking-[0.25em] uppercase mt-1 m-0">
            PREMIUM MARKETPLACE
          </p>

          {/* Small Dot Separator */}
          <div className="w-1.5 h-1.5 rounded-full bg-purple-300/45 mx-auto my-6 sm:my-8" />

          {/* Big Display Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-white tracking-tight leading-[1.08] m-0">
            Shop Smarter.
            <br />
            Live Better.
          </h1>

          {/* Paragraph Copy */}
          <p className="text-sm sm:text-[15px] text-purple-100/75 max-w-md mx-auto mt-4 leading-relaxed font-normal m-0">
            Sign in to continue shopping curated products, track your orders, and manage your wishlist — all in one place.
          </p>
        </div>

        {/* Bottom 3 Feature Cards matching Screenshot */}
        <div className="relative z-10 grid grid-cols-3 gap-3 sm:gap-4 mt-auto pt-6 border-t border-white/10">
          <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl p-3.5 sm:p-4 text-center transition-all hover:bg-white/[0.09]">
            <div className="w-8 h-8 rounded-xl bg-white/[0.08] flex items-center justify-center mx-auto mb-2 text-purple-200">
              <Truck size={17} />
            </div>
            <div className="text-xs font-bold text-white leading-snug">Free Shipping</div>
            <div className="text-[10px] text-purple-200/60 mt-0.5 leading-tight">On orders over $50</div>
          </div>

          <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl p-3.5 sm:p-4 text-center transition-all hover:bg-white/[0.09]">
            <div className="w-8 h-8 rounded-xl bg-white/[0.08] flex items-center justify-center mx-auto mb-2 text-purple-200">
              <ShieldCheck size={17} />
            </div>
            <div className="text-xs font-bold text-white leading-snug">Secure Payments</div>
            <div className="text-[10px] text-purple-200/60 mt-0.5 leading-tight">256-bit SSL</div>
          </div>

          <div className="bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-2xl p-3.5 sm:p-4 text-center transition-all hover:bg-white/[0.09]">
            <div className="w-8 h-8 rounded-xl bg-white/[0.08] flex items-center justify-center mx-auto mb-2 text-purple-200">
              <ShoppingBag size={17} />
            </div>
            <div className="text-xs font-bold text-white leading-snug">Easy Returns</div>
            <div className="text-[10px] text-purple-200/60 mt-0.5 leading-tight">30-day guarantee</div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* RIGHT COLUMN: Pure White Sign In Panel (Matching Screenshot)   */}
      {/* ------------------------------------------------------------- */}
      <div className="lg:col-span-6 xl:col-span-6 min-h-screen bg-white flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative overflow-y-auto">
        {/* Top Bar: Back to Home */}
        <div>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer self-start"
          >
            <ArrowLeft size={14} />
            <span>Back to home</span>
          </button>
        </div>

        {/* Center Container: max-w-[400px] */}
        <div className="w-full max-w-[400px] mx-auto my-auto py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 m-0">
              Welcome Back <span className="text-3xl">👋</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 m-0">Sign in to your account</p>
          </div>

          {/* General Error Banner */}
          {generalError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-500" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Form matching Screenshot */}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="admin-email">
                Email address
              </label>
              <input
                id="admin-email"
                type="text"
                placeholder="you@example.com"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  if (usernameError) setUsernameError('')
                }}
                required
                autoComplete="username email"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 bg-white transition-all shadow-2xs"
              />
              {usernameError && (
                <div className="flex items-center gap-1.5 text-rose-500 text-[11px] mt-1.5">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{usernameError}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="admin-password">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder=""
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (passwordError) setPasswordError('')
                  }}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 bg-white transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordError && (
                <div className="flex items-center gap-1.5 text-rose-500 text-[11px] mt-1.5">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}
              <div className="flex justify-end pt-1.5">
                <button
                  type="button"
                  onClick={() => router.push('/admin/invite')}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Remember me for 30 days */}
            <div
              onClick={() => setRememberMe(!rememberMe)}
              className="flex items-center gap-2.5 pt-1 select-none cursor-pointer"
            >
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                  rememberMe
                    ? 'bg-[#0F172A] border-[#0F172A] text-white'
                    : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
              >
                {rememberMe && <Check size={10} strokeWidth={3} />}
              </div>
              <span className="text-xs text-slate-700 font-medium">Remember me for 30 days</span>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer mt-5 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Signing In…</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Links below form matching screenshot */}
          <p className="text-xs text-slate-600 text-center mt-5 m-0">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => router.push('/?mode=login')}
              className="font-bold text-slate-900 hover:underline cursor-pointer"
            >
              Create one
            </button>
          </p>

          <p className="text-xs text-slate-500 text-center mt-2 m-0">
            Are you a seller?{' '}
            <button
              type="button"
              onClick={() => router.push('/?mode=login')}
              className="underline hover:text-slate-800 cursor-pointer"
            >
              Seller login
            </button>
          </p>

          <p className="text-[11px] text-slate-400 text-center mt-7 m-0 leading-normal">
            By signing in, you agree to our{' '}
            <a href="#" className="underline hover:text-slate-600">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="underline hover:text-slate-600">
              Privacy Policy
            </a>
            .
          </p>
        </div>

        <div className="h-6" />
      </div>
    </main>
  )
}

