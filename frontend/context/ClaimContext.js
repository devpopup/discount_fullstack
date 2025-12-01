'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getClaimedOfferIds, claimOffer as apiClaimOffer, unclaimOffer as apiUnclaimOffer, getClaimedOffers } from '@/lib/offers-api'
import { useAuth } from './AuthContext'

const ClaimContext = createContext(null)

export function ClaimProvider({ children }) {
  const { user } = useAuth()
  const [claimedOfferIds, setClaimedOfferIds] = useState(new Set())
  const [claimDetails, setClaimDetails] = useState(new Map()) // Map<offerId, claimData[]> - Array of claims per offer
  const [loading, setLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)

  // Refresh claimed offers from API
  const refreshClaims = useCallback(async () => {
    if (!user) {
      setClaimedOfferIds(new Set())
      setClaimDetails(new Map())
      return
    }

    try {
      setLoading(true)
      // Fetch all claimed offers with details
      const result = await getClaimedOffers({ page: 1, size: 100 })

      if (result.claimed_offers) {
        const ids = new Set()
        const details = new Map()

        result.claimed_offers.forEach(claim => {
          const offer = claim.offer || claim.offers
          const offerId = offer?.id || claim.offer_id

          if (offerId) {
            ids.add(offerId)

            // Store claims as an array per offer (user can have multiple claims for same offer)
            const claimData = {
              id: claim.id,
              offerId,
              isRedeemed: claim.is_redeemed || false,
              redeemedAt: claim.redeemed_at,
              claimedAt: claim.claimed_at,
              uniqueClaimId: claim.unique_claim_id,
              quantity: claim.quantity || 1,
              claimType: claim.claim_type || 'in_store'
            }

            // Add to array of claims for this offer
            if (details.has(offerId)) {
              details.get(offerId).push(claimData)
            } else {
              details.set(offerId, [claimData])
            }
          }
        })

        setClaimedOfferIds(ids)
        setClaimDetails(details)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('Error refreshing claims:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Initial load
  useEffect(() => {
    refreshClaims()
  }, [refreshClaims])

  // Check if an offer is claimed
  const isClaimed = useCallback((offerId) => {
    return claimedOfferIds.has(offerId)
  }, [claimedOfferIds])

  // Get all claim details for an offer (returns array)
  const getClaimDetails = useCallback((offerId) => {
    return claimDetails.get(offerId) || []
  }, [claimDetails])

  // Get total quantity claimed for an offer (sum of all claims)
  const getTotalQuantityClaimed = useCallback((offerId) => {
    const claims = claimDetails.get(offerId) || []
    return claims.reduce((total, claim) => total + claim.quantity, 0)
  }, [claimDetails])

  // Get remaining quota for an offer based on max_claims_per_user
  const getRemainingQuota = useCallback((offerId, maxClaimsPerUser) => {
    if (!maxClaimsPerUser) return Infinity // No limit
    const totalClaimed = getTotalQuantityClaimed(offerId)
    return Math.max(0, maxClaimsPerUser - totalClaimed)
  }, [getTotalQuantityClaimed])

  // Check if user can claim more (has remaining quota)
  const canClaimMore = useCallback((offerId, maxClaimsPerUser) => {
    if (!maxClaimsPerUser) return true // No limit
    const remaining = getRemainingQuota(offerId, maxClaimsPerUser)
    return remaining > 0
  }, [getRemainingQuota])

  // Check if user has any unredeemed claims (for unclaim button)
  const hasUnredeemedClaims = useCallback((offerId) => {
    const claims = claimDetails.get(offerId) || []
    return claims.some(claim => !claim.isRedeemed)
  }, [claimDetails])

  // Check if a claim can be unclaimed (has at least one unredeemed claim)
  const canUnclaim = useCallback((offerId) => {
    return hasUnredeemedClaims(offerId)
  }, [hasUnredeemedClaims])

  // Claim an offer with optimistic update
  const claimOfferOptimistic = useCallback(async (offerId, claimType = 'in_store', quantity = 1, redirectUrl = null) => {
    if (!user) {
      throw new Error('User must be logged in to claim offers')
    }

    // Optimistic update - add to existing claims array
    const tempClaimData = {
      id: 'temp',
      offerId,
      isRedeemed: false,
      redeemedAt: null,
      claimedAt: new Date().toISOString(),
      uniqueClaimId: 'pending',
      quantity,
      claimType
    }

    // Store previous state for rollback
    const previousState = {
      ids: new Set(claimedOfferIds),
      details: new Map(claimDetails)
    }

    setClaimedOfferIds(prev => new Set([...prev, offerId]))
    setClaimDetails(prev => {
      const newMap = new Map(prev)
      const existingClaims = newMap.get(offerId) || []
      newMap.set(offerId, [...existingClaims, tempClaimData])
      return newMap
    })

    try {
      const result = await apiClaimOffer(offerId, claimType, quantity, redirectUrl)

      if (result.success) {
        // Refresh to get accurate server state
        await refreshClaims()
        return result
      } else {
        // Rollback on failure
        setClaimedOfferIds(previousState.ids)
        setClaimDetails(previousState.details)
        throw new Error(result.error || 'Failed to claim offer')
      }
    } catch (error) {
      // Rollback on error
      setClaimedOfferIds(previousState.ids)
      setClaimDetails(previousState.details)
      throw error
    }
  }, [user, refreshClaims, claimedOfferIds, claimDetails])

  // Unclaim an offer with validation and optimistic update
  // This removes ONE unredeemed claim for the offer
  const unclaimOfferOptimistic = useCallback(async (offerId) => {
    if (!user) {
      throw new Error('User must be logged in')
    }

    // Check if can unclaim (has at least one unredeemed claim)
    const claims = claimDetails.get(offerId) || []
    const unredeemedClaim = claims.find(claim => !claim.isRedeemed)

    if (!unredeemedClaim) {
      throw new Error('Cannot unclaim - all claims for this offer have been redeemed')
    }

    // Store previous state for rollback
    const previousState = {
      ids: new Set(claimedOfferIds),
      details: new Map(claimDetails)
    }

    // Optimistic update - remove the unredeemed claim from array
    setClaimDetails(prev => {
      const newMap = new Map(prev)
      const updatedClaims = claims.filter(claim => claim.id !== unredeemedClaim.id)

      if (updatedClaims.length === 0) {
        // No more claims for this offer
        newMap.delete(offerId)
        setClaimedOfferIds(prevIds => {
          const newSet = new Set(prevIds)
          newSet.delete(offerId)
          return newSet
        })
      } else {
        // Still have other claims
        newMap.set(offerId, updatedClaims)
      }

      return newMap
    })

    try {
      const result = await apiUnclaimOffer(offerId)

      if (result.success) {
        // Refresh to sync with server
        await refreshClaims()
        return result
      } else {
        // Rollback on failure
        setClaimedOfferIds(previousState.ids)
        setClaimDetails(previousState.details)
        throw new Error(result.error || 'Failed to unclaim offer')
      }
    } catch (error) {
      // Rollback on error
      setClaimedOfferIds(previousState.ids)
      setClaimDetails(previousState.details)
      throw error
    }
  }, [user, claimDetails, claimedOfferIds, refreshClaims])

  const value = {
    claimedOfferIds,
    claimDetails,
    loading,
    lastRefresh,
    isClaimed,
    getClaimDetails,
    getTotalQuantityClaimed,
    getRemainingQuota,
    canClaimMore,
    hasUnredeemedClaims,
    canUnclaim,
    claimOffer: claimOfferOptimistic,
    unclaimOffer: unclaimOfferOptimistic,
    refreshClaims
  }

  return (
    <ClaimContext.Provider value={value}>
      {children}
    </ClaimContext.Provider>
  )
}

export function useClaims() {
  const context = useContext(ClaimContext)
  if (!context) {
    throw new Error('useClaims must be used within a ClaimProvider')
  }
  return context
}
