'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import BusinessLayout from '@/components/BusinessLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ShoppingBag,
  Upload,
  X,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Save,
  Package,
  DollarSign,
  FileImage
} from 'lucide-react'

// Import API functions
import { updateProduct, getProduct, getCategories, uploadProductImage } from '@/lib/products'
import { getImageUrl } from '@/lib/api'

export default function EditProductPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const productId = params.productId
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    stock_quantity: '',
    tags: '',
    image_url: '',
    is_active: true
  })
  
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imagePath, setImagePath] = useState(null)
  const [originalProduct, setOriginalProduct] = useState(null)

  // Load product data
  useEffect(() => {
    if (user && user.is_business && productId) {
      loadProductData()
      fetchCategories()
    }
  }, [user, productId])

  const loadProductData = async () => {
    try {
      setPageLoading(true)
      const result = await getProduct(productId)
      
      if (result.success) {
        const product = result.product
        setOriginalProduct(product)
        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: product.price ? parseFloat(product.price).toFixed(2) : '',
          category_id: product.category_id || product.categories?.id || '',
          stock_quantity: product.stock_quantity ? product.stock_quantity.toString() : '',
          tags: product.tags || '',
          image_url: product.image_url || '',
          is_active: product.is_active !== false
        })
        
        // Set image preview if product has image
        if (product.image_url) {
          setImagePreview(getImageUrl(product.image_url))
          setImagePath(product.image_url)
        }
      } else {
        setError(result.error || 'Failed to load product')
      }
    } catch (error) {
      console.error('Error loading product:', error)
      setError('Unable to load product. Please try again.')
    } finally {
      setPageLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const result = await getCategories()
      if (result.success) {
        setCategories(result.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value === 'none' ? '' : value
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }

      setImageFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
      
      setError(null)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setImagePath(null)
    setFormData(prev => ({
      ...prev,
      image_url: ''
    }))
    
    // Reset file input
    const fileInput = document.getElementById('image')
    if (fileInput) fileInput.value = ''
  }

  const uploadImage = async () => {
    if (!imageFile) return imagePath

    try {
      setImageUploading(true)
      const result = await uploadProductImage(imageFile)
      
      if (result.success) {
        setImagePath(result.path)
        return result.path
      } else {
        throw new Error(result.error || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      setError(error.message || 'Failed to upload image')
      return null
    } finally {
      setImageUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Upload image if there's a new one
      let finalImagePath = imagePath
      if (imageFile) {
        finalImagePath = await uploadImage()
        if (!finalImagePath && imageFile) {
          return // Error uploading image
        }
      }

      // Prepare product data
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: formData.price ? parseFloat(formData.price) : null,
        category_id: formData.category_id && formData.category_id !== 'none' ? formData.category_id : null,
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : null,
        tags: formData.tags.trim() || null,
        image_url: finalImagePath || null,
        is_active: formData.is_active
      }

      const result = await updateProduct(productId, productData)
      
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/business/products')
        }, 2000)
      } else {
        setError(result.error || 'Failed to update product')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      setError('An error occurred while updating the product')
    } finally {
      setLoading(false)
    }
  }

  if (!user || !user.is_business) {
    return null
  }

  if (pageLoading) {
    return (
      <BusinessLayout
        title="Edit Product"
        subtitle="Update your product information"
        activeTab="products"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#e94e1b]" />
            <span className="ml-3 text-gray-600">Loading product...</span>
          </div>
        </div>
      </BusinessLayout>
    )
  }

  if (error && !originalProduct) {
    return (
      <BusinessLayout
        title="Edit Product"
        subtitle="Update your product information"
        activeTab="products"
      >
        <div className="max-w-7xl mx-auto px-4">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="mb-4 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
          
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        </div>
      </BusinessLayout>
    )
  }

  return (
    <BusinessLayout
      title="Edit Product"
      subtitle="Update your product information"
      activeTab="products"
    >
      <div className="max-w-7xl mx-auto px-4">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="mb-4 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>

        <Card className="bg-[#1e3a5f] border-2 border-[#00a8e6] shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-white text-lg">
              <Package className="h-5 w-5 text-[#00a8e6]" />
              Product Information
            </CardTitle>
            <CardDescription className="text-blue-200 text-sm">
              Update the details for your product
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-400 bg-red-900/20">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 border-green-400 bg-green-900/20">
                <AlertCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300">
                  Product updated successfully! Redirecting to products page...
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Top Row: Image + Basic Info */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Product Image */}
                <div className="space-y-2">
                  <Label className="text-white font-medium text-sm">Product Image</Label>
                  {imagePreview ? (
                    <div className="relative w-full h-48 bg-white rounded-lg overflow-hidden">
                      <img 
                        src={imagePreview} 
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={removeImage}
                        className="absolute top-2 right-2 h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/40 transition-colors h-48 flex flex-col justify-center">
                      <input
                        type="file"
                        id="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <label htmlFor="image" className="cursor-pointer">
                        <FileImage className="h-10 w-10 text-blue-200 mx-auto mb-2" />
                        <p className="text-blue-200 text-sm mb-1">Click to upload</p>
                        <p className="text-xs text-blue-300">Max 5MB</p>
                      </label>
                    </div>
                  )}
                </div>

                {/* Product Name and Description */}
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <Label className="text-white font-medium text-sm">Product Name *</Label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter product name"
                      required
                      className="bg-[#1e3a5f] border-white/20 text-white placeholder:text-gray-400 mt-1 h-10"
                    />
                  </div>

                  <div>
                    <Label className="text-white font-medium text-sm">Description</Label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your product (optional)"
                      rows={4}
                      className="bg-[#1e3a5f] border-white/20 text-white placeholder:text-gray-400 mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Middle Row: Price, Stock, Category */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-white font-medium text-sm">Price</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="bg-[#1e3a5f] border-white/20 text-white placeholder:text-gray-400 pl-10 mt-1 h-10"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white font-medium text-sm">Stock Quantity</Label>
                  <Input
                    name="stock_quantity"
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    placeholder="Enter stock quantity"
                    className="bg-[#1e3a5f] border-white/20 text-white placeholder:text-gray-400 mt-1 h-10"
                  />
                </div>

                <div>
                  <Label className="text-white font-medium text-sm">Category</Label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={(value) => handleSelectChange('category_id', value)}
                  >
                    <SelectTrigger className="bg-[#1e3a5f] border-white/20 text-white mt-1 h-10">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="none" className="text-gray-900 hover:bg-gray-100">
                        No category
                      </SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id} className="text-gray-900 hover:bg-gray-100">
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bottom Row: Tags */}
              <div>
                <Label className="text-white font-medium text-sm">Tags</Label>
                <Input
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="organic, premium, bestseller"
                  className="bg-[#1e3a5f] border-white/20 text-white placeholder:text-gray-400 mt-1 h-10"
                />
                <p className="text-xs text-blue-300 mt-1">
                  Add searchable keywords separated by commas (e.g., organic, premium, bestseller)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/business/products')}
                  className="flex-1 border-white/20 text-white hover:bg-white hover:text-[#1e3a5f] h-11"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || imageUploading || !formData.name.trim()}
                  className="flex-1 bg-[#e94e1b] hover:bg-[#d13f16] text-white h-11"
                >
                  {loading || imageUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {imageUploading ? 'Uploading image...' : 'Updating Product...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Product
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </BusinessLayout>
  )
}