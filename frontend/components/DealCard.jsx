'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, Star, Tag, Users, Heart, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DealCard({ deal, className = "" }) {
  const {
    id,
    title,
    description,
    businessName,
    businessLogo,
    discount,
    originalPrice,
    discountedPrice,
    category,
    location,
    distance,
    rating,
    reviewCount,
    expiresAt,
    claimedCount,
    maxClaims,
    isPopular,
    isFeatured,
    images = []
  } = deal || {}

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

  return (
    <Card className={`group hover:shadow-lg transition-all duration-200 overflow-hidden bg-white border-gray-200 ${className}`}>
      <div className="relative">
        {/* Deal Image */}
        <div className="aspect-[16/10] relative overflow-hidden bg-gray-100">
          {images.length > 0 ? (
            <Image
              src={images[0]}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Tag className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {isFeatured && (
            <Badge className="bg-[#e94e1b] text-white">Featured</Badge>
          )}
          {isPopular && (
            <Badge className="bg-purple-600 text-white">Popular</Badge>
          )}
          <Badge variant="secondary" className="bg-black/70 text-white backdrop-blur-sm">
            {discount}% OFF
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="ghost" className="w-8 h-8 p-0 bg-white/90 hover:bg-white">
            <Heart className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" className="w-8 h-8 p-0 bg-white/90 hover:bg-white">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Time Remaining */}
        <div className="absolute bottom-3 right-3">
          <Badge variant="outline" className="bg-white/90 text-[#e94e1b] border-[#e94e1b]">
            <Clock className="w-3 h-3 mr-1" />
            {calculateTimeRemaining(expiresAt)}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Business Info */}
        <div className="flex items-center gap-2 mb-2">
          {businessLogo ? (
            <Image
              src={businessLogo}
              alt={businessName}
              width={20}
              height={20}
              className="rounded-full"
            />
          ) : (
            <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
          )}
          <span className="text-sm text-gray-600 font-medium">{businessName}</span>
          {category && (
            <Badge variant="outline" className="text-xs px-2 py-0">
              {category}
            </Badge>
          )}
        </div>

        {/* Deal Title */}
        <Link href={`/shoppers/deals/${id}`}>
          <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-[#e94e1b] transition-colors mb-2">
            {title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {description}
        </p>

        {/* Pricing */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-[#e94e1b]">
            ${discountedPrice?.toFixed(2) || '0.00'}
          </span>
          {originalPrice && originalPrice > 0 && (
            <span className="text-sm text-gray-500 line-through">
              ${originalPrice.toFixed(2)}
            </span>
          )}
          {originalPrice && discountedPrice && originalPrice > discountedPrice && (
            <span className="text-sm text-green-600 font-medium">
              Save ${(originalPrice - discountedPrice).toFixed(2)}
            </span>
          )}
        </div>

        {/* Location & Rating */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
            {distance && (
              <span className="text-[#e94e1b]">• {formatDistance(distance)}</span>
            )}
          </div>
          
          {rating && rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{rating}</span>
              {reviewCount && reviewCount > 0 && (
                <span>({reviewCount})</span>
              )}
            </div>
          )}
        </div>

        {/* Progress Bar for Limited Offers */}
        {maxClaims && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {claimedCount} claimed
              </span>
              <span>{maxClaims - claimedCount} left</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#e94e1b] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <Link href={`/shoppers/deals/${id}`}>
          <Button className="w-full bg-[#e94e1b] hover:bg-[#d13f16] text-white">
            View Deal
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}