'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { getClaimedOfferIds } from '@/lib/offers-api'
import { useAuth } from './AuthContext'

const ClaimsContext = createContext({
  claimedIds: new Set(),
  loading: true,
  addClaim: () => {},
  removeClaim: () => {},
  refreshClaims: async () => {}
})

export function ClaimsProvider({ children }) {
  const [claimedIds, setClaimedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Load claimed IDs when user changes
  useEffect(() => {
    loadClaimedIds()
  }, [user])

  const loadClaimedIds = async () => {
    if (!user) {
      setClaimedIds(new Set())
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const ids = await getClaimedOfferIds()
      setClaimedIds(ids)
    } catch (error) {
      console.error('Error loading claimed IDs:', error)
      setClaimedIds(new Set())
    } finally {
      setLoading(false)
    }
  }

  const addClaim = (offerId) => {
    setClaimedIds(prev => {
      const newSet = new Set(prev)
      newSet.add(offerId)
      return newSet
    })
  }

  const removeClaim = (offerId) => {
    setClaimedIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(offerId)
      return newSet
    })
  }

  const refreshClaims = async () => {
    await loadClaimedIds()
  }

  return (
    <ClaimsContext.Provider value={{ claimedIds, loading, addClaim, removeClaim, refreshClaims }}>
      {children}
    </ClaimsContext.Provider>
  )
}

export function useClaims() {
  const context = useContext(ClaimsContext)
  if (!context) {
    throw new Error('useClaims must be used within a ClaimsProvider')
  }
  return context
}
