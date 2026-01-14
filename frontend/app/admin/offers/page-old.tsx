'use client'

import { useState, useEffect } from 'react'
import { getAdminOffers, createAdminOffer, deleteAdminOffer, getCategories, getAdminBusinesses } from '@/lib/admin-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Store, Calendar, Percent, Tag, Loader2, CheckCircle, AlertCircle, Eye } from 'lucide-react'
import { toast } from 'sonner'
import AddressAutocomplete from '@/components/AddressAutocomplete'

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<any[]>([])
  const [businesses, setBusinesses] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    // Choose existing business or create new
    useExistingBusiness: false,
    existing_business_id: '',

    // Business details
    business_name: '',
    business_description: '',
    business_address: '',
    phone_number: '',
    business_website: '',
    category_id: '',
    latitude: '',
    longitude: '',
    formatted_address: '',
    place_id: '',
    address_components: null,

    // Offer details
    offer_title: '',
    offer_description: '',
    discount_type: 'percentage',
    discount_value: '',
    original_price: '',
    discounted_price: '',
    start_date: '',
    expiry_date: '',
    max_claims: '',
    max_claims_per_user: '',
    minimum_purchase_amount: '0',
    terms_conditions: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [offersData, categoriesData, businessesData] = await Promise.all([
        getAdminOffers({ page: 1, size: 100 }),
        getCategories(),
        getAdminBusinesses({ page: 1, size: 100 })
      ])
      setOffers(offersData.offers || [])
      setCategories(categoriesData.categories || [])
      setBusinesses(businessesData.businesses || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      // Prepare the payload
      const payload: any = {
        offer_title: formData.offer_title,
        offer_description: formData.offer_description,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        start_date: new Date(formData.start_date).toISOString(),
        expiry_date: new Date(formData.expiry_date).toISOString(),
        max_claims: formData.max_claims ? parseInt(formData.max_claims) : undefined,
        max_claims_per_user: formData.max_claims_per_user ? parseInt(formData.max_claims_per_user) : undefined,
        minimum_purchase_amount: parseFloat(formData.minimum_purchase_amount || '0'),
        terms_conditions: formData.terms_conditions,
      }

      // Add prices if provided
      if (formData.original_price) payload.original_price = parseFloat(formData.original_price)
      if (formData.discounted_price) payload.discounted_price = parseFloat(formData.discounted_price)

      // Add business details based on selection
      if (formData.useExistingBusiness && formData.existing_business_id) {
        payload.existing_business_id = formData.existing_business_id
      } else {
        // Creating new business
        payload.business_name = formData.business_name
        payload.business_description = formData.business_description
        payload.business_address = formData.business_address
        payload.phone_number = formData.phone_number
        payload.business_website = formData.business_website
        payload.category_id = formData.category_id ? parseInt(formData.category_id) : undefined
        payload.formatted_address = formData.formatted_address || formData.business_address

        if (formData.latitude) payload.latitude = parseFloat(formData.latitude)
        if (formData.longitude) payload.longitude = parseFloat(formData.longitude)
        if (formData.place_id) payload.place_id = formData.place_id
        if (formData.address_components) payload.address_components = formData.address_components
      }

      await createAdminOffer(payload)

      toast.success('Demo offer created successfully!')

      // Reset form and reload offers
      setFormData({
        useExistingBusiness: false,
        existing_business_id: '',
        business_name: '',
        business_description: '',
        business_address: '',
        phone_number: '',
        business_website: '',
        category_id: '',
        latitude: '',
        longitude: '',
        formatted_address: '',
        place_id: '',
        address_components: null,
        offer_title: '',
        offer_description: '',
        discount_type: 'percentage',
        discount_value: '',
        original_price: '',
        discounted_price: '',
        start_date: '',
        expiry_date: '',
        max_claims: '',
        max_claims_per_user: '',
        minimum_purchase_amount: '0',
        terms_conditions: '',
      })
      setShowCreateForm(false)
      loadData()

    } catch (error: any) {
      console.error('Error creating offer:', error)
      toast.error(error.message || 'Failed to create offer')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (offerId: string, offerTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${offerTitle}"?`)) {
      return
    }

    try {
      await deleteAdminOffer(offerId)
      toast.success('Offer deleted successfully')
      loadData()
    } catch (error: any) {
      console.error('Error deleting offer:', error)
      toast.error(error.message || 'Failed to delete offer')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#e94e1b]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Demo Offers</h1>
          <p className="text-gray-600 mt-1">Create and manage demo offers for user acquisition</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-[#e94e1b] hover:bg-[#d43d0f]"
        >
          {showCreateForm ? (
            <>Cancel</>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Demo Offer
            </>
          )}
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="border-2 border-[#e94e1b]/20">
          <CardHeader>
            <CardTitle>Create Demo Offer</CardTitle>
            <CardDescription>Fill in business and offer details to create a demo offer</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Business Selection */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-lg">Business Information</h3>

                <div className="flex items-center space-x-4">
                  <Label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!formData.useExistingBusiness}
                      onChange={() => handleInputChange('useExistingBusiness', false)}
                      className="w-4 h-4"
                    />
                    <span>Create New Business</span>
                  </Label>
                  <Label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.useExistingBusiness}
                      onChange={() => handleInputChange('useExistingBusiness', true)}
                      className="w-4 h-4"
                    />
                    <span>Use Existing Business</span>
                  </Label>
                </div>

                {formData.useExistingBusiness ? (
                  <div className="space-y-2">
                    <Label>Select Business</Label>
                    <Select
                      value={formData.existing_business_id}
                      onValueChange={(value) => handleInputChange('existing_business_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a business" />
                      </SelectTrigger>
                      <SelectContent>
                        {businesses.map((business) => (
                          <SelectItem key={business.id} value={business.id}>
                            {business.business_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="business_name">Business Name *</Label>
                      <Input
                        id="business_name"
                        value={formData.business_name}
                        onChange={(e) => handleInputChange('business_name', e.target.value)}
                        required
                        placeholder="e.g., Joe's Pizza"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category_id">Category</Label>
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) => handleInputChange('category_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.icon} {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="business_description">Business Description</Label>
                      <Textarea
                        id="business_description"
                        value={formData.business_description}
                        onChange={(e) => handleInputChange('business_description', e.target.value)}
                        placeholder="Brief description of the business"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="business_address">Business Address</Label>
                      <AddressAutocomplete
                        value={formData.business_address}
                        onChange={(value) => handleInputChange('business_address', value)}
                        onLocationSelect={(locationData) => {
                          if (locationData) {
                            handleInputChange('formatted_address', locationData.address)
                            handleInputChange('latitude', locationData.latitude ? locationData.latitude.toString() : '')
                            handleInputChange('longitude', locationData.longitude ? locationData.longitude.toString() : '')
                            handleInputChange('place_id', locationData.place_id || '')
                            // Store address_components if needed
                            if (locationData.address_components) {
                              handleInputChange('address_components', locationData.address_components)
                            }
                          }
                        }}
                        placeholder="Start typing business address..."
                      />
                      {formData.latitude && formData.longitude && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Location coordinates captured
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Phone Number</Label>
                      <Input
                        id="phone_number"
                        value={formData.phone_number}
                        onChange={(e) => handleInputChange('phone_number', e.target.value)}
                        placeholder="+1-555-555-5555"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="business_website">Website</Label>
                      <Input
                        id="business_website"
                        type="url"
                        value={formData.business_website}
                        onChange={(e) => handleInputChange('business_website', e.target.value)}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Offer Details */}
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-lg">Offer Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="offer_title">Offer Title *</Label>
                    <Input
                      id="offer_title"
                      value={formData.offer_title}
                      onChange={(e) => handleInputChange('offer_title', e.target.value)}
                      required
                      placeholder="e.g., 50% Off All Pizzas"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="offer_description">Offer Description</Label>
                    <Textarea
                      id="offer_description"
                      value={formData.offer_description}
                      onChange={(e) => handleInputChange('offer_description', e.target.value)}
                      placeholder="Detailed description of the offer"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount_type">Discount Type *</Label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(value) => handleInputChange('discount_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage Off</SelectItem>
                        <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                        <SelectItem value="bogo">Buy One Get One</SelectItem>
                        <SelectItem value="minimum_purchase">Minimum Purchase</SelectItem>
                        <SelectItem value="quantity_discount">Quantity Discount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount_value">Discount Value *</Label>
                    <Input
                      id="discount_value"
                      type="number"
                      step="0.01"
                      value={formData.discount_value}
                      onChange={(e) => handleInputChange('discount_value', e.target.value)}
                      required
                      placeholder="e.g., 50 for 50% or $50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="original_price">Original Price</Label>
                    <Input
                      id="original_price"
                      type="number"
                      step="0.01"
                      value={formData.original_price}
                      onChange={(e) => handleInputChange('original_price', e.target.value)}
                      placeholder="e.g., 20.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discounted_price">Discounted Price</Label>
                    <Input
                      id="discounted_price"
                      type="number"
                      step="0.01"
                      value={formData.discounted_price}
                      onChange={(e) => handleInputChange('discounted_price', e.target.value)}
                      placeholder="e.g., 10.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => handleInputChange('start_date', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">Expiry Date *</Label>
                    <Input
                      id="expiry_date"
                      type="datetime-local"
                      value={formData.expiry_date}
                      onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_claims">Max Total Claims</Label>
                    <Input
                      id="max_claims"
                      type="number"
                      value={formData.max_claims}
                      onChange={(e) => handleInputChange('max_claims', e.target.value)}
                      placeholder="e.g., 100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_claims_per_user">Max Claims Per User</Label>
                    <Input
                      id="max_claims_per_user"
                      type="number"
                      value={formData.max_claims_per_user}
                      onChange={(e) => handleInputChange('max_claims_per_user', e.target.value)}
                      placeholder="e.g., 1"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="terms_conditions">Terms & Conditions</Label>
                    <Textarea
                      id="terms_conditions"
                      value={formData.terms_conditions}
                      onChange={(e) => handleInputChange('terms_conditions', e.target.value)}
                      placeholder="Enter any terms and conditions"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-[#e94e1b] hover:bg-[#d43d0f]"
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Create Demo Offer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Offers List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Existing Demo Offers ({offers.length})
        </h2>

        {offers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Tag className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No demo offers created yet.</p>
              <p className="text-sm mt-2">Click "Create Demo Offer" to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((offer) => (
              <Card key={offer.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary" className="mb-2">
                      <Eye className="h-3 w-3 mr-1" />
                      View Only
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(offer.id, offer.title)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 -mt-2 -mr-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{offer.title}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <Store className="h-3 w-3 mr-1" />
                    {offer.business?.business_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <Badge variant="outline" className="bg-green-50">
                      <Percent className="h-3 w-3 mr-1" />
                      {offer.discount_value}{offer.discount_type === 'percentage' ? '%' : ''} off
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Expires:</span>
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(offer.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                  {offer.business?.business_address && (
                    <p className="text-xs text-gray-500 line-clamp-2 pt-2 border-t">
                      {offer.business.business_address}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
