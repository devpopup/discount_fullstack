'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/Navbar'
import {
  MapPin,
  Clock,
  Tag,
  Share2,
  Heart,
  Phone,
  Globe,
  Calendar,
  Store,
  ArrowLeft,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { getOfferById } from '@/lib/offers-api'

export default function OfferDetailsPage({ params }) {
  // Use React's use() hook to unwrap the params promise
  const resolvedParams = use(params)
  const offerId = resolvedParams?.id

  const router = useRouter()
  const [offer, setOffer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    if (offerId) {
      loadOfferDetails()
    }
  }, [offerId])

  const loadOfferDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await getOfferById(offerId)

      if (result.error) {
        setError(result.error)
      } else if (result.offer) {
        setOffer(result.offer)
      } else {
        setError('Offer not found')
      }
    } catch (err) {
      console.error('Error loading offer:', err)
      setError('Failed to load offer details')
    } finally {
      setLoading(false)
    }
  }

  const handleClaimInStore = () => {
    // TODO: Implement claim in store functionality
    console.log('Claim in store clicked')
  }

  const handleGoToWebsite = () => {
    const website = offer?.business?.business_website || offer?.business?.website
    if (website) {
      window.open(website, '_blank')
    }
  }

  const formatBusinessHours = (hours) => {
    if (!hours) return 'Hours not available'
    // Parse and format business hours
    // Assuming hours is a JSON object like { "monday": "9:00 AM - 5:00 PM", ... }
    try {
      const hoursObj = typeof hours === 'string' ? JSON.parse(hours) : hours
      return Object.entries(hoursObj).map(([day, time]) => (
        <div key={day} className="flex justify-between py-1">
          <span className="font-medium capitalize">{day}:</span>
          <span className="text-gray-600">{time}</span>
        </div>
      ))
    } catch (e) {
      return hours
    }
  }

  const calculateTimeRemaining = (expiresAt) => {
    if (!expiresAt) return 'No expiry'

    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry - now

    if (diff <= 0) return 'Expired'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`
    return 'Ending soon'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#e94e1b] mx-auto mb-4" />
            <p className="text-gray-600">Loading offer details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 mb-4">{error || 'Offer not found'}</p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const images = offer.images || []
  const website = offer.business?.business_website || offer.business?.website
  const hasWebsite = website && website.trim() !== ''

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Deals
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {images.length > 0 ? (
                <>
                  <div className="relative h-96">
                    <Image
                      src={images[selectedImage]}
                      alt={offer.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {/* Discount Badge */}
                    <div className="absolute top-4 left-4 bg-[#e74c3c] text-white px-4 py-2 rounded-lg font-semibold text-lg">
                      {offer.discount}% OFF
                    </div>
                  </div>

                  {/* Image Thumbnails */}
                  {images.length > 1 && (
                    <div className="flex gap-2 p-4 overflow-x-auto">
                      {images.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                            selectedImage === index ? 'border-[#e94e1b]' : 'border-gray-200'
                          }`}
                        >
                          <Image
                            src={img}
                            alt={`${offer.title} ${index + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="h-96 bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center">
                  <Tag className="w-24 h-24 text-gray-400" />
                </div>
              )}
            </div>

            {/* Offer Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{offer.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {calculateTimeRemaining(offer.expiresAt)}
                  </div>
                  {offer.claimedCount !== undefined && offer.maxClaims && (
                    <div className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      {offer.claimedCount}/{offer.maxClaims} claimed
                    </div>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="mb-6 pb-6 border-b">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-[#e94e1b]">
                    ${offer.discountedPrice?.toFixed(2)}
                  </span>
                  {offer.originalPrice && offer.originalPrice > 0 && (
                    <>
                      <span className="text-2xl text-gray-400 line-through">
                        ${offer.originalPrice.toFixed(2)}
                      </span>
                      <span className="text-lg text-green-600 font-semibold">
                        Save ${(offer.originalPrice - offer.discountedPrice).toFixed(2)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">About this offer</h2>
                <p className="text-gray-700 leading-relaxed">
                  {offer.description || 'No description available.'}
                </p>
              </div>

              {/* Terms and Conditions */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Terms & Conditions</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Offer valid until {new Date(offer.expiresAt).toLocaleDateString()}</li>
                  {offer.maxClaims && (
                    <li>Limited to {offer.maxClaims} total claims</li>
                  )}
                  <li>Must be presented at time of purchase</li>
                  <li>Cannot be combined with other offers</li>
                  <li>Subject to availability</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column - Business Info and Actions */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-3">
              <Button
                onClick={handleClaimInStore}
                className="w-full bg-[#e94e1b] hover:bg-[#d13f16] text-white py-6 text-lg font-semibold"
              >
                <Store className="w-5 h-5 mr-2" />
                Claim In Store
              </Button>

              <Button
                onClick={handleGoToWebsite}
                disabled={!hasWebsite}
                variant="outline"
                className={`w-full py-6 text-lg font-semibold ${
                  !hasWebsite ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Globe className="w-5 h-5 mr-2" />
                Go to Website
                {hasWebsite && <ExternalLink className="w-4 h-4 ml-2" />}
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Heart className="w-5 h-5" />
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Business Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Business Information</h2>

              {/* Business Name */}
              <div className="mb-4">
                <div className="text-lg font-semibold text-gray-900">
                  {offer.businessName}
                </div>
              </div>

              {/* Address */}
              <div className="mb-4">
                <div className="flex items-start gap-2 text-gray-700">
                  <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>{offer.location}</p>
                    {offer.distance && (
                      <p className="text-sm text-gray-500 mt-1">
                        {offer.distance < 1
                          ? `${Math.round(offer.distance * 1000)}m away`
                          : `${offer.distance.toFixed(1)}km away`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Phone */}
              {(offer.business?.phone_number || offer.business?.phone) && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-5 h-5 flex-shrink-0" />
                    <a
                      href={`tel:${offer.business.phone_number || offer.business.phone}`}
                      className="hover:text-[#e94e1b]"
                    >
                      {offer.business.phone_number || offer.business.phone}
                    </a>
                  </div>
                </div>
              )}

              {/* Website */}
              {hasWebsite && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Globe className="w-5 h-5 flex-shrink-0" />
                    <a
                      href={offer.business.business_website || offer.business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#e94e1b] truncate"
                    >
                      {offer.business.business_website || offer.business.website}
                    </a>
                  </div>
                </div>
              )}

              {/* Business Hours */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5" />
                  <h3 className="font-semibold">Business Hours</h3>
                </div>
                <div className="text-sm">
                  {offer.business?.business_hours ? (
                    formatBusinessHours(offer.business.business_hours)
                  ) : (
                    <p className="text-gray-500">Hours not available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Category */}
            {offer.category && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold mb-2">Category</h3>
                <div className="inline-block bg-gray-100 px-3 py-1 rounded-full text-sm">
                  {offer.category}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
