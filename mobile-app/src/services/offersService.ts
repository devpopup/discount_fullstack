import apiClient from './api';
import { Offer, OffersResponse, Location } from '../types/offer';

/**
 * Transform API offer data to match our app's structure
 */
function transformOfferData(apiOffer: any): Offer {
  const business = apiOffer.businesses || apiOffer.business || {};
  const product = apiOffer.products || apiOffer.product || {};
  const category = product.categories || {};

  const offerId = apiOffer.id || apiOffer.offer_id;
  const offerTitle = apiOffer.title || apiOffer.offer_title;
  const offerDescription = apiOffer.description || apiOffer.offer_description;

  return {
    id: offerId,
    title: offerTitle || 'Special Offer',
    description: offerDescription || '',
    businessName: business.business_name || apiOffer.business_name || 'Unknown Business',
    businessLogo: business.avatar_url || apiOffer.avatar_url || null,
    discount: calculateDiscountPercentage(apiOffer),
    originalPrice: parseFloat(apiOffer.original_price || product.price || 0),
    discountedPrice: parseFloat(apiOffer.discounted_price || 0),
    category: category.name || product.category || apiOffer.category || apiOffer.category_name || 'General',
    location: business.business_address || business.address || business.city || apiOffer.business_address || apiOffer.address || 'Location not specified',
    distance: apiOffer.distance || apiOffer.distance_km || null,
    rating: business.rating || apiOffer.rating || null,
    reviewCount: business.review_count || apiOffer.review_count || null,
    expiresAt: apiOffer.expiry_date || apiOffer.offer_expiry_date,
    claimedCount: apiOffer.current_claims || apiOffer.claimed_count || 0,
    maxClaims: apiOffer.max_claims || null,
    isPopular: apiOffer.is_popular || false,
    isFeatured: apiOffer.is_featured || false,
    images: apiOffer.images ||
            apiOffer.product_images ||
            (product && product.image_url ? [constructImageUrl(product.image_url)] : []) ||
            (apiOffer.product_image_url ? [constructImageUrl(apiOffer.product_image_url)] : []),
    latitude: parseFloat(business.latitude || apiOffer.business_latitude || apiOffer.latitude || 0),
    longitude: parseFloat(business.longitude || apiOffer.business_longitude || apiOffer.longitude || 0),
    business: business && Object.keys(business).length > 0 ? business : null
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

/**
 * Calculate discount percentage from API data
 */
function calculateDiscountPercentage(apiOffer: any): number {
  if (apiOffer.discount_type === 'percentage') {
    return parseInt(apiOffer.discount_value || 0);
  }

  if (apiOffer.discount_type === 'fixed' && apiOffer.original_price) {
    const discountAmount = parseFloat(apiOffer.discount_value || 0);
    const originalPrice = parseFloat(apiOffer.original_price);

    if (originalPrice > 0) {
      return Math.round((discountAmount / originalPrice) * 100);
    }
  }

  const originalPrice = parseFloat(apiOffer.original_price || 0);
  const discountedPrice = parseFloat(apiOffer.discounted_price || 0);

  if (originalPrice > 0 && discountedPrice > 0) {
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
  }

  return 0;
}

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
    const offers = (response.data.offers || []).map(transformOfferData);

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
  offset: number = 0
): Promise<OffersResponse> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });

    const response = await apiClient.get(`/customer/offers/trending?${params}`);
    const offers = (response.data.offers || []).map(transformOfferData);

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
  offset: number = 0
): Promise<OffersResponse> {
  try {
    const params = new URLSearchParams({
      hours: hours.toString(),
      limit: limit.toString(),
      offset: offset.toString()
    });

    const response = await apiClient.get(`/customer/offers/expiring-soon?${params}`);
    const offers = (response.data.offers || []).map(transformOfferData);

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
 * Get a specific offer by ID
 */
export async function getOfferById(offerId: string): Promise<{ offer: Offer | null; error: string | null }> {
  try {
    const response = await apiClient.get(`/customer/offers/${offerId}`);
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
  claimType: string = 'in_store'
): Promise<{ success: boolean; error: string | null }> {
  try {
    await apiClient.post(`/customer/offers/${offerId}/claim`, {
      claim_type: claimType
    });

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
 * Get favorited offer IDs
 */
export async function getFavoritedOfferIds(): Promise<Set<string>> {
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

    return favoriteIds;
  } catch (error: any) {
    console.error('Error fetching favorited offer IDs:', error);
    return new Set();
  }
}

/**
 * Get claimed offer IDs
 */
export async function getClaimedOfferIds(): Promise<Set<string>> {
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

    return claimedIds;
  } catch (error: any) {
    console.error('Error fetching claimed offer IDs:', error);
    return new Set();
  }
}
