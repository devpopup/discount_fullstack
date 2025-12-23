'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Smartphone, Globe } from 'lucide-react'

export default function BusinessLandingPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.id
  const [countdown, setCountdown] = useState(3)
  const [showOptions, setShowOptions] = useState(false)

  useEffect(() => {
    // Deep link to open the app
    const appDeepLink = `popupreach://business/${businessId}`
    const webFallback = `/shoppers/business/${businessId}`

    // Try to open the app
    const tryOpenApp = () => {
      // Record the time when we attempt to open the app
      const startTime = Date.now()

      // Attempt to open the app
      window.location.href = appDeepLink

      // Set a timeout to check if the app opened
      const timeout = setTimeout(() => {
        const elapsedTime = Date.now() - startTime

        // If less than 2 seconds passed, app probably didn't open
        // (when app opens, this tab goes to background and timer pauses)
        if (elapsedTime < 2000) {
          setShowOptions(true)
        }
      }, 1500)

      // Cleanup
      return () => clearTimeout(timeout)
    }

    // Start countdown
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          tryOpenApp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Cleanup on unmount
    return () => {
      clearInterval(countdownInterval)
    }
  }, [businessId])

  const handleOpenWeb = () => {
    router.push(`/shoppers/business/${businessId}`)
  }

  const handleTryAgain = () => {
    window.location.href = `popupreach://business/${businessId}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {!showOptions ? (
          <>
            {/* Loading state */}
            <div className="mb-6">
              <Loader2 className="w-16 h-16 text-[#e94e1b] mx-auto animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Opening PopupReach App...
            </h1>
            <p className="text-gray-600 mb-4">
              Redirecting you to the app in {countdown} second{countdown !== 1 ? 's' : ''}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-[#e94e1b] h-2 rounded-full transition-all duration-1000"
                style={{ width: `${((3 - countdown) / 3) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">
              If the app doesn't open automatically, you'll see options to continue.
            </p>
          </>
        ) : (
          <>
            {/* Options when app doesn't open */}
            <div className="mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-[#e94e1b]" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Choose How to Continue
              </h1>
              <p className="text-gray-600">
                Don't have the app yet? No problem!
              </p>
            </div>

            <div className="space-y-3">
              {/* Open in App button */}
              <button
                onClick={handleTryAgain}
                className="w-full bg-[#e94e1b] hover:bg-[#d13f16] text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-3"
              >
                <Smartphone className="w-5 h-5" />
                Open in PopupReach App
              </button>

              {/* View on Web button */}
              <button
                onClick={handleOpenWeb}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 rounded-xl border-2 border-gray-200 transition-colors duration-200 flex items-center justify-center gap-3"
              >
                <Globe className="w-5 h-5" />
                Continue on Web
              </button>
            </div>

            <div className="mt-6 p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Tip:</strong> Download the PopupReach app for a better experience and exclusive features!
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
