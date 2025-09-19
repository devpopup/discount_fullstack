'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import DealCard from '@/components/DealCard'
import { ChevronLeft, ChevronRight, MapPin, TrendingUp, Clock, ArrowRight, Search, Filter, Loader2 } from 'lucide-react'
import { 
  getFeaturedOffers, 
  getNearbyOffers, 
  getTrendingOffers, 
  getExpiringSoonOffers,
  transformOfferData,
  getUserLocation,
  getDefaultLocation
} from '@/lib/offers-api'


function FeaturedCarousel({ deals }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === deals.length - 1 ? 0 : prevIndex + 1
    )
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? deals.length - 1 : prevIndex - 1
    )
  }

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000) // Auto-advance every 5 seconds
    return () => clearInterval(timer)
  }, [deals.length])

  if (deals.length === 0) return null

  return (
    <div className="relative w-full">
      <div className="overflow-hidden rounded-lg">
        <div 
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {deals.map((deal) => (
            <div key={deal.id} className="w-full flex-shrink-0">
              <DealCard deal={deal} className="max-w-md mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
        onClick={nextSlide}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Indicators */}
      <div className="flex justify-center mt-4 space-x-2">
        {deals.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-[#e94e1b]' : 'bg-gray-300'
            }`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  )
}

function DealsSection({ title, description, deals, sectionType, icon: Icon }) {
  // Show only first 4 deals in a single row
  const displayDeals = deals.slice(0, 4)
  
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

      {displayDeals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
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
  const [searchQuery, setSearchQuery] = useState('')
  const [featuredDeals, setFeaturedDeals] = useState([])
  const [nearbyDeals, setNearbyDeals] = useState([])
  const [trendingDeals, setTrendingDeals] = useState([])
  const [expiringSoonDeals, setExpiringSoonDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userLocation, setUserLocation] = useState(null)

  // Load all deals on component mount
  useEffect(() => {
    loadAllDeals()
  }, [])

  const loadAllDeals = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get user location first (optional)
      let location = getDefaultLocation()
      try {
        location = await getUserLocation()
        setUserLocation(location)
      } catch (locationError) {
        console.log('Using default location:', locationError.message)
      }

      // Fetch all deal types in parallel - only need 4 for single row display
      const [featuredResult, nearbyResult, trendingResult, expiringResult] = await Promise.all([
        getFeaturedOffers({ limit: 4 }),
        getNearbyOffers({ ...location, limit: 4 }),
        getTrendingOffers({ limit: 4 }),
        getExpiringSoonOffers({ limit: 4 })
      ])

      // Transform and set data
      setFeaturedDeals(featuredResult.offers.map(transformOfferData))
      setNearbyDeals(nearbyResult.offers.map(transformOfferData))
      setTrendingDeals(trendingResult.offers.map(transformOfferData))
      setExpiringSoonDeals(expiringResult.offers.map(transformOfferData))

    } catch (err) {
      console.error('Error loading deals:', err)
      setError('Failed to load deals. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Discover Local Deals</h1>
              <p className="text-gray-600">Find amazing offers from businesses near you</p>
            </div>
            
            {/* Search Bar */}
            <div className="hidden md:flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search deals, businesses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e94e1b] focus:border-transparent"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search deals, businesses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e94e1b] focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#e94e1b] mx-auto mb-4" />
              <p className="text-gray-600">Loading amazing deals for you...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="text-center">
              <p className="text-red-800 mb-4">{error}</p>
              <Button 
                onClick={loadAllDeals}
                className="bg-[#e94e1b] hover:bg-[#d13f16] text-white"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Content - only show when not loading */}
        {!loading && !error && (
          <>
            {/* Featured Deals Carousel */}
            <section className="mb-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Deals</h2>
                <p className="text-gray-600">Don't miss out on these amazing limited-time offers</p>
              </div>
              
              {featuredDeals.length > 0 ? (
                <FeaturedCarousel deals={featuredDeals} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No featured deals available at the moment.</p>
                </div>
              )}
            </section>

            {/* Deals Near You */}
            <DealsSection
              title="Deals Near You"
              description="Discover great offers from businesses in your area"
              deals={nearbyDeals}
              sectionType="nearby"
              icon={MapPin}
            />

            {/* Trending Deals */}
            <DealsSection
              title="Trending Deals"
              description="Popular offers that everyone is talking about"
              deals={trendingDeals}
              sectionType="trending"
              icon={TrendingUp}
            />

            {/* Expiring Soon */}
            <DealsSection
              title="Expiring Soon"
              description="Hurry! These deals won't last much longer"
              deals={expiringSoonDeals}
              sectionType="expiring"
              icon={Clock}
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