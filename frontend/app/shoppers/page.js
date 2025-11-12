'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import DealCard from '@/components/DealCard'
import Navbar from '@/components/Navbar'
import Featured from '@/components/Featured'
import { MapPin, TrendingUp, Clock, ArrowRight, Loader2, ChevronRight, Grid } from 'lucide-react'
import {
  getUserLocation,
  getDefaultLocation,
  getFavoritedOfferIds,
  getClaimedOfferIds,
  getAllOffers,
  transformOfferDataWithDistance
} from '@/lib/offers-api'
import { useAuth } from '@/context/AuthContext'
import { useNearbyOffers, useTrendingOffers, useExpiringSoonOffers } from '@/hooks/useOffers'


function DealsSection({ title, description, deals, sectionType, icon: Icon, userLocation = null, favoritedIds = new Set(), claimedIds = new Set(), onFavoriteChange, onClaimChange, loading = false }) {
  const scrollContainerRef = useRef(null)
  const [showScrollButton, setShowScrollButton] = useState(false)

  // Check if container is scrollable
  useEffect(() => {
    const checkScrollable = () => {
      if (scrollContainerRef.current) {
        const isScrollable = scrollContainerRef.current.scrollWidth > scrollContainerRef.current.clientWidth
        setShowScrollButton(isScrollable)
      }
    }

    checkScrollable()
    window.addEventListener('resize', checkScrollable)
    return () => window.removeEventListener('resize', checkScrollable)
  }, [deals])

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#e94e1b] rounded-full flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-gray-600">{description}</p>
          </div>
        </div>

        <Link href={`/shoppers/deals/${sectionType}`}>
          <Button variant="outline" className="text-[#e94e1b] border-[#e94e1b] hover:bg-[#e94e1b] hover:text-white">
            View More
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#e94e1b] mx-auto mb-4" />
            <p className="text-gray-600">Loading {title.toLowerCase()}...</p>
          </div>
        </div>
      ) : deals.length > 0 ? (
        <div className="relative">
          {/* Horizontal scrollable container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {deals.map((deal, index) => (
              <DealCard
                key={deal.id || `deal-${index}`}
                deal={deal}
                userLocation={userLocation}
                isFavorited={favoritedIds.has(deal.id)}
                isClaimed={claimedIds.has(deal.id)}
                onFavoriteChange={onFavoriteChange}
                onClaimChange={onClaimChange}
              />
            ))}
          </div>

          {/* Chevron button - only show if container is scrollable */}
          {showScrollButton && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No {title.toLowerCase()} available at the moment.</p>
        </div>
      )}
    </section>
  )
}

export default function ShoppersHome() {
  const [userLocation, setUserLocation] = useState(null)
  const [favoritedIds, setFavoritedIds] = useState(new Set())
  const [claimedIds, setClaimedIds] = useState(new Set())
  const [allDeals, setAllDeals] = useState([])
  const [allDealsLoading, setAllDealsLoading] = useState(false)
  const [cardsToShow, setCardsToShow] = useState(4)
  const { user } = useAuth()

  // Calculate number of cards based on screen width
  useEffect(() => {
    const calculateCards = () => {
      const width = window.innerWidth
      // Card width is 160px + 12px gap (3px on each side)
      const cardWidth = 160 + 12
      // Max container width is 7xl (80rem = 1280px), with padding
      const containerPadding = 64 // 32px on each side for lg:px-8
      const availableWidth = Math.min(width - containerPadding, 1280)
      const cards = Math.max(3, Math.floor(availableWidth / cardWidth))
      setCardsToShow(cards)
    }

    calculateCards()
    window.addEventListener('resize', calculateCards)
    return () => window.removeEventListener('resize', calculateCards)
  }, [])

  // Use React Query hooks for data fetching with automatic caching
  const { data: nearbyData, isLoading: nearbyLoading, error: nearbyError } = useNearbyOffers(
    userLocation,
    { limit: cardsToShow, enabled: !!userLocation }
  )
  const { data: trendingData, isLoading: trendingLoading, error: trendingError } = useTrendingOffers({
    limit: cardsToShow,
    userLocation
  })
  const { data: expiringData, isLoading: expiringLoading, error: expiringError } = useExpiringSoonOffers({
    limit: cardsToShow,
    userLocation
  })

  // Combined loading state
  const loading = nearbyLoading || trendingLoading || expiringLoading
  const error = nearbyError || trendingError || expiringError

  // Initialize user location on mount
  useEffect(() => {
    const initLocation = async () => {
      let location = getDefaultLocation()
      try {
        location = await getUserLocation()
      } catch (locationError) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Using default location:', locationError.message)
        }
      }
      setUserLocation(location)
    }

    initLocation()
  }, [])

  // Fetch favorited and claimed IDs if user is logged in
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        const [favIds, clmIds] = await Promise.all([
          getFavoritedOfferIds(),
          getClaimedOfferIds()
        ])
        setFavoritedIds(favIds)
        setClaimedIds(clmIds)
      } else {
        setFavoritedIds(new Set())
        setClaimedIds(new Set())
      }
    }

    loadUserData()
  }, [user])

  // Fetch all deals - runs when component mounts or userLocation/cardsToShow changes
  useEffect(() => {
    // Only fetch if we have a location and cardsToShow is calculated
    if (!userLocation || !cardsToShow) return

    const loadAllDeals = async () => {
      setAllDealsLoading(true)
      try {
        console.log('🔄 Fetching all deals...')
        const result = await getAllOffers({ page: 1, size: cardsToShow })
        console.log('📦 All deals result:', result)
        console.log('📊 All deals offers (raw):', result.offers)
        console.log('📄 All deals pagination:', result.pagination)
        if (result.error) {
          console.error('❌ Error loading all deals:', result.error)
        } else {
          // Transform the offers with distance calculation
          const transformedOffers = result.offers
            .map(offer => transformOfferDataWithDistance(offer, userLocation))
            .filter(offer => offer && offer.id)

          console.log('📊 All deals offers (transformed):', transformedOffers)
          console.log(`✅ Successfully loaded ${transformedOffers.length} deals`)
          setAllDeals(transformedOffers)
        }
      } catch (error) {
        console.error('❌ Exception loading all deals:', error)
      } finally {
        setAllDealsLoading(false)
      }
    }

    loadAllDeals()
  }, [userLocation?.lat, userLocation?.lng, cardsToShow])

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

  // Handle claim state changes
  const handleClaimChange = (offerId, isClaimed) => {
    setClaimedIds(prev => {
      const newSet = new Set(prev)
      if (isClaimed) {
        newSet.add(offerId)
      } else {
        newSet.delete(offerId)
      }
      return newSet
    })
  }

  // Extract deals from React Query results
  const nearbyDeals = nearbyData?.offers || []
  const trendingDeals = trendingData?.offers || []
  const expiringSoonDeals = expiringData?.offers || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Featured Hero Section - Full width, outside main container */}
      {!error && <Featured />}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="text-center">
              <p className="text-red-800 mb-4">{error?.message || 'Failed to load deals. Please try again.'}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-[#e94e1b] hover:bg-[#d13f16] text-white"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        {!error && (
          <>

            {/* Deals Near You */}
            <div id="nearby-deals">
              <DealsSection
                title="Deals Near You"
                description="Discover great offers from businesses in your area"
                deals={nearbyDeals}
                sectionType="nearby"
                icon={MapPin}
                userLocation={userLocation}
                favoritedIds={favoritedIds}
                claimedIds={claimedIds}
                onFavoriteChange={handleFavoriteChange}
                onClaimChange={handleClaimChange}
                loading={nearbyLoading}
              />
            </div>

            {/* All Deals */}
            <div id="all-deals">
              <DealsSection
                title="All Deals"
                description="Browse all available offers from local businesses"
                deals={allDeals}
                sectionType="all"
                icon={Grid}
                userLocation={userLocation}
                favoritedIds={favoritedIds}
                claimedIds={claimedIds}
                onFavoriteChange={handleFavoriteChange}
                onClaimChange={handleClaimChange}
                loading={allDealsLoading}
              />
            </div>

            {/* Trending Deals */}
            <div id="trending-deals">
              <DealsSection
                title="Trending Deals"
                description="Popular offers that everyone is talking about"
                deals={trendingDeals}
                sectionType="trending"
                icon={TrendingUp}
                userLocation={userLocation}
                favoritedIds={favoritedIds}
                claimedIds={claimedIds}
                onFavoriteChange={handleFavoriteChange}
                onClaimChange={handleClaimChange}
                loading={trendingLoading}
              />
            </div>

            {/* Expiring Soon */}
            <DealsSection
              title="Expiring Soon"
              description="Hurry! These deals won't last much longer"
              deals={expiringSoonDeals}
              sectionType="expiring"
              icon={Clock}
              userLocation={userLocation}
              favoritedIds={favoritedIds}
              claimedIds={claimedIds}
              onFavoriteChange={handleFavoriteChange}
              onClaimChange={handleClaimChange}
              loading={expiringLoading}
            />

            {/* Call to Action */}
            <section className="bg-gradient-to-r from-[#e94e1b] to-red-600 rounded-2xl p-8 text-center text-white">
              <h2 className="text-3xl font-bold mb-4">Never Miss a Deal Again</h2>
              <p className="text-lg mb-6 opacity-90">
                Enable notifications to get alerts about new deals from your favorite businesses
              </p>
              <Button className="bg-white text-[#e94e1b] hover:bg-gray-100">
                Enable Notifications
              </Button>
            </section>
          </>
        )}
      </div>
    </div>
  )
}