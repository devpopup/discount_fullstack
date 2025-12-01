import apiClient from './api';

export interface ClaimDetails {
  claim_id: string;
  offer_id: string;
  offer_title: string;
  customer_name: string;
  customer_email: string;
  claimed_at: string;
  quantity: number;
  is_redeemed: boolean;
  discount_type: string;
  discount_value: number;
  product_name?: string;
  product_image?: string;
}

export interface VerifyClaimResponse {
  success: boolean;
  is_valid: boolean;
  claim_details?: ClaimDetails;
  error?: string;
  error_message?: string;
}

export interface RedeemClaimResponse {
  success: boolean;
  message?: string;
  redemption_details?: any;
  error?: string;
}

/**
 * Verify a claim code for redemption
 */
export async function verifyClaimCode(claimCode: string): Promise<VerifyClaimResponse> {
  try {
    const response = await apiClient.post('/business/redeem/verify', {
      claim_identifier: claimCode,
      verification_type: 'claim_id'
    });

    return {
      success: response.data.is_valid || false,
      is_valid: response.data.is_valid || false,
      claim_details: response.data.claim_details,
      error_message: response.data.error_message
    };
  } catch (error: any) {
    console.error('Verify claim error:', error);
    return {
      success: false,
      is_valid: false,
      error: error.response?.data?.detail || error.response?.data?.error_message || error.message || 'Failed to verify claim code'
    };
  }
}

/**
 * Complete redemption of a claim
 */
export async function redeemClaim(claimCode: string, notes: string = ''): Promise<RedeemClaimResponse> {
  try {
    const response = await apiClient.post('/business/redeem/complete', {
      claim_id: claimCode,
      redemption_notes: notes
    });

    return {
      success: response.data.success || false,
      message: response.data.message,
      redemption_details: response.data.redemption_details
    };
  } catch (error: any) {
    console.error('Redeem claim error:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to redeem claim'
    };
  }
}
