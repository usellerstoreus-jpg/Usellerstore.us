'use client'

import React, { useState } from 'react'
import {
  Camera,
  Check,
  Star,
  ChevronRight,
  Store,
  User as UserIcon,
  Lock,
  Wallet,
  ShieldCheck,
  LogOut,
  CreditCard,
  Shield,
  X,
  Plus,
  KeyRound,
  Mail,
  Phone,
  Globe
} from 'lucide-react'
import { SellerProfile } from '@/lib/mock-data'

interface ProfileViewProps {
  profile: SellerProfile
  onUpdateProfile: (updated: Partial<SellerProfile>) => void
  onSignOut: () => void
  onOpenBalanceModal: () => void
  onToast: (msg: string) => void
}

export function ProfileView({
  profile,
  onUpdateProfile,
  onSignOut,
  onOpenBalanceModal,
  onToast,
}: ProfileViewProps) {
  // Modal states
  const [activeModal, setActiveModal] = useState<
    'none' | 'shop' | 'account' | 'security' | 'payout' | 'verify' | 'logoutConfirm'
  >('none')

  // Form states for modals
  const [shopForm, setShopForm] = useState({
    shopName: profile.shopName,
    phone: profile.phone,
    seoTitle: profile.seoTitle,
    seoDescription: profile.seoDescription,
  })

  const [accountForm, setAccountForm] = useState({
    ownerName: profile.ownerName,
    email: profile.email,
    phone: profile.phone,
  })

  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    transactionPin: '••••',
  })

  const [payoutForm, setPayoutForm] = useState({
    bankName: 'Chase Bank USA',
    accountNumber: '8842991024',
    accountHolder: profile.ownerName,
    cryptoWallet: '0x71C...498f',
  })

  const handleSaveShop = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdateProfile(shopForm)
    setActiveModal('none')
    onToast('Shop information updated successfully')
  }

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdateProfile(accountForm)
    setActiveModal('none')
    onToast('Account details updated successfully')
  }

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveModal('none')
    setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '', transactionPin: '' })
    onToast('Security settings & credentials updated')
  }

  const handleSavePayout = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveModal('none')
    onToast('Payout withdrawal details updated')
  }

  const handleAvatarChange = () => {
    const letters = ['Z', 'T', 'A', 'M', 'S']
    const nextLetter = letters[(letters.indexOf(profile.avatarLetter) + 1) % letters.length]
    onUpdateProfile({ avatarLetter: nextLetter })
    onToast(`Avatar updated`)
  }

  return (
    <div className="profile-view-container max-w-4xl mx-auto space-y-5 pb-12">
      {/* Top Navy Hero Banner as in Screenshot 4 */}
      <div className="profile-hero-banner bg-gradient-to-r from-[#0d2238] via-[#123654] to-[#0f2c47] rounded-2xl p-7 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Large Avatar container with camera upload */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-[#324f68] text-white text-3xl font-extrabold flex items-center justify-center border-2 border-[#527493] shadow-inner">
              {profile.avatarLetter}
            </div>
            <button
              type="button"
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-white text-slate-800 rounded-full flex items-center justify-center shadow-md hover:bg-slate-100 hover:scale-110 transition-transform"
              onClick={handleAvatarChange}
              title="Change Profile Photo"
            >
              <Camera size={14} />
            </button>
          </div>

          {/* User Details */}
          <div className="space-y-1.5 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-white">{profile.shopName}</h1>
            <p className="text-sm text-slate-300 font-medium">{profile.ownerName}</p>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {profile.verified && (
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  <Check size={12} strokeWidth={2.5} /> Verified
                </span>
              )}
              {profile.active && (
                <span className="inline-flex items-center bg-slate-800/80 text-slate-200 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-700">
                  Active
                </span>
              )}
              <span className="inline-flex items-center gap-1 bg-slate-800/80 text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-700">
                {profile.rating.toFixed(1)} <Star size={12} className="fill-amber-400 text-amber-400" />
              </span>
            </div>

            <p className="text-xs text-slate-400 pt-0.5">Member since {profile.memberSince}</p>
          </div>
        </div>
      </div>

      {/* Split Balance & Guarantee Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl border border-slate-200 shadow-xs divide-y md:divide-y-0 md:divide-x divide-slate-200 overflow-hidden">
        <button
          type="button"
          className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
          onClick={onOpenBalanceModal}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <CreditCard size={20} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                SHOP BALANCE
              </span>
              <strong className="text-xl font-extrabold text-slate-900">${profile.balance.toFixed(2)}</strong>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </button>

        <div className="flex items-center justify-between p-4 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                GUARANTEE
              </span>
              <strong className="text-xl font-extrabold text-slate-900">${profile.guarantee.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Menu Items Stack */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {/* 1. Shop */}
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
          onClick={() => setActiveModal('shop')}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Store size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Shop</h3>
              <p className="text-xs text-slate-500">Shop name, phone & SEO</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </button>

        {/* 2. Account */}
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
          onClick={() => setActiveModal('account')}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <UserIcon size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Account</h3>
              <p className="text-xs text-slate-500">Email & contact details</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </button>

        {/* 3. Security */}
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
          onClick={() => setActiveModal('security')}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Security</h3>
              <p className="text-xs text-slate-500">Login & transaction password</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </button>

        {/* 4. Payout Method */}
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
          onClick={() => setActiveModal('payout')}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Wallet size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Payout Method</h3>
              <p className="text-xs text-slate-500">Bank accounts & wallets for withdrawals</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </button>

        {/* 5. Verify */}
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
          onClick={() => setActiveModal('verify')}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Verify</h3>
              <p className="text-xs text-slate-500">Identity verification</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </button>
      </div>

      {/* Log out Bottom Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 hover:bg-red-50/50 transition-colors text-left"
          onClick={() => setActiveModal('logoutConfirm')}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
              <LogOut size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-600">Log out</h3>
              <p className="text-xs text-slate-500">Sign out of your seller account</p>
            </div>
          </div>
        </button>
      </div>

      {/* MODALS */}

      {/* Shop Modal */}
      {activeModal === 'shop' && (
        <div className="modal-backdrop fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Store size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Shop Settings</h3>
                  <p className="text-xs text-slate-500">Manage store brand and public profile</p>
                </div>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                onClick={() => setActiveModal('none')}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveShop} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Shop Display Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={shopForm.shopName}
                  onChange={(e) => setShopForm({ ...shopForm, shopName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Shop Phone Number
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={shopForm.phone}
                  onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  SEO Meta Title
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={shopForm.seoTitle}
                  onChange={(e) => setShopForm({ ...shopForm, seoTitle: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  SEO Description
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={shopForm.seoDescription}
                  onChange={(e) => setShopForm({ ...shopForm, seoDescription: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
                  onClick={() => setActiveModal('none')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Modal */}
      {activeModal === 'account' && (
        <div className="modal-backdrop fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserIcon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Account Details</h3>
                  <p className="text-xs text-slate-500">Manage seller contact information</p>
                </div>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                onClick={() => setActiveModal('none')}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Owner Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={accountForm.ownerName}
                  onChange={(e) => setAccountForm({ ...accountForm, ownerName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={accountForm.email}
                  onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Direct Phone
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={accountForm.phone}
                  onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
                  onClick={() => setActiveModal('none')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md"
                >
                  Update Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Modal */}
      {activeModal === 'security' && (
        <div className="modal-backdrop fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Security & Password</h3>
                  <p className="text-xs text-slate-500">Update login password and withdrawal PIN</p>
                </div>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                onClick={() => setActiveModal('none')}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSecurity} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={securityForm.currentPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new strong password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={securityForm.newPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Transaction / Withdrawal PIN (6 Digits)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  value={securityForm.transactionPin}
                  onChange={(e) => setSecurityForm({ ...securityForm, transactionPin: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
                  onClick={() => setActiveModal('none')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md"
                >
                  Update Security
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout Method Modal */}
      {activeModal === 'payout' && (
        <div className="modal-backdrop fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Payout Methods</h3>
                  <p className="text-xs text-slate-500">Bank accounts & crypto addresses for withdrawals</p>
                </div>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                onClick={() => setActiveModal('none')}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePayout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Bank Name
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={payoutForm.bankName}
                  onChange={(e) => setPayoutForm({ ...payoutForm, bankName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Account / IBAN Number
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  value={payoutForm.accountNumber}
                  onChange={(e) => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  USDT (TRC20 / ERC20) Address (Optional)
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  value={payoutForm.cryptoWallet}
                  onChange={(e) => setPayoutForm({ ...payoutForm, cryptoWallet: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
                  onClick={() => setActiveModal('none')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md"
                >
                  Save Payout Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify (KYC) Modal */}
      {activeModal === 'verify' && (
        <div className="modal-backdrop fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Identity Verification</h3>
                  <p className="text-xs text-slate-500">Tier 1 Verified Seller Account</p>
                </div>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                onClick={() => setActiveModal('none')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={16} strokeWidth={3} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-emerald-900">KYC Status: Approved</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Your government identification and store registration documents have been validated.
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400">Account Type</span>
                  <span className="font-semibold text-slate-800">Individual Merchant</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400">Verification ID</span>
                  <span className="font-mono font-semibold text-slate-800">#6bc54j84</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Approval Date</span>
                  <span className="font-semibold text-slate-800">7 August 2026</span>
                </div>
              </div>

              <button
                type="button"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm"
                onClick={() => setActiveModal('none')}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirm Modal */}
      {activeModal === 'logoutConfirm' && (
        <div className="modal-backdrop fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="modal-content bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <LogOut size={24} />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Log out of your account?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              You will need to sign in again with your credentials to access your store dashboard.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
                onClick={() => setActiveModal('none')}
              >
                Stay Logged In
              </button>
              <button
                type="button"
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm shadow-md"
                onClick={() => {
                  setActiveModal('none')
                  onSignOut()
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
