'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminIndexPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-semibold">
      Loading Admin Console…
    </div>
  )
}
