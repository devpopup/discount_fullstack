'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import DealCard from '@/components/DealCard'
import Navbar from '@/components/Navbar'
import Featured from '@/components/Featured'
import { MapPin, TrendingUp, Clock, ArrowRight, Loader2 } from 'lucide-react'
import {
  getNearbyOffers,
  getTrendingOffers,
  getExpiringSoonOffers,
  transformOfferDataWithDistance,
  getUserLocation,
  getDefaultLocation
} from '@/lib/offers-api'


function DealsSection({ title, description, deals, sectionType, icon: Icon, userLocation = null }) {
  const scrollContainerRef = useRef(null)

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

      {deals.length > 0 ? (
        <div className="relative">
          {/* Horizontal scrollable container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {deals.map((deal, index) => (
              <DealCard key={deal.id || `deal-${index}`} deal={deal} userLocation={userLocation} />
            ))}
          </div>

          {/* Chevron button */}
          {deals.length > 4 && (
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
      const [nearbyResult, trendingResult, expiringResult] = await Promise.all([
        getNearbyOffers({ ...location, limit: 4 }),
        getTrendingOffers({ limit: 4 }),
        getExpiringSoonOffers({ limit: 4 })
      ])

      // Transform and set data with distance calculation, filter out invalid offers
      setNearbyDeals(
        nearbyResult.offers
          .map(offer => transformOfferDataWithDistance(offer, location))
          .filter(offer => offer && offer.id)
      )
      setTrendingDeals(
        trendingResult.offers
          .map(offer => transformOfferDataWithDistance(offer, location))
          .filter(offer => offer && offer.id)
      )
      setExpiringSoonDeals(
        expiringResult.offers
          .map(offer => transformOfferDataWithDistance(offer, location))
          .filter(offer => offer && offer.id)
      )

    } catch (err) {
      console.error('Error loading deals:', err)
      setError('Failed to load deals. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Featured Hero Section - Full width, outside main container */}
      {!loading && !error && <Featured />}

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

            {/* Deals Near You */}
            <div id="nearby-deals">
              <DealsSection
                title="Deals Near You"
                description="Discover great offers from businesses in your area"
                deals={nearbyDeals}
                sectionType="nearby"
                icon={MapPin}
                userLocation={userLocation}
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