import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 500 })
    }

    // Test with a simple, known working query
    const testInput = "New York"
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${testInput}&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    return NextResponse.json({
      test_input: testInput,
      api_status: data.status,
      predictions_count: data.predictions?.length || 0,
      error_message: data.error_message,
      working: data.status === 'OK' && data.predictions?.length > 0
    })

  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({ error: 'Test failed', details: error.message }, { status: 500 })
  }
}