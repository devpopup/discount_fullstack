'use client'

import { AuthProvider } from '@/context/AuthContext'
import { ClaimsProvider } from '@/context/ClaimsContext'

export default function AuthWrapper({ children }) {
  return (
    <AuthProvider>
      <ClaimsProvider>
        {children}
      </ClaimsProvider>
    </AuthProvider>
  )
}