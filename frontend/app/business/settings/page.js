'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import BusinessLayout from '@/components/BusinessLayout'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import LogoUpload from '@/components/LogoUpload'
import { apiRequest, endpoints } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  User, 
  Upload, 
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Bell,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('Profile')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [formData, setFormData] = useState({
    business_name: '',
    address: '',
    phone: '',
    website: '',
    email: '',
    category: '',
    timezone: 'America/Toronto',
    avatar_url: '',
    latitude: null,
    longitude: null,
    formatted_address: null,
    place_id: null,
    address_components: null,
    promotional_updates: true,
    transaction_alerts: true,
    email_notifications: true
  })

  const tabs = ['Profile', 'Notifications', 'Account']
  
  // Load categories
  const loadCategories = async () => {
    try {
      const result = await apiRequest(endpoints.categories || '/categories', {
        method: 'GET'
      })
      
      if (result && Array.isArray(result)) {
        setCategories(result)
      } else if (result.data && Array.isArray(result.data)) {
        setCategories(result.data)
      }
    } catch (err) {
      console.error('Failed to load categories:', err)
      // Set default categories if API fails
      setCategories([
        { id: 'restaurant', name: 'Restaurant' },
        { id: 'retail', name: 'Retail' },
        { id: 'service', name: 'Service' },
        { id: 'health', name: 'Health & Wellness' },
        { id: 'entertainment', name: 'Entertainment' },
        { id: 'other', name: 'Other' }
      ])
    } finally {
      setLoadingCategories(false)
    }
  }

  // Load user data on component mount
  useEffect(() => {
    const loadUserSettings = async () => {
      if (user) {
        try {
          // Try to fetch full profile data from API
          const result = await apiRequest(endpoints.businessProfile, {
            method: 'GET'
          })
          
          if (result.success && result.data) {
            const profileData = result.data
            console.log('Settings: Profile data received:', profileData)
            setFormData({
              business_name: profileData.business?.business_name || profileData.business_name || user.business_name || '',
              address: profileData.business?.business_address || profileData.address || user.address || '',
              phone: profileData.business?.phone_number || profileData.phone || user.phone || '',
              website: profileData.business?.business_website || profileData.website || user.website || '',
              email: profileData.email || user.email || '',
              category: profileData.business?.category_id || profileData.category_id || profileData.category || user.category || '',
              timezone: profileData.business?.timezone || profileData.timezone || user.timezone || 'America/Toronto',
              avatar_url: profileData.business?.avatar_url || profileData.avatar_url || user.avatar_url || '',
              latitude: profileData.business?.latitude || profileData.latitude || user.latitude || null,
              longitude: profileData.business?.longitude || profileData.longitude || user.longitude || null,
              formatted_address: profileData.business?.formatted_address || profileData.formatted_address || user.formatted_address || null,
              place_id: profileData.business?.place_id || profileData.place_id || user.place_id || null,
              address_components: profileData.business?.address_components || profileData.address_components || user.address_components || null,
              promotional_updates: profileData.promotional_updates ?? true,
              transaction_alerts: profileData.transaction_alerts ?? true,
              email_notifications: profileData.email_notifications ?? true
            })
          } else {
            // Fallback to user data from auth context
            setFormData({
              business_name: user.business?.business_name || user.business_name || '',
              address: user.business?.business_address || user.address || '',
              phone: user.business?.phone_number || user.phone || '',
              website: user.business?.business_website || user.website || '',
              email: user.email || '',
              category: user.business?.category_id || user.category_id || user.category || '',
              timezone: user.business?.timezone || user.timezone || 'America/Toronto',
              avatar_url: user.business?.avatar_url || user.avatar_url || '',
              latitude: user.business?.latitude || user.latitude || null,
              longitude: user.business?.longitude || user.longitude || null,
              formatted_address: user.business?.formatted_address || user.formatted_address || null,
              place_id: user.business?.place_id || user.place_id || null,
              address_components: user.business?.address_components || user.address_components || null,
              promotional_updates: true,
              transaction_alerts: true,
              email_notifications: true
            })
          }
        } catch (err) {
          console.error('Failed to load user settings:', err)
          // Fallback to user data from auth context
          setFormData({
            business_name: user.business?.business_name || user.business_name || '',
            address: user.business?.business_address || user.address || '',
            phone: user.business?.phone_number || user.phone || '',
            website: user.business?.business_website || user.website || '',
            email: user.email || '',
            category: user.business?.category_id || user.category_id || user.category || '',
            timezone: user.business?.timezone || user.timezone || 'America/Toronto',
            avatar_url: user.business?.avatar_url || user.avatar_url || '',
            latitude: user.business?.latitude || user.latitude || null,
            longitude: user.business?.longitude || user.longitude || null,
            formatted_address: user.business?.formatted_address || user.formatted_address || null,
            place_id: user.business?.place_id || user.place_id || null,
            address_components: user.business?.address_components || user.address_components || null,
            promotional_updates: true,
            transaction_alerts: true,
            email_notifications: true
          })
        }
      }
    }
    
    loadUserSettings()
    loadCategories()
  }, [user])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLogoUpdate = (logoUrl) => {
    setFormData(prev => ({
      ...prev,
      avatar_url: logoUrl || ''
    }))
  }

  const handleToggle = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    setSuccess('')
    setError('')

    try {
      // Map frontend field names to backend field names
      const apiData = {
        business_name: formData.business_name,
        business_address: formData.address, // Map address to business_address
        phone_number: formData.phone,
        business_website: formData.website,
        category_id: formData.category,
        avatar_url: formData.avatar_url,
        latitude: formData.latitude,
        longitude: formData.longitude,
        formatted_address: formData.formatted_address,
        place_id: formData.place_id,
        address_components: formData.address_components,
        // Note: email, timezone, notification settings handled separately if needed
      }

      // Remove null/undefined fields to avoid sending empty data
      Object.keys(apiData).forEach(key => {
        if (apiData[key] === null || apiData[key] === undefined) {
          delete apiData[key]
        }
      })

      console.log('Sending business profile update:', apiData)
      const result = await apiRequest(endpoints.businessProfile, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      })
      
      if (result.success) {
        setSuccess('Settings saved successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('Failed to save settings:', err)
      setError(err.message || 'Failed to save settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form to original user data
    if (user) {
      setFormData({
        business_name: user.business?.business_name || user.business_name || '',
        address: user.business?.business_address || user.address || '',
        phone: user.business?.phone_number || user.phone || '',
        website: user.business?.business_website || user.website || '',
        email: user.email || '',
        category: user.business?.category || user.category || '',
        timezone: user.business?.timezone || user.timezone || 'America/Toronto',
        latitude: user.business?.latitude || user.latitude || null,
        longitude: user.business?.longitude || user.longitude || null,
        formatted_address: user.business?.formatted_address || user.formatted_address || null,
        place_id: user.business?.place_id || user.place_id || null,
        address_components: user.business?.address_components || user.address_components || null,
        promotional_updates: true,
        transaction_alerts: true,
        email_notifications: true
      })
    }
  }

  if (!user || !user.is_business) {
    return null // BusinessLayout will handle the redirect
  }

  return (
    <BusinessLayout
      title="Settings"
      subtitle="Manage your business profile and preferences"
      activeTab="settings"
    >
      {/* Success/Error Messages */}
      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-slate-700 mb-8">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-orange-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-white hover:border-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl">
        {activeTab === 'Profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Business Information */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-orange-500" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Business Logo Upload */}
                <div>
                  <Label className="text-slate-300 mb-3 block">Business Logo</Label>
                  <LogoUpload 
                    currentLogoUrl={formData.avatar_url}
                    onLogoUpdate={handleLogoUpdate}
                    size="large"
                  />
                </div>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="business_name" className="text-slate-300 mb-3 block">Business Name</Label>
                    <Input
                      id="business_name"
                      value={formData.business_name}
                      onChange={(e) => handleInputChange('business_name', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 h-12"
                      placeholder="Enter business name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category" className="text-slate-300 mb-3 block">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-12">
                        <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select category"} />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-slate-300 mb-3 block">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 pl-10 h-12"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="website" className="text-slate-300 mb-3 block">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 pl-10 h-12"
                        placeholder="https://www.example.com"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location & Contact */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  Location & Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="address" className="text-slate-300 mb-3 block">Business Address</Label>
                  <AddressAutocomplete
                    value={formData.address}
                    onChange={(value) => handleInputChange('address', value)}
                    onLocationSelect={(location) => {
                      console.log('Selected location:', location)
                      if (location) {
                        const locationUpdate = {
                          latitude: location.latitude,
                          longitude: location.longitude,
                          formatted_address: location.address,
                          place_id: location.place_id,
                          address_components: location.address_components
                        }
                        console.log('Updating form with location data:', locationUpdate)
                        setFormData(prev => ({
                          ...prev,
                          ...locationUpdate
                        }))
                      } else {
                        // Clear location data when location is null
                        console.log('Clearing location data')
                        setFormData(prev => ({
                          ...prev,
                          latitude: null,
                          longitude: null,
                          formatted_address: null,
                          place_id: null,
                          address_components: null
                        }))
                      }
                    }}
                    placeholder="Enter full business address"
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-slate-300 mb-3 block">Business Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-orange-500 pl-10 h-12"
                      placeholder="business@example.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="timezone" className="text-slate-300 mb-3 block">Timezone</Label>
                  <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-12">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="America/Toronto">Eastern Time (Toronto)</SelectItem>
                      <SelectItem value="America/Montreal">Eastern Time (Montreal)</SelectItem>
                      <SelectItem value="America/Ottawa">Eastern Time (Ottawa)</SelectItem>
                      <SelectItem value="America/Halifax">Atlantic Time (Halifax)</SelectItem>
                      <SelectItem value="America/Winnipeg">Central Time (Winnipeg)</SelectItem>
                      <SelectItem value="America/Edmonton">Mountain Time (Edmonton)</SelectItem>
                      <SelectItem value="America/Calgary">Mountain Time (Calgary)</SelectItem>
                      <SelectItem value="America/Vancouver">Pacific Time (Vancouver)</SelectItem>
                      <SelectItem value="America/Victoria">Pacific Time (Victoria)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'Notifications' && (
          <Card className="bg-slate-800 border-slate-700 max-w-2xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <Bell className="h-5 w-5 text-orange-500" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between py-3 border-b border-slate-700">
                  <div>
                    <div className="font-medium text-white">Email Notifications</div>
                    <div className="text-sm text-slate-400">Receive email updates about your account</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.email_notifications}
                      onChange={() => handleToggle('email_notifications')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-slate-700">
                  <div>
                    <div className="font-medium text-white">Promotional Updates</div>
                    <div className="text-sm text-slate-400">Get notified about new features and promotions</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.promotional_updates}
                      onChange={() => handleToggle('promotional_updates')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium text-white">Transaction Alerts</div>
                    <div className="text-sm text-slate-400">Get alerts for important account activities</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.transaction_alerts}
                      onChange={() => handleToggle('transaction_alerts')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'Account' && (
          <Card className="bg-slate-800 border-slate-700 max-w-2xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <User className="h-5 w-5 text-orange-500" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">Account Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account ID:</span>
                    <span className="text-white font-mono">{user?.id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account Type:</span>
                    <span className="text-white">Business Account</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Member Since:</span>
                    <span className="text-white">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-6">
                <h3 className="font-medium text-white mb-4">Danger Zone</h3>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <span className="font-medium text-red-400">Delete Account</span>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-700">
        <Button
          onClick={handleCancel}
          variant="outline"
          className="border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          className="bg-orange-500 hover:bg-orange-600 text-white"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </BusinessLayout>
  )
}