// lib/products.js
import { makeAuthenticatedRequest } from './auth'

/**
 * Get all products for current business with pagination and filters
 */
export async function getProducts(params = {}) {
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
    
    // Add category filter
    if (params.category_id) queryParams.append('category_id', params.category_id)
    
    const url = `/business/products${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    const response = await makeAuthenticatedRequest(url)
    
    if (!response || !response.ok) {
      const data = await response?.json()
      return { error: data?.detail || 'Failed to fetch products' }
    }
    
    const data = await response.json()
    
    // Ensure products have proper category structure
    const processedProducts = (data.products || []).map(product => ({
      ...product,
      // Ensure both category and categories are available for backward compatibility
      category: product.categories || product.category || null,
      categories: product.categories || product.category || null
    }))
    
    return { 
      success: true, 
      products: processedProducts,
      pagination: data.pagination || {}
    }
  } catch (error) {
    console.error('Get products error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Get single product by ID
 */
export async function getProduct(productId) {
  try {
    const response = await makeAuthenticatedRequest(`/business/products/${productId}`)
    
    if (!response || !response.ok) {
      const data = await response?.json()
      return { error: data?.detail || 'Failed to fetch product' }
    }
    
    const data = await response.json()
    
    // Process the single product with category structure
    const processedProduct = {
      ...data.product,
      category: data.product?.categories || data.product?.category || null,
      categories: data.product?.categories || data.product?.category || null
    }
    
    return { 
      success: true, 
      product: processedProduct
    }
  } catch (error) {
    console.error('Get product error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Create new product
 */
export async function createProduct(productData) {
  try {
    const response = await makeAuthenticatedRequest('/business/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    })

    if (!response || !response.ok) {
      const data = await response?.json()
      console.error('Product creation failed:', data)
      
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
      return { error: 'Failed to create product' }
    }
    
    const data = await response.json()

    return { success: true, product: data.product || data }
  } catch (error) {
    console.error('Create product error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Update existing product - FIXED to use PATCH method
 */
export async function updateProduct(productId, productData) {
  try {
    const response = await makeAuthenticatedRequest(`/business/products/${productId}`, {
      method: 'PATCH', // FIXED: Changed from PUT to PATCH to match backend
      body: JSON.stringify(productData),
    })
    
    if (!response || !response.ok) {
      const data = await response?.json()
      console.error('Product update failed:', data)
      
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
      return { error: 'Failed to update product' }
    }
    
    const data = await response.json()
    
    return { success: true, product: data.product || data }
  } catch (error) {
    console.error('Update product error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Delete product
 */
export async function deleteProduct(productId) {
  try {

    const response = await makeAuthenticatedRequest(`/business/products/${productId}`, {
      method: 'DELETE',
    })

    if (!response) {
      return { error: 'No response from server' }
    }

    // Parse response body
    let data
    try {
      data = await response.json()
    } catch (e) {
      console.error('Failed to parse response:', e)
      data = {}
    }

    if (!response.ok) {
      console.error('Product deletion failed:', data)
      return {
        success: false,
        error: data?.detail || data?.message || 'Failed to delete product'
      }
    }


    return { success: true, message: data.message || 'Product deleted successfully' }
  } catch (error) {
    console.error('Delete product error:', error)
    return { success: false, error: 'Network error. Please try again.' }
  }
}

/**
 * Upload product image
 */
export async function uploadProductImage(imageFile) {
  try {
    
    const formData = new FormData()
    formData.append('image', imageFile)

    // Get the token for authorization
    const token = localStorage.getItem('auth_token')
    if (!token) {
      return { error: 'Authentication required' }
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'
    const response = await fetch(`${API_BASE_URL}/business/products/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })

    if (!response.ok) {
      const data = await response.json()
      console.error('Image upload failed:', data)
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
    console.error('Upload image error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

/**
 * Get categories for select options
 */
export async function getCategories() {
  try {
    const response = await makeAuthenticatedRequest('/categories')
    
    if (!response || !response.ok) {
      const data = await response?.json()
      return { error: data?.detail || 'Failed to fetch categories' }
    }
    
    const categories = await response.json()
    
    return { 
      success: true, 
      categories: Array.isArray(categories) ? categories : []
    }
  } catch (error) {
    console.error('Get categories error:', error)
    return { error: 'Network error. Please try again.' }
  }
}