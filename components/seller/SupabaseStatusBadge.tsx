'use client'

import React, { useState, useEffect } from 'react'
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  X,
  Sparkles,
  Server,
  Layers
} from 'lucide-react'
import { checkSupabaseConnection, seedInitialDataToSupabase, ConnectionStatus } from '@/lib/supabase/api'
import { isSupabaseConfigured } from '@/lib/supabase/client'

interface SupabaseStatusBadgeProps {
  onDataRefreshed?: () => void
  onToast?: (msg: string) => void
}

export function SupabaseStatusBadge({ onDataRefreshed, onToast }: SupabaseStatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [copiedSql, setCopiedSql] = useState(false)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const res = await checkSupabaseConnection()
      setStatus(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const res = await seedInitialDataToSupabase()
      if (res.success) {
        onToast?.(res.message)
        await checkStatus()
        onDataRefreshed?.()
      } else {
        onToast?.(`Error: ${res.message}`)
      }
    } catch (err: any) {
      onToast?.(err.message || 'Seeding failed')
    } finally {
      setSeeding(false)
    }
  }

  const handleCopySqlInstructions = () => {
    const instructions = `-- Open Supabase Dashboard (https://supabase.com/dashboard)
-- Navigate to your project -> SQL Editor -> New Query
-- Copy and paste the contents of d:/u-seller-store/supabase/schema.sql and click Run!`
    navigator.clipboard?.writeText(instructions)
    setCopiedSql(true)
    onToast?.('SQL schema instructions copied to clipboard!')
    setTimeout(() => setCopiedSql(false), 2500)
  }

  const isConfigured = isSupabaseConfigured()
  const isConnected = status?.isConnected

  return (
    <>
      {/* Floating or Header Status Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(true)
          checkStatus()
        }}
        className={`supabase-status-pill inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm ${
          isConnected
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
            : isConfigured
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'
        }`}
        title="Click to view Supabase connection status & setup"
      >
        <Database size={13} className={isConnected ? 'text-emerald-500' : 'text-blue-500'} />
        <span className="font-semibold">Supabase</span>
        <span
          className={`w-2 h-2 rounded-full ${
            isConnected
              ? 'bg-emerald-500 animate-pulse'
              : isConfigured
              ? 'bg-amber-500 animate-pulse'
              : 'bg-blue-500'
          }`}
        />
        <span className="text-[11px] opacity-90 hidden sm:inline">
          {isConnected ? 'Connected' : isConfigured ? 'Connecting...' : 'Setup'}
        </span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Database size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                    Supabase Integration
                    {isConnected && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Real-time PostgreSQL database & API synchronization
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 overflow-y-auto text-sm">
              {/* Status Box */}
              <div
                className={`p-4 rounded-xl border ${
                  isConnected
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                    : isConfigured
                    ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200'
                    : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isConnected ? (
                    <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">
                      {isConnected
                        ? 'Connected to Supabase'
                        : isConfigured
                        ? 'Configuration detected, verifying connection'
                        : 'Using Local Fallback State'}
                    </p>
                    <p className="text-xs opacity-90 leading-relaxed">
                      {isConnected
                        ? `Live latency: ${status?.latencyMs ?? 0}ms · Products in DB: ${status?.productsCount ?? 0} · Orders in DB: ${status?.ordersCount ?? 0}`
                        : status?.error ||
                          'The website is currently operating with high-fidelity local state. Provide your credentials in .env.local to activate cloud persistence.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Step by step guide */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Quick Setup in 2 Steps
                </h4>

                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/70 dark:border-zinc-700/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px]">
                        1
                      </span>
                      Set credentials in <code className="font-mono text-emerald-600 dark:text-emerald-400">.env.local</code>
                    </span>
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-blue-600 dark:text-blue-400 inline-flex items-center gap-1 hover:underline"
                    >
                      Supabase Dashboard <ExternalLink size={11} />
                    </a>
                  </div>
                  <pre className="text-[11px] bg-zinc-900 text-zinc-100 p-2.5 rounded-lg overflow-x-auto font-mono">
                    {`NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>`}
                  </pre>
                </div>

                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200/70 dark:border-zinc-700/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px]">
                        2
                      </span>
                      Run Database Migration Script
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySqlInstructions}
                      className="text-[11px] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white inline-flex items-center gap-1"
                    >
                      {copiedSql ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      {copiedSql ? 'Copied' : 'Copy path'}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    A ready-to-run schema file is provided at{' '}
                    <code className="bg-zinc-200/70 dark:bg-zinc-700 px-1 py-0.5 rounded text-[11px] font-mono">
                      supabase/schema.sql
                    </code>{' '}
                    with tables for Products, Orders, Notifications, and Profiles.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={checkStatus}
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                  <span>Test Connection</span>
                </button>

                {isConnected && (
                  <button
                    type="button"
                    onClick={handleSeed}
                    disabled={seeding}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50"
                  >
                    <Sparkles size={13} className={seeding ? 'animate-spin' : ''} />
                    <span>{seeding ? 'Seeding...' : 'Push Starter Catalog to DB'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-zinc-50/80 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Server size={12} />
                Client: @supabase/supabase-js
              </span>
              <span>U Seller Store v0.1</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
