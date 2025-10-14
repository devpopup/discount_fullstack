'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, CheckCircle, Clock, AlertCircle, Store, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getClaimedOffers, unclaimOffer } from '@/lib/offers-api'
import { toast } from 'sonner'
import Navbar from '@/components/Navbar'

export default function ClaimedOffersPage() {
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('pending') // 'all', 'pending', 'redeemed'
  const [unclaimingId, setUnclaimingId] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadClaims()
    }
  }, [user, filter])

  const loadClaims = async () => {
    setLoading(true)
    setError(null)
    try {
      const redeemedOnly = filter === 'redeemed' ? true : filter === 'pending' ? false : null
      const result = await getClaimedOffers({ page: 1, size: 50, redeemed_only: redeemedOnly })
      setClaims(result.claimed_offers || [])
    } catch (err) {
      console.error('Error loading claimed offers:', err)
      setError('Failed to load claimed offers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (claim) => {
    if (claim.is_redeemed) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          Redeemed
        </div>
      )
    }

    // Check if expired
    const offer = claim.offer || claim.offers
    if (offer?.expiry_date) {
      const expiryDate = new Date(offer.expiry_date)
      const now = new Date()
      if (expiryDate < now) {
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            Expired
          </div>
        )
      }
    }

    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
        <Clock className="w-3 h-3" />
        Pending
      </div>
    )
  }

  const handleUnclaim = async (offerId, claimId) => {
    if (unclaimingId) return // Prevent multiple simultaneous unclaims

    setUnclaimingId(claimId)

    try {
      const result = await unclaimOffer(offerId)

      if (result.success) {
        toast.success('Offer unclaimed successfully!')
        // Remove the claim from the list
        setClaims(prevClaims => prevClaims.filter(claim => claim.id !== claimId))
      } else {
        toast.error(result.error || 'Failed to unclaim offer')
      }
    } catch (err) {
      console.error('Error unclaiming offer:', err)
      toast.error('Failed to unclaim offer')
    } finally {
      setUnclaimingId(null)
    }
  }

  const filteredClaims = claims.filter(claim => {
    if (filter === 'all') return true
    if (filter === 'pending') return !claim.is_redeemed
    if (filter === 'redeemed') return claim.is_redeemed
    return true
  })

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign in required</h2>
          <p className="text-gray-600 mb-6">Please sign in to view your claimed offers</p>
          <Link href="/shoppers/auth/signin">
            <Button className="bg-[#e94e1b] hover:bg-[#d13f16] text-white">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/shoppers">
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Claims</h1>
              <p className="text-gray-600">Offers you've claimed - show at the store to redeem</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilter('pending')}
              className={filter === 'pending' ? 'bg-[#e94e1b] hover:bg-[#d13f16] text-white' : ''}
            >
              Pending
            </Button>
            <Button
              variant={filter === 'redeemed' ? 'default' : 'outline'}
              onClick={() => setFilter('redeemed')}
              className={filter === 'redeemed' ? 'bg-[#e94e1b] hover:bg-[#d13f16] text-white' : ''}
            >
              Redeemed
            </Button>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-[#e94e1b] hover:bg-[#d13f16] text-white' : ''}
            >
              All
            </Button>
          </div>
        </div>
      </div>

      {/* Claims List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#e94e1b]" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 text-center">{error}</p>
            <div className="flex justify-center mt-4">
              <Button onClick={loadClaims} className="bg-[#e94e1b] hover:bg-[#d13f16] text-white">
                Try Again
              </Button>
            </div>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No claims found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'pending'
                ? "You don't have any pending claims. Browse deals to claim offers!"
                : filter === 'redeemed'
                ? "You haven't redeemed any offers yet."
                : "You haven't claimed any offers yet. Browse deals to get started!"}
            </p>
            <Link href="/shoppers">
              <Button className="bg-[#e94e1b] hover:bg-[#d13f16] text-white">
                Browse Deals
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClaims.map((claim) => {
              const offer = claim.offer || claim.offers
              const business = offer?.businesses || {}
              const imageUrl = offer?.image_url || (offer?.images && offer.images.length > 0 ? offer.images[0] : null)

              return (
                <div
                  key={claim.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="flex-shrink-0 w-24 h-24 relative rounded-lg overflow-hidden bg-gray-100">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={offer?.title || 'Offer'}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Store className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {offer?.title || 'Offer'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {business?.business_name || 'Business'}
                          </p>
                        </div>
                        {getStatusBadge(claim)}
                      </div>

                      <div className="space-y-2">
                        {/* Business Location */}
                        {business?.business_address && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Location:</span> {business.business_address}
                          </div>
                        )}

                        {/* Claimed Date */}
                        <div className="text-xs text-gray-500">
                          Claimed on {new Date(claim.claimed_at).toLocaleDateString()} at{' '}
                          {new Date(claim.claimed_at).toLocaleTimeString()}
                        </div>

                        {/* Expiry Warning */}
                        {!claim.is_redeemed && offer?.expiry_date && (
                          <div className="text-sm">
                            {(() => {
                              const expiryDate = new Date(offer.expiry_date)
                              const now = new Date()
                              const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))

                              if (daysRemaining < 0) {
                                return (
                                  <span className="text-red-600 font-medium">
                                    This offer has expired
                                  </span>
                                )
                              } else if (daysRemaining === 0) {
                                return (
                                  <span className="text-orange-600 font-medium">
                                    Expires today!
                                  </span>
                                )
                              } else if (daysRemaining === 1) {
                                return (
                                  <span className="text-orange-600 font-medium">
                                    Expires tomorrow
                                  </span>
                                )
                              } else if (daysRemaining <= 3) {
                                return (
                                  <span className="text-orange-600 font-medium">
                                    Expires in {daysRemaining} days
                                  </span>
                                )
                              } else {
                                return (
                                  <span className="text-gray-600">
                                    Valid until {expiryDate.toLocaleDateString()}
                                  </span>
                                )
                              }
                            })()}
                          </div>
                        )}

                        {/* Redemption Instructions & Unclaim Button */}
                        {!claim.is_redeemed && (
                          <>
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm text-blue-900">
                                <strong>To redeem:</strong> Visit the store and show this claimed offer to the merchant
                              </p>
                            </div>
                            <div className="mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnclaim(offer?.id, claim.id)}
                                disabled={unclaimingId === claim.id}
                                className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                              >
                                {unclaimingId === claim.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Unclaiming...
                                  </>
                                ) : (
                                  <>
                                    <X className="w-4 h-4 mr-2" />
                                    Unclaim Offer
                                  </>
                                )}
                              </Button>
                            </div>
                          </>
                        )}

                        {/* Redeemed Info */}
                        {claim.is_redeemed && claim.redeemed_at && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm text-green-900">
                              Redeemed on {new Date(claim.redeemed_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
