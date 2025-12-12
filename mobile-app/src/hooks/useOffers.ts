import { useQuery } from '@tanstack/react-query';
import {
  getNearbyOffers,
  getTrendingOffers,
  getExpiringSoonOffers,
  getUpcomingOffers,
  getAllOffers,
  getOfferById,
} from '../services/offersService';
import { Location } from '../types/offer';

/**
 * Hook to fetch nearby offers with caching
 */
export function useNearbyOffers(
  location: Location | null,
  radius: number = 10,
  limit: number = 4,
  offset: number = 0,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['offers', 'nearby', location?.lat, location?.lng, radius, limit, offset],
    queryFn: async () => {
      if (!location) throw new Error('Location required');
      return getNearbyOffers(location, radius, limit, offset);
    },
    enabled: enabled && !!location,
    staleTime: 3 * 60 * 1000, // 3 minutes for nearby offers (more dynamic)
  });
}

/**
 * Hook to fetch trending offers with caching
 */
export function useTrendingOffers(
  limit: number = 4,
  offset: number = 0,
  userLocation?: Location,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['offers', 'trending', limit, offset],
    queryFn: () => getTrendingOffers(limit, offset, userLocation),
    enabled,
  });
}

/**
 * Hook to fetch expiring soon offers with caching
 */
export function useExpiringSoonOffers(
  hours: number = 24,
  limit: number = 4,
  offset: number = 0,
  userLocation?: Location,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['offers', 'expiring', hours, limit, offset],
    queryFn: () => getExpiringSoonOffers(hours, limit, offset, userLocation),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes for expiring offers (very dynamic)
  });
}

/**
 * Hook to fetch upcoming offers with caching
 */
export function useUpcomingOffers(
  page: number = 1,
  limit: number = 4,
  userLocation?: Location,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['offers', 'upcoming', page, limit],
    queryFn: () => getUpcomingOffers(page, limit, userLocation),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes for upcoming offers
  });
}

/**
 * Hook to fetch all offers with caching
 */
export function useAllOffers(
  page: number = 1,
  size: number = 4,
  userLocation?: Location,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['offers', 'all', page, size],
    queryFn: () => getAllOffers(page, size, userLocation),
    enabled,
  });
}

/**
 * Hook to fetch a specific offer by ID with caching
 */
export function useOfferById(offerId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['offer', offerId],
    queryFn: () => getOfferById(offerId),
    enabled: enabled && !!offerId,
  });
}
