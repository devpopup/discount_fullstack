'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Navbar from '@/components/Navbar'
import DealCard from '@/components/DealCard'
import {
  Bell,
  Loader2,
  ArrowLeft,
  Sparkles
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getUpcomingOffers, transformOfferDataWithDistance, getUserLocation, getDefaultLocation, getFavoritedOfferIds } from '@/lib/offers-api'

export default function ComingSoonPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [favoritedIds, setFavoritedIds] = useState(new Set())

  // Initialize user location
  useEffect(() => {
    const initLocation = async () => {
      let location = getDefaultLocation()
      try {
        location = await getUserLocation()
      } catch (locationError) {
        console.error('Error getting location:', locationError)
      }
      setUserLocation(location)
    }
    initLocation()
  }, [])

  // Load favorited IDs if user is logged in
  useEffect(() => {
    const loadFavorites = async () => {
      if (user) {
        const favIds = await getFavoritedOfferIds()
        setFavoritedIds(favIds)
      } else {
        setFavoritedIds(new Set())
      }
    }
    loadFavorites()
  }, [user])

  useEffect(() => {
    if (userLocation) {
      loadUpcomingOffers()
    }
  }, [userLocation])

  const loadUpcomingOffers = async () => {
    try {
      setLoading(true)
      const result = await getUpcomingOffers({ page: 1, limit: 50 })
      if (result.success) {
        // Transform offers with distance calculation
        const transformedOffers = result.offers
          .map(offer => transformOfferDataWithDistance(offer, userLocation))
          .filter(offer => offer && offer.id)

        setOffers(transformedOffers)
      } else {
        setError('Failed to load upcoming offers')
      }
    } catch (err) {
      console.error('Error loading upcoming offers:', err)
      setError('Failed to load upcoming offers')
    } finally {
      setLoading(false)
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-[#e94e1b] animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading upcoming offers...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#e94e1b] rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Coming Soon</h1>
              <p className="text-gray-600">Get notified when these offers go live!</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Offers Grid */}
        {offers.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Upcoming Offers</h3>
              <p className="text-gray-600 mb-6">
                Check back soon for new deals that are coming your way!
              </p>
              <Button onClick={() => router.push('/shoppers')}>
                Browse Active Deals
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-wrap gap-3">
            {offers.map((offer, index) => (
              <DealCard
                key={offer.id}
                deal={offer}
                userLocation={userLocation}
                isFavorited={favoritedIds.has(offer.id)}
                onFavoriteChange={handleFavoriteChange}
                priority={index === 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
