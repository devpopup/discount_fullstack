'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { IoGift } from 'react-icons/io5'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useClaims } from '@/context/ClaimContext'
import { toast } from 'sonner'

export default function ClaimModal({
  isOpen,
  onClose,
  offer,
  onClaimSuccess
}) {
  const router = useRouter()
  const {
    getTotalQuantityClaimed,
    canClaimMore,
    claimOffer
  } = useClaims()

  const [quantity, setQuantity] = useState(offer?.min_claims_per_customer || 1)
  const [claiming, setClaiming] = useState(false)

  if (!offer) return null

  const totalClaimed = getTotalQuantityClaimed(offer.id)
  const userCanClaimMore = canClaimMore(offer.id, offer.max_claims_per_user)
  const remainingQuota = offer.max_claims_per_user
    ? offer.max_claims_per_user - totalClaimed
    : Infinity
  const isQuotaExhausted = !userCanClaimMore
  const minQuantity = offer.min_claims_per_customer || 1
  const maxQuantity = remainingQuota === Infinity ? 100 : Math.min(100, remainingQuota)

  const handleClaim = async () => {
    // Validate minimum quantity
    if (minQuantity && quantity < minQuantity) {
      toast.error(`Minimum claim quantity is ${minQuantity}.`)
      return
    }

    // Pre-validation if we know the quota
    if (offer.max_claims_per_user && (totalClaimed + quantity) > offer.max_claims_per_user) {
      const remaining = offer.max_claims_per_user - totalClaimed
      toast.error(
        remaining > 0
          ? `You can only claim ${remaining} more. You've already claimed ${totalClaimed}/${offer.max_claims_per_user}.`
          : `Quota exhausted. You've claimed all ${offer.max_claims_per_user} available to you.`
      )
      return
    }

    setClaiming(true)
    try {
      await claimOffer(offer.id, 'in_store', quantity)

      // Success message
      let message = `Claimed quantity ${quantity} successfully!`
      if (totalClaimed > 0 && offer.max_claims_per_user) {
        message = `Claimed ${quantity} more! Quota used: ${totalClaimed + quantity}/${offer.max_claims_per_user}`
      } else if (totalClaimed > 0) {
        message = `Claimed ${quantity} more! Total: ${totalClaimed + quantity}`
      }

      toast.success(message, {
        action: {
          label: 'Click to view your claims',
          onClick: () => router.push('/shoppers/claims')
        }
      })
      if (onClaimSuccess) {
        onClaimSuccess(offer.id, true)
      }
      onClose()
    } catch (error) {
      console.error('Error claiming offer:', error)

      // Parse quota-related errors
      let errorMsg = error.message || 'Failed to claim offer'

      // Parse quota exceeded errors for better UX
      if (errorMsg.includes('already claimed') && errorMsg.includes('Maximum allowed')) {
        const claimedMatch = errorMsg.match(/already claimed (\d+)/)
        const maxMatch = errorMsg.match(/Maximum allowed is (\d+)/)

        if (claimedMatch && maxMatch) {
          const claimed = parseInt(claimedMatch[1])
          const maxAllowed = parseInt(maxMatch[1])

          if (claimed > maxAllowed) {
            errorMsg = `You have exceeded your claim limit for this offer. You've claimed ${claimed}, but the maximum allowed is ${maxAllowed}. Please contact support if you believe this is an error.`
          } else if (claimed === maxAllowed) {
            errorMsg = `You have reached your claim limit for this offer (${maxAllowed}/${maxAllowed} used).`
          }
        } else {
          errorMsg = 'You\'ve reached your quota limit for this offer'
        }
      }

      toast.error(errorMsg)
    } finally {
      setClaiming(false)
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IoGift className="w-5 h-5 text-[#e94e1b]" />
            Claim Offer
          </DialogTitle>
          <DialogDescription>
            {offer.title || offer.businessName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quota Status */}
          {offer.max_claims_per_user && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Your Quota Usage:</span>
                <span className="font-semibold text-gray-900">
                  {totalClaimed}/{offer.max_claims_per_user}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#e94e1b] h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (totalClaimed / offer.max_claims_per_user) * 100)}%`
                  }}
                />
              </div>

              {userCanClaimMore ? (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {remainingQuota} remaining
                </p>
              ) : (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Quota exhausted ({totalClaimed}/{offer.max_claims_per_user} used)
                </p>
              )}
            </div>
          )}

          {/* Quantity Selector or Exhausted Message */}
          {isQuotaExhausted ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Quota Limit Reached</h4>
              <p className="text-sm text-red-700">
                You've used all {offer.max_claims_per_user} of your quota for this offer.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity to Claim
                </label>
                {minQuantity > 1 && (
                  <p className="text-xs text-gray-600 mb-2">
                    Minimum: {minQuantity} • Maximum: {maxQuantity === Infinity ? 'No limit' : maxQuantity}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(minQuantity, quantity - 1))}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                    disabled={quantity <= minQuantity}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={minQuantity}
                    max={maxQuantity}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || minQuantity
                      setQuantity(Math.min(maxQuantity, Math.max(minQuantity, val)))
                    }}
                    className="w-20 h-10 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e94e1b] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setQuantity(Math.min(maxQuantity, quantity + 1))
                    }}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                    disabled={quantity >= maxQuantity}
                  >
                    +
                  </button>
                </div>
              </div>

              <Button
                onClick={handleClaim}
                disabled={claiming}
                className="w-full bg-[#e94e1b] hover:bg-[#d13f16] text-white"
              >
                {claiming ? 'Claiming...' : `Claim Quantity: ${quantity}`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
