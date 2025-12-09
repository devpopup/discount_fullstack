'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import BusinessLayout from '@/components/BusinessLayout'
import { formatInTimeZone } from 'date-fns-tz'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Tag,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Pause,
  Play,
  Trash,
  AlertCircle,
  ArrowLeft,
  Plus,
  Loader2,
  Package,
  ArrowUpDown,
  Calendar,
  Users,
  TrendingUp
} from 'lucide-react'

// Import API functions
import { getProduct } from '@/lib/products'
import { getOffers, pauseOffer, resumeOffer, deleteOffer } from '@/lib/offers'
import { getImageUrl } from '@/lib/api'

export default function ProductOffersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const productId = params.productId
  
  const [product, setProduct] = useState(null)
  const [offers, setOffers] = useState([])
  const [filteredOffers, setFilteredOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12
  
  // Dialog states
  const [pauseDialog, setPauseDialog] = useState({
    isOpen: false,
    offerId: null,
    offerTitle: '',
    isActive: false,
    action: '',
    isLoading: false
  })
  
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    offerId: null,
    offerTitle: '',
    isDeleting: false
  })

  useEffect(() => {
    if (user && user.is_business && productId) {
      fetchData()
    }
  }, [user, productId])

  useEffect(() => {
    applyFilters()
  }, [offers, searchTerm, selectedStatus, sortBy, sortOrder])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch product details
      const productResult = await getProduct(productId)
      if (!productResult.success) {
        setError(typeof productResult.error === 'string' ? productResult.error : 'Failed to fetch product')
        return
      }
      
      // Process product image URL
      const processedProduct = {
        ...productResult.product,
        image_url: getImageUrl(productResult.product.image_url)
      }
      setProduct(processedProduct)
      
      // Fetch offers for this specific product
      const offersResult = await getOffers({ product_id: productId })
      if (!offersResult.success) {
        setError(typeof offersResult.error === 'string' ? offersResult.error : 'Failed to fetch offers')
        return
      }
      
      // Process offers image URLs
      const processedOffers = (offersResult.offers || []).map(offer => ({
        ...offer,
        image_url: getImageUrl(offer.image_url)
      }))
      setOffers(processedOffers)
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const applyFilters = () => {
    let filtered = [...offers]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(offer =>
        offer.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(offer => offer.status === selectedStatus)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      if (sortBy === 'created_at' || sortBy === 'start_date' || sortBy === 'end_date') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      } else if (sortBy === 'discount_value') {
        aValue = parseFloat(aValue) || 0
        bValue = parseFloat(bValue) || 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredOffers(filtered)
    setCurrentPage(1)
  }

  const handleSearch = (value) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleStatusFilter = (value) => {
    setSelectedStatus(value)
    setCurrentPage(1)
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    setCurrentPage(1)
  }

  const handleEdit = (offerId) => {
    router.push(`/business/offers/${offerId}/edit`)
  }

  const handleView = (offerId) => {
    router.push(`/business/offers/${offerId}`)
  }

  // Open pause dialog
  const openPauseDialog = (offer, isActive) => {
    setPauseDialog({
      isOpen: true,
      offerId: offer.id,
      offerTitle: offer.title,
      isActive,
      action: isActive ? 'pause' : 'resume',
      isLoading: false
    })
  }

  // Close pause dialog
  const closePauseDialog = () => {
    if (!pauseDialog.isLoading) {
      setPauseDialog({
        isOpen: false,
        offerId: null,
        offerTitle: '',
        isActive: false,
        action: '',
        isLoading: false
      })
    }
  }

  // Handle pause/resume confirmation
  const handleConfirmPauseResume = async () => {
    try {
      setPauseDialog(prev => ({ ...prev, isLoading: true }))
      
      const result = pauseDialog.isActive 
        ? await pauseOffer(pauseDialog.offerId) 
        : await resumeOffer(pauseDialog.offerId)
      
      if (result.success) {
        await fetchData()
        closePauseDialog()
      } else {
        setError(`Failed to ${pauseDialog.action} offer: ` + (typeof result.error === 'string' ? result.error : 'Unknown error'))
        closePauseDialog()
      }
    } catch (error) {
      console.error(`Error ${pauseDialog.action} offer:`, error)
      setError(`Error ${pauseDialog.action} offer`)
      closePauseDialog()
    }
  }

  // Open delete dialog
  const openDeleteDialog = (offer) => {
    setDeleteDialog({
      isOpen: true,
      offerId: offer.id,
      offerTitle: offer.title,
      isDeleting: false
    })
  }

  // Close delete dialog
  const closeDeleteDialog = () => {
    if (!deleteDialog.isDeleting) {
      setDeleteDialog({
        isOpen: false,
        offerId: null,
        offerTitle: '',
        isDeleting: false
      })
    }
  }

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    try {
      setDeleteDialog(prev => ({ ...prev, isDeleting: true }))
      
      const result = await deleteOffer(deleteDialog.offerId)
      
      if (result.success) {
        await fetchData()
        closeDeleteDialog()
      } else {
        setError('Failed to delete offer: ' + (typeof result.error === 'string' ? result.error : 'Unknown error'))
        closeDeleteDialog()
      }
    } catch (error) {
      console.error('Error deleting offer:', error)
      setError('Error deleting offer')
      closeDeleteDialog()
    }
  }

  const handleCreateOffer = () => {
    router.push(`/business/offers/new?product_id=${productId}`)
  }

  const handleBackToProducts = () => {
    router.push('/business/products')
  }

  const formatDate = (dateString) => {
    const businessTimezone = user?.business?.timezone || user?.timezone || 'America/Toronto';
    return formatInTimeZone(new Date(dateString), businessTimezone, "MMM d, yyyy");
  }

  const formatDateTime = (dateString) => {
    const businessTimezone = user?.business?.timezone || user?.timezone || 'America/Toronto';
    return formatInTimeZone(new Date(dateString), businessTimezone, "MMM d, h:mm a");
  }

  const getDiscountDisplay = (offer) => {
    if (offer.discount_type === 'percentage') {
      return `${offer.discount_value}% off`
    } else if (offer.discount_type === 'fixed_amount') {
      return `$${parseFloat(offer.discount_value).toFixed(2)} off`
    } else if (offer.discount_type === 'buy_x_get_y') {
      return `Buy ${offer.buy_quantity} Get ${offer.get_quantity} Free`
    }
    return 'Special Offer'
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { variant: 'default', className: 'bg-green-500 hover:bg-green-600', label: 'Active' },
      paused: { variant: 'secondary', className: 'bg-yellow-500 hover:bg-yellow-600', label: 'Paused' },
      expired: { variant: 'destructive', className: 'bg-red-500 hover:bg-red-600', label: 'Expired' },
      scheduled: { variant: 'outline', className: 'bg-blue-500 hover:bg-blue-600 text-white', label: 'Scheduled' },
      cancelled: { variant: 'destructive', className: 'bg-gray-500 hover:bg-gray-600', label: 'Cancelled' }
    }

    const config = statusConfig[status] || statusConfig.active
    return (
      <Badge variant={config.variant} className={`text-white font-medium ${config.className}`}>
        {config.label}
      </Badge>
    )
  }

  const getSortIcon = (field) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4" />
    return sortOrder === 'asc' ? 
      <ArrowUpDown className="h-4 w-4 rotate-180" /> : 
      <ArrowUpDown className="h-4 w-4" />
  }

  // Pagination
  const totalPages = Math.ceil(filteredOffers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOffers = filteredOffers.slice(startIndex, startIndex + itemsPerPage)

  if (!user || !user.is_business) {
    return null
  }

  return (
    <BusinessLayout
      title={product ? `Offers for ${product.name}` : 'Product Offers'}
      subtitle={product ? `Manage promotional offers for ${product.name}` : 'Loading...'}
      onRefresh={handleRefresh}
      refreshing={refreshing}
      showRefresh={true}
      activeTab="products"
    >
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={handleBackToProducts}
          className="bg-white text-gray-900 border-gray-300 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>

      {/* Product Info Card */}
      {product && (
        <Card className="mb-6 bg-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">{product.name}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Category: {product.category?.name || 'Uncategorized'}</span>
                  {product.price && (
                    <span>Price: ${parseFloat(product.price).toFixed(2)}</span>
                  )}
                  {product.stock_quantity !== null && (
                    <span>Stock: {product.stock_quantity}</span>
                  )}
                </div>
              </div>
              <Button 
                onClick={handleCreateOffer}
                className="bg-[#e94e1b] hover:bg-[#d13f16] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Offer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {typeof error === 'string' ? error : 'An error occurred'}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search offers..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedStatus} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSort('created_at')}
            className="text-sm bg-white text-black border-gray-300 hover:bg-gray-100"
          >
            Date {getSortIcon('created_at')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSort('title')}
            className="text-sm bg-white text-black border-gray-300 hover:bg-gray-100"
          >
            Title {getSortIcon('title')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSort('discount_value')}
            className="text-sm bg-white text-black border-gray-300 hover:bg-gray-100"
          >
            Discount {getSortIcon('discount_value')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSort('status')}
            className="text-sm bg-white text-black border-gray-300 hover:bg-gray-100"
          >
            Status {getSortIcon('status')}
          </Button>
        </div>
      </div>

      {/* Offers Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#e94e1b]" />
          <span className="ml-3 text-gray-600">Loading offers...</span>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="text-center py-20">
          <Tag className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm || selectedStatus !== 'all' ? 'No offers found' : 'No offers yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedStatus !== 'all'
              ? 'Try adjusting your search or filters' 
              : `Create your first promotional offer for ${product?.name || 'this product'}!`
            }
          </p>
          <Button onClick={handleCreateOffer} className="bg-[#e94e1b] hover:bg-[#d13f16] text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create your first offer
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {paginatedOffers.map((offer) => (
              <Card key={offer.id} className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 h-[420px] flex flex-col overflow-hidden py-0">
                <CardContent className="p-0 flex flex-col h-full">
                  {/* Offer Image */}
                  <div className="relative h-48 bg-gray-200 overflow-hidden rounded-t-lg">
                    {offer.image_url || product?.image_url ? (
                      <img 
                        src={offer.image_url || product?.image_url} 
                        alt={offer.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Tag className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Discount Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-[#e94e1b] text-white font-bold">
                        {getDiscountDisplay(offer)}
                      </Badge>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-2 right-12">
                      {getStatusBadge(offer.status)}
                    </div>
                    
                    {/* Actions Dropdown - Fixed horizontal ellipsis */}
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="sm" className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm transition-all duration-200">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(offer.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(offer.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Offer
                          </DropdownMenuItem>
                          {offer.status === 'active' || offer.status === 'scheduled' ? (
                            <DropdownMenuItem onClick={() => openPauseDialog(offer, true)}>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause Offer
                            </DropdownMenuItem>
                          ) : offer.status === 'paused' ? (
                            <DropdownMenuItem onClick={() => openPauseDialog(offer, false)}>
                              <Play className="h-4 w-4 mr-2" />
                              Resume Offer
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(offer)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Offer Details */}
                  <div className="px-4 pt-4 pb-4 flex flex-col flex-grow">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{offer.title}</h3>
                    </div>

                    {offer.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {offer.description}
                      </p>
                    )}

                    {/* Offer Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDateTime(offer.start_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>
                          {offer.total_claims || 0} claim{(offer.total_claims || 0) !== 1 ? 's' : ''}
                          {offer.max_claims ? ` / ${offer.max_claims}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-auto pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleView(offer.id)}
                        className="flex-1 text-xs border-[#e94e1b] text-[#e94e1b] hover:bg-[#e94e1b] hover:text-white"
                      >
                        View Details
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleEdit(offer.id)}
                        className="flex-1 text-xs bg-[#e94e1b] hover:bg-[#d13f16] text-white"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <span className="text-sm text-gray-600 px-4">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Pause/Resume Confirmation Dialog */}
      <AlertDialog open={pauseDialog.isOpen} onOpenChange={closePauseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {pauseDialog.action === 'pause' ? (
                <Pause className="h-5 w-5 text-yellow-600" />
              ) : (
                <Play className="h-5 w-5 text-green-600" />
              )}
              {pauseDialog.action === 'pause' ? 'Pause Offer' : 'Resume Offer'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {pauseDialog.action} <strong>"{pauseDialog.offerTitle}"</strong>? 
              {pauseDialog.action === 'pause' 
                ? ' Customers will no longer be able to claim this offer until you resume it.'
                : ' Customers will be able to claim this offer again.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={closePauseDialog}
              disabled={pauseDialog.isLoading}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPauseResume}
              disabled={pauseDialog.isLoading}
              className={pauseDialog.action === 'pause' 
                ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
              }
            >
              {pauseDialog.isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {pauseDialog.action === 'pause' ? 'Pausing...' : 'Resuming...'}
                </>
              ) : (
                <>
                  {pauseDialog.action === 'pause' ? (
                    <Pause className="h-4 w-4 mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {pauseDialog.action === 'pause' ? 'Pause Offer' : 'Resume Offer'}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={closeDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash className="h-5 w-5 text-red-600" />
              Delete Offer
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{deleteDialog.offerTitle}"</strong>? 
              This action cannot be undone and will permanently remove the offer and all associated claims.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={closeDeleteDialog}
              disabled={deleteDialog.isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteDialog.isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteDialog.isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Offer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </BusinessLayout>
  )
}