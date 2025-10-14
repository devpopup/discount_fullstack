'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DealCard from '@/components/DealCard'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Heart, Loader2, Search } from 'lucide-react'
import { getFavoriteOffers, transformOfferDataWithDistance, getUserLocation, getDefaultLocation } from '@/lib/offers-api'
import { useAuth } from '@/context/AuthContext'

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const { user } = useAuth()
  const router = useRouter()

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/shoppers/auth/signin')
    }
  }, [user, loading, router])

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get user location
      let location = getDefaultLocation()
      try {
        location = await getUserLocation()
        setUserLocation(location)
      } catch (locationError) {
        console.log('Using default location:', locationError.message)
      }

      // Fetch favorites
      const result = await getFavoriteOffers({ size: 100 })

      if (result.error) {
        setError(result.error)
        setFavorites([])
        return
      }

      // Transform the offers
      const transformedOffers = result.offers
        .map(savedOffer => {
          // The API returns saved_offers with nested offers object
          const offer = savedOffer.offers || savedOffer

          // Debug: log the offer structure to see what we're getting
          console.log('Saved offer structure:', savedOffer)
          console.log('Extracted offer:', offer)
          console.log('Offer product/products:', offer.product, offer.products)
          console.log('Offer product_id:', offer.product_id)

          return transformOfferDataWithDistance(offer, location)
        })
        .filter(offer => offer && offer.id)

      console.log('Transformed favorites:', transformedOffers)
      setFavorites(transformedOffers)
    } catch (err) {
      console.error('Error loading favorites:', err)
      setError('Failed to load favorites. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle when a favorite is removed from DealCard
  const handleFavoriteChange = (offerId, isFavorited) => {
    if (!isFavorited) {
      // Remove from the list
      setFavorites(prev => prev.filter(offer => offer.id !== offerId))
    }
  }

  // Show loading while checking auth
  if (!user && loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#e94e1b]" />
        </div>
      </div>
    )
  }

  // Don't render content if not logged in
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/shoppers">
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#e94e1b] rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Favorites</h1>
                <p className="text-gray-600">Offers you've saved for later</p>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              {favorites.length} {favorites.length === 1 ? 'favorite' : 'favorites'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#e94e1b] mx-auto mb-4" />
              <p className="text-gray-600">Loading your favorites...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="text-center">
              <p className="text-red-800 mb-4">{error}</p>
              <Button
                onClick={loadFavorites}
                className="bg-[#e94e1b] hover:bg-[#d13f16] text-white"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Favorites Grid */}
        {!loading && !error && (
          <>
            {favorites.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-1">
                {favorites.map((deal, index) => (
                  <DealCard
                    key={deal.id || `favorite-${index}`}
                    deal={deal}
                    userLocation={userLocation}
                    isFavorited={true}
                    onFavoriteChange={handleFavoriteChange}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No favorites yet</h3>
                <p className="text-gray-600 mb-4">
                  Start saving offers you like to easily find them later
                </p>
                <Link href="/shoppers">
                  <Button className="bg-[#e94e1b] hover:bg-[#d13f16] text-white">
                    Browse Deals
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
