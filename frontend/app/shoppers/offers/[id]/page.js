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
  ArrowLeft,
  ExternalLink,
  Loader2,
  Bell,
  BellOff,
  Store
} from 'lucide-react'
import { IoGift } from 'react-icons/io5'
import {
  getOfferById,
  getFavoritedOfferIds,
  saveOfferToFavorites,
  removeOfferFromFavorites,
  setOfferReminder,
  removeOfferReminder,
  getMyReminders
} from '@/lib/offers-api'
import { useAuth } from '@/context/AuthContext'
import { useClaims } from '@/context/ClaimContext'
import { toast } from 'sonner'

export default function OfferDetailsPage({ params }) {
  // Use React's use() hook to unwrap the params promise
  const resolvedParams = use(params)
  const offerId = resolvedParams?.id

  const router = useRouter()
  const { user } = useAuth()
  const {
    getTotalQuantityClaimed,
    canClaimMore,
    hasUnredeemedClaims,
    canUnclaim,
    claimOffer,
    unclaimOffer
  } = useClaims()
  const [offer, setOffer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [claiming, setClaiming] = useState(false)
  const [claimError, setClaimError] = useState(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [minQuantity, setMinQuantity] = useState(1)
  const [maxQuantity, setMaxQuantity] = useState(100)
  const [hasReminder, setHasReminder] = useState(false)
  const [isTogglingReminder, setIsTogglingReminder] = useState(false)

  useEffect(() => {
    if (offerId) {
      loadOfferDetails()
    }
  }, [offerId])

  // Set min/max quantity based on offer constraints
  useEffect(() => {
    if (offer) {
      const min = offer.min_claims_per_customer || 1
      const totalClaimed = getTotalQuantityClaimed(offerId)
      const max = offer.max_claims_per_user
        ? Math.max(min, offer.max_claims_per_user - totalClaimed)
        : 100

      setMinQuantity(min)
      setMaxQuantity(max)
      setQuantity(min) // Initialize quantity to minimum
    }
  }, [offer, offerId])

  const loadOfferDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await getOfferById(offerId)

      if (result.error) {
        setError(result.error)
      } else if (result.offer) {
        setOffer(result.offer)

        // Check if offer is favorited (if user is logged in)
        if (user) {
          checkIfFavorited()

          // Check if user has a reminder for this offer (if it's upcoming)
          const isUpcoming = result.offer.start_date && new Date(result.offer.start_date) > new Date()
          if (isUpcoming) {
            checkIfReminderSet()
          }
        }
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

  const checkIfFavorited = async () => {
    try {
      const favoritedIds = await getFavoritedOfferIds()
      setIsFavorited(favoritedIds.has(offerId))
    } catch (err) {
      console.error('Error checking favorite status:', err)
    }
  }

  const checkIfReminderSet = async () => {
    try {
      const result = await getMyReminders()
      if (result.success && result.reminders) {
        const hasReminderForOffer = result.reminders.some(
          reminder => reminder.offer_id === offerId
        )
        setHasReminder(hasReminderForOffer)
      }
    } catch (err) {
      console.error('Error checking reminder status:', err)
    }
  }

  const handleClaimInStore = async () => {
    // Check if user is logged in
    if (!user) {
      toast.error('Please sign in to claim this offer')
      router.push('/shoppers/auth/signin')
      return
    }

    // Validate minimum quantity
    if (offer.min_claims_per_customer && quantity < offer.min_claims_per_customer) {
      const errorMsg = `Minimum claim quantity is ${offer.min_claims_per_customer}.`
      setClaimError(errorMsg)
      toast.error(errorMsg)
      return
    }

    const totalClaimed = getTotalQuantityClaimed(offerId)
    const userCanClaim = canClaimMore(offerId, offer.max_claims_per_user)
    const hasUnredeemed = hasUnredeemedClaims(offerId)

    // Determine action: claim, unclaim, or maxed
    const shouldUnclaim = !userCanClaim && hasUnredeemed

    if (shouldUnclaim) {
      // User wants to unclaim
      if (!canUnclaim(offerId)) {
        const errorMsg = 'Cannot unclaim - all claims have been redeemed'
        setClaimError(errorMsg)
        toast.error(errorMsg)
        return
      }

      setClaiming(true)
      setClaimError(null)

      try {
        await unclaimOffer(offerId)
        toast.success('Offer unclaimed successfully!')
      } catch (err) {
        console.error('Error unclaiming offer:', err)
        const errorMsg = err.message || 'Failed to unclaim offer.'
        setClaimError(errorMsg)
        toast.error(errorMsg)
      } finally {
        setClaiming(false)
      }
    } else {
      // User wants to claim (or claim more)
      // Validate total quantity (existing + new) against max_claims_per_user
      if (offer.max_claims_per_user) {
        const totalAfterClaim = totalClaimed + quantity
        if (totalAfterClaim > offer.max_claims_per_user) {
          const remaining = offer.max_claims_per_user - totalClaimed
          const errorMsg = remaining > 0
            ? `You've used ${totalClaimed} of ${offer.max_claims_per_user}. Only ${remaining} remaining in your quota.`
            : `You've reached your quota limit (${offer.max_claims_per_user}) for this offer.`
          setClaimError(errorMsg)
          toast.error(errorMsg)
          return
        }
      }

      setClaiming(true)
      setClaimError(null)

      try {
        await claimOffer(offerId, 'in_store', quantity)

        // Success message
        let message = `Offer claimed successfully! (quantity: ${quantity}) Visit the store to redeem.`
        if (totalClaimed > 0 && offer.max_claims_per_user) {
          message = `Claimed ${quantity} more! Quota used: ${totalClaimed + quantity}/${offer.max_claims_per_user}. Visit the store to redeem.`
        } else if (totalClaimed > 0) {
          message = `Claimed ${quantity} more! Total: ${totalClaimed + quantity}. Visit the store to redeem.`
        }

        toast.success(message, {
          action: {
            label: 'Click to view your claims',
            onClick: () => router.push('/shoppers/claims')
          }
        })
        setQuantity(minQuantity) // Reset quantity to minimum after claiming
      } catch (err) {
        console.error('Error claiming offer:', err)
        let errorMsg = err.message || 'Failed to claim offer.'

        // Parse quota exceeded errors for better UX
        if (errorMsg.includes('already claimed') && errorMsg.includes('Maximum allowed')) {
          const claimedMatch = errorMsg.match(/already claimed (\d+)/)
          const maxMatch = errorMsg.match(/Maximum allowed is (\d+)/)

          if (claimedMatch && maxMatch) {
            const claimed = parseInt(claimedMatch[1])
            const maxAllowed = parseInt(maxMatch[1])

            if (claimed > maxAllowed) {
              errorMsg = `You have exceeded your claim limit for this offer. You've claimed ${claimed}, but the maximum allowed is ${maxAllowed}. Please contact support if you believe this is an error.`
            } else if (claimed === maxAllowed) {
              errorMsg = `You have reached your claim limit for this offer (${maxAllowed}/${maxAllowed} used).`
            }
          }
        }

        setClaimError(errorMsg)
        toast.error(errorMsg)
      } finally {
        setClaiming(false)
      }
    }
  }

  const handleGoToWebsite = () => {
    const website = offer?.business?.business_website || offer?.business?.website
    if (website) {
      window.open(website, '_blank')
    }
  }

  const handleFavoriteToggle = async () => {
    if (!user) {
      toast.error('Please sign in to save favorites')
      router.push('/shoppers/auth/signin')
      return
    }

    setIsTogglingFavorite(true)

    try {
      if (isFavorited) {
        const result = await removeOfferFromFavorites(offerId)
        if (result.success) {
          setIsFavorited(false)
          toast.success('Removed from favorites')
        } else {
          toast.error(result.error || 'Failed to remove from favorites')
        }
      } else {
        const result = await saveOfferToFavorites(offerId)
        if (result.success) {
          setIsFavorited(true)
          toast.success('Added to favorites')
        } else {
          // Handle "already saved" error gracefully
          if (result.error && result.error.includes('already saved')) {
            setIsFavorited(true)
            toast.success('Added to favorites')
          } else {
            toast.error(result.error || 'Failed to save to favorites')
          }
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
      toast.error('Failed to update favorites')
    } finally {
      setIsTogglingFavorite(false)
    }
  }

  const handleToggleReminder = async () => {
    if (!user) {
      toast.error('Please sign in to set reminders')
      router.push('/shoppers/auth/signin')
      return
    }

    setIsTogglingReminder(true)

    try {
      if (hasReminder) {
        const result = await removeOfferReminder(offerId)
        if (result.success) {
          setHasReminder(false)
          toast.success('Reminder removed')
        } else {
          toast.error(result.error || 'Failed to remove reminder')
        }
      } else {
        const result = await setOfferReminder(offerId)
        if (result.success) {
          setHasReminder(true)
          toast.success(result.message || "You'll be notified when this offer goes live!")
        } else {
          toast.error(result.error || 'Failed to set reminder')
        }
      }
    } catch (err) {
      console.error('Error toggling reminder:', err)
      toast.error('Failed to update reminder')
    } finally {
      setIsTogglingReminder(false)
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: offer?.title || 'Check out this offer',
      text: `${offer?.title} - ${offer?.description || 'Great deal!'}`,
      url: window.location.href
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        toast.success('Shared successfully!')
      } else {
        // Fallback: copy link to clipboard
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard!')
      }
    } catch (err) {
      // User cancelled or error occurred
      if (err.name !== 'AbortError') {
        console.error('Error sharing:', err)
        // Try clipboard as last resort
        try {
          await navigator.clipboard.writeText(window.location.href)
          toast.success('Link copied to clipboard!')
        } catch (clipboardErr) {
          toast.error('Failed to share')
        }
      }
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
  const isUpcoming = offer.start_date && new Date(offer.start_date) > new Date()
  const isDemoOffer = offer.can_claim === false || offer.is_demo === true

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
                <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {calculateTimeRemaining(offer.expiresAt)}
                  </div>
                  {(offer.claimed_count !== undefined || offer.redeemed_count !== undefined) && (
                    <>
                      {offer.claimed_count !== undefined && (
                        <div className="flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          <span className="font-medium">{offer.claimed_count || 0}</span> claimed
                        </div>
                      )}
                      {offer.redeemed_count !== undefined && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium text-green-600">{offer.redeemed_count || 0}</span> redeemed
                        </div>
                      )}
                    </>
                  )}
                  {offer.maxClaims && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      {offer.maxClaims - (offer.claimed_count || offer.currentClaims || 0)} remaining
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
                  {offer.max_claims_per_user && (
                    <li className="font-medium text-[#e94e1b]">
                      Quota limit: {offer.max_claims_per_user} per customer
                    </li>
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
              {claimError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  {claimError}
                </div>
              )}

              {/* Conditional: Show Remind Me for upcoming, View Only for demo, Claim for active offers */}
              {isUpcoming ? (
                // Upcoming offer - show Remind Me button
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Coming Soon</p>
                        <p className="text-sm text-blue-700 mt-1">
                          This offer starts on {new Date(offer.start_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleToggleReminder}
                    disabled={isTogglingReminder}
                    className={`w-full py-6 text-lg font-semibold ${
                      hasReminder
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-[#e94e1b] hover:bg-[#d13f16]'
                    } text-white`}
                  >
                    {isTogglingReminder ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {hasReminder ? 'Removing...' : 'Setting...'}
                      </>
                    ) : hasReminder ? (
                      <>
                        <BellOff className="w-5 h-5 mr-2" />
                        Remove Reminder
                      </>
                    ) : (
                      <>
                        <Bell className="w-5 h-5 mr-2" />
                        Remind Me
                      </>
                    )}
                  </Button>
                </>
              ) : isDemoOffer ? (
                // Demo offer - show informational message only
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Store className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-1">Visit Store to Claim</h3>
                      <p className="text-sm text-blue-700">
                        This offer is available in-store only. Visit the business location to claim this special offer in person.
                      </p>
                      {offer.business?.business_address && (
                        <p className="text-sm text-blue-800 font-medium mt-2">
                          📍 {offer.business.business_address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Active offer - show Claim button with quantity selector
                <>
                  {/* Quantity Selector */}
                  {canClaimMore(offerId, offer.max_claims_per_user) && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity to Claim
                        {offer.max_claims_per_user && (
                          <span className="text-gray-500 ml-1">
                            (Your quota: {getTotalQuantityClaimed(offerId)}/{offer.max_claims_per_user} used)
                          </span>
                        )}
                      </label>
                      <p className="text-xs text-amber-600 mb-2 font-medium">
                        Minimum: {minQuantity} • Maximum: {maxQuantity === Infinity ? 'No limit' : maxQuantity}
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.max(minQuantity, quantity - 1))}
                          className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                          disabled={quantity <= minQuantity}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={minQuantity}
                          max={maxQuantity}
                          value={quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || minQuantity
                            setQuantity(Math.min(maxQuantity, Math.max(minQuantity, val)))
                          }}
                          className="w-20 h-10 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e94e1b] focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                          className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                          disabled={quantity >= maxQuantity}
                        >
                          +
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {offer.max_claims_per_user && getTotalQuantityClaimed(offerId) > 0
                          ? `Remaining quota: ${offer.max_claims_per_user - getTotalQuantityClaimed(offerId)}`
                          : minQuantity > 1
                          ? `Minimum claim: ${minQuantity}`
                          : 'Select quantity to claim'}
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleClaimInStore}
                    disabled={claiming || (!canClaimMore(offerId, offer.max_claims_per_user) && !hasUnredeemedClaims(offerId))}
                    className={`w-full py-6 text-lg font-semibold ${
                      !canClaimMore(offerId, offer.max_claims_per_user) && !hasUnredeemedClaims(offerId)
                        ? 'bg-gray-500 opacity-70 cursor-not-allowed'
                        : !canClaimMore(offerId, offer.max_claims_per_user) && hasUnredeemedClaims(offerId)
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-[#e94e1b] hover:bg-[#d13f16]'
                    } text-white`}
                  >
                    {claiming ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {!canClaimMore(offerId, offer.max_claims_per_user) && hasUnredeemedClaims(offerId) ? 'Unclaiming...' : 'Claiming...'}
                      </>
                    ) : !canClaimMore(offerId, offer.max_claims_per_user) ? (
                      hasUnredeemedClaims(offerId) ? (
                        <>
                          <IoGift className="w-5 h-5 mr-2" />
                          Unclaim One
                        </>
                      ) : (
                        <>
                          <IoGift className="w-5 h-5 mr-2" />
                          Quota Full ({getTotalQuantityClaimed(offerId)}/{offer.max_claims_per_user} used)
                        </>
                      )
                    ) : (
                      <>
                        <IoGift className="w-5 h-5 mr-2" />
                        {getTotalQuantityClaimed(offerId) > 0 && offer.max_claims_per_user
                          ? `Claim More • ${getTotalQuantityClaimed(offerId)}/${offer.max_claims_per_user} used`
                          : getTotalQuantityClaimed(offerId) > 0
                          ? `Claim More • ${getTotalQuantityClaimed(offerId)} claimed`
                          : 'Claim In Store'}
                      </>
                    )}
                  </Button>
                </>
              )}

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
                <Button
                  variant="outline"
                  className={`flex-1 ${isFavorited ? 'bg-red-50 border-red-500 hover:bg-red-100' : ''}`}
                  onClick={handleFavoriteToggle}
                  disabled={isTogglingFavorite}
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleShare}
                >
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
