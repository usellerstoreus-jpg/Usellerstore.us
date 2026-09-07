'use client'

import React, { useState } from 'react'
import {
  CreditCard,
  Shield,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  CheckCircle,
  Building,
  DollarSign
} from 'lucide-react'
import { SellerProfile } from '@/lib/mock-data'

interface BalanceModalProps {
  isOpen: boolean
  profile: SellerProfile
  onClose: () => void
  onWithdraw: (amount: number) => void
  onToast: (msg: string) => void
}

export function BalanceModal({
  isOpen,
  profile,
  onClose,
  onWithdraw,
  onToast,
}: BalanceModalProps) {
  const [tab, setTab] = useState<'overview' | 'withdraw'>('overview')
  const [withdrawAmount, setWithdrawAmount] = useState('')

  if (!isOpen) return null

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) {
      onToast('Please enter a valid amount')
      return
    }
    if (amount > profile.balance) {
      onToast('Withdrawal amount exceeds available shop balance')
      return
    }
    onWithdraw(amount)
    setWithdrawAmount('')
    setTab('overview')
    onToast(`Withdrawal request for $${amount.toFixed(2)} submitted for processing`)
  }

  return (
    <div className="modal-backdrop fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="modal-content bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Store Financials</h3>
              <p className="text-xs text-slate-500">Balance, Guarantees & Payouts</p>
            </div>
          </div>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {tab === 'overview' ? (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-[#123d63] to-[#286797] text-white p-5 rounded-2xl shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                    Available Balance
                  </span>
                  <strong className="text-3xl font-extrabold mt-1 block">${profile.balance.toFixed(2)}</strong>
                </div>
                <span className="text-[11px] bg-white/20 text-white px-2.5 py-1 rounded-full font-bold">
                  {profile.currency}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-white/20 flex justify-between text-xs text-slate-200">
                <span>Guarantee Deposit:</span>
                <span className="font-bold">${profile.guarantee.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
                onClick={() => setTab('withdraw')}
              >
                <ArrowUpRight size={15} /> Request Withdrawal
              </button>
              <button
                type="button"
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5"
                onClick={() => onToast('Deposit feature is managed through admin top-ups')}
              >
                <ArrowDownLeft size={15} /> Deposit Info
              </button>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-500 block mb-2">Connected Payout Method</span>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Building size={16} className="text-slate-500" />
                  <div>
                    <span className="font-bold text-slate-800 block">Chase Bank USA</span>
                    <span className="text-slate-400">•••• 8842</span>
                  </div>
                </div>
                <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Verified</span>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleWithdrawSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Amount to Withdraw ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="0.00"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Available: ${profile.balance.toFixed(2)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payout Destination
              </label>
              <select className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Chase Bank USA (•••• 8842)</option>
                <option>USDT Wallet TRC20 (0x71C...)</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
                onClick={() => setTab('overview')}
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md"
              >
                Confirm Withdraw
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
