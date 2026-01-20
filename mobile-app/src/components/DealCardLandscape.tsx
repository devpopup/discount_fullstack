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

const SCREEN_WIDTH = Dimensions.get('window').width;

interface DealCardLandscapeProps {
  deal: Offer;
  onPress: () => void;
  onLike?: (offerId: string) => void;
  onRemind?: (offerId: string, hasReminder: boolean) => void;
  onLocationPress?: () => void;
  isLiked?: boolean;
  hideBusinessInfo?: boolean;
}

function DealCardLandscape({ deal, onPress, onLike, onRemind, onLocationPress, isLiked = false, hideBusinessInfo = false }: DealCardLandscapeProps) {
  const [liked, setLiked] = useState(isLiked);

  const handleLike = (e: any) => {
    e.stopPropagation();
    setLiked(!liked);
    if (onLike) {
      onLike(deal.id);
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

  const imageUrl = deal.images && deal.images.length > 0
    ? deal.images[0]
    : 'https://via.placeholder.com/400x200?text=No+Image';

  // Safe price formatting
  const formatPrice = (price: any): string => {
    const numPrice = typeof price === 'number' ? price : parseFloat(price);
    if (isNaN(numPrice)) return '0.00';
    return numPrice.toFixed(2);
  };

  const discount = typeof deal.discount === 'number' ? deal.discount : 0;

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
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        {/* Business Name */}
        {!hideBusinessInfo && (
          <Text style={styles.businessName} numberOfLines={1}>
            {deal.businessName}
          </Text>
        )}

        {/* Location */}
        {!hideBusinessInfo && deal.location && onLocationPress && (
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

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLike}
            activeOpacity={0.7}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={18}
              color={liked ? '#e94e1b' : '#666'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default React.memo(DealCardLandscape);

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH - 30,
    height: 140,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  imageContainer: {
    width: 140,
    height: '100%',
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
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  businessName: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#666',
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  discountedPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e94e1b',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  infoItem: {
    marginRight: 10,
    marginBottom: 3,
  },
  infoText: {
    fontSize: 11,
    color: '#666',
  },
  actionButtons: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
