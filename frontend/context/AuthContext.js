// context/AuthContext.js
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

// Simple API request function for business profile
const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = localStorage.getItem('auth_token')
    const url = `${API_BASE_URL}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    const data = await response.json()
    
    if (!response.ok) {
      return { success: false, error: data.detail || data.message || 'Request failed' }
    }
    
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message || 'Network error' }
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [businessProfile, setBusinessProfile] = useState(null)
  const [businessProfileLoading, setBusinessProfileLoading] = useState(false)

  // Check for existing auth on mount
  useEffect(() => {
    checkExistingAuth()
  }, [])

  // Fetch business profile when user changes
  useEffect(() => {
    if (user && user.is_business && !businessProfile) {
      fetchBusinessProfile()
    }
  }, [user])

  const checkExistingAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const userData = localStorage.getItem('auth_user')
      const cachedBusinessProfile = localStorage.getItem('business_profile')

      if (token && userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        
        // Restore cached business profile if available
        if (cachedBusinessProfile && parsedUser.is_business) {
          setBusinessProfile(JSON.parse(cachedBusinessProfile))
        }
        
        // Verify token is still valid
        await verifyToken(token)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      clearAuthData()
    } finally {
      setLoading(false)
    }
  }

  const fetchBusinessProfile = async () => {
    if (!user || !user.is_business) return
    
    setBusinessProfileLoading(true)
    try {
      const result = await apiRequest('/business/profile', { method: 'GET' })
      if (result.success && result.data) {
        setBusinessProfile(result.data)
        // Cache in localStorage for persistence
        localStorage.setItem('business_profile', JSON.stringify(result.data))
      }
    } catch (error) {
      console.error('Failed to fetch business profile:', error)
    } finally {
      setBusinessProfileLoading(false)
    }
  }

  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Token verification failed')
      }

      const userData = await response.json()
      setUser(userData.user || userData)
    } catch (error) {
      console.error('Token verification failed:', error)
      clearAuthData()
    }
  }

  const login = async (email, password) => {
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
        // Handle different error formats more gracefully
        let errorMessage = 'Login failed'
        
        if (data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage = data.detail
          } else if (Array.isArray(data.detail)) {
            errorMessage = data.detail.map(err => err.msg || err).join(', ')
          }
        } else if (data.message) {
          errorMessage = data.message
        }
        
        return { error: errorMessage }
      }

      // Store auth data
      localStorage.setItem('auth_token', data.access_token)
      localStorage.setItem('auth_user', JSON.stringify(data.user))
      
      setUser(data.user)
      
      return { success: true, user: data.user }
    } catch (error) {
      console.error('Login error:', error)
      return { error: error.message || 'Network error. Please try again.' }
    }
  }

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle different error formats more gracefully
        let errorMessage = 'Registration failed'
        
        if (data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage = data.detail
          } else if (Array.isArray(data.detail)) {
            errorMessage = data.detail.map(err => {
              const field = err.loc ? err.loc[err.loc.length - 1] : 'field'
              return `${field}: ${err.msg}`
            }).join(', ')
          }
        } else if (data.message) {
          errorMessage = data.message
        }
        
        return { error: errorMessage }
      }

      // Store auth data
      localStorage.setItem('auth_token', data.access_token)
      localStorage.setItem('auth_user', JSON.stringify(data.user))
      
      setUser(data.user)
      
      return { success: true, user: data.user, token: data.access_token }
    } catch (error) {
      console.error('Registration error:', error)
      return { error: error.message || 'Network error. Please try again.' }
    }
  }

  // Business-specific registration - keep existing interface
  const registerBusiness = async (businessData) => {
    const userData = {
      ...businessData,
      is_business: true
    }
    return await register(userData)
  }

  // Customer-specific registration
  const registerCustomer = async (customerData) => {
    const userData = {
      ...customerData,
      is_business: false
    }
    return await register(userData)
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuthData()
    }
  }

  const deleteAccount = async () => {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.detail || 'Failed to delete account')
    }
    clearAuthData()
  }

  const clearAuthData = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('business_profile')
    setUser(null)
    setBusinessProfile(null)
    setBusinessProfileLoading(false)
  }

  // Add this login function that your existing signin page expects
  const loginUser = (user, token = null) => {
    if (token) {
      localStorage.setItem('auth_token', token)
    }
    localStorage.setItem('auth_user', JSON.stringify(user))
    setUser(user)
  }

  const value = {
    user,
    loading,
    businessProfile,
    businessProfileLoading,
    fetchBusinessProfile,
    login: loginUser,  // This is what your existing signin page expects
    signIn: login,     // This is the API login function
    register,
    registerBusiness,
    registerCustomer,
    logout,
    deleteAccount,
    clearAuthData
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}