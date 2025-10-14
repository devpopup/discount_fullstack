'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import DealCard from '@/components/DealCard'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, Filter, Search, MapPin, TrendingUp, Clock } from 'lucide-react'
import {
  getNearbyOffers,
  getTrendingOffers,
  getExpiringSoonOffers,
  searchOffers,
  transformOfferDataWithDistance,
  getUserLocation,
  getDefaultLocation,
  getFavoritedOfferIds
} from '@/lib/offers-api'
import { useAuth } from '@/context/AuthContext'


const sectionConfig = {
  nearby: {
    title: "Deals Near You",
    description: "Discover great offers from businesses in your area",
    icon: MapPin,
    color: "text-blue-600"
  },
  trending: {
    title: "Trending Deals",
    description: "Popular offers that everyone is talking about",
    icon: TrendingUp,
    color: "text-green-600"
  },
  expiring: {
    title: "Expiring Soon",
    description: "Hurry! These deals won't last much longer",
    icon: Clock,
    color: "text-red-600"
  }
}

export default function InfiniteDealsPage({ dealType }) {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1) // API uses 1-based pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [userLocation, setUserLocation] = useState(null)
  const [error, setError] = useState(null)
  const [favoritedIds, setFavoritedIds] = useState(new Set())
  const observer = useRef()
  const { user } = useAuth()

  const config = sectionConfig[dealType] || sectionConfig.nearby

  // Get user location and favorited IDs
  useEffect(() => {
    const initializeLocation = async () => {
      // Load favorited IDs if user is logged in
      if (user) {
        const favIds = await getFavoritedOfferIds()
        setFavoritedIds(favIds)
      }

      if (dealType === 'nearby') {
        try {
          const location = await getUserLocation()
          setUserLocation(location)
        } catch (locationError) {
          console.log('Using default location:', locationError.message)
          setUserLocation(getDefaultLocation())
        }
      } else {
        // For non-nearby types, load immediately
        loadMoreDeals(1, true)
      }
    }

    initializeLocation()
  }, [dealType])

  // Load deals when userLocation is available (for nearby type)
  useEffect(() => {
    if (dealType === 'nearby' && userLocation) {
      loadMoreDeals(1, true)
    }
  }, [userLocation, dealType])

  // Handle favorite state changes
  const handleFavoriteChange = (offerId, isFavorited) => {
    setFavoritedIds(prev => {
      const newSet = new Set(prev)
      if (isFavorited) {
        newSet.add(offerId)
      } else {
        newSet.delete(offerId)
      }
      return newSet
    })
  }

  const loadMoreDeals = useCallback(async (pageNumber, isInitial = false) => {
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      let result = { offers: [], hasMore: false }

      if (searchQuery) {
        // Use search API when searching
        result = await searchOffers({
          query: searchQuery,
          page: pageNumber,
          size: 12
        })
      } else {
        // Use specific endpoint based on deal type
        switch (dealType) {
          case 'nearby':
            const location = userLocation || getDefaultLocation()
            result = await getNearbyOffers({
              ...location,
              radius: 50, // Search radius for non-geofenced offers
              limit: 12 * pageNumber
            })
            // For nearby, we need to simulate pagination
            const startIndex = (pageNumber - 1) * 12
            const endIndex = pageNumber * 12
            const paginatedOffers = result.offers.slice(startIndex, endIndex)
            result = {
              offers: paginatedOffers,
              hasMore: endIndex < result.offers.length
            }
            break
            
          case 'trending':
            result = await getTrendingOffers({ limit: 12 * pageNumber })
            const trendingStartIndex = (pageNumber - 1) * 12
            const trendingEndIndex = pageNumber * 12
            const paginatedTrending = result.offers.slice(trendingStartIndex, trendingEndIndex)
            result = {
              offers: paginatedTrending,
              hasMore: trendingEndIndex < result.offers.length
            }
            break
            
          case 'expiring':
            result = await getExpiringSoonOffers({ limit: 12 * pageNumber })
            const expiringStartIndex = (pageNumber - 1) * 12
            const expiringEndIndex = pageNumber * 12
            const paginatedExpiring = result.offers.slice(expiringStartIndex, expiringEndIndex)
            result = {
              offers: paginatedExpiring,
              hasMore: expiringEndIndex < result.offers.length
            }
            break
            
          default:
            result = await searchOffers({ page: pageNumber, size: 12 })
        }
      }
      
      // Transform the offers with distance calculation and filter out invalid ones
      const transformedOffers = result.offers
        .map(offer => transformOfferDataWithDistance(offer, userLocation))
        .filter(offer => offer && offer.id)

      if (isInitial) {
        setDeals(transformedOffers)
      } else {
        setDeals(prev => [...prev, ...transformedOffers])
      }
      
      setPage(pageNumber)
      setHasMore(result.hasMore || transformedOffers.length === 12)
      
    } catch (err) {
      console.error('Error loading deals:', err)
      setError('Failed to load deals. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [dealType, loading, searchQuery, userLocation])

  // Note: Using manual "Load More" button instead of automatic infinite scroll

  // Handle search with debouncing
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchQuery) {
        setDeals([])
        setPage(1)
        setHasMore(true)
        loadMoreDeals(1, true)
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(searchTimeout)
  }, [searchQuery])

  // Reset search
  const handleSearchReset = () => {
    setSearchQuery('')
    setDeals([])
    setPage(1)
    setHasMore(true)
    loadMoreDeals(1, true)
  }

  // For display, we don't need to filter again since API handles search
  const filteredDeals = deals

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/shoppers">
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            
            <div className="flex items-center gap-1">
              <div className={`w-10 h-10 bg-[#e94e1b] rounded-full flex items-center justify-center`}>
                <config.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
                <p className="text-gray-600">{config.description}</p>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search deals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e94e1b] focus:border-transparent"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {/* Results Count */}
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Showing {filteredDeals.length} {filteredDeals.length === 1 ? 'deal' : 'deals'}
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          </div>
        </div>
      </div>

      {/* Deals Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="text-center">
              <p className="text-red-800 mb-4">{error}</p>
              <Button 
                onClick={() => loadMoreDeals(1, true)}
                className="bg-[#e94e1b] hover:bg-[#d13f16] text-white"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {!error && (
          <>
            {filteredDeals.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-1">
                {filteredDeals.map((deal, index) => (
                  <DealCard
                    key={deal.id || `deal-${index}`}
                    deal={deal}
                    userLocation={userLocation}
                    isFavorited={favoritedIds.has(deal.id)}
                    onFavoriteChange={handleFavoriteChange}
                  />
                ))}
              </div>
            ) : !loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No deals found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery
                    ? `No results found for "${searchQuery}". Try different keywords or browse all ${dealType} deals.`
                    : `No ${dealType} deals available at the moment.`
                  }
                </p>
                {searchQuery && (
                  <Button 
                    onClick={handleSearchReset}
                    variant="outline"
                    className="text-[#e94e1b] border-[#e94e1b] hover:bg-[#e94e1b] hover:text-white"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && !loading && filteredDeals.length > 0 && (
              <div className="flex justify-center py-8">
                <Button 
                  onClick={() => loadMoreDeals(page + 1)}
                  className="bg-[#e94e1b] hover:bg-[#d13f16] text-white px-8 py-3"
                  disabled={loading}
                >
                  Load More Deals
                </Button>
              </div>
            )}

            {/* Loading Indicator */}
            {loading && filteredDeals.length > 0 && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading more deals...</span>
                </div>
              </div>
            )}

            {/* End of Results */}
            {!hasMore && filteredDeals.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">No more deals.</p>
                <Link href="/shoppers">
                  <Button className="mt-4 bg-[#e94e1b] hover:bg-[#d13f16] text-white">
                    Back to Home
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}