import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { input } = await request.json()

    if (!input || input.length < 5) {  // Increased from 3 to 5 characters
      return NextResponse.json({ predictions: [] })
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.error('Google Maps API key not found in environment variables')
      console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('GOOGLE')))
      return NextResponse.json({ 
        error: 'Google Maps API key not configured in environment variables' 
      }, { status: 500 })
    }

    // Build the request URL for Google Places Autocomplete API
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json')
    url.searchParams.append('input', input)
    url.searchParams.append('components', 'country:us|country:ca')
    url.searchParams.append('key', apiKey)

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status === 'OK') {
      return NextResponse.json({ predictions: data.predictions })
    } else {
      console.error('Google Places API error:', data.status, data.error_message)
      console.error('Full Google response:', data)
      return NextResponse.json({
        predictions: [],
        error_message: data.error_message,
        status: data.status
      })
    }

  } catch (error) {
    console.error('Places autocomplete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}