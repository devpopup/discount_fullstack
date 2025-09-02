'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import BusinessLayout from '@/components/BusinessLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  ShoppingBag,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash,
  Tag,
  Package,
  AlertCircle,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X
} from 'lucide-react'

// Import API functions and utils
import { getProducts, getCategories, deleteProduct } from '@/lib/products'
import { getImageUrl } from '@/lib/api'

const ITEMS_PER_PAGE = 12

export default function ProductsPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [businessName, setBusinessName] = useState('')
  
  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    productId: null,
    productName: '',
    isDeleting: false
  })

  // Fetch products
  const fetchProducts = async () => {
    if (!user || !user.is_business) return
    
    try {
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        sortBy,
        sortOrder,
      }
      
      if (searchTerm) params.search = searchTerm
      if (selectedCategory) params.category_id = selectedCategory
      
      const result = await getProducts(params)
      
      if (result.success) {
        const processedProducts = result.products.map(product => ({
          ...product,
          image_url: getImageUrl(product.image_url)
        }))
        setProducts(processedProducts)
        setPagination(result.pagination || {})
        setTotalPages(result.pagination?.totalPages || 1)
        
        // Get business name from first product if available
        if (processedProducts.length > 0 && processedProducts[0].business) {
          setBusinessName(processedProducts[0].business.business_name || '')
        }
      } else {
        setError(typeof result.error === 'string' ? result.error : 'Failed to fetch products')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setError('Unable to load products. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Fetch categories
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

  useEffect(() => {
    if (user && user.is_business) {
      fetchProducts()
      fetchCategories()
    }
  }, [user, currentPage, searchTerm, selectedCategory, sortBy, sortOrder])

  const handleRefresh = async () => {
    setRefreshing(true)
    setCurrentPage(1)
    await fetchProducts()
  }

  const handleSearch = (value) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleCategoryFilter = (value) => {
    setSelectedCategory(value === 'all' ? '' : value)
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

  const handleViewOffers = (productId) => {
    router.push(`/business/products/${productId}/offers`)
  }

  const handleEdit = (productId) => {
    router.push(`/business/products/${productId}/edit`)
  }

  const handleCreateOffer = (productId) => {
    router.push(`/business/offers/new?product_id=${productId}`)
  }

  // Open delete confirmation dialog
  const openDeleteDialog = (product) => {
    setDeleteDialog({
      isOpen: true,
      productId: product.id,
      productName: product.name,
      isDeleting: false
    })
  }

  // Close delete dialog
  const closeDeleteDialog = () => {
    if (!deleteDialog.isDeleting) {
      setDeleteDialog({
        isOpen: false,
        productId: null,
        productName: '',
        isDeleting: false
      })
    }
  }

  // Handle actual delete
  const handleConfirmDelete = async () => {
    if (!deleteDialog.productId) return

    try {
      setDeleteDialog(prev => ({ ...prev, isDeleting: true }))
      
      const result = await deleteProduct(deleteDialog.productId)
      
      if (result.success) {
        // Refresh the products list
        await fetchProducts()
        closeDeleteDialog()
        
        // Show success message briefly
        setError(null)
      } else {
        setError('Failed to delete product: ' + (typeof result.error === 'string' ? result.error : 'Unknown error'))
        closeDeleteDialog()
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      setError('Error deleting product')
      closeDeleteDialog()
    }
  }

  const handleNewProduct = () => {
    router.push('/business/products/new')
  }

  const getSortIcon = (field) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4" />
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  if (!user || !user.is_business) {
    return null // BusinessLayout will handle the redirect
  }

  return (
    <BusinessLayout
      title="Products"
      subtitle="Manage your product catalog and create offers"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      showRefresh={true}
      activeTab="products"
    >
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {typeof error === 'string' ? error : 'An error occurred'}
          </AlertDescription>
        </Alert>
      )}

      {/* Header with Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search and New Product Button Row */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-white border-gray-200"
            />
          </div>

          {/* New Product Button */}
          <Button
            onClick={handleNewProduct}
            className="bg-[#e94e1b] hover:bg-[#d13f16] text-white w-full sm:w-auto shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">New Product</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>

        {/* Filters and Sort Controls Row */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={handleCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-white border-gray-200">
              <Filter className="h-4 w-4 mr-2 text-gray-400" />
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Controls */}
          <div className="flex gap-2 overflow-x-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort('name')}
              className="text-sm whitespace-nowrap border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
            >
              Name {getSortIcon('name')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort('price')}
              className="text-sm whitespace-nowrap border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
            >
              Price {getSortIcon('price')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort('created_at')}
              className="text-sm whitespace-nowrap border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
            >
              Date {getSortIcon('created_at')}
            </Button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#e94e1b]" />
          <span className="ml-3 text-gray-600">Loading products...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedCategory
              ? 'No products match your current filters.'
              : 'Get started by adding your first product to the catalog.'}
          </p>
          <Button
            onClick={handleNewProduct}
            className="bg-[#e94e1b] hover:bg-[#d13f16] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Product
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 h-[420px] flex flex-col overflow-hidden py-0">
              <CardContent className="p-0 flex flex-col h-full">
                {/* Product Image */}
                <div className="relative h-48 bg-gray-200 overflow-hidden rounded-t-lg">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                  
                  {/* Actions Dropdown */}
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm transition-all duration-200"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => handleViewOffers(product.id)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Offers
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCreateOffer(product.id)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Tag className="h-4 w-4 mr-2" />
                          Create Offer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleEdit(product.id)}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(product)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Stock Status */}
                  {product.stock_quantity !== null && product.stock_quantity !== undefined && (
                    <div className="absolute bottom-2 left-2">
                      <Badge
                        variant={product.stock_quantity > 0 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="px-4 pb-4 flex flex-col flex-grow">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="text-xs">
                      {product.categories?.name || product.category?.name || 'Uncategorized'}
                    </Badge>
                    {product.price && (
                      <span className="text-lg font-bold text-[#e94e1b]">
                        ${parseFloat(product.price).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {product.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-auto pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewOffers(product.id)}
                      className="flex-1 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Offers
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleCreateOffer(product.id)}
                      className="flex-1 bg-[#e94e1b] hover:bg-[#d13f16] text-white text-xs"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      Create Offer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
              return pageNum <= totalPages ? (
                <Button
                  key={pageNum}
                  variant={pageNum === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={pageNum === currentPage ? "bg-[#e94e1b] hover:bg-[#d13f16]" : ""}
                >
                  {pageNum}
                </Button>
              ) : null
            })}
          </div>
          
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={closeDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash className="h-5 w-5 text-red-600" />
              Delete Product
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{deleteDialog.productName}"</strong>? 
              This action cannot be undone and will permanently remove the product and all associated offers.
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
                  Delete Product
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </BusinessLayout>
  )
}