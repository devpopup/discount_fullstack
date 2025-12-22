'use client'

import { useState, useEffect, memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Tag, Heart, Bell, BellOff } from 'lucide-react'
import { IoGift } from 'react-icons/io5'
import { calculateDistance, saveOfferToFavorites, removeOfferFromFavorites, setOfferReminder, removeOfferReminder } from '@/lib/offers-api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
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
import { useRouter } from 'next/navigation'
import ClaimModal from '@/components/ClaimModal'

function DealCard({ deal, userLocation = null, className = "", isFavorited: initialFavorited = false, onFavoriteChange, isClaimed: initialClaimed = false, onClaimChange, priority = false }) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited)
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [authAction, setAuthAction] = useState('') // 'favorite', 'claim', or 'remind'
  const [hasReminder, setHasReminder] = useState(deal?.has_reminder || false)
  const [isTogglingReminder, setIsTogglingReminder] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const {
    title,
    description,
    businessName,
    businessLogo,
    discount,
    originalPrice,
    discountedPrice,
    category,
    location,
    distance: providedDistance,
    rating,
    reviewCount,
    expiresAt,
    claimedCount,
    maxClaims,
    isPopular,
    isFeatured,
    images = [],
    latitude,
    longitude
  } = deal || {}

  // Calculate distance if not provided and we have user location + business coordinates
  let distance = providedDistance
  if (!distance && userLocation && latitude && longitude) {
    distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      parseFloat(latitude),
      parseFloat(longitude)
    )
  }

  const calculateTimeRemaining = (expiresAt) => {
    if (!expiresAt) return 'No expiry'

    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry - now

    if (diff <= 0) return 'Expired'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days}d left`
    if (hours > 0) return `${hours}h left`
    return 'Ending soon'
  }

  const calculateTimeUntilStart = (startDate) => {
    if (!startDate) return 'Coming Soon'

    const now = new Date()
    const start = new Date(startDate)
    const diff = start - now

    if (diff <= 0) return null // Already started

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `Starts in ${days}d`
    if (hours > 0) return `Starts in ${hours}h`
    return 'Starts soon'
  }

  const formatDistance = (distance) => {
    if (!distance) return null
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`
    }
    return `${distance.toFixed(1)}km away`
  }

  const progressPercentage = maxClaims ? (claimedCount / maxClaims) * 100 : 0

  // Update favorited state when prop changes
  useEffect(() => {
    setIsFavorited(initialFavorited)
  }, [initialFavorited])

  // Update reminder state when deal.has_reminder changes
  useEffect(() => {
    setHasReminder(deal?.has_reminder || false)
  }, [deal?.has_reminder])

  // Check if offer is upcoming
  const isUpcoming = deal?.start_date && new Date(deal.start_date) > new Date()


  // Handle favorite toggle
  const handleFavoriteClick = async (e) => {
    e.preventDefault() // Prevent navigation to offer details
    e.stopPropagation()

    // Check if user is logged in
    if (!user) {
      setAuthAction('favorite')
      setShowAuthDialog(true)
      return
    }

    setIsTogglingFavorite(true)

    try {
      if (isFavorited) {
        // Remove from favorites
        const result = await removeOfferFromFavorites(deal.id)
        if (result.success) {
          setIsFavorited(false)
          if (onFavoriteChange) {
            onFavoriteChange(deal.id, false)
          }
        } else {
          console.error('Failed to remove from favorites:', result.error)
        }
      } else {
        // Add to favorites
        const result = await saveOfferToFavorites(deal.id)
        if (result.success) {
          setIsFavorited(true)
          if (onFavoriteChange) {
            onFavoriteChange(deal.id, true)
          }
        } else {
          // Handle "already saved" error gracefully
          if (result.error && result.error.includes('already saved')) {
            // Just update the UI to show it's favorited
            setIsFavorited(true)
            if (onFavoriteChange) {
              onFavoriteChange(deal.id, true)
            }
          } else {
            console.error('Failed to save to favorites:', result.error)
          }
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setIsTogglingFavorite(false)
    }
  }

  // Handle claim button click - open modal
  const handleClaimClick = (e) => {
    e.preventDefault() // Prevent navigation to offer details
    e.stopPropagation()

    // Check if user is logged in
    if (!user) {
      setAuthAction('claim')
      setShowAuthDialog(true)
      return
    }

    // Open claim modal
    setShowClaimModal(true)
  }

  // Handle remind me button click
  const handleRemindClick = async (e) => {
    e.preventDefault() // Prevent navigation to offer details
    e.stopPropagation()

    // Check if user is logged in
    if (!user) {
      setAuthAction('remind')
      setShowAuthDialog(true)
      return
    }

    setIsTogglingReminder(true)

    try {
      let result
      if (hasReminder) {
        result = await removeOfferReminder(deal.id)
        if (result.success) {
          setHasReminder(false)
          toast.success('Reminder removed')
        } else {
          toast.error(result.error || 'Failed to remove reminder')
        }
      } else {
        result = await setOfferReminder(deal.id)
        if (result.success) {
          setHasReminder(true)
          toast.success("You'll be notified when this offer goes live!")
        } else {
          toast.error(result.error || 'Failed to set reminder')
        }
      }
    } catch (error) {
      console.error('Error toggling reminder:', error)
      toast.error('Failed to update reminder')
    } finally {
      setIsTogglingReminder(false)
    }
  }

  if (!deal?.id) {
    if (process.env.NODE_ENV === 'development') {
      console.error('DealCard: Missing deal.id', deal)
    }
    return null
  }

  return (
    <>
    <Link
      href={`/shoppers/offers/${deal.id}`}
      className={`hover:shadow-lg transition-shadow duration-200 overflow-hidden bg-white flex-shrink-0 ${className}`}
      style={{
        width: '160px',
        height: '270px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Deal Image - Full width, 150px height */}
      <div className="relative" style={{ width: '100%', height: '150px', overflow: 'hidden' }}>
        {(() => {
          // Check multiple possible image sources
          const imageUrl = images?.[0] || deal?.products?.image_url || deal?.product?.image_url

          return imageUrl ? (
            <Image
              src={imageUrl}
              alt={title || 'Product'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 200px"
              priority={priority}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center">
              <Tag className="w-12 h-12 text-gray-400" />
            </div>
          )
        })()}

        {/* Percentage OFF Badge - Top Left */}
        <div
          className="absolute bg-[#e74c3c] text-white font-semibold"
          style={{
            top: '8px',
            left: '8px',
            fontSize: '11px',
            padding: '4px 8px',
            borderRadius: '4px'
          }}
        >
          {discount}% OFF
        </div>

        {/* Favorite Button - Top Right */}
        <button
          onClick={handleFavoriteClick}
          disabled={isTogglingFavorite}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white transition-all duration-200 shadow-md"
          style={{
            zIndex: 10
          }}
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`w-4 h-4 transition-all duration-200 ${
              isFavorited
                ? 'fill-red-500 text-red-500'
                : 'text-gray-600 hover:text-red-500'
            }`}
          />
        </button>

        {/* Time Badge - Bottom Right: Shows start time for upcoming, expiry for active */}
        {(() => {
          const timeText = isUpcoming
            ? calculateTimeUntilStart(deal?.start_date)
            : calculateTimeRemaining(expiresAt)

          // Don't show badge if null (already started)
          if (!timeText) return null

          return (
            <div
              className="absolute text-white font-medium"
              style={{
                bottom: '8px',
                right: '8px',
                backgroundColor: isUpcoming ? 'rgba(233, 78, 27, 0.9)' : 'rgba(0, 0, 0, 0.7)',
                fontSize: '10px',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
              suppressHydrationWarning
            >
              {timeText}
            </div>
          )
        })()}
      </div>

      {/* Card Content */}
      <div style={{ padding: '12px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Price container */}
        <div className="flex items-center gap-1.5" style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>
            ${discountedPrice?.toFixed(2) || '0.00'}
          </div>
          {originalPrice && originalPrice > 0 && (
            <div style={{ fontSize: '13px', color: '#999', textDecoration: 'line-through' }}>
              ${originalPrice.toFixed(2)}
            </div>
          )}
        </div>

        {/* Product Name */}
        <div style={{ fontSize: '13px', color: '#333', lineHeight: '1.3', marginBottom: '4px' }}>
          {title || businessName}
        </div>

        {/* Distance */}
        <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
          {distance ? formatDistance(distance) : 'Distance N/A'}
        </div>

        {/* Conditional Button: Remind Me for upcoming offers, Claim for active offers */}
        {isUpcoming ? (
          <Button
            onClick={handleRemindClick}
            size="sm"
            disabled={isTogglingReminder}
            className={`w-full text-white text-xs py-1 ${
              hasReminder
                ? 'bg-gray-600 hover:bg-gray-700'
                : 'bg-[#e94e1b] hover:bg-[#d13f16]'
            }`}
          >
            {isTogglingReminder ? (
              <>...</>
            ) : hasReminder ? (
              <>
                <BellOff className="w-3 h-3 mr-1" />
                Reminder Set
              </>
            ) : (
              <>
                <Bell className="w-3 h-3 mr-1" />
                Remind Me
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleClaimClick}
            size="sm"
            className="w-full bg-[#e94e1b] hover:bg-[#d13f16] text-white text-xs py-1"
          >
            <IoGift className="w-3 h-3 mr-1" />
            Claim
          </Button>
        )}
      </div>
    </Link>

    {/* Claim Modal */}
    <ClaimModal
      isOpen={showClaimModal}
      onClose={() => setShowClaimModal(false)}
      offer={deal}
      onClaimSuccess={onClaimChange}
    />

    {/* Auth Dialog */}
    <AlertDialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign in required</AlertDialogTitle>
          <AlertDialogDescription>
            Please sign in to {authAction === 'favorite' ? 'save offers to your favorites' : authAction === 'remind' ? 'set reminders for upcoming offers' : 'claim this offer'}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              router.push('/shoppers/auth/signin')
            }}
            className="bg-[#e94e1b] hover:bg-[#d13f16]"
          >
            Sign In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}

// Memoize component to prevent unnecessary re-renders
export default memo(DealCard, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.deal.id === nextProps.deal.id &&
    prevProps.isFavorited === nextProps.isFavorited &&
    prevProps.isClaimed === nextProps.isClaimed &&
    prevProps.userLocation?.lat === nextProps.userLocation?.lat &&
    prevProps.userLocation?.lng === nextProps.userLocation?.lng
  )
})