'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getNearbyOffers,
  getTrendingOffers,
  getExpiringSoonOffers,
  searchOffers,
  getOfferById,
  saveOfferToFavorites,
  removeOfferFromFavorites,
  getFavoriteOffers,
  claimOffer,
  unclaimOffer,
  getClaimedOffers,
  transformOfferDataWithDistance
} from '@/lib/offers-api'

// ============================================================================
// QUERY KEYS - Centralized for cache management
// ============================================================================

export const offerKeys = {
  all: ['offers'],
  nearby: (location) => ['offers', 'nearby', location],
  trending: (limit) => ['offers', 'trending', limit],
  expiring: (hours, limit) => ['offers', 'expiring', hours, limit],
  search: (filters) => ['offers', 'search', filters],
  detail: (id) => ['offers', 'detail', id],
  favorites: (page, size) => ['offers', 'favorites', page, size],
  claimed: (page, size, filters) => ['offers', 'claimed', page, size, filters],
}

// ============================================================================
// OFFER QUERIES
// ============================================================================

/**
 * Hook to fetch nearby offers with automatic caching and revalidation
 */
export function useNearbyOffers(location, options = {}) {
  const { limit = 20, categoryId = null, enabled = true } = options

  return useQuery({
    queryKey: offerKeys.nearby({ lat: location?.lat, lng: location?.lng, limit, categoryId }),
    queryFn: async () => {
      const result = await getNearbyOffers({
        lat: location.lat,
        lng: location.lng,
        limit,
        categoryId
      })

      // Transform offers with distance
      const transformedOffers = result.offers.map(offer =>
        transformOfferDataWithDistance(offer, location)
      ).filter(offer => offer && offer.id)

      return { ...result, offers: transformedOffers }
    },
    enabled: enabled && !!location?.lat && !!location?.lng,
    staleTime: 2 * 60 * 1000, // 2 minutes for location-based data
  })
}

/**
 * Hook to fetch trending offers
 */
export function useTrendingOffers(options = {}) {
  const { limit = 10, categoryId = null, userLocation = null } = options

  return useQuery({
    queryKey: offerKeys.trending({ limit, categoryId }),
    queryFn: async () => {
      const result = await getTrendingOffers({ limit, categoryId })

      // Transform offers with distance calculation
      const transformedOffers = result.offers.map(offer =>
        transformOfferDataWithDistance(offer, userLocation)
      ).filter(offer => offer && offer.id)

      return { ...result, offers: transformedOffers }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for trending data
  })
}

/**
 * Hook to fetch expiring soon offers
 */
export function useExpiringSoonOffers(options = {}) {
  const { hours = 24, limit = 10, userLocation = null } = options

  return useQuery({
    queryKey: offerKeys.expiring(hours, limit),
    queryFn: async () => {
      const result = await getExpiringSoonOffers({ hours, limit })

      // Transform offers with distance calculation
      const transformedOffers = result.offers.map(offer =>
        transformOfferDataWithDistance(offer, userLocation)
      ).filter(offer => offer && offer.id)

      return { ...result, offers: transformedOffers }
    },
    staleTime: 60 * 1000, // 1 minute for time-sensitive data
  })
}

/**
 * Hook to search offers with debouncing built-in
 */
export function useSearchOffers(filters = {}, enabled = true) {
  return useQuery({
    queryKey: offerKeys.search(filters),
    queryFn: () => searchOffers(filters),
    enabled,
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook to fetch a single offer by ID
 */
export function useOffer(offerId, enabled = true) {
  return useQuery({
    queryKey: offerKeys.detail(offerId),
    queryFn: () => getOfferById(offerId),
    enabled: enabled && !!offerId,
    staleTime: 3 * 60 * 1000,
  })
}

// ============================================================================
// FAVORITES QUERIES & MUTATIONS
// ============================================================================

/**
 * Hook to fetch favorite offers
 */
export function useFavoriteOffers(options = {}) {
  const { page = 1, size = 20, activeOnly = true } = options

  return useQuery({
    queryKey: offerKeys.favorites(page, size),
    queryFn: () => getFavoriteOffers({ page, size, activeOnly }),
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook to save an offer to favorites
 */
export function useSaveOfferMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (offerId) => saveOfferToFavorites(offerId),
    onSuccess: () => {
      // Invalidate favorites queries to refetch
      queryClient.invalidateQueries({ queryKey: offerKeys.favorites() })
    },
  })
}

/**
 * Hook to remove an offer from favorites
 */
export function useRemoveOfferMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (offerId) => removeOfferFromFavorites(offerId),
    onSuccess: () => {
      // Invalidate favorites queries to refetch
      queryClient.invalidateQueries({ queryKey: offerKeys.favorites() })
    },
  })
}

// ============================================================================
// CLAIM QUERIES & MUTATIONS
// ============================================================================

/**
 * Hook to fetch claimed offers
 */
export function useClaimedOffers(options = {}) {
  const { page = 1, size = 20, redeemed_only = null, claim_type = null } = options

  return useQuery({
    queryKey: offerKeys.claimed(page, size, { redeemed_only, claim_type }),
    queryFn: () => getClaimedOffers({ page, size, redeemed_only, claim_type }),
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook to claim an offer
 */
export function useClaimOfferMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ offerId, claimType, redirectUrl }) =>
      claimOffer(offerId, claimType, redirectUrl),
    onSuccess: () => {
      // Invalidate claimed offers queries to refetch
      queryClient.invalidateQueries({ queryKey: offerKeys.claimed() })
    },
  })
}

/**
 * Hook to unclaim an offer
 */
export function useUnclaimOfferMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (offerId) => unclaimOffer(offerId),
    onSuccess: () => {
      // Invalidate claimed offers queries to refetch
      queryClient.invalidateQueries({ queryKey: offerKeys.claimed() })
    },
  })
}
