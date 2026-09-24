import { recordActivityLog, getDeviceDetails, getLocationDetails } from '@/lib/activity-logger'
import { AdminUser } from '@/lib/supabase/api'

// Default hardcoded platform invite codes that are always valid
export const DEFAULT_INVITE_CODES = [
  'MXSVHSDL',
  'ADMIN-2026',
  'US-STORE-ADMIN',
  'SUPER-ADMIN',
]

const STORAGE_ACTIVE_INVITE_KEY = 'u_admin_active_invite_code'
const STORAGE_CUSTOM_INVITE_CODES_KEY = 'u_admin_custom_invite_codes'

/**
 * Get the currently active invite code displayed in the admin console.
 */
export function getActiveInviteCode(): string {
  if (typeof window === 'undefined') return DEFAULT_INVITE_CODES[0]
  try {
    const stored = localStorage.getItem(STORAGE_ACTIVE_INVITE_KEY)
    if (stored && stored.trim()) return stored.trim().toUpperCase()
  } catch {}
  return DEFAULT_INVITE_CODES[0]
}

/**
 * Get all recognized valid invite codes (defaults + dynamically generated/custom).
 */
export function getAllValidInviteCodes(): string[] {
  const codes = new Set<string>(DEFAULT_INVITE_CODES.map((c) => c.toUpperCase()))
  if (typeof window !== 'undefined') {
    try {
      const active = localStorage.getItem(STORAGE_ACTIVE_INVITE_KEY)
      if (active) codes.add(active.trim().toUpperCase())

      const custom = localStorage.getItem(STORAGE_CUSTOM_INVITE_CODES_KEY)
      if (custom) {
        const parsed = JSON.parse(custom)
        if (Array.isArray(parsed)) {
          parsed.forEach((c) => {
            if (typeof c === 'string' && c.trim()) codes.add(c.trim().toUpperCase())
          })
        }
      }
    } catch {}
  }
  return Array.from(codes)
}

/**
 * Verify if a given code matches any valid admin invite code.
 */
export function verifyInviteCode(code: string): { valid: boolean; normalizedCode: string } {
  if (!code || typeof code !== 'string') return { valid: false, normalizedCode: '' }
  const clean = code.trim().toUpperCase()
  const validCodes = getAllValidInviteCodes()
  const isValid = validCodes.includes(clean)
  return { valid: isValid, normalizedCode: clean }
}

/**
 * Generate a new random 8-character invite code and set as active.
 */
export function generateNewInviteCode(): { code: string; fullLink: string } {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'ADM-'
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_ACTIVE_INVITE_KEY, code)
      const current = getAllValidInviteCodes()
      if (!current.includes(code)) {
        const stored = localStorage.getItem(STORAGE_CUSTOM_INVITE_CODES_KEY)
        const list = stored ? JSON.parse(stored) : []
        localStorage.setItem(STORAGE_CUSTOM_INVITE_CODES_KEY, JSON.stringify([...list, code]))
      }
      window.dispatchEvent(new CustomEvent('u_admin_invite_code_updated', { detail: { code } }))
    } catch {}
  }

  return {
    code,
    fullLink: getAdminInviteLink(code),
  }
}

/**
 * Set a custom invite code.
 */
export function setCustomInviteCode(newCode: string): { success: boolean; code: string; error?: string } {
  const clean = newCode.trim().toUpperCase()
  if (!clean || clean.length < 4) {
    return { success: false, code: clean, error: 'Invite code must be at least 4 characters.' }
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_ACTIVE_INVITE_KEY, clean)
      const stored = localStorage.getItem(STORAGE_CUSTOM_INVITE_CODES_KEY)
      const list = stored ? JSON.parse(stored) : []
      if (!list.includes(clean)) {
        localStorage.setItem(STORAGE_CUSTOM_INVITE_CODES_KEY, JSON.stringify([...list, clean]))
      }
      window.dispatchEvent(new CustomEvent('u_admin_invite_code_updated', { detail: { code: clean } }))
    } catch {}
  }

  return { success: true, code: clean }
}

/**
 * Construct a shareable invitation link.
 */
export function getAdminInviteLink(code?: string): string {
  const targetCode = code ? code.trim().toUpperCase() : getActiveInviteCode()
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  return `${origin}/admin/invite?code=${encodeURIComponent(targetCode)}`
}

/**
 * Check if the current browser session has administrator privileges.
 */
export function getAdminSession(): AdminUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('u_auth_session')
    if (!raw) return null
    const session = JSON.parse(raw)
    if (session && session.role === 'admin') {
      return {
        email: session.adminEmail || session.email || 'admin@usellerstore.com',
        name: session.name || session.adminName || 'Administrator',
        role: 'admin',
        avatar: session.avatar || 'A',
        permissions: session.permissions || ['all'],
      }
    }
  } catch {}
  return null
}

/**
 * Quick boolean check for admin authorization.
 */
export function isAdminAuthenticated(): boolean {
  return getAdminSession() !== null
}

/**
 * Claim an admin invite code and establish the session.
 */
export async function claimAdminInvite(params: {
  code: string
  name?: string
  email?: string
}): Promise<{ success: boolean; admin?: AdminUser; error?: string }> {
  const verification = verifyInviteCode(params.code)
  if (!verification.valid) {
    return {
      success: false,
      error: 'Invalid or expired administrator invite code. Please contact the platform owner.',
    }
  }

  const adminName = params.name?.trim() || 'Platform Administrator'
  const adminEmail = params.email?.trim().toLowerCase() || 'admin@usellerstore.com'

  const adminUser: AdminUser = {
    email: adminEmail,
    name: adminName,
    role: 'admin',
    avatar: adminName.charAt(0).toUpperCase() || 'A',
    permissions: ['all', 'manage_sellers', 'manage_orders', 'kyc_review', 'withdrawals'],
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        'u_auth_session',
        JSON.stringify({
          role: 'admin',
          adminEmail: adminUser.email,
          name: adminUser.name,
          avatar: adminUser.avatar,
          claimedInviteCode: verification.normalizedCode,
          claimedAt: new Date().toISOString(),
        })
      )
      window.dispatchEvent(new CustomEvent('u_admin_login_success', { detail: adminUser }))
    } catch {}
  }

  // Record audit activity log for invite redemption
  try {
    const [device, location] = await Promise.all([
      Promise.resolve(getDeviceDetails()),
      getLocationDetails(),
    ])

    await recordActivityLog({
      action: 'admin_login',
      category: 'seller_logins',
      logType: 'login',
      title: 'Admin Invite Redeemed',
      description: `Administrator "${adminName}" (${adminEmail}) claimed invite code "${verification.normalizedCode}" from ${location.formatted}.`,
      user: {
        name: adminName,
        email: adminEmail,
        role: 'admin',
        avatar: adminUser.avatar,
      },
      location,
      device,
      status: 'success',
      isThisDevice: true,
      metadata: {
        inviteCode: verification.normalizedCode,
        viaInviteLink: true,
      },
    })
  } catch (err) {
    console.warn('[claimAdminInvite] Logging error:', err)
  }

  return { success: true, admin: adminUser }
}

/**
 * Sign out administrator session cleanly.
 */
export function signOutAdmin(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('u_auth_session')
      window.dispatchEvent(new CustomEvent('u_admin_logout'))
    } catch {}
  }
}
