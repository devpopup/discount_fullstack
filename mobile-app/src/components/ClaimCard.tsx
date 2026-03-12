import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ClaimCardProps {
  claim: any;
  onPress: () => void;
  onLocationPress?: () => void;
  onUnclaim?: (claimId: string, offerId: string) => void;
}

export default function ClaimCard({ claim, onPress, onLocationPress, onUnclaim }: ClaimCardProps) {
  const offer = claim.offer || claim.offers;
  const business = offer?.business || offer?.businesses || {};
  const product = offer?.product || offer?.products;

  // Construct image URL (same logic as web app)
  let imageUrl: string | null = null;

  if (offer?.image_url) {
    imageUrl = offer.image_url.startsWith('http')
      ? offer.image_url
      : `https://lwwhsiaqvkjtlqaxkads.supabase.co/storage/v1/object/public/product-images/${offer.image_url}`;
  } else if (offer?.images && offer.images.length > 0) {
    imageUrl = offer.images[0].startsWith('http')
      ? offer.images[0]
      : `https://lwwhsiaqvkjtlqaxkads.supabase.co/storage/v1/object/public/product-images/${offer.images[0]}`;
  } else if (product?.image_url) {
    imageUrl = product.image_url.startsWith('http')
      ? product.image_url
      : `https://lwwhsiaqvkjtlqaxkads.supabase.co/storage/v1/object/public/product-images/${product.image_url}`;
  }

  const getStatusBadge = () => {
    if (claim.is_redeemed) {
      return (
        <View style={styles.statusBadge}>
          <Ionicons name="checkmark-circle" size={12} color="#15803d" />
          <Text style={styles.statusTextRedeemed}>Redeemed</Text>
        </View>
      );
    }

    // Check if expired
    if (offer?.expires_at) {
      try {
        const expiryDate = new Date(offer.expires_at);
        const now = new Date();
        if (!isNaN(expiryDate.getTime()) && expiryDate < now) {
          return (
            <View style={[styles.statusBadge, styles.statusExpired]}>
              <Ionicons name="alert-circle" size={12} color="#991b1b" />
              <Text style={styles.statusTextExpired}>Expired</Text>
            </View>
          );
        }
      } catch (error) {
        // Invalid date, fall through to pending
      }
    }

    return (
      <View style={[styles.statusBadge, styles.statusPending]}>
        <Ionicons name="time" size={12} color="#1e40af" />
        <Text style={styles.statusTextPending}>Pending</Text>
      </View>
    );
  };

  const getExpiryMessage = () => {
    if (claim.is_redeemed || !offer?.expires_at) return null;

    try {
      const expiryDate = new Date(offer.expires_at);
      const now = new Date();

      // Check if date is valid
      if (isNaN(expiryDate.getTime())) return null;

      const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysRemaining < 0) {
        return <Text style={styles.expiryTextExpired}>This offer has expired</Text>;
      } else if (daysRemaining === 0) {
        return <Text style={styles.expiryTextUrgent}>Expires today!</Text>;
      } else if (daysRemaining === 1) {
        return <Text style={styles.expiryTextUrgent}>Expires tomorrow</Text>;
      } else if (daysRemaining <= 3) {
        return <Text style={styles.expiryTextWarning}>Expires in {daysRemaining} days</Text>;
      } else {
        return <Text style={styles.expiryTextNormal}>Valid until {expiryDate.toLocaleDateString()}</Text>;
      }
    } catch (error) {
      return null;
    }
  };

  // Safe date parsing for claimed date
  let claimedDate: Date | null = null;
  if (claim.claimed_at) {
    try {
      const date = new Date(claim.claimed_at);
      if (!isNaN(date.getTime())) {
        claimedDate = date;
      }
    } catch (error) {
      claimedDate = null;
    }
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.container}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={imageUrl ? { uri: imageUrl } : require('../../assets/icon.png')}
            style={styles.image}
            resizeMode="cover"
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title and Status */}
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {offer?.title || 'Offer'}
              </Text>
              <Text style={styles.businessName} numberOfLines={1}>
                {business?.business_name || 'Business'}
              </Text>
            </View>
            {getStatusBadge()}
          </View>

          {/* Business Location */}
          {business?.business_address && onLocationPress && (
            <TouchableOpacity onPress={onLocationPress} activeOpacity={0.7}>
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>Location: </Text>
                <Text style={styles.locationText} numberOfLines={1}>
                  {business.business_address}
                </Text>
                <Ionicons name="chevron-forward" size={14} color="#666" />
              </View>
            </TouchableOpacity>
          )}

          {/* Redemption Code - Prominently displayed for unredeemed claims */}
          {!claim.is_redeemed && claim.unique_claim_id && (
            <View style={styles.claimCodeBox}>
              <Text style={styles.claimCodeLabel}>Your Redemption Code</Text>
              <Text style={styles.claimCodeText} selectable={true}>
                {claim.unique_claim_id}
              </Text>
              <Text style={styles.claimCodeHint}>
                Show this code to the merchant at checkout
              </Text>
            </View>
          )}

          {/* Claimed Date */}
          {claimedDate && (
            <Text style={styles.claimedDate}>
              Claimed on {claimedDate.toLocaleDateString()} at {claimedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}

          {/* Expiry Message */}
          <View style={styles.expiryContainer}>
            {getExpiryMessage()}
          </View>

          {/* Redemption Instructions */}
          {!claim.is_redeemed && (
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionsText}>
                <Text style={styles.instructionsLabel}>To redeem: </Text>
                Show your redemption code to the merchant at checkout
              </Text>
            </View>
          )}

          {/* Unclaim Button */}
          {!claim.is_redeemed && onUnclaim && (
            <TouchableOpacity
              style={styles.unclaimButton}
              onPress={() => onUnclaim(claim.id, offer?.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle-outline" size={16} color="#dc2626" />
              <Text style={styles.unclaimText}>Unclaim Offer</Text>
            </TouchableOpacity>
          )}

          {/* Redeemed Info */}
          {claim.is_redeemed && claim.redeemed_at && (() => {
            try {
              const redeemedDate = new Date(claim.redeemed_at);
              if (!isNaN(redeemedDate.getTime())) {
                return (
                  <View style={styles.redeemedBox}>
                    <Text style={styles.redeemedText}>
                      Redeemed on {redeemedDate.toLocaleDateString()}
                    </Text>
                  </View>
                );
              }
            } catch (error) {
              // Invalid date, don't render anything
            }
            return null;
          })()}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  container: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  imageContainer: {
    width: 96,
    height: 96,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  businessName: {
    fontSize: 13,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
  },
  statusPending: {
    backgroundColor: '#dbeafe',
  },
  statusExpired: {
    backgroundColor: '#fee2e2',
  },
  statusTextPending: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1e40af',
  },
  statusTextRedeemed: {
    fontSize: 11,
    fontWeight: '500',
    color: '#15803d',
  },
  statusTextExpired: {
    fontSize: 11,
    fontWeight: '500',
    color: '#991b1b',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
  },
  claimCodeBox: {
    backgroundColor: '#e94e1b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#d13f16',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  claimCodeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  claimCodeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'monospace',
    letterSpacing: 6,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  claimCodeHint: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  claimedDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  expiryContainer: {
    marginTop: 4,
  },
  expiryTextExpired: {
    fontSize: 13,
    fontWeight: '500',
    color: '#dc2626',
  },
  expiryTextUrgent: {
    fontSize: 13,
    fontWeight: '500',
    color: '#ea580c',
  },
  expiryTextWarning: {
    fontSize: 13,
    fontWeight: '500',
    color: '#ea580c',
  },
  expiryTextNormal: {
    fontSize: 13,
    color: '#6b7280',
  },
  instructionsBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginTop: 4,
  },
  instructionsText: {
    fontSize: 13,
    color: '#1e3a8a',
    lineHeight: 18,
  },
  instructionsLabel: {
    fontWeight: '600',
  },
  unclaimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc2626',
    backgroundColor: '#fff',
    marginTop: 8,
  },
  unclaimText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#dc2626',
  },
  redeemedBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginTop: 4,
  },
  redeemedText: {
    fontSize: 13,
    color: '#166534',
  },
});
