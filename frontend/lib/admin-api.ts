// lib/admin-api.ts - Superadmin API utilities

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

export interface SuperadminOffer {
  id?: string
  business_name: string
  business_description?: string
  business_address?: string
  phone_number?: string
  business_website?: string
  business_hours?: Record<string, string>
  category_id?: number
  latitude?: number
  longitude?: number
  formatted_address?: string
  place_id?: string
  offer_title: string
  offer_description?: string
  discount_type: string
  discount_value: number
  original_price?: number
  discounted_price?: number
  start_date: string
  expiry_date: string
  max_claims?: number
  max_claims_per_user?: number
  minimum_purchase_amount?: number
  buy_quantity?: number
  get_quantity?: number
  terms_conditions?: string
  existing_business_id?: string
}

export interface SuperadminBusiness {
  id: string
  business_name: string
  business_description?: string
  business_address?: string
  phone_number?: string
  category_id?: number
  created_at: string
}

/**
 * Store superadmin authentication
 */
export function setAdminAuthData(token: string, user: any) {
  if (typeof window === 'undefined') return
  localStorage.setItem('admin_token', token)
  localStorage.setItem('admin_user', JSON.stringify(user))
}

/**
 * Get admin token
 */
export function getAdminToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('admin_token')
}

/**
 * Get admin user
 */
export function getAdminUser() {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem('admin_user')
  return userStr ? JSON.parse(userStr) : null
}

/**
 * Clear admin authentication
 */
export function clearAdminAuthData() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user')
}

/**
 * Check if admin is authenticated
 */
export function isAdminAuthenticated() {
  const token = getAdminToken()
  const user = getAdminUser()
  return !!(token && user?.is_superadmin)
}

/**
 * Make authenticated admin API request
 */
async function makeAdminRequest(endpoint: string, options: RequestInit = {}) {
  const token = getAdminToken()

  if (!token) {
    throw new Error('No admin token found')
  }

  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // Handle 401/403 - unauthorized
  if (response.status === 401 || response.status === 403) {
    clearAdminAuthData()
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login'
    }
    throw new Error('Unauthorized - redirecting to login')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))

    // Handle validation errors (array format)
    if (Array.isArray(error.detail)) {
      const errorMessages = error.detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ')
      throw new Error(errorMessages)
    }

    // Handle string or object detail
    const errorMessage = typeof error.detail === 'string'
      ? error.detail
      : (error.message || JSON.stringify(error.detail) || 'Request failed')

    throw new Error(errorMessage)
  }

  // Handle 204 No Content - no response body
  if (response.status === 204) {
    return null
  }

  return response.json()
}

/**
 * Admin login
 */
export async function adminLogin(email: string, password: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data.detail || 'Login failed' }
    }

    // Check if user is superadmin
    if (!data.user?.is_superadmin) {
      return { error: 'Access denied. This account is not a superadmin.' }
    }

    setAdminAuthData(data.access_token, data.user)
    return { user: data.user }
  } catch (error) {
    console.error('Admin login error:', error)
    return { error: 'Login failed. Please try again.' }
  }
}

/**
 * Admin logout
 */
export function adminLogout() {
  clearAdminAuthData()
  if (typeof window !== 'undefined') {
    window.location.href = '/admin/login'
  }
}

/**
 * Get all superadmin offers
 */
export async function getAdminOffers(params: {
  page?: number
  size?: number
  is_active?: boolean
  business_id?: string
  discount_type?: string
} = {}) {
  const queryParams = new URLSearchParams()
  if (params.page) queryParams.append('page', params.page.toString())
  if (params.size) queryParams.append('size', params.size.toString())
  if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString())
  if (params.business_id) queryParams.append('business_id', params.business_id)
  if (params.discount_type) queryParams.append('discount_type', params.discount_type)

  const query = queryParams.toString()
  return makeAdminRequest(`/superadmin/offers${query ? '?' + query : ''}`)
}

/**
 * Get single superadmin offer
 */
export async function getAdminOffer(offerId: string) {
  return makeAdminRequest(`/superadmin/offers/${offerId}`)
}

/**
 * Create superadmin offer with business
 */
export async function createAdminOffer(offerData: SuperadminOffer) {
  return makeAdminRequest('/superadmin/offers', {
    method: 'POST',
    body: JSON.stringify(offerData),
  })
}

/**
 * Update superadmin offer
 */
export async function updateAdminOffer(offerId: string, offerData: Partial<SuperadminOffer>) {
  return makeAdminRequest(`/superadmin/offers/${offerId}`, {
    method: 'PUT',
    body: JSON.stringify(offerData),
  })
}

/**
 * Delete superadmin offer
 */
export async function deleteAdminOffer(offerId: string) {
  return makeAdminRequest(`/superadmin/offers/${offerId}`, {
    method: 'DELETE',
  })
}

/**
 * Get all superadmin businesses
 */
export async function getAdminBusinesses(params: {
  page?: number
  size?: number
  is_active?: boolean
  category_id?: number
} = {}) {
  const queryParams = new URLSearchParams()
  if (params.page) queryParams.append('page', params.page.toString())
  if (params.size) queryParams.append('size', params.size.toString())
  if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString())
  if (params.category_id) queryParams.append('category_id', params.category_id.toString())

  const query = queryParams.toString()
  return makeAdminRequest(`/superadmin/businesses${query ? '?' + query : ''}`)
}

/**
 * Get categories for dropdown
 */
export async function getCategories() {
  const response = await fetch(`${API_BASE_URL}/customer/offers/categories`)
  if (!response.ok) {
    throw new Error('Failed to fetch categories')
  }
  return response.json()
}
