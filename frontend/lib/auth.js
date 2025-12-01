// frontend/lib/auth.js - Fixed version

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

/**
 * Get stored authentication token
 */
export function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

/**
 * Get stored user data
 */
export function getUser() {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem('auth_user')
  return userStr ? JSON.parse(userStr) : null
}

/**
 * Store authentication data
 */
export function setAuthData(token, user) {
  if (typeof window === 'undefined') return
  localStorage.setItem('auth_token', token)
  localStorage.setItem('auth_user', JSON.stringify(user))
}

/**
 * Clear authentication data
 */
export function clearAuthData() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!getToken()
}

/**
 * Make authenticated API request
 */
export async function makeAuthenticatedRequest(endpoint, options = {}) {
  const token = getToken()
  
  // Don't set Content-Type for FormData uploads - let browser set it with boundary
  const isFormData = options.body instanceof FormData || options.isFormData
  
  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }
  
  // Only set Content-Type for non-FormData requests
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }
  
  const config = {
    ...options,
    headers,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  
  // Handle 401 - token expired
  if (response.status === 401) {
    clearAuthData()
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
    return null
  }

  return response
}

/**
 * Sign in user
 */
export async function signIn(credentials) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    const data = await response.json()

    if (!response.ok) {
      // Handle different error formats
      if (data.detail) {
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
      return { error: data.message || 'Login failed' }
    }

    setAuthData(data.access_token, data.user)
    return { success: true, user: data.user, token: data.access_token }
  } catch (error) {
    console.error('Sign in error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Sign up customer user
 */
export async function signUp(userData) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...userData,
        is_business: false  // Explicitly set as customer
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      if (data.detail) {
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
      return { error: data.message || 'Registration failed' }
    }

    setAuthData(data.access_token, data.user)
    return { success: true, user: data.user, token: data.access_token }
  } catch (error) {
    console.error('Sign up error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Register business user (FIXED)
 */
export async function registerBusiness(businessData) {
  try {
    // Use the business-specific registration endpoint
    const response = await fetch(`${API_BASE_URL}/business/register-complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(businessData),
    })

    const data = await response.json()

    if (!response.ok) {
      if (data.detail) {
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
      return { error: data.message || 'Registration failed' }
    }

    // Store auth data
    setAuthData(data.access_token, data.user)
    return { 
      success: true, 
      user: data.user, 
      token: data.access_token,
      message: data.message 
    }
  } catch (error) {
    console.error('Business registration error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Register customer user specifically
 */
export async function registerCustomer(customerData) {
  try {
    // Use the general auth register endpoint for customers
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...customerData,
        is_business: false
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      if (data.detail) {
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
      return { error: data.message || 'Registration failed' }
    }

    setAuthData(data.access_token, data.user)
    return { success: true, user: data.user, token: data.access_token }
  } catch (error) {
    console.error('Customer registration error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Sign out user
 */
export async function signOut() {
  try {
    // Optional: Call backend logout endpoint
    const token = getToken()
    if (token) {
      await makeAuthenticatedRequest('/auth/logout', {
        method: 'POST'
      })
    }
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    // Always clear local data
    clearAuthData()
  }
}