'use client'

import { useState } from 'react'
import { Store, X, AlertCircle, CheckCircle2 } from 'lucide-react'
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
  const {
    getTotalQuantityClaimed,
    canClaimMore,
    hasUnredeemedClaims,
    claimOffer,
    unclaimOffer
  } = useClaims()

  const [quantity, setQuantity] = useState(offer?.min_claims_per_customer || 1)
  const [claiming, setClaiming] = useState(false)

  if (!offer) return null

  const totalClaimed = getTotalQuantityClaimed(offer.id)
  const userCanClaimMore = canClaimMore(offer.id, offer.max_claims_per_user)
  const remainingQuota = offer.max_claims_per_user
    ? offer.max_claims_per_user - totalClaimed
    : Infinity
  const hasUnredeemed = hasUnredeemedClaims(offer.id)
  const isQuotaExhausted = !userCanClaimMore
  const minQuantity = offer.min_claims_per_customer || 1
  const maxQuantity = remainingQuota === Infinity ? 100 : Math.min(100, remainingQuota)

  const handleClaim = async () => {
    // Validate minimum quantity
    if (minQuantity && quantity < minQuantity) {
      toast.error(`Minimum claim quantity is ${minQuantity} unit${minQuantity > 1 ? 's' : ''}.`)
      return
    }

    // Pre-validation if we know the quota
    if (offer.max_claims_per_user && (totalClaimed + quantity) > offer.max_claims_per_user) {
      const remaining = offer.max_claims_per_user - totalClaimed
      toast.error(
        remaining > 0
          ? `You can only claim ${remaining} more unit${remaining > 1 ? 's' : ''}. You've already claimed ${totalClaimed}/${offer.max_claims_per_user}.`
          : `Quota exhausted. You've claimed all ${offer.max_claims_per_user} units available to you.`
      )
      return
    }

    setClaiming(true)
    try {
      await claimOffer(offer.id, 'in_store', quantity)

      // Success message
      let message = `Claimed ${quantity} unit${quantity > 1 ? 's' : ''} successfully!`
      if (totalClaimed > 0 && offer.max_claims_per_user) {
        message = `Claimed ${quantity} more unit${quantity > 1 ? 's' : ''}! Quota used: ${totalClaimed + quantity}/${offer.max_claims_per_user}`
      } else if (totalClaimed > 0) {
        message = `Claimed ${quantity} more unit${quantity > 1 ? 's' : ''}! Total: ${totalClaimed + quantity}`
      }

      toast.success(message)
      if (onClaimSuccess) {
        onClaimSuccess(offer.id, true)
      }
      onClose()
    } catch (error) {
      console.error('Error claiming offer:', error)

      // Parse quota-related errors
      const errorMsg = error.message || 'Failed to claim offer'
      if (errorMsg.includes('already claimed') || errorMsg.includes('Maximum allowed')) {
        // Extract the quota info if available
        const match = errorMsg.match(/Maximum allowed is (\d+)/)
        if (match) {
          const maxAllowed = parseInt(match[1])
          toast.error(`Quota limit reached. You've claimed ${maxAllowed}/${maxAllowed} units for this offer.`)
        } else {
          toast.error('You\'ve reached your quota limit for this offer')
        }
      } else {
        toast.error(errorMsg)
      }
    } finally {
      setClaiming(false)
    }
  }

  const handleUnclaim = async () => {
    setClaiming(true)
    try {
      await unclaimOffer(offer.id)
      toast.success('Offer unclaimed successfully!')
      if (onClaimSuccess) {
        onClaimSuccess(offer.id, false)
      }
      onClose()
    } catch (error) {
      console.error('Error unclaiming offer:', error)
      toast.error(error.message || 'Failed to unclaim offer')
    } finally {
      setClaiming(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#e94e1b]" />
            Claim Offer
          </DialogTitle>
          <DialogDescription>
            {offer.title || offer.businessName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quota Status */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            {offer.max_claims_per_user ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Your Quota Usage:</span>
                  <span className="font-semibold text-gray-900">
                    {totalClaimed}/{offer.max_claims_per_user} units
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
                    {remainingQuota} unit{remainingQuota > 1 ? 's' : ''} remaining
                  </p>
                ) : (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Quota exhausted ({totalClaimed}/{offer.max_claims_per_user} units used)
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Units Claimed:</span>
                  <span className="font-semibold text-gray-900">
                    {totalClaimed} unit{totalClaimed !== 1 ? 's' : ''}
                  </span>
                </div>

                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  No quota limit - claim as many as you need
                </p>
              </>
            )}
          </div>

          {/* Quantity Selector or Exhausted Message */}
          {isQuotaExhausted ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Quota Limit Reached</h4>
              <p className="text-sm text-red-700 mb-3">
                You've used all {offer.max_claims_per_user} units of your quota for this offer.
              </p>

              {hasUnredeemed && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    You have unredeemed claims. You can unclaim one to free up quota.
                  </p>
                  <Button
                    onClick={handleUnclaim}
                    disabled={claiming}
                    variant="outline"
                    className="w-full border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Unclaim One
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity to Claim
                </label>
                {minQuantity > 1 && (
                  <p className="text-xs text-gray-600 mb-2">
                    Minimum: {minQuantity} units • Maximum: {maxQuantity === Infinity ? 'No limit' : `${maxQuantity} units`}
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
                {claiming ? 'Claiming...' : `Claim ${quantity} Unit${quantity > 1 ? 's' : ''}`}
              </Button>

              {hasUnredeemed && (
                <Button
                  onClick={handleUnclaim}
                  disabled={claiming}
                  variant="outline"
                  className="w-full"
                >
                  Or Unclaim One
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
