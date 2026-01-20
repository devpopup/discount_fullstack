import apiClient from './api';
import { Offer, OffersResponse, Location } from '../types/offer';
import { calculateDistance } from '../utils/location';

/**
 * Simple cache for API responses to reduce network calls
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  set<T>(key: string, data: T, ttlMs: number = 300000): void { // 5 min default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

const apiCache = new SimpleCache();

/**
 * Transform API offer data to match our app's structure
 * If userLocation is provided and distance is missing, it will be calculated
 */
function transformOfferData(apiOffer: any, userLocation?: Location): Offer {
  const business = apiOffer.businesses || apiOffer.business || {};
  const product = apiOffer.products || apiOffer.product || {};
  const category = product.categories || {};

  const offerId = apiOffer.id || apiOffer.offer_id;
  const offerTitle = apiOffer.title || apiOffer.offer_title;
  const offerDescription = apiOffer.description || apiOffer.offer_description;

  // Extract distance - check multiple possible field names
  let distance = null;
  if (apiOffer.distance !== undefined && apiOffer.distance !== null) {
    distance = parseFloat(apiOffer.distance);
  } else if (apiOffer.distance_km !== undefined && apiOffer.distance_km !== null) {
    distance = parseFloat(apiOffer.distance_km);
  }

  // If distance not provided by API but we have coordinates, calculate it client-side
  if ((distance === null || distance === 0) && userLocation) {
    const businessLat = parseFloat(business.latitude || apiOffer.business_latitude || apiOffer.latitude || 0);
    const businessLng = parseFloat(business.longitude || apiOffer.business_longitude || apiOffer.longitude || 0);

    if (businessLat && businessLng) {
      distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        businessLat,
        businessLng
      );
    }
  }

  // Safe parseFloat with fallback
  const safeParseFloat = (value: any, fallback: number = 0): number => {
    try {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? fallback : parsed;
    } catch (e) {
      return fallback;
    }
  };

  // Safe images array construction
  let images: string[] = [];
  if (Array.isArray(apiOffer.images) && apiOffer.images.length > 0) {
    images = apiOffer.images;
  } else if (Array.isArray(apiOffer.product_images) && apiOffer.product_images.length > 0) {
    images = apiOffer.product_images;
  } else if (product?.image_url) {
    const imageUrl = constructImageUrl(product.image_url);
    if (imageUrl) images = [imageUrl];
  } else if (apiOffer.product_image_url) {
    const imageUrl = constructImageUrl(apiOffer.product_image_url);
    if (imageUrl) images = [imageUrl];
  }

  return {
    id: offerId,
    title: offerTitle || 'Special Offer',
    description: offerDescription || '',
    businessName: business.business_name || apiOffer.business_name || 'Unknown Business',
    businessLogo: business.avatar_url || apiOffer.avatar_url || null,
    discount: safeParseFloat(apiOffer.discount_percentage, 0),
    originalPrice: safeParseFloat(apiOffer.original_price || product.price, 0),
    discountedPrice: safeParseFloat(apiOffer.discounted_price, 0),
    category: category.name || product.category || apiOffer.category || apiOffer.category_name || 'General',
    location: business.business_address || business.address || business.city || apiOffer.business_address || apiOffer.address || 'Location not specified',
    distance: distance,
    rating: business.rating || apiOffer.rating || null,
    reviewCount: business.review_count || apiOffer.review_count || null,
    expiresAt: apiOffer.expiry_date || apiOffer.offer_expiry_date,
    startDate: apiOffer.start_date,
    claimedCount: apiOffer.current_claims || apiOffer.claimed_count || 0,
    maxClaims: apiOffer.max_claims || null,
    max_claims_per_user: apiOffer.max_claims_per_user || null,
    min_claims_per_customer: apiOffer.min_claims_per_customer || null,
    isPopular: apiOffer.is_popular || false,
    isFeatured: apiOffer.is_featured || false,
    hasReminder: apiOffer.has_reminder || false,
    images: images,
    latitude: safeParseFloat(business.latitude || apiOffer.business_latitude || apiOffer.latitude, 0),
    longitude: safeParseFloat(business.longitude || apiOffer.business_longitude || apiOffer.longitude, 0),
    business: business && Object.keys(business).length > 0 ? business : null,
    canClaim: apiOffer.can_claim === false ? false : true,
    isDemo: apiOffer.is_demo === true ? true : false,
  };
}

/**
 * Construct full Supabase image URL
 */
function constructImageUrl(imagePath: string): string | null {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `https://lwwhsiaqvkjtlqaxkads.supabase.co/storage/v1/object/public/product-images/${imagePath}`;
}

// Note: Discount percentage is now calculated on the backend for consistency and performance.
// The API returns discount_percentage directly in the offer data.

/**
 * Get nearby offers based on user location
 */
export async function getNearbyOffers(
  location: Location,
  radius: number = 10,
  limit: number = 20,
  offset: number = 0
): Promise<OffersResponse> {
  try {
    const params = new URLSearchParams({
      lat: location.lat.toString(),
      lng: location.lng.toString(),
      radius: radius.toString(),
      limit: limit.toString(),
      offset: offset.toString()
    });

    const response = await apiClient.get(`/customer/offers/nearby?${params}`);

    const offers = (response.data.offers || []).map((offer: any) => transformOfferData(offer, location));

    return {
      offers,
      hasMore: offers.length === limit,
      error: null
    };
  } catch (error: any) {
    console.error('Error fetching nearby offers:', error);
    return {
      offers: [],
      hasMore: false,
      error: error.message || 'Failed to fetch nearby offers'
    };
  }
}

/**
 * Get trending offers
 */
export async function getTrendingOffers(
  limit: number = 10,
  offset: number = 0,
  userLocation?: Location
): Promise<OffersResponse> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    const response = await apiClient.get(`/customer/offers/trending?${params}`);
    const offers = (response.data.offers || []).map((offer: any) => transformOfferData(offer, userLocation));

    return {
      offers,
      hasMore: offers.length === limit,
      error: null
    };
  } catch (error: any) {
    console.error('Error fetching trending offers:', error);
    return {
      offers: [],
      hasMore: false,
      error: error.message || 'Failed to fetch trending offers'
    };
  }
}

/**
 * Get offers expiring soon
 */
export async function getExpiringSoonOffers(
  hours: number = 24,
  limit: number = 10,
  offset: number = 0,
  userLocation?: Location
): Promise<OffersResponse> {
  try {
    const params = new URLSearchParams({
      hours: hours.toString(),
      limit: limit.toString(),
      offset: offset.toString()
    });

    const response = await apiClient.get(`/customer/offers/expiring-soon?${params}`);
    const offers = (response.data.offers || []).map((offer: any) => transformOfferData(offer, userLocation));

    return {
      offers,
      hasMore: offers.length === limit,
      error: null
    };
  } catch (error: any) {
    console.error('Error fetching expiring offers:', error);
    return {
      offers: [],
      hasMore: false,
      error: error.message || 'Failed to fetch expiring offers'
    };
  }
}

/**
 * Get upcoming offers (not yet started)
 */
export async function getUpcomingOffers(
  page: number = 1,
  limit: number = 50,
  userLocation?: Location
): Promise<OffersResponse> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const response = await apiClient.get(`/customer/offers/upcoming?${params}`);
    const offers = (response.data.offers || []).map((offer: any) => transformOfferData(offer, userLocation));

    return {
      offers,
      hasMore: response.data.has_next || false,
      error: null
    };
  } catch (error: any) {
    console.error('Error fetching upcoming offers:', error);
    return {
      offers: [],
      hasMore: false,
      error: error.message || 'Failed to fetch upcoming offers'
    };
  }
}

/**
 * Get a specific offer by ID (includes both business and superadmin offers)
 */
export async function getOfferById(offerId: string): Promise<{ offer: Offer | null; error: string | null }> {
  try {
    const response = await apiClient.get(`/customer/all-offers/${offerId}`);
    const offer = response.data.offer ? transformOfferData(response.data.offer) : null;

    return { offer, error: null };
  } catch (error: any) {
    console.error('Error fetching offer:', error);
    return {
      offer: null,
      error: error.message || 'Failed to fetch offer details'
    };
  }
}

/**
 * Claim an offer
 */
export async function claimOffer(
  offerId: string,
  claimType: string = 'in_store',
  quantity: number = 1
): Promise<{ success: boolean; error: string | null }> {
  try {
    await apiClient.post(`/customer/offers/${offerId}/claim`, {
      claim_type: claimType,
      quantity: quantity
    });

    // Invalidate caches
    apiCache.invalidate('claimed_offer_ids');
    apiCache.invalidate(`total_claimed_${offerId}`);

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error claiming offer:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to claim offer'
    };
  }
}

/**
 * Unclaim an offer
 */
export async function unclaimOffer(offerId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    await apiClient.delete(`/customer/offers/${offerId}/claim`);

    // Invalidate caches
    apiCache.invalidate('claimed_offer_ids');
    apiCache.invalidate(`total_claimed_${offerId}`);

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error unclaiming offer:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to unclaim offer'
    };
  }
}

/**
 * Save offer to favorites
 */
export async function saveOfferToFavorites(offerId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    await apiClient.post(`/customer/offers/${offerId}/save`);

    // Invalidate cache
    apiCache.invalidate('favorited_offer_ids');

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error saving offer:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to save offer'
    };
  }
}

/**
 * Remove offer from favorites
 */
export async function removeOfferFromFavorites(offerId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    await apiClient.delete(`/customer/offers/${offerId}/save`);

    // Invalidate cache
    apiCache.invalidate('favorited_offer_ids');

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error removing offer:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to remove offer'
    };
  }
}

/**
 * Get favorite offers with full details
 */
export async function getFavoriteOffers(
  page: number = 1,
  size: number = 50,
  userLocation?: Location
): Promise<OffersResponse> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    const response = await apiClient.get(`/customer/saved-offers?${params}`);

    const offers = (response.data.saved_offers || [])
      .map((savedOffer: any) => {
        const offer = savedOffer.offers || savedOffer.offer;
        return transformOfferData(offer, userLocation);
      })
      .filter((offer: any) => offer && offer.id);

    return {
      offers,
      hasMore: response.data.pagination?.has_next || false,
      error: null
    };
  } catch (error: any) {
    console.error('Error fetching favorite offers:', error);
    return {
      offers: [],
      hasMore: false,
      error: error.message || 'Failed to fetch favorite offers'
    };
  }
}

/**
 * Get favorited offer IDs
 */
export async function getFavoritedOfferIds(): Promise<Set<string>> {
  const cacheKey = 'favorited_offer_ids';

  // Check cache first
  const cached = apiCache.get<Set<string>>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await apiClient.get('/customer/saved-offers?size=100');
    const favoriteIds = new Set<string>();

    (response.data.saved_offers || []).forEach((savedOffer: any) => {
      const offer = savedOffer.offers || savedOffer;
      const offerId = offer.id || offer.offer_id;
      if (offerId) {
        favoriteIds.add(offerId);
      }
    });

    // Cache for 5 minutes
    apiCache.set(cacheKey, favoriteIds, 300000);
    return favoriteIds;
  } catch (error: any) {
    console.error('Error fetching favorited offer IDs:', error);
    return new Set();
  }
}

/**
 * Get claimed offers with full details
 */
export async function getClaimedOffers(
  page: number = 1,
  size: number = 20,
  claimType?: 'online' | 'in_store'
): Promise<{ claimedOffers: any[]; hasMore: boolean; error: string | null }> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (claimType) {
      params.append('claim_type', claimType);
    }

    const response = await apiClient.get(`/customer/claimed-offers?${params}`);

    return {
      claimedOffers: response.data.claimed_offers || [],
      hasMore: response.data.pagination?.has_next || false,
      error: null
    };
  } catch (error: any) {
    console.error('Error fetching claimed offers:', error);
    return {
      claimedOffers: [],
      hasMore: false,
      error: error.message || 'Failed to fetch claimed offers'
    };
  }
}

/**
 * Get claimed offer IDs
 */
export async function getClaimedOfferIds(): Promise<Set<string>> {
  const cacheKey = 'claimed_offer_ids';

  // Check cache first
  const cached = apiCache.get<Set<string>>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await apiClient.get('/customer/claimed-offers?size=100');
    const claimedIds = new Set<string>();

    (response.data.claimed_offers || []).forEach((claimedOffer: any) => {
      const offer = claimedOffer.offer || claimedOffer.offers;
      const offerId = offer?.id || claimedOffer.offer_id;
      if (offerId) {
        claimedIds.add(offerId);
      }
    });

    // Cache for 5 minutes
    apiCache.set(cacheKey, claimedIds, 300000);
    return claimedIds;
  } catch (error: any) {
    console.error('Error fetching claimed offer IDs:', error);
    return new Set();
  }
}

/**
 * Get all offers with optional filtering (includes both business and superadmin offers)
 */
export async function getAllOffers(
  page: number = 1,
  size: number = 20,
  userLocation?: Location
): Promise<OffersResponse> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString()
    });

    const response = await apiClient.get(`/customer/all-offers?${params}`);
    const offers = (response.data.offers || []).map((offer: any) => transformOfferData(offer, userLocation));

    const hasMore = response.data.has_next || false;

    return {
      offers,
      hasMore,
      error: null
    };
  } catch (error: any) {
    console.error('Error fetching all offers:', error);
    return {
      offers: [],
      hasMore: false,
      error: error.message || 'Failed to fetch all offers'
    };
  }
}

/**
 * Set a reminder for an upcoming offer
 */
export async function setOfferReminder(offerId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    await apiClient.post(`/customer/offers/${offerId}/remind`);

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error setting reminder:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to set reminder'
    };
  }
}

/**
 * Remove a reminder for an offer
 */
export async function removeOfferReminder(offerId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    await apiClient.delete(`/customer/offers/${offerId}/remind`);

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error removing reminder:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to remove reminder'
    };
  }
}

/**
 * Get user's active reminders
 */
export async function getMyReminders(): Promise<{ reminders: any[]; error: string | null }> {
  try {
    const response = await apiClient.get('/customer/reminders');

    return {
      reminders: response.data.reminders || [],
      error: null
    };
  } catch (error: any) {
    console.error('Error fetching reminders:', error);
    return {
      reminders: [],
      error: error.message || 'Failed to fetch reminders'
    };
  }
}

/**
 * Get total quantity claimed for an offer across all user's claims
 */
export async function getTotalQuantityClaimed(offerId: string): Promise<number> {
  const cacheKey = `total_claimed_${offerId}`;

  // Check cache first
  const cached = apiCache.get<number>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  try {
    const response = await apiClient.get('/customer/claimed-offers?size=100');
    const claimedOffers = response.data.claimed_offers || [];

    let totalQuantity = 0;
    claimedOffers.forEach((claimedOffer: any) => {
      const offer = claimedOffer.offer || claimedOffer.offers;
      const claimOfferId = offer?.id || claimedOffer.offer_id;

      if (claimOfferId === offerId) {
        totalQuantity += claimedOffer.quantity || 1;
      }
    });

    // Cache for 2 minutes (shorter TTL since this changes more frequently)
    apiCache.set(cacheKey, totalQuantity, 120000);
    return totalQuantity;
  } catch (error: any) {
    console.error('Error getting total quantity claimed:', error);
    return 0;
  }
}

/**
 * Check if user can claim more of an offer based on max_claims_per_user
 */
export async function canClaimMore(offerId: string, maxClaimsPerUser?: number): Promise<boolean> {
  if (!maxClaimsPerUser) return true; // No limit

  const totalClaimed = await getTotalQuantityClaimed(offerId);
  return totalClaimed < maxClaimsPerUser;
}

/**
 * Get remaining quota for an offer
 */
export async function getRemainingQuota(offerId: string, maxClaimsPerUser?: number): Promise<number> {
  if (!maxClaimsPerUser) return Infinity; // No limit

  const totalClaimed = await getTotalQuantityClaimed(offerId);
  return Math.max(0, maxClaimsPerUser - totalClaimed);
}
