// lib/offers.js - Additional API functions for offers

import { makeAuthenticatedRequest } from './auth'

/**
 * Create new offer
 */
export async function createOffer(offerData) {
  try {
    
    const response = await makeAuthenticatedRequest('/business/offers', {
      method: 'POST',
      body: JSON.stringify(offerData),
    })
    
    if (!response || !response.ok) {
      const data = await response?.json()
      console.error('Offer creation failed:', data)
      
      if (data && data.detail) {
        if (Array.isArray(data.detail)) {
          const errorMessages = data.detail.map(err => {
            const field = err.loc ? err.loc[err.loc.length - 1] : 'field'
            return `${field}: ${err.msg}`
          }).join(', ')
          return { error: `Validation errors - ${errorMessages}` }
        } else {
          return { error: data.detail }
        }
      }
      return { error: 'Failed to create offer' }
    }
    
    const data = await response.json()
    
    return { success: true, offer: data.offer || data }
  } catch (error) {
    console.error('Create offer error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Update existing offer
 */
export async function updateOffer(offerId, offerData) {
  try {
    
    const response = await makeAuthenticatedRequest(`/business/offers/${offerId}`, {
      method: 'PATCH',
      body: JSON.stringify(offerData),
    })
    
    if (!response || !response.ok) {
      const data = await response?.json()
      console.error('Offer update failed:', data)
      
      if (data && data.detail) {
        if (Array.isArray(data.detail)) {
          const errorMessages = data.detail.map(err => {
            const field = err.loc ? err.loc[err.loc.length - 1] : 'field'
            return `${field}: ${err.msg}`
          }).join(', ')
          return { error: `Validation errors - ${errorMessages}` }
        } else {
          return { error: data.detail }
        }
      }
      return { error: 'Failed to update offer' }
    }
    
    const data = await response.json()
    
    return { success: true, offer: data.offer || data }
  } catch (error) {
    console.error('Update offer error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Delete offer
 */
export async function deleteOffer(offerId) {
  try {
    
    const response = await makeAuthenticatedRequest(`/business/offers/${offerId}`, {
      method: 'DELETE',
    })
    
    if (!response || !response.ok) {
      const data = await response?.json()
      console.error('Offer deletion failed:', data)
      return { error: data?.detail || 'Failed to delete offer' }
    }
    
    const data = await response.json()
    
    return { success: true, message: data.message || 'Offer deleted successfully' }
  } catch (error) {
    console.error('Delete offer error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Pause offer by setting is_active to false
 */
export async function pauseOffer(offerId) {
  try {
    
    const response = await makeAuthenticatedRequest(`/business/offers/${offerId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: false }),
    })
    
    if (!response || !response.ok) {
      const data = await response?.json()
      console.error('Offer pause failed:', data)
      return { error: data?.detail || 'Failed to pause offer' }
    }
    
    const result = await response.json()
    return { success: true, offer: result.offer }
  } catch (error) {
    console.error('Pause offer error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Resume offer by setting is_active to true
 */
export async function resumeOffer(offerId) {
  try {
    
    const response = await makeAuthenticatedRequest(`/business/offers/${offerId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: true }),
    })
    
    if (!response || !response.ok) {
      const data = await response?.json()
      console.error('Offer resume failed:', data)
      return { error: data?.detail || 'Failed to resume offer' }
    }
    
    const result = await response.json()
    return { success: true, offer: result.offer }
  } catch (error) {
    console.error('Resume offer error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Get offer by ID
 */
export async function getOffer(offerId) {
  try {
    const response = await makeAuthenticatedRequest(`/business/offers/${offerId}`)
    
    if (!response || !response.ok) {
      const data = await response?.json()
      return { error: data?.detail || 'Failed to fetch offer' }
    }
    
    const data = await response.json()
    
    return { 
      success: true, 
      offer: data.offer || data
    }
  } catch (error) {
    console.error('Get offer error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Get all offers for current business with pagination and filters
 */
export async function getOffers(params = {}) {
  try {
    const queryParams = new URLSearchParams()
    
    // Add pagination
    if (params.page) queryParams.append('page', params.page)
    if (params.limit) queryParams.append('limit', params.limit)
    
    // Add sorting
    if (params.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)
    
    // Add search
    if (params.search) queryParams.append('search', params.search)
    
    // Add filters
    if (params.product_id) queryParams.append('product_id', params.product_id)
    if (params.status) queryParams.append('status', params.status)
    if (params.discount_type) queryParams.append('discount_type', params.discount_type)
    
    const url = `/business/offers${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await makeAuthenticatedRequest(url)
    
    if (!response || !response.ok) {
      const data = await response?.json()
      return { error: data?.detail || 'Failed to fetch offers' }
    }
    
    const data = await response.json()
    
    return { 
      success: true, 
      offers: data.offers || [],
      pagination: data.pagination || {}
    }
  } catch (error) {
    console.error('Get offers error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Upload offer image
 */
export async function uploadOfferImage(imageFile) {
  try {

    const formData = new FormData()
    formData.append('image', imageFile)

    // Get the token for authorization
    const token = localStorage.getItem('auth_token')
    if (!token) {
      return { error: 'Authentication required' }
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'
    const response = await fetch(`${API_BASE_URL}/business/offers/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })

    if (!response.ok) {
      const data = await response.json()
      console.error('Offer image upload failed:', data)
      return { error: data.detail || 'Failed to upload image' }
    }

    const data = await response.json()

    return {
      success: true,
      path: data.path,
      url: data.url,
      compression_info: data.compression_info
    }
  } catch (error) {
    console.error('Upload offer image error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Verify a claim code for redemption
 */
export async function verifyClaimCode(claimCode) {
  try {

    const response = await makeAuthenticatedRequest('/business/redeem/verify', {
      method: 'POST',
      body: JSON.stringify({
        claim_identifier: claimCode,
        verification_type: 'claim_id'
      }),
    })

    if (!response || !response.ok) {
      const data = await response?.json()
      console.error('Claim verification failed:', data)
      return {
        success: false,
        error: data?.detail || data?.error_message || 'Failed to verify claim code'
      }
    }

    const data = await response.json()

    return {
      success: data.is_valid,
      claim: data.claim_details,
      error: data.error_message
    }
  } catch (error) {
    console.error('Verify claim error:', error)
    return { success: false, error: 'Network error. Please try again.' }
  }
}

/**
 * Complete redemption of a claim
 */
export async function redeemClaim(claimCode, notes = '') {
  try {

    const response = await makeAuthenticatedRequest('/business/redeem/complete', {
      method: 'POST',
      body: JSON.stringify({
        claim_id: claimCode,
        redemption_notes: notes
      }),
    })

    if (!response || !response.ok) {
      const data = await response?.json()
      console.error('Claim redemption failed:', data)
      return {
        success: false,
        error: data?.detail || data?.message || 'Failed to redeem claim'
      }
    }

    const data = await response.json()

    return {
      success: data.success,
      message: data.message,
      redemption: data.redemption_details
    }
  } catch (error) {
    console.error('Redeem claim error:', error)
    return { success: false, error: 'Network error. Please try again.' }
  }
}