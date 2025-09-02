'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import BusinessLayout from '@/components/BusinessLayout'
import { apiRequest, endpoints } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Tag, 
  ShoppingBag,
  Users,
  Plus,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  CreditCard,
  Eye,
  MoreHorizontal,
  Edit,
  Trash,
  Building2
} from 'lucide-react'

// Import API functions
import { getOffers, deleteOffer } from '@/lib/offers'
import { getProducts, deleteProduct } from '@/lib/products'
import { getImageUrl } from '@/lib/api'

// Stats Cards Component
function StatsCards({ stats }) {
  const cards = [
    {
      title: 'Active Offers',
      value: stats.activeOffers,
      icon: Tag,
      color: 'bg-green-500',
      change: '+12%',
      changeColor: 'text-green-600'
    },
    {
      title: 'Claims',
      value: stats.totalClaims,
      icon: Users,
      color: 'bg-blue-500',
      change: '+8%',
      changeColor: 'text-blue-600'
    },
    {
      title: 'Products',
      value: stats.totalProducts,
      icon: ShoppingBag,
      color: 'bg-purple-500',
      change: '+3%',
      changeColor: 'text-purple-600'
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cards.map((card, index) => (
        <Card key={index} className="bg-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${card.changeColor}`}>
                    {card.change}
                  </span>
                  <span className="text-xs text-gray-500">vs last month</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Recent Offers Component
function RecentOffers({ offers, loading, onCreateOffer, onViewAll, onRefresh }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('Active')
  
  const tabs = ['Active', 'Expired', 'Scheduled']
  
  const handleOfferClick = (offerId) => {
    router.push(`/business/offers/${offerId}`)
  }
  
  const getOfferStatus = (offer) => {
    const now = new Date()
    const isActive = offer.is_active === true
    const notExpired = new Date(offer.expiry_date) > now
    const hasStarted = new Date(offer.start_date) <= now
    
    if (!isActive) return 'Inactive'
    if (!hasStarted) return 'Scheduled'
    if (!notExpired) return 'Expired'
    return 'Active'
  }

  const filteredOffers = offers.filter(offer => {
    const status = getOfferStatus(offer)
    if (activeTab === 'Active') return status === 'Active'
    if (activeTab === 'Expired') return status === 'Expired' || status === 'Inactive'
    if (activeTab === 'Scheduled') return status === 'Scheduled'
    return true
  })

  return (
    <Card className="bg-white border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl font-bold text-gray-900">Offers</CardTitle>
          <CardDescription>Recent promotional offers</CardDescription>
        </div>
        <Button 
          onClick={onCreateOffer}
          className="bg-[#e94e1b] hover:bg-[#d13f16] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create offer
        </Button>
      </CardHeader>

      <CardContent>
        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#e94e1b]" />
            <span className="ml-2 text-gray-600">Loading offers...</span>
          </div>
        ) : filteredOffers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOffers.slice(0, 6).map((offer, index) => (
              <div 
                key={offer.id || index} 
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-[#e94e1b]"
                onClick={() => handleOfferClick(offer.id)}
              >
                <div className="flex flex-col h-full space-y-3">
                  {/* Offer Image */}
                  <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                    {offer.image_url || offer.product?.image_url || offer.products?.image_url ? (
                      <img 
                        src={offer.image_url || offer.product?.image_url || offer.products?.image_url} 
                        alt={offer.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Tag className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Status Badge */}
                  <div className="flex justify-between items-start">
                    <Badge 
                      variant={getOfferStatus(offer) === 'Active' ? 'default' : 'secondary'}
                      className={`text-xs ${getOfferStatus(offer) === 'Active' ? 'bg-green-100 text-green-800' : ''}`}
                    >
                      {getOfferStatus(offer)}
                    </Badge>
                  </div>
                  
                  {/* Offer Title */}
                  <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 flex-1">
                    {offer.title || `${offer.discount_value || offer.discount_percentage}% off ${offer.product_name || offer.product?.name || offer.products?.name || 'Product'}`}
                  </h4>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs mt-auto">
                    <div>
                      <span className="text-gray-500 block">Views</span>
                      <span className="font-medium text-gray-900">{offer.view_count || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Claims</span>
                      <span className="font-medium text-gray-900">{offer.current_claims || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab.toLowerCase()} offers</h3>
            <p className="text-gray-500 mb-4">
              {activeTab === 'Active' 
                ? 'Create your first offer to start attracting customers!' 
                : `No ${activeTab.toLowerCase()} offers found.`
              }
            </p>
            {activeTab === 'Active' && (
              <Button onClick={onCreateOffer} className="bg-[#e94e1b] hover:bg-[#d13f16] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create your first offer
              </Button>
            )}
          </div>
        )}
        
        {filteredOffers.length > 6 && (
          <div className="flex justify-center mt-6">
            <Button 
              variant="outline" 
              onClick={onViewAll}
              className="border-[#e94e1b] text-[#e94e1b] hover:bg-[#e94e1b] hover:text-white px-8"
            >
              View all offers
              <ArrowUpRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Products Table Component
function ProductsTable({ products, loading, onNewProduct, onViewAll, onRefresh, businessName }) {
  const router = useRouter()

  const handleViewOffers = (productId) => {
    router.push(`/business/products/${productId}/offers`)
  }

  const handleEdit = (productId) => {
    router.push(`/business/products/${productId}/edit`)
  }

  const handleCreateOffer = (productId) => {
    router.push(`/business/offers/new?product_id=${productId}`)
  }

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const result = await deleteProduct(productId)
        if (result.success) {
          onRefresh() // Refresh the dashboard data
        } else {
          alert('Failed to delete product: ' + result.error)
        }
      } catch (error) {
        alert('Error deleting product')
      }
    }
  }

  const handleProductClick = (productId) => {
    router.push(`/business/products/${productId}/offers`)
  }

  return (
    <Card className="bg-white border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl font-bold text-gray-900">Products</CardTitle>
          <CardDescription>Manage your product catalog</CardDescription>
        </div>
        <Button 
          onClick={onNewProduct}
          className="bg-[#e94e1b] hover:bg-[#d13f16] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Product
        </Button>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#e94e1b]" />
            <span className="ml-2 text-gray-600">Loading products...</span>
          </div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Price</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 5).map((product, index) => (
                  <tr 
                    key={product.id || index} 
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleProductClick(product.id)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ShoppingBag className="h-6 w-6 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            {businessName || 'Your Business'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="text-xs">
                        {product.categories?.name || product.category?.name || 'Uncategorized'}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-medium text-gray-900">
                        {product.price ? `$${parseFloat(product.price).toFixed(2)}` : 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewOffers(product.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View offers
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(product.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCreateOffer(product.id)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create offer
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {products.length > 5 && (
              <div className="mt-4 flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={onViewAll}
                  className="border-[#e94e1b] text-[#e94e1b] hover:bg-[#e94e1b] hover:text-white px-8"
                >
                  View all products
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500 mb-4">Add your first product to start creating offers!</p>
            <Button onClick={onNewProduct} className="bg-[#e94e1b] hover:bg-[#d13f16] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add your first product
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Main Dashboard Component
export default function Dashboard() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOffers: 0,
    activeOffers: 0,
    totalClaims: 0,
  })
  
  const [offers, setOffers] = useState([])
  const [products, setProducts] = useState([])
  const [businessName, setBusinessName] = useState('')
  const [businessProfile, setBusinessProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setError(null)
      console.log('Fetching dashboard data...')
      
      // Fetch business profile for business name
      const profileResult = await apiRequest(endpoints.businessProfile, {
        method: 'GET'
      })
      if (profileResult.success && profileResult.data) {
        setBusinessProfile(profileResult.data)
        setBusinessName(profileResult.data.business?.business_name || profileResult.data.business_name || '')
      }
      
      // Fetch products with category data
      const productsResult = await getProducts({ page: 1, limit: 100 })
      let totalProducts = 0
      
      if (productsResult.success) {
        totalProducts = productsResult.pagination?.total || 0
        // Process product images and ensure category data is available
        const processedProducts = productsResult.products.map(product => ({
          ...product,
          image_url: getImageUrl(product.image_url)
        }))
        setProducts(processedProducts || [])
        
        // Get business name from first product if available
        if (processedProducts.length > 0 && processedProducts[0].business) {
          setBusinessName(processedProducts[0].business.business_name || '')
        }
      }

      // Fetch offers
      const offersResult = await getOffers({ page: 1, limit: 100 })
      let totalOffers = 0
      let activeOffers = 0
      let totalClaims = 0
      
      if (offersResult.success) {
        totalOffers = offersResult.pagination?.total || 0
        const offersData = offersResult.offers || []
        
        // Process offer images
        const processedOffers = offersData.map(offer => ({
          ...offer,
          image_url: getImageUrl(offer.image_url),
          product: offer.product ? {
            ...offer.product,
            image_url: getImageUrl(offer.product.image_url)
          } : undefined,
          products: offer.products ? {
            ...offer.products,
            image_url: getImageUrl(offer.products.image_url)
          } : undefined
        }))
        
        setOffers(processedOffers)
        
        // Calculate active offers
        const now = new Date()
        activeOffers = processedOffers.filter(offer => {
          try {
            const isActive = offer.is_active === true
            const notExpired = new Date(offer.expiry_date) > now
            const hasStarted = new Date(offer.start_date) <= now
            return isActive && notExpired && hasStarted
          } catch (e) {
            return false
          }
        }).length

        // Calculate total claims
        totalClaims = processedOffers.reduce((sum, offer) => {
          return sum + (parseInt(offer.current_claims) || 0)
        }, 0)
      }

      setStats({
        totalProducts,
        totalOffers,
        activeOffers,
        totalClaims,
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Unable to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && user.is_business) {
      fetchDashboardData()
    }
  }, [user])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setRefreshing(false)
  }

  // Navigation handlers
  const handleCreateOffer = () => router.push('/business/offers/new')
  const handleNewProduct = () => router.push('/business/products/new')
  const handleViewAllOffers = () => router.push('/business/offers')
  const handleViewAllProducts = () => router.push('/business/products')

  if (!user || !user.is_business) {
    return null // BusinessLayout will handle the redirect
  }

  return (
    <BusinessLayout
      title="Dashboard"
      subtitle="Manage your business promotions and track performance"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      showRefresh={true}
      activeTab="dashboard"
    >
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#e94e1b]" />
          <span className="ml-2 text-gray-600">Loading dashboard...</span>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <StatsCards stats={stats} />

          {/* Welcome Section */}
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Welcome back{businessProfile?.business?.business_name ? `, ${businessProfile.business.business_name}!` : businessName ? `, ${businessName}!` : '!'}
                  </h2>
                  <p className="text-slate-400">
                    Here's what's happening with your business today.
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="space-y-8">
            <RecentOffers 
              offers={offers}
              loading={false}
              onCreateOffer={handleCreateOffer}
              onViewAll={handleViewAllOffers}
              onRefresh={handleRefresh}
            />
            
            <ProductsTable 
              products={products}
              loading={false}
              onNewProduct={handleNewProduct}
              onViewAll={handleViewAllProducts}
              onRefresh={handleRefresh}
              businessName={businessName}
            />
          </div>
        </>
      )}
    </BusinessLayout>
  )
}