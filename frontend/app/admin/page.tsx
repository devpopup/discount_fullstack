'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin-api'

export default function AdminHomePage() {
  const router = useRouter()

  useEffect(() => {
    if (isAdminAuthenticated()) {
      router.push('/admin/offers')
    } else {
      router.push('/admin/login')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Redirecting...</p>
    </div>
  )
}
