'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  MapPin,
  Radar,
  Target,
  Zap,
  DollarSign
} from 'lucide-react'

export default function LocationAdvertisingControls({ 
  formData, 
  handleInputChange, 
  setFormData,
  useSlider = false,
  autoAdvertiseEnabled = true 
}) {
  const radiusOptions = [
    { value: 100, label: '100m - Immediate vicinity' },
    { value: 250, label: '250m - Close proximity' },
    { value: 500, label: '500m - Walking distance' },
    { value: 1000, label: '1km - Local area' },
    { value: 2000, label: '2km - Extended reach' },
    { value: 5000, label: '5km - Wide coverage' }
  ]

  const handleRadiusChange = (value) => {
    if (useSlider) {
      handleInputChange({
        target: {
          name: 'geofence_radius',
          value: parseInt(value)
        }
      })
    } else {
      setFormData(prev => ({...prev, geofence_radius: parseInt(value)}))
    }
  }

  const handleBudgetChange = (value) => {
    if (useSlider) {
      handleInputChange({
        target: {
          name: 'daily_ad_budget',
          value: parseFloat(value) || 20.00
        }
      })
    } else {
      handleInputChange({
        target: {
          name: 'daily_ad_budget',
          value: parseFloat(value)
        }
      })
    }
  }

  return (
    <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
          <Target className="h-5 w-5 text-orange-500" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg">Location-Based Advertising</h3>
          <p className="text-slate-400 text-sm">Enhance your offer with geofenced marketing</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Geofence Toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-600/50">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-white font-medium">Enable Geofencing</p>
              <p className="text-slate-400 text-sm">Target customers near your location</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="geofence_enabled"
              checked={formData.geofence_enabled}
              onChange={handleInputChange}
              className="sr-only"
            />
            <div className={`w-11 h-6 rounded-full transition-colors ${formData.geofence_enabled ? 'bg-orange-500' : 'bg-slate-600'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${formData.geofence_enabled ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
            </div>
          </label>
        </div>

        {/* Geofence Radius - Only show when enabled */}
        {formData.geofence_enabled && (
          <div className="space-y-3 pl-8">
            <div className="flex items-center gap-2">
              <Radar className="h-4 w-4 text-orange-500" />
              <Label className="text-white font-medium">Targeting Radius</Label>
            </div>
            
            {useSlider ? (
              <div className="space-y-2">
                <input
                  type="range"
                  name="geofence_radius"
                  min="100"
                  max="5000"
                  step="100"
                  value={formData.geofence_radius}
                  onChange={(e) => handleRadiusChange(e.target.value)}
                  className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>100m</span>
                  <span className="text-orange-500 font-medium">{formData.geofence_radius}m</span>
                  <span>5km</span>
                </div>
              </div>
            ) : (
              <Select 
                value={formData.geofence_radius.toString()} 
                onValueChange={handleRadiusChange}
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {radiusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Auto Advertise Toggle */}
        <div className={`flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-600/50 ${!autoAdvertiseEnabled ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-white font-medium">
                Auto-Advertise {!autoAdvertiseEnabled && '(Coming Soon)'}
              </p>
              <p className="text-slate-400 text-sm">Automatically create ad campaigns</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="auto_advertise"
              checked={formData.auto_advertise}
              onChange={handleInputChange}
              className="sr-only"
              disabled={!autoAdvertiseEnabled}
            />
            <div className={`w-11 h-6 rounded-full transition-colors ${
              formData.auto_advertise && autoAdvertiseEnabled ? 'bg-orange-500' : 'bg-slate-600'
            }`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                formData.auto_advertise && autoAdvertiseEnabled ? 'translate-x-5' : 'translate-x-0'
              } mt-0.5 ml-0.5`}></div>
            </div>
          </label>
        </div>

        {/* Daily Budget - Only show when auto_advertise enabled */}
        {formData.auto_advertise && autoAdvertiseEnabled && (
          <div className="space-y-3 pl-8">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-500" />
              <Label className="text-white font-medium">Daily Ad Budget</Label>
            </div>
            
            {useSlider ? (
              <div className="space-y-2">
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    name="daily_ad_budget"
                    type="number"
                    step="0.01"
                    min="10"
                    max="500"
                    value={formData.daily_ad_budget}
                    onChange={(e) => handleBudgetChange(e.target.value)}
                    placeholder="20.00"
                    className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-400 pl-10 h-10"
                  />
                </div>
                <p className="text-xs text-slate-400">Recommended: $20-50 per day for local businesses</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-sm">$10</span>
                  <input
                    type="range"
                    name="daily_ad_budget"
                    min="10"
                    max="100"
                    step="5"
                    value={formData.daily_ad_budget}
                    onChange={(e) => handleBudgetChange(e.target.value)}
                    className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-slate-400 text-sm">$100</span>
                </div>
                <p className="text-slate-300 text-sm">
                  Selected: <span className="text-orange-500 font-semibold">${formData.daily_ad_budget}/day</span>
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}