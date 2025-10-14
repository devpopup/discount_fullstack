// frontend/lib/offers-api.js - API service for fetching offers

import { makeAuthenticatedRequest, getToken } from './auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

/**
 * Make API request with optional authentication
 * For public browsing endpoints, don't send expired tokens
 */
async function makeOfferRequest(endpoint, options = {}, requireAuth = false) {
  const token = getToken()

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Only add auth header if explicitly required or if we have a valid token
  if (requireAuth && token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      // Try to get the error message from the response
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorData.message || errorMessage
        if (process.env.NODE_ENV === 'development') {
          console.error(`API Error Response for ${endpoint}:`, errorData)
        }
      } catch (parseError) {
        // If we can't parse the error response, use the status
        if (process.env.NODE_ENV === 'development') {
          console.error(`Failed to parse error response for ${endpoint}:`, parseError)
        }
      }
      throw new Error(errorMessage)
    }

    return await response.json()
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`API request failed for ${endpoint}:`, error)
    }
    throw error
  }
}

/**
 * Get nearby offers based on user location
 * @param {number} offset - Starting index for pagination
 * @param {number} limit - Number of items to fetch
 */
export async function getNearbyOffers({ lat, lng, radius = 10, limit = 20, offset = 0, categoryId = null }) {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radius.toString(),
      limit: limit.toString(),
      offset: offset.toString()
    })

    if (categoryId) {
      params.append('category_id', categoryId)
    }

    const data = await makeOfferRequest(`/customer/offers/nearby?${params}`)

    // Return the offers from API with pagination info
    return {
      offers: data.offers || [],
      hasMore: (data.offers || []).length === limit, // If we got full page, there might be more
      error: null
    }

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching nearby offers:', error)
    }
    return { offers: [], hasMore: false, error: error.message }
  }
}

/**
 * Get trending offers
 * @param {number} offset - Starting index for pagination
 * @param {number} limit - Number of items to fetch
 */
export async function getTrendingOffers({ limit = 10, offset = 0, categoryId = null } = {}) {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    })

    if (categoryId) {
      params.append('category_id', categoryId)
    }

    const data = await makeOfferRequest(`/customer/offers/trending?${params}`)

    // Return the offers from API with pagination info
    return {
      offers: data.offers || [],
      hasMore: (data.offers || []).length === limit,
      error: null
    }

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching trending offers:', error)
    }
    return { offers: [], hasMore: false, error: error.message }
  }
}

/**
 * Get offers expiring soon
 * @param {number} offset - Starting index for pagination
 * @param {number} limit - Number of items to fetch
 */
export async function getExpiringSoonOffers({ hours = 24, limit = 10, offset = 0 } = {}) {
  try {
    const params = new URLSearchParams({
      hours: hours.toString(),
      limit: limit.toString(),
      offset: offset.toString()
    })

    const data = await makeOfferRequest(`/customer/offers/expiring-soon?${params}`)

    // Return the offers from API with pagination info
    return {
      offers: data.offers || [],
      hasMore: (data.offers || []).length === limit,
      error: null
    }

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching expiring offers:', error)
    }
    return { offers: [], hasMore: false, error: error.message }
  }
}

/**
 * Search offers with various filters
 */
export async function searchOffers({
  query = '',
  categoryId = null,
  businessId = null,
  sortBy = 'created_at',
  sortOrder = 'desc',
  page = 1,
  size = 20
} = {}) {
  try {
    const params = new URLSearchParams({
      sort_by: sortBy,
      sort_order: sortOrder,
      page: page.toString(),
      size: size.toString()
    })
    
    if (query) {
      params.append('q', query)
    }
    
    if (categoryId) {
      params.append('category_id', categoryId)
    }
    
    if (businessId) {
      params.append('business_id', businessId)
    }

    const data = await makeOfferRequest(`/customer/offers/search?${params}`)
    return { 
      offers: data.offers || [], 
      totalCount: data.total_count || 0,
      hasMore: data.has_more || false,
      error: null 
    }
  } catch (error) {
    console.error('Error searching offers:', error)
    return { offers: [], totalCount: 0, hasMore: false, error: error.message }
  }
}

/**
 * Get a specific offer by ID
 */
export async function getOfferById(offerId) {
  try {
    const data = await makeOfferRequest(`/customer/offers/${offerId}`)
    const transformedOffer = data.offer ? transformOfferData(data.offer) : null
    return { offer: transformedOffer, error: null }
  } catch (error) {
    console.error('Error fetching offer:', error)
    return { offer: null, error: error.message }
  }
}


/**
 * Get featured offers (can use trending for now)
 */
export async function getFeaturedOffers({ limit = 5 } = {}) {
  try {
    // Get trending offers for featured section
    const result = await getTrendingOffers({ limit })
    return result
  } catch (error) {
    console.error('Error fetching featured offers:', error)
    return { 
      offers: [], 
      error: error.message 
    }
  }
}

/**
 * Transform API offer data to match our component expectations
 */
export function transformOfferData(apiOffer) {
  if (!apiOffer) return null

  // Handle new API structure with enriched data
  // Backend may use 'businesses' or 'business', 'products' or 'product'
  const business = apiOffer.businesses || apiOffer.business || {}
  const product = apiOffer.products || apiOffer.product || {}
  const category = product.categories || {}

  // Debug logging for images (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('transformOfferData - apiOffer.id:', apiOffer.id)
    console.log('transformOfferData - product:', product)
    console.log('transformOfferData - product.image_url:', product?.image_url)
    console.log('transformOfferData - apiOffer.images:', apiOffer.images)
  }

  // Handle both regular API format and RPC function format (nearby offers)
  // RPC returns: offer_id, offer_title, offer_description, business_name, business_address, etc.
  const offerId = apiOffer.id || apiOffer.offer_id
  const offerTitle = apiOffer.title || apiOffer.offer_title
  const offerDescription = apiOffer.description || apiOffer.offer_description

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
    // Preserve full business object for detailed pages
    business: business && Object.keys(business).length > 0 ? business : null
  }
}

/**
 * Construct full Supabase image URL
 */
function constructImageUrl(imagePath) {
  if (!imagePath) return null

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath
  }

  // Construct Supabase storage URL
  const fullUrl = `https://lwwhsiaqvkjtlqaxkads.supabase.co/storage/v1/object/public/product-images/${imagePath}`
  if (process.env.NODE_ENV === 'development') {
    console.log('constructImageUrl - input:', imagePath, 'output:', fullUrl)
  }
  return fullUrl
}

/**
 * Calculate discount percentage from API data
 */
function calculateDiscountPercentage(apiOffer) {
  if (apiOffer.discount_type === 'percentage') {
    return parseInt(apiOffer.discount_value || 0)
  }
  
  if (apiOffer.discount_type === 'fixed' && apiOffer.original_price) {
    const discountAmount = parseFloat(apiOffer.discount_value || 0)
    const originalPrice = parseFloat(apiOffer.original_price)
    
    if (originalPrice > 0) {
      return Math.round((discountAmount / originalPrice) * 100)
    }
  }
  
  // For other types, try to calculate from original vs discounted price
  const originalPrice = parseFloat(apiOffer.original_price || 0)
  const discountedPrice = parseFloat(apiOffer.discounted_price || 0)
  
  if (originalPrice > 0 && discountedPrice > 0) {
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
  }
  
  return 0
}

/**
 * Get user location (with permission)
 */
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      (error) => {
        reject(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  })
}

/**
 * Get default location (fallback)
 */
export function getDefaultLocation() {
  // Default to a central location - you can customize this
  return {
    lat: 40.7128, // New York City
    lng: -74.0060
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) {
    return null
  }

  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c // Distance in kilometers
}

/**
 * Enhanced transform function that calculates distance if not provided
 */
export function transformOfferDataWithDistance(apiOffer, userLocation = null) {
  const transformedOffer = transformOfferData(apiOffer)

  // If distance is not already provided and we have both user and business location
  if (!transformedOffer.distance && userLocation) {
    const business = apiOffer.businesses || apiOffer.business || {}
    const businessLat = business.latitude || apiOffer.latitude
    const businessLng = business.longitude || apiOffer.longitude

    if (businessLat && businessLng) {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        parseFloat(businessLat),
        parseFloat(businessLng)
      )
      transformedOffer.distance = distance
    }
  }

  return transformedOffer
}

// ============================================================================
// FAVORITES API
// ============================================================================

/**
 * Save offer to favorites
 */
export async function saveOfferToFavorites(offerId) {
  try {
    const response = await makeOfferRequest(
      `/customer/offers/${offerId}/save`,
      {
        method: 'POST'
      },
      true // Requires authentication
    )
    return { success: true, data: response }
  } catch (error) {
    console.error('Error saving offer to favorites:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Remove offer from favorites
 */
export async function removeOfferFromFavorites(offerId) {
  try {
    const response = await makeOfferRequest(
      `/customer/offers/${offerId}/save`,
      {
        method: 'DELETE'
      },
      true // Requires authentication
    )
    return { success: true, data: response }
  } catch (error) {
    console.error('Error removing offer from favorites:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get user's saved/favorite offers
 */
export async function getFavoriteOffers({ page = 1, size = 20, activeOnly = true } = {}) {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      active_only: activeOnly.toString()
    })

    const response = await makeOfferRequest(
      `/customer/saved-offers?${params.toString()}`,
      {
        method: 'GET'
      },
      true // Requires authentication
    )

    return {
      offers: response.saved_offers || [],
      total: response.total || 0,
      page: response.page || 1,
      size: response.size || size,
      hasMore: response.has_next || false
    }
  } catch (error) {
    console.error('Error fetching favorite offers:', error)
    return {
      offers: [],
      total: 0,
      page: 1,
      size,
      hasMore: false,
      error: error.message
    }
  }
}

/**
 * Check if an offer is saved/favorited
 * This is a client-side helper that checks if an offer ID exists in the favorites list
 */
export async function isOfferFavorited(offerId) {
  try {
    const result = await getFavoriteOffers({ size: 100 }) // Get a reasonable batch
    return result.offers.some(offer => {
      const savedOfferId = offer.offers?.id || offer.offer_id || offer.id
      return savedOfferId === offerId
    })
  } catch (error) {
    console.error('Error checking if offer is favorited:', error)
    return false
  }
}

/**
 * Get a Set of all favorited offer IDs for efficient lookup
 * This should be called once and cached on the client
 */
export async function getFavoritedOfferIds() {
  try {
    const result = await getFavoriteOffers({ size: 100 })
    const favoriteIds = new Set()

    result.offers.forEach(savedOffer => {
      const offer = savedOffer.offers || savedOffer
      const offerId = offer.id || offer.offer_id
      if (offerId) {
        favoriteIds.add(offerId)
      }
    })

    return favoriteIds
  } catch (error) {
    console.error('Error fetching favorited offer IDs:', error)
    return new Set()
  }
}

/**
 * Get a Set of all claimed offer IDs for efficient lookup
 * This should be called once and cached on the client
 */
export async function getClaimedOfferIds() {
  try {
    const result = await getClaimedOffers({ page: 1, size: 100 })
    const claimedIds = new Set()

    if (result.claimed_offers) {
      result.claimed_offers.forEach(claimedOffer => {
        const offer = claimedOffer.offer || claimedOffer.offers
        const offerId = offer?.id || claimedOffer.offer_id
        if (offerId) {
          claimedIds.add(offerId)
        }
      })
    }

    return claimedIds
  } catch (error) {
    console.error('Error fetching claimed offer IDs:', error)
    return new Set()
  }
}

// ============================================================================
// CLAIM OFFERS API
// ============================================================================

/**
 * Claim an offer
 */
export async function claimOffer(offerId, claimType = 'in_store', redirectUrl = null) {
  try {
    const requestBody = {
      claim_type: claimType
    }

    if (redirectUrl) {
      requestBody.redirect_url = redirectUrl
    }

    const data = await makeOfferRequest(
      `/customer/offers/${offerId}/claim`,
      {
        method: 'POST',
        body: JSON.stringify(requestBody)
      },
      true // require auth
    )

    return { success: true, data, error: null }
  } catch (error) {
    console.error('Error claiming offer:', error)
    return { success: false, data: null, error: error.message }
  }
}

/**
 * Get claimed offers
 */
export async function getClaimedOffers({ page = 1, size = 20, redeemed_only = null, claim_type = null } = {}) {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString()
    })

    if (redeemed_only !== null) {
      params.append('redeemed_only', redeemed_only.toString())
    }

    if (claim_type) {
      params.append('claim_type', claim_type)
    }

    const data = await makeOfferRequest(`/customer/claimed-offers?${params}`, {}, true)

    return data
  } catch (error) {
    console.error('Error fetching claimed offers:', error)
    throw error
  }
}

/**
 * Get offer status (check if claimed, saved, etc.)
 */
export async function getOfferStatus(offerId) {
  try {
    const data = await makeOfferRequest(`/customer/offers/${offerId}/status`, {}, false)

    return { success: true, data, error: null }
  } catch (error) {
    console.error('Error fetching offer status:', error)
    return { success: false, data: null, error: error.message }
  }
}

/**
 * Unclaim an offer (remove claim if not yet redeemed)
 */
export async function unclaimOffer(offerId) {
  try {
    const data = await makeOfferRequest(
      `/customer/offers/${offerId}/claim`,
      {
        method: 'DELETE'
      },
      true // require auth
    )

    return { success: true, data, error: null }
  } catch (error) {
    console.error('Error unclaiming offer:', error)
    return { success: false, data: null, error: error.message }
  }
}