'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Tag } from 'lucide-react'
import { calculateDistance } from '@/lib/offers-api'

export default function DealCard({ deal, userLocation = null, className = "" }) {
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

  const formatDistance = (distance) => {
    if (!distance) return null
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`
    }
    return `${distance.toFixed(1)}km away`
  }

  const progressPercentage = maxClaims ? (claimedCount / maxClaims) * 100 : 0

  if (!deal?.id) {
    console.error('DealCard: Missing deal.id', deal)
    return null
  }

  return (
    <Link
      href={`/shoppers/offers/${deal.id}`}
      className={`hover:shadow-lg transition-shadow duration-200 overflow-hidden bg-white flex-shrink-0 ${className}`}
      style={{
        width: '140px',
        height: '222px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Deal Image - Full width, 140px height */}
      <div className="relative" style={{ width: '100%', height: '140px', overflow: 'hidden' }}>
        {images && images.length > 0 ? (
          <Image
            src={images[0]}
            alt={title || 'Product'}
            width={140}
            height={140}
            className="object-cover"
            style={{ width: '100%', height: '100%' }}
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center">
            <Tag className="w-12 h-12 text-gray-400" />
          </div>
        )}

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

        {/* Days Remaining Badge - Bottom Right */}
        <div
          className="absolute text-white font-medium"
          style={{
            bottom: '8px',
            right: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            fontSize: '10px',
            padding: '4px 8px',
            borderRadius: '4px'
          }}
        >
          {calculateTimeRemaining(expiresAt)} left
        </div>
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
        <div style={{ fontSize: '11px', color: '#666' }}>
          {distance ? `${formatDistance(distance)} away` : 'Distance N/A'}
        </div>
      </div>
    </Link>
  )
}