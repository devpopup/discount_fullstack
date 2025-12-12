import { useInfiniteQuery } from '@tanstack/react-query';
import {
  getNearbyOffers,
  getTrendingOffers,
  getExpiringSoonOffers,
  getUpcomingOffers,
  getAllOffers,
} from '../services/offersService';
import { Location } from '../types/offer';

/**
 * Hook for infinite scroll nearby offers
 */
export function useInfiniteNearbyOffers(
  location: Location | null,
  radius: number = 10,
  limit: number = 20,
  enabled: boolean = true
) {
  return useInfiniteQuery({
    queryKey: ['offers', 'nearby', 'infinite', location?.lat, location?.lng, radius, limit],
    queryFn: async ({ pageParam = 0 }) => {
      if (!location) throw new Error('Location required');
      return getNearbyOffers(location, radius, limit, pageParam);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasMore) {
        return allPages.length * limit;
      }
      return undefined;
    },
    enabled: enabled && !!location,
  });
}

/**
 * Hook for infinite scroll trending offers
 */
export function useInfiniteTrendingOffers(
  limit: number = 20,
  userLocation?: Location,
  enabled: boolean = true
) {
  return useInfiniteQuery({
    queryKey: ['offers', 'trending', 'infinite', limit],
    queryFn: async ({ pageParam = 0 }) => {
      return getTrendingOffers(limit, pageParam, userLocation);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasMore) {
        return allPages.length * limit;
      }
      return undefined;
    },
    enabled,
  });
}

/**
 * Hook for infinite scroll expiring offers
 */
export function useInfiniteExpiringSoonOffers(
  hours: number = 24,
  limit: number = 20,
  userLocation?: Location,
  enabled: boolean = true
) {
  return useInfiniteQuery({
    queryKey: ['offers', 'expiring', 'infinite', hours, limit],
    queryFn: async ({ pageParam = 0 }) => {
      return getExpiringSoonOffers(hours, limit, pageParam, userLocation);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasMore) {
        return allPages.length * limit;
      }
      return undefined;
    },
    enabled,
  });
}

/**
 * Hook for infinite scroll upcoming offers
 */
export function useInfiniteUpcomingOffers(
  limit: number = 20,
  userLocation?: Location,
  enabled: boolean = true
) {
  return useInfiniteQuery({
    queryKey: ['offers', 'upcoming', 'infinite', limit],
    queryFn: async ({ pageParam = 1 }) => {
      return getUpcomingOffers(pageParam, limit, userLocation);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasMore) {
        return allPages.length + 1;
      }
      return undefined;
    },
    enabled,
  });
}

/**
 * Hook for infinite scroll all offers
 */
export function useInfiniteAllOffers(
  size: number = 20,
  userLocation?: Location,
  enabled: boolean = true
) {
  return useInfiniteQuery({
    queryKey: ['offers', 'all', 'infinite', size],
    queryFn: async ({ pageParam = 1 }) => {
      return getAllOffers(pageParam, size, userLocation);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasMore) {
        return allPages.length + 1;
      }
      return undefined;
    },
    enabled,
  });
}
