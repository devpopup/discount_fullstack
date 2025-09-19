// frontend/lib/offers-api.js - API service for fetching offers

import { makeAuthenticatedRequest, getToken } from './auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

/**
 * Make API request with optional authentication
 */
async function makeOfferRequest(endpoint, options = {}) {
  const token = getToken()
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
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
        console.error(`API Error Response for ${endpoint}:`, errorData)
      } catch (parseError) {
        // If we can't parse the error response, use the status
        console.error(`Failed to parse error response for ${endpoint}:`, parseError)
      }
      throw new Error(errorMessage)
    }
    
    return await response.json()
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error)
    throw error
  }
}

/**
 * Get nearby offers based on user location
 */
export async function getNearbyOffers({ lat, lng, radius = 10, limit = 20, categoryId = null }) {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radius.toString(),
      limit: limit.toString()
    })
    
    if (categoryId) {
      params.append('category_id', categoryId)
    }

    const data = await makeOfferRequest(`/customer/offers/nearby?${params}`)
    
    // Return the offers from API (could be empty array)
    return { offers: data.offers || [], error: null }
    
  } catch (error) {
    console.error('Error fetching nearby offers:', error)
    return { offers: [], error: error.message }
  }
}

/**
 * Get trending offers
 */
export async function getTrendingOffers({ limit = 10, categoryId = null } = {}) {
  try {
    const params = new URLSearchParams({
      limit: limit.toString()
    })
    
    if (categoryId) {
      params.append('category_id', categoryId)
    }

    const data = await makeOfferRequest(`/customer/offers/trending?${params}`)
    
    // Return the offers from API (could be empty array)
    return { offers: data.offers || [], error: null }
    
  } catch (error) {
    console.error('Error fetching trending offers:', error)
    return { offers: [], error: error.message }
  }
}

/**
 * Get offers expiring soon
 */
export async function getExpiringSoonOffers({ hours = 24, limit = 10 } = {}) {
  try {
    const params = new URLSearchParams({
      hours: hours.toString(),
      limit: limit.toString()
    })

    const data = await makeOfferRequest(`/customer/offers/expiring-soon?${params}`)
    
    // Return the offers from API (could be empty array) 
    return { offers: data.offers || [], error: null }
    
  } catch (error) {
    console.error('Error fetching expiring offers:', error)
    return { offers: [], error: error.message }
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
    return { offer: data.offer || null, error: null }
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
  const business = apiOffer.businesses || apiOffer.business || {}
  const product = apiOffer.products || {}
  const category = product.categories || {}

  return {
    id: apiOffer.id,
    title: apiOffer.title || 'Special Offer',
    description: apiOffer.description || '',
    businessName: business.business_name || apiOffer.business_name || 'Unknown Business',
    businessLogo: business.avatar_url || apiOffer.avatar_url || null,
    discount: calculateDiscountPercentage(apiOffer),
    originalPrice: parseFloat(apiOffer.original_price || product.price || 0),
    discountedPrice: parseFloat(apiOffer.discounted_price || 0),
    category: category.name || product.category || apiOffer.category || 'General',
    location: business.business_address || business.address || business.city || apiOffer.address || 'Location not specified',
    distance: apiOffer.distance || null,
    rating: business.rating || apiOffer.rating || null,
    reviewCount: business.review_count || apiOffer.review_count || null,
    expiresAt: apiOffer.expiry_date,
    claimedCount: apiOffer.current_claims || apiOffer.claimed_count || 0,
    maxClaims: apiOffer.max_claims || null,
    isPopular: apiOffer.is_popular || false,
    isFeatured: apiOffer.is_featured || false,
    images: apiOffer.images || (product.image_url ? [constructImageUrl(product.image_url)] : [])
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
  return `https://lwwhsiaqvkjtlqaxkads.supabase.co/storage/v1/object/public/product-images/${imagePath}`
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