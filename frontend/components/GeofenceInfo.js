'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin,
  Radar,
  Zap,
  DollarSign
} from 'lucide-react'

export default function GeofenceInfo({ offer, showAll = false, className = "" }) {
  if (!offer.geofence_enabled) {
    return null
  }

  const getRadiusDisplay = (radius) => {
    if (radius >= 1000) {
      return `${(radius / 1000).toFixed(radius % 1000 === 0 ? 0 : 1)}km`
    }
    return `${radius}m`
  }

  const getRadiusLabel = (radius) => {
    if (radius <= 100) return 'Immediate vicinity'
    if (radius <= 250) return 'Close proximity' 
    if (radius <= 500) return 'Walking distance'
    if (radius <= 1000) return 'Local area'
    if (radius <= 2000) return 'Extended reach'
    return 'Wide coverage'
  }

  if (!showAll) {
    // Compact display for list view
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge variant="outline" className="flex items-center gap-1 text-xs bg-orange-50 border-orange-200 text-orange-700">
          <MapPin className="h-3 w-3" />
          {getRadiusDisplay(offer.geofence_radius)}
        </Badge>
        {offer.auto_advertise && (
          <Badge variant="outline" className="flex items-center gap-1 text-xs bg-yellow-50 border-yellow-200 text-yellow-700">
            <Zap className="h-3 w-3" />
            Auto-Ad
          </Badge>
        )}
      </div>
    )
  }

  // Detailed display for details view
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Geofence Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-orange-500" />
          <span className="text-sm text-gray-600">Geofencing</span>
        </div>
        <Badge className="bg-orange-100 text-orange-700 border-orange-200">
          Enabled
        </Badge>
      </div>

      {/* Radius */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radar className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">Target Radius</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium">
            {getRadiusDisplay(offer.geofence_radius)}
          </span>
          <p className="text-xs text-gray-500">
            {getRadiusLabel(offer.geofence_radius)}
          </p>
        </div>
      </div>

      {/* Auto-Advertise Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">Auto-Advertise</span>
        </div>
        <Badge 
          className={offer.auto_advertise 
            ? "bg-yellow-100 text-yellow-700 border-yellow-200" 
            : "bg-gray-100 text-gray-500 border-gray-200"
          }
        >
          {offer.auto_advertise ? 'Active' : 'Disabled'}
        </Badge>
      </div>

      {/* Daily Budget - Only show if auto-advertise is enabled */}
      {offer.auto_advertise && offer.daily_ad_budget && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Daily Budget</span>
          </div>
          <span className="text-sm font-medium text-green-600">
            ${parseFloat(offer.daily_ad_budget).toFixed(2)}/day
          </span>
        </div>
      )}
    </div>
  )
}

export function GeofenceStatusBadge({ offer, size = "sm" }) {
  if (!offer.geofence_enabled) {
    return null
  }

  const getRadiusDisplay = (radius) => {
    if (radius >= 1000) {
      return `${(radius / 1000).toFixed(radius % 1000 === 0 ? 0 : 1)}km`
    }
    return `${radius}m`
  }

  return (
    <Badge 
      variant="outline" 
      className={`flex items-center gap-1 bg-orange-50 border-orange-200 text-orange-700 ${
        size === 'xs' ? 'text-xs px-1.5 py-0.5' : 'text-xs'
      }`}
    >
      <MapPin className={size === 'xs' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      Geo: {getRadiusDisplay(offer.geofence_radius)}
    </Badge>
  )
}