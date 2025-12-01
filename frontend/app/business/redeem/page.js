'use client'

import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import BusinessLayout from '@/components/BusinessLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Ticket,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  User,
  Tag,
  Calendar,
  DollarSign,
  Percent
} from 'lucide-react'

import { verifyClaimCode, redeemClaim } from '@/lib/offers'

export default function RedeemPage() {
  const { user } = useAuth()

  const [claimCode, setClaimCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [redeeming, setRedeeming] = useState(false)
  const [claimDetails, setClaimDetails] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [redemptionNotes, setRedemptionNotes] = useState('')

  const handleClaimCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (value.length <= 8) {
      setClaimCode(value)
    }
  }

  const handleVerify = async () => {
    if (claimCode.length !== 8) {
      setError('Please enter a valid 8-character claim code')
      return
    }

    setVerifying(true)
    setError(null)
    setSuccess(null)
    setClaimDetails(null)

    try {
      const result = await verifyClaimCode(claimCode)

      if (result.success) {
        setClaimDetails(result.claim)
        setError(null)
      } else {
        // Parse backend error and show user-friendly message
        const errorMsg = result.error || ''

        if (errorMsg.toLowerCase().includes('already been redeemed') ||
            errorMsg.toLowerCase().includes('already redeemed')) {
          setError('This code has already been redeemed')
        } else if (errorMsg.toLowerCase().includes('not found') ||
                   errorMsg.toLowerCase().includes('invalid') ||
                   errorMsg.toLowerCase().includes('does not exist') ||
                   errorMsg.toLowerCase().includes('not belong')) {
          setError('Code is invalid')
        } else {
          setError('Code is invalid')
        }
        setClaimDetails(null)
      }
    } catch (err) {
      console.error('Verification error:', err)
      setError('Code is invalid')
      setClaimDetails(null)
    } finally {
      setVerifying(false)
    }
  }

  const handleRedeem = async () => {
    setRedeeming(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await redeemClaim(claimCode, redemptionNotes)

      if (result.success) {
        setSuccess('Claim redeemed successfully!')
        setClaimDetails(null)
        setClaimCode('')
        setRedemptionNotes('')

        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000)
      } else {
        // Parse backend error and show user-friendly message
        const errorMsg = result.error || ''

        if (errorMsg.toLowerCase().includes('already been redeemed') ||
            errorMsg.toLowerCase().includes('already redeemed')) {
          setError('This code has already been redeemed')
        } else if (errorMsg.toLowerCase().includes('not found') ||
                   errorMsg.toLowerCase().includes('invalid') ||
                   errorMsg.toLowerCase().includes('does not exist')) {
          setError('Code is invalid')
        } else {
          setError('Failed to redeem claim')
        }
      }
    } catch (err) {
      console.error('Redemption error:', err)
      setError('Failed to redeem claim')
    } finally {
      setRedeeming(false)
    }
  }

  const handleReset = () => {
    setClaimCode('')
    setClaimDetails(null)
    setError(null)
    setSuccess(null)
    setRedemptionNotes('')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!user || !user.is_business) {
    return null
  }

  return (
    <BusinessLayout
      title="Redeem Offer"
      subtitle="Verify and redeem customer claim codes"
      activeTab="redeem"
    >
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 gap-6">
          {/* Input Section */}
          <Card className="bg-[#1e3a5f] border-2 border-[#00a8e6] shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-white text-lg">
                <Ticket className="h-5 w-5 text-[#00a8e6]" />
                Enter Claim Code
              </CardTitle>
              <CardDescription className="text-blue-200 text-sm">
                Enter the 8-character code from the customer
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <Alert className="mb-4 border-red-400 bg-red-900/20">
                  <XCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-300">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-4 border-green-400 bg-green-900/20">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-300">{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white font-medium text-sm">Claim Code</Label>
                  <div className="flex gap-3">
                    <Input
                      value={claimCode}
                      onChange={handleClaimCodeChange}
                      placeholder="AB12CD34"
                      className="bg-[#1e3a5f] border-white/20 text-white text-2xl font-mono tracking-widest text-center placeholder:text-gray-400 h-14"
                      maxLength={8}
                      disabled={verifying || claimDetails}
                    />
                    <Button
                      onClick={handleVerify}
                      disabled={claimCode.length !== 8 || verifying || claimDetails}
                      className="bg-[#00a8e6] hover:bg-[#0090c4] text-white h-14 px-8"
                    >
                      {verifying ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Search className="h-5 w-5 mr-2" />
                          Verify
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-blue-200">
                    Format: 8 characters (letters and numbers)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Claim Details Section */}
          {claimDetails && (
            <Card className="bg-[#1e3a5f] border-2 border-green-400 shadow-lg">
              <CardHeader className="pb-3 bg-green-900/20">
                <CardTitle className="flex items-center gap-2 text-white text-lg">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  Valid Claim
                </CardTitle>
                <CardDescription className="text-green-200 text-sm">
                  Review the details below and confirm redemption
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Top Row: Customer & Offer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer Info */}
                    <div className="p-4 bg-white/5 rounded-lg">
                      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <User className="h-4 w-4 text-[#00a8e6]" />
                        Customer Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-200">Name:</span>
                          <span className="text-white font-medium">
                            {claimDetails.customer?.name || 'N/A'}
                          </span>
                        </div>
                        {claimDetails.customer?.email && (
                          <div className="flex justify-between">
                            <span className="text-blue-200">Email:</span>
                            <span className="text-white font-medium">
                              {claimDetails.customer.email}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Claim Info */}
                    <div className="p-4 bg-white/5 rounded-lg">
                      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#00a8e6]" />
                        Claim Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-200">Claim ID:</span>
                          <span className="text-white font-mono font-medium">
                            {claimDetails.claim_id}
                          </span>
                        </div>
                        {claimDetails.quantity && claimDetails.quantity > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-blue-200">Quantity:</span>
                            <span className="text-white font-bold text-lg">
                              {claimDetails.quantity}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-blue-200">Claimed At:</span>
                          <span className="text-white font-medium">
                            {formatDate(claimDetails.claimed_at)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-200">Claim Type:</span>
                          <span className="text-white font-medium capitalize">
                            {claimDetails.claim_type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle Row: Offer Details (Full Width) */}
                  <div className="p-4 bg-white/5 rounded-lg">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-[#00a8e6]" />
                      Offer Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-blue-200 block mb-1">Offer Title:</span>
                        <span className="text-white font-medium text-base">
                          {claimDetails.offer?.title || 'N/A'}
                        </span>
                      </div>
                      {claimDetails.offer?.description && (
                        <div>
                          <span className="text-blue-200 block mb-1">Description:</span>
                          <span className="text-white">
                            {claimDetails.offer.description}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: Discount Info (Full Width with Emphasis) */}
                  <div className="p-4 bg-green-900/20 border border-green-400 rounded-lg">
                    <h3 className="text-sm font-semibold text-green-300 mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Discount Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <span className="text-green-200 block mb-2 text-xs">Discount Type</span>
                        <span className="text-white font-medium capitalize text-base">
                          {claimDetails.discount_info?.discount_type?.replace('_', ' ') || 'N/A'}
                        </span>
                      </div>
                      {claimDetails.discount_info?.discount_text && (
                        <div className="text-center p-3 bg-white/5 rounded-lg">
                          <span className="text-green-200 block mb-2 text-xs">Discount</span>
                          <span className="text-white font-bold text-lg">
                            {claimDetails.discount_info.discount_text}
                          </span>
                        </div>
                      )}
                      {claimDetails.discount_info?.savings_amount !== undefined && (
                        <div className="text-center p-3 bg-white/5 rounded-lg">
                          <span className="text-green-200 block mb-2 text-xs">Customer Saves</span>
                          <span className="text-green-300 font-bold text-lg">
                            ${Number(claimDetails.discount_info.savings_amount).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Redemption Notes */}
                  <div className="space-y-2">
                    <Label className="text-white font-medium text-sm">
                      Redemption Notes (Optional)
                    </Label>
                    <Textarea
                      value={redemptionNotes}
                      onChange={(e) => setRedemptionNotes(e.target.value)}
                      placeholder="Add any notes about this redemption..."
                      rows={3}
                      className="bg-[#1e3a5f] border-white/20 text-white placeholder:text-gray-400 resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-slate-700">
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="flex-1 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 h-12"
                      disabled={redeeming}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRedeem}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12"
                      disabled={redeeming}
                    >
                      {redeeming ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Redeeming...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Confirm Redemption
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help Section */}
          <Card className="bg-[#1e3a5f] border border-[#00a8e6]/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-white text-base">
                <AlertCircle className="h-4 w-4 text-[#00a8e6]" />
                How to Redeem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm text-blue-200 list-decimal list-inside">
                <li>Ask the customer for their 8-character claim code</li>
                <li>Enter the code in the field above and click "Verify"</li>
                <li>Review the claim details and discount information</li>
                <li>Click "Confirm Redemption" to complete the transaction</li>
                <li>The code will be marked as redeemed and cannot be used again</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </BusinessLayout>
  )
}
