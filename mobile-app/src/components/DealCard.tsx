import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Offer } from '../types/offer';

const CARD_WIDTH = Dimensions.get('window').width * 0.385;

interface DealCardProps {
  deal: Offer;
  onPress: () => void;
  onLike?: (offerId: string) => void;
  onClaim?: (offerId: string) => void;
  onRemind?: (offerId: string, hasReminder: boolean) => void;
  onLocationPress?: () => void;
  isLiked?: boolean;
}

function DealCard({ deal, onPress, onLike, onClaim, onRemind, onLocationPress, isLiked = false }: DealCardProps) {
  const [liked, setLiked] = useState(isLiked);
  const [hasReminder, setHasReminder] = useState(deal.hasReminder || false);

  // Check if offer is upcoming (hasn't started yet) - with safe date handling
  let isUpcoming = false;
  if (deal.startDate) {
    try {
      const startDate = new Date(deal.startDate);
      if (!isNaN(startDate.getTime())) {
        isUpcoming = startDate > new Date();
      }
    } catch (error) {
      isUpcoming = false;
    }
  }

  const handleLike = (e: any) => {
    e.stopPropagation();
    setLiked(!liked);
    if (onLike) {
      onLike(deal.id);
    }
  };

  const handleClaim = (e: any) => {
    e.stopPropagation();
    if (onClaim) {
      onClaim(deal.id);
    }
  };

  const handleRemind = (e: any) => {
    e.stopPropagation();
    if (onRemind) {
      const newReminderState = !hasReminder;
      setHasReminder(newReminderState);
      onRemind(deal.id, newReminderState);
    }
  };

  const handleLocationPress = (e: any) => {
    e.stopPropagation();
    if (onLocationPress) {
      onLocationPress();
    }
  };

  const formatDistance = (distance: number | null | undefined): string => {
    if (!distance) return '';
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    }
    return `${distance.toFixed(1)}km away`;
  };

  const calculateTimeRemaining = (expiresAt?: string): string => {
    if (!expiresAt) return '';

    try {
      const now = new Date();
      const expiry = new Date(expiresAt);

      // Check if date is valid
      if (isNaN(expiry.getTime())) return '';

      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) return 'Expired';

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (days > 0) return `${days}d left`;
      if (hours > 0) return `${hours}h left`;
      return 'Ending soon';
    } catch (error) {
      return '';
    }
  };

  // Safe price formatting
  const formatPrice = (price: any): string => {
    const numPrice = typeof price === 'number' ? price : parseFloat(price);
    if (isNaN(numPrice)) return '0.00';
    return numPrice.toFixed(2);
  };

  const discount = typeof deal.discount === 'number' ? deal.discount : 0;

  // Check multiple image sources: image_url (superadmin) > images array > placeholder
  const imageUrl = deal.image_url ||
    (deal.images && deal.images.length > 0 ? deal.images[0] : null) ||
    'https://via.placeholder.com/400x200?text=No+Image';

  // Debug logging for superadmin offers
  if (deal.isDemo && __DEV__) {
    console.log('DealCard - Superadmin Offer:', {
      id: deal.id,
      title: deal.title,
      image_url: deal.image_url,
      images: deal.images,
      finalImageUrl: imageUrl
    });
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
        {/* Discount Badge */}
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discount}%</Text>
          <Text style={styles.offText}>OFF</Text>
        </View>

        {/* Distance Badge */}
        {(deal.distance !== null && deal.distance !== undefined && deal.distance > 0) && (
          <View style={styles.distanceBadge}>
            <Ionicons name="location" size={10} color="#fff" />
            <Text style={styles.distanceText}>{formatDistance(deal.distance)}</Text>
          </View>
        )}

        {/* In-Store Only Badge for Demo Offers */}
        {(deal.isDemo === true || deal.canClaim === false) && (
          <View style={styles.inStoreBadge}>
            <Ionicons name="storefront" size={10} color="#fff" />
            <Text style={styles.inStoreText}>IN-STORE</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLike}
            activeOpacity={0.7}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={16}
              color={liked ? '#e94e1b' : '#fff'}
            />
          </TouchableOpacity>
          {isUpcoming ? (
            <TouchableOpacity
              style={[styles.actionButton, hasReminder && styles.actionButtonActive]}
              onPress={handleRemind}
              activeOpacity={0.7}
            >
              <Ionicons
                name={hasReminder ? 'notifications' : 'notifications-outline'}
                size={16}
                color={hasReminder ? '#e94e1b' : '#fff'}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleClaim}
              activeOpacity={0.7}
            >
              <Ionicons
                name="ticket-outline"
                size={16}
                color="#fff"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        {/* Business Name */}
        <Text style={styles.businessName} numberOfLines={1}>
          {deal.businessName}
        </Text>

        {/* Location */}
        {deal.location && onLocationPress && (
          <TouchableOpacity onPress={handleLocationPress} activeOpacity={0.7}>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color="#666" />
              <Text style={styles.locationText} numberOfLines={1}>
                {deal.location}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {deal.title}
        </Text>

        {/* Price Section */}
        <View style={styles.priceRow}>
          <Text style={styles.discountedPrice} numberOfLines={1}>
            ${formatPrice(deal.discountedPrice)}
          </Text>
          {deal.originalPrice && deal.originalPrice > 0 && (
            <Text style={styles.originalPrice} numberOfLines={1}>
              ${formatPrice(deal.originalPrice)}
            </Text>
          )}
        </View>

        {/* Info Row */}
        <View style={styles.infoRow}>
          {deal.expiresAt && (
            <View style={styles.infoItem}>
              <Text style={styles.infoText} numberOfLines={1}>⏰ {calculateTimeRemaining(deal.expiresAt)}</Text>
            </View>
          )}
        </View>

        {/* Category Badge */}
        {/* {deal.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText} numberOfLines={1}>{deal.category}</Text>
          </View>
        )} */}
      </View>
    </TouchableOpacity>
  );
}

export default React.memo(DealCard);

const CARD_HEIGHT = 320;
const IMAGE_HEIGHT = CARD_HEIGHT * 0.65; // 65% of card height

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e94e1b',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 14,
  },
  offText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '600',
    lineHeight: 8,
  },
  distanceBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  distanceText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
  },
  inStoreBadge: {
    position: 'absolute',
    top: 52,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  inStoreText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
  },
  actionButtons: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },
  businessName: {
    fontSize: 9,
    color: '#666',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  locationText: {
    fontSize: 10,
    color: '#666',
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e94e1b',
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 11,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  infoItem: {
    marginRight: 10,
    marginBottom: 3,
  },
  infoText: {
    fontSize: 10,
    color: '#666',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
  },
});
