'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin, X } from 'lucide-react'

const AddressAutocomplete = ({ 
  value, 
  onChange, 
  onLocationSelect,
  placeholder = "Enter business address...",
  className = ""
}) => {
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef(null)
  const debounceTimer = useRef(null)

  const getSuggestions = async (input) => {
    if (!input || input.length < 5) {  // Increased from 3 to 5 characters
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      setIsLoading(true)
      
      const response = await fetch('/api/places/autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input })
      })

      const data = await response.json()

      console.log('Autocomplete API response:', { status: response.status, data })

      if (response.ok && data.predictions) {
        setSuggestions(data.predictions)
        setShowSuggestions(true)
      } else {
        console.error('Autocomplete API error:', data.error)
        console.error('Full response:', { status: response.status, data })

        // Show fallback message for billing issues
        if (data.error_message && data.error_message.includes('Billing')) {
          setSuggestions([{
            place_id: 'fallback',
            description: `Type your full address: "${input}"`,
            structured_formatting: {
              main_text: 'Use manual entry',
              secondary_text: '(Google API billing required for autocomplete)'
            },
            fallback: true
          }])
          setShowSuggestions(true)
        } else {
          setSuggestions([])
          setShowSuggestions(false)
        }
      }
    } catch (error) {
      console.error('Error getting suggestions:', error)
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setIsLoading(false)
    }
  }

  const getPlaceDetails = async (placeId) => {
    try {
      const response = await fetch('/api/places/details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ placeId })
      })

      const data = await response.json()

      if (response.ok && data.place) {
        return data.place
      } else {
        throw new Error(data.error || 'Failed to get place details')
      }
    } catch (error) {
      console.error('Error getting place details:', error)
      throw error
    }
  }

  const handleInputChange = (e) => {
    const newValue = e.target.value
    onChange(newValue)

    // Debounce the API calls
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      getSuggestions(newValue)
    }, 1000) // 1 second delay to reduce API calls
  }

  const handleSuggestionClick = async (suggestion) => {
    try {
      setIsLoading(true)

      // Handle fallback manual entry
      if (suggestion.fallback) {
        const manualAddress = value // Use current input value
        onChange(manualAddress)
        onLocationSelect({
          address: manualAddress,
          latitude: null,
          longitude: null,
          place_id: null,
          address_components: null
        })
        setShowSuggestions(false)
        setSuggestions([])
        return
      }

      const place = await getPlaceDetails(suggestion.place_id)

      const locationData = {
        address: place.formatted_address,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        place_id: place.place_id,
        address_components: place.address_components
      }

      onChange(place.formatted_address)
      onLocationSelect(locationData)
      setShowSuggestions(false)
      setSuggestions([])

    } catch (error) {
      console.error('Error getting place details:', error)
      // Still update the address even if details fail
      onChange(suggestion.description)
      onLocationSelect({
        address: suggestion.description,
        latitude: null,
        longitude: null,
        place_id: suggestion.place_id,
        address_components: null
      })
      setShowSuggestions(false)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const clearAddress = () => {
    onChange('')
    onLocationSelect(null)
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const handleBlur = () => {
    // Delay hiding suggestions to allow for click
    setTimeout(() => {
      setShowSuggestions(false)
    }, 200)
  }

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={() => value.length >= 3 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={`pl-10 pr-10 h-12 border-gray-300 focus:border-[#e94e1b] focus:ring-[#e94e1b] rounded-lg ${className}`}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            onClick={clearAddress}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || isLoading) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center p-4 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-[#e94e1b] mr-2"></div>
              Searching addresses...
            </div>
          )}
          
          {!isLoading && suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-gray-50 focus:outline-none"
            >
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.structured_formatting?.main_text || suggestion.description}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {suggestion.structured_formatting?.secondary_text || ''}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default AddressAutocomplete