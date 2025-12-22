// lib/api.js
import { makeAuthenticatedRequest } from './auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

// API endpoints configuration
export const endpoints = {
  // Authentication
  login: '/auth/login',
  register: '/auth/register',
  me: '/auth/me',
  logout: '/auth/logout',

  // Business Profile
  businessProfile: '/business/profile',
  businessLocation: '/business/location',
  uploadBusinessLogo: '/business/upload-logo',

  // Business Tools
  business: {
    qrCode: '/business/qr-code',
  },

  // Products
  products: '/business/products',
  product: (id) => `/business/products/${id}`,
  productOffers: (id) => `/business/products/${id}/offers`,
  uploadImage: '/business/products/upload-image',

  // Categories
  categories: '/categories',
  category: (id) => `/categories/${id}`,

  // Offers
  offers: '/business/offers',
  offer: (id) => `/business/offers/${id}`,
  toggleOfferStatus: (id) => `/business/offers/${id}/toggle`,
  offerAnalytics: (id) => `/business/offers/${id}/analytics`,

  // Claims & Redemptions
  claimedOffers: '/business/claimed-offers',
  verifyClaim: '/business/claims/verify',
  redeemClaim: '/business/claims/redeem',
  redemptionStats: '/business/redemption-stats',

  // Analytics
  businessAnalytics: '/business/analytics',
  offersAnalyticsList: '/business/analytics/offers',

  // Customer endpoints (for reference)
  customer: {
    searchProducts: '/customer/search/products',
    searchOffers: '/customer/search/offers',
    claimOffer: (id) => `/customer/offers/${id}/claim`,
    savedOffers: '/customer/saved-offers',
    claimedOffers: '/customer/claimed-offers'
  }
}

// Helper function to get full image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null

  // If it's already a full URL, return as-is
  if (imagePath.startsWith('http')) return imagePath

  // If it's a relative path, construct full URL using Supabase Storage
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/product-images/${imagePath}`
  }

  // Fallback: if no Supabase URL is configured, return null
  console.warn('NEXT_PUBLIC_SUPABASE_URL is not configured, cannot load images')
  return null
}

// API helper functions for common operations
export const apiHelpers = {
  // Format API errors
  formatError: (error) => {
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail
      if (Array.isArray(detail)) {
        return detail.map(err => {
          const field = err.loc ? err.loc[err.loc.length - 1] : 'field'
          return `${field}: ${err.msg}`
        }).join(', ')
      }
      return detail
    }
    return error.message || 'An unexpected error occurred'
  },

  // Handle pagination parameters
  buildPaginationParams: (params) => {
    const queryParams = new URLSearchParams()
    
    if (params.page) queryParams.append('page', params.page)
    if (params.limit) queryParams.append('limit', params.limit)
    if (params.search) queryParams.append('search', params.search)
    if (params.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)
    
    return queryParams.toString()
  },

  // Process product/offer data with image URLs
  processImageUrls: (items) => {
    if (!Array.isArray(items)) {
      return {
        ...items,
        image_url: getImageUrl(items.image_url)
      }
    }

    return items.map(item => ({
      ...item,
      image_url: getImageUrl(item.image_url),
      // Handle nested product images in offers
      product: item.product ? {
        ...item.product,
        image_url: getImageUrl(item.product.image_url)
      } : undefined,
      products: item.products ? {
        ...item.products,
        image_url: getImageUrl(item.products.image_url)
      } : undefined
    }))
  }
}

// Generic API request wrapper
export async function apiRequest(endpoint, options = {}) {
  try {
    const response = await makeAuthenticatedRequest(endpoint, options)
    
    if (!response || !response.ok) {
      const data = await response?.json()
      throw new Error(data?.detail || `HTTP error! status: ${response?.status}`)
    }
    
    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('API request failed:', error)
    return { success: false, error: error.message }
  }
}

export default {
  endpoints,
  apiHelpers,
  apiRequest,
  getImageUrl
}