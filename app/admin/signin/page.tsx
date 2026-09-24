'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminSignInRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/login')
  }, [router])

  return (
    <div className="min-h-screen bg-[#0A0D1B] flex items-center justify-center text-white text-xs font-semibold">
      Loading Admin Sign In…
    </div>
  )
}
