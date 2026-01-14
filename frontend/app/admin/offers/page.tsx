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
import { Plus, Trash2, Store, Calendar, Percent, Tag, Loader2, CheckCircle, AlertCircle, Eye, DollarSign, Package } from 'lucide-react'
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
    start_date: new Date().toISOString().split('T')[0],
    expiry_date: (() => {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth.toISOString().split('T')[0];
    })(),
    start_time: '09:00',
    expiry_time: '17:00',
    max_claims: '',
    max_claims_per_user: '',
    minimum_purchase_amount: '',
    minimum_quantity: '',
    buy_quantity: '',
    get_quantity: '',
    get_discount_percentage: '100',
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

  const handleDiscountTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      discount_type: type,
      discount_value: '',
      minimum_purchase_amount: '',
      minimum_quantity: '',
      buy_quantity: '',
      get_quantity: '',
      get_discount_percentage: type === 'bogo' ? '100' : '',
    }))
  }

  // Calculate discounted price based on discount type and values
  const calculateDiscountedPrice = () => {
    const originalPrice = parseFloat(formData.original_price)
    const discountValue = parseFloat(formData.discount_value)

    if (!originalPrice || originalPrice <= 0) return 0

    switch (formData.discount_type) {
      case 'percentage':
        if (!discountValue || discountValue <= 0) return originalPrice
        return originalPrice - (originalPrice * (discountValue / 100))

      case 'fixed':
        if (!discountValue || discountValue <= 0) return originalPrice
        return Math.max(0, originalPrice - discountValue)

      case 'minimum_purchase':
        if (!discountValue || discountValue <= 0) return originalPrice
        return Math.max(0, originalPrice - discountValue)

      case 'quantity_discount':
        if (!discountValue || discountValue <= 0) return originalPrice
        return originalPrice - (originalPrice * (discountValue / 100))

      case 'bogo':
        // For BOGO, the discounted price represents the effective price per item
        const buyQty = parseInt(formData.buy_quantity) || 1
        const getQty = parseInt(formData.get_quantity) || 0
        const getDiscount = parseFloat(formData.get_discount_percentage) || 100

        if (buyQty <= 0) return originalPrice

        // Calculate effective price: (buy items at full price + get items at discount) / total items
        const totalItems = buyQty + getQty
        const paidItems = buyQty + (getQty * (1 - getDiscount / 100))
        const effectivePricePerItem = (paidItems * originalPrice) / totalItems

        return effectivePricePerItem

      default:
        return originalPrice
    }
  }

  const discountedPrice = calculateDiscountedPrice()
  const savingsAmount = parseFloat(formData.original_price) > 0 ? parseFloat(formData.original_price) - discountedPrice : 0
  const savingsPercentage = parseFloat(formData.original_price) > 0 ? Math.round((savingsAmount / parseFloat(formData.original_price)) * 100) : 0

  const validateForm = () => {
    // Business validation
    if (!formData.useExistingBusiness) {
      if (!formData.business_name.trim()) {
        toast.error('Business name is required')
        return false
      }
    } else {
      if (!formData.existing_business_id) {
        toast.error('Please select an existing business')
        return false
      }
    }

    // Offer validation
    if (!formData.offer_title.trim()) {
      toast.error('Offer title is required')
      return false
    }

    // Price validation
    if (!formData.original_price || parseFloat(formData.original_price) <= 0) {
      toast.error('Original price must be greater than 0')
      return false
    }

    if (!formData.start_date || !formData.expiry_date || !formData.start_time || !formData.expiry_time) {
      toast.error('Start and expiry dates/times are required')
      return false
    }

    const startDateTime = new Date(`${formData.start_date}T${formData.start_time}:00`)
    const expiryDateTime = new Date(`${formData.expiry_date}T${formData.expiry_time}:00`)

    if (expiryDateTime <= startDateTime) {
      toast.error('Expiry date/time must be after start date/time')
      return false
    }

    // Discount type specific validation
    if (formData.discount_type === 'percentage' || formData.discount_type === 'fixed') {
      if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
        toast.error('Discount value must be greater than 0')
        return false
      }
      if (formData.discount_type === 'percentage' && parseFloat(formData.discount_value) > 100) {
        toast.error('Percentage discount cannot exceed 100%')
        return false
      }
    }

    if (formData.discount_type === 'minimum_purchase') {
      if (!formData.discount_value || !formData.minimum_purchase_amount) {
        toast.error('Discount value and minimum purchase amount are required')
        return false
      }
    }

    if (formData.discount_type === 'quantity_discount') {
      if (!formData.discount_value || !formData.minimum_quantity) {
        toast.error('Discount value and minimum quantity are required')
        return false
      }
    }

    if (formData.discount_type === 'bogo') {
      if (!formData.buy_quantity || !formData.get_quantity || !formData.get_discount_percentage) {
        toast.error('Buy quantity, get quantity, and discount percentage are required for BOGO offers')
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setCreating(true)

    try {
      // Combine date and time, parse as local time, then convert to UTC ISO strings
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}:00`)
      const expiryDateTime = new Date(`${formData.expiry_date}T${formData.expiry_time}:00`)

      // Convert to ISO strings (automatically converts local time to UTC)
      const startDateISO = startDateTime.toISOString()
      const expiryDateISO = expiryDateTime.toISOString()

      // Calculate discounted price
      const calculatedDiscountedPrice = calculateDiscountedPrice()

      // Prepare the payload
      const payload: any = {
        offer_title: formData.offer_title.trim(),
        offer_description: formData.offer_description.trim() || undefined,
        discount_type: formData.discount_type,
        original_price: parseFloat(formData.original_price),
        discounted_price: calculatedDiscountedPrice,
        start_date: startDateISO,
        expiry_date: expiryDateISO,
        max_claims: formData.max_claims ? parseInt(formData.max_claims) : undefined,
        max_claims_per_user: formData.max_claims_per_user ? parseInt(formData.max_claims_per_user) : undefined,
        terms_conditions: formData.terms_conditions.trim() || undefined,
      }

      // Add discount type specific fields
      if (formData.discount_type === 'percentage' || formData.discount_type === 'fixed') {
        payload.discount_value = parseFloat(formData.discount_value)
      }

      if (formData.discount_type === 'minimum_purchase') {
        payload.discount_value = parseFloat(formData.discount_value)
        payload.minimum_purchase_amount = parseFloat(formData.minimum_purchase_amount)
      }

      if (formData.discount_type === 'quantity_discount') {
        payload.discount_value = parseFloat(formData.discount_value)
        payload.minimum_quantity = parseInt(formData.minimum_quantity)
      }

      if (formData.discount_type === 'bogo') {
        payload.buy_quantity = parseInt(formData.buy_quantity)
        payload.get_quantity = parseInt(formData.get_quantity)
        payload.get_discount_percentage = parseFloat(formData.get_discount_percentage)
        // Backend requires discount_value even for BOGO, use get_discount_percentage
        payload.discount_value = parseFloat(formData.get_discount_percentage)
      }

      // Add business details based on selection
      if (formData.useExistingBusiness && formData.existing_business_id) {
        payload.existing_business_id = formData.existing_business_id
        // Backend requires business_name even when using existing business
        const selectedBusiness = businesses.find(b => b.id === formData.existing_business_id)
        payload.business_name = selectedBusiness?.business_name || 'Existing Business'
      } else {
        // Creating new business
        payload.business_name = formData.business_name.trim()
        payload.business_description = formData.business_description.trim() || undefined
        payload.business_address = formData.business_address
        payload.phone_number = formData.phone_number || undefined
        payload.business_website = formData.business_website || undefined
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
      resetForm()
      setShowCreateForm(false)
      loadData()

    } catch (error: any) {
      console.error('Error creating offer:', error)
      toast.error(error.message || 'Failed to create offer')
    } finally {
      setCreating(false)
    }
  }

  const resetForm = () => {
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
      start_date: new Date().toISOString().split('T')[0],
      expiry_date: (() => {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth.toISOString().split('T')[0];
      })(),
      start_time: '09:00',
      expiry_time: '17:00',
      max_claims: '',
      max_claims_per_user: '',
      minimum_purchase_amount: '',
      minimum_quantity: '',
      buy_quantity: '',
      get_quantity: '',
      get_discount_percentage: '100',
      terms_conditions: '',
    })
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
              {/* BUSINESS SECTION */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Store className="h-5 w-5 text-[#e94e1b]" />
                  Business Information
                </h3>

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
                        required={!formData.useExistingBusiness}
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
                        onChange={(value: string) => handleInputChange('business_address', value)}
                        onLocationSelect={(locationData: any) => {
                          if (locationData) {
                            handleInputChange('formatted_address', locationData.address)
                            handleInputChange('latitude', locationData.latitude ? locationData.latitude.toString() : '')
                            handleInputChange('longitude', locationData.longitude ? locationData.longitude.toString() : '')
                            handleInputChange('place_id', locationData.place_id || '')
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

              {/* OFFER SECTION */}
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5 text-[#e94e1b]" />
                  Offer Details
                </h3>

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
                      rows={2}
                    />
                  </div>
                </div>

                {/* Discount Type Selection */}
                <div className="space-y-3">
                  <Label>Discount Type *</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'percentage', label: 'Percentage', icon: Percent },
                      { value: 'fixed', label: 'Fixed Amount', icon: DollarSign },
                      { value: 'minimum_purchase', label: 'Min Purchase', icon: DollarSign },
                      { value: 'quantity_discount', label: 'Bulk Discount', icon: Package },
                      { value: 'bogo', label: 'BOGO', icon: Package }
                    ].map((type) => (
                      <Button
                        key={type.value}
                        type="button"
                        onClick={() => handleDiscountTypeChange(type.value)}
                        className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                          formData.discount_type === type.value
                            ? 'bg-[#e94e1b] text-white shadow-lg'
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </Button>
                    ))}
                  </div>

                  {/* Dynamic Discount Configuration */}
                  <div className="mt-4 p-4 bg-white rounded-lg border">
                    {formData.discount_type === 'percentage' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="discount_value">Discount Percentage *</Label>
                          <div className="relative">
                            <Input
                              id="discount_value"
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={formData.discount_value}
                              onChange={(e) => handleInputChange('discount_value', e.target.value)}
                              placeholder="20"
                              className="pr-10"
                              required
                            />
                            <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.discount_type === 'fixed' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="discount_value">Discount Amount *</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              id="discount_value"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.discount_value}
                              onChange={(e) => handleInputChange('discount_value', e.target.value)}
                              placeholder="10.00"
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.discount_type === 'minimum_purchase' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="discount_value">Discount Amount *</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              id="discount_value"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.discount_value}
                              onChange={(e) => handleInputChange('discount_value', e.target.value)}
                              placeholder="5.00"
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="minimum_purchase_amount">Minimum Purchase *</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              id="minimum_purchase_amount"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.minimum_purchase_amount}
                              onChange={(e) => handleInputChange('minimum_purchase_amount', e.target.value)}
                              placeholder="25.00"
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.discount_type === 'quantity_discount' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="minimum_quantity">Minimum Quantity *</Label>
                          <Input
                            id="minimum_quantity"
                            type="number"
                            min="1"
                            value={formData.minimum_quantity}
                            onChange={(e) => handleInputChange('minimum_quantity', e.target.value)}
                            placeholder="3"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="discount_value">Discount Percentage *</Label>
                          <div className="relative">
                            <Input
                              id="discount_value"
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={formData.discount_value}
                              onChange={(e) => handleInputChange('discount_value', e.target.value)}
                              placeholder="15"
                              className="pr-10"
                              required
                            />
                            <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.discount_type === 'bogo' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="buy_quantity">Buy Quantity *</Label>
                          <Input
                            id="buy_quantity"
                            type="number"
                            min="1"
                            value={formData.buy_quantity}
                            onChange={(e) => handleInputChange('buy_quantity', e.target.value)}
                            placeholder="1"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="get_quantity">Get Quantity *</Label>
                          <Input
                            id="get_quantity"
                            type="number"
                            min="1"
                            value={formData.get_quantity}
                            onChange={(e) => handleInputChange('get_quantity', e.target.value)}
                            placeholder="1"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="get_discount_percentage">Discount % *</Label>
                          <div className="relative">
                            <Input
                              id="get_discount_percentage"
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={formData.get_discount_percentage}
                              onChange={(e) => handleInputChange('get_discount_percentage', e.target.value)}
                              placeholder="100"
                              className="pr-10"
                              required
                            />
                            <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing Fields */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Pricing Information *
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="original_price">Original Price *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          id="original_price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.original_price}
                          onChange={(e) => handleInputChange('original_price', e.target.value)}
                          placeholder="100.00"
                          className="pl-10"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500">Regular price before discount</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Discounted Price (Auto-calculated)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <div className="pl-10 pr-4 py-2 h-10 border border-gray-300 rounded-md bg-gray-50 flex items-center text-gray-900 font-medium">
                          {discountedPrice > 0 ? discountedPrice.toFixed(2) : '0.00'}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Calculated based on discount settings</p>
                    </div>
                  </div>

                  {/* Show calculated savings */}
                  {savingsAmount > 0 && (
                    <div className="bg-white border border-green-300 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-700">
                        Customer Saves: ${savingsAmount.toFixed(2)} ({savingsPercentage}% off)
                      </p>
                    </div>
                  )}
                </div>

                {/* Date/Time Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => handleInputChange('start_date', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time *</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => handleInputChange('start_time', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">Expiry Date *</Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry_time">Expiry Time *</Label>
                    <Input
                      id="expiry_time"
                      type="time"
                      value={formData.expiry_time}
                      onChange={(e) => handleInputChange('expiry_time', e.target.value)}
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
                      {offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `$${offer.discount_value}`} off
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
