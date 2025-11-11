import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Offer } from '../types/offer';

const CARD_WIDTH = Dimensions.get('window').width * 0.47;

interface DealCardProps {
  deal: Offer;
  onPress: () => void;
  onLike?: (offerId: string) => void;
  onClaim?: (offerId: string) => void;
  isLiked?: boolean;
}

export default function DealCard({ deal, onPress, onLike, onClaim, isLiked = false }: DealCardProps) {
  const [liked, setLiked] = useState(isLiked);

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

  // Debug: Log deal distance
  console.log(`DealCard render - Offer ${deal.id}: distance = ${deal.distance}`);

  const formatDistance = (distance: number | null | undefined): string => {
    if (!distance) return '';
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    }
    return `${distance.toFixed(1)}km away`;
  };

  const calculateTimeRemaining = (expiresAt?: string): string => {
    if (!expiresAt) return '';

    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d left`;
    if (hours > 0) return `${hours}h left`;
    return 'Ending soon';
  };

  const imageUrl = deal.images && deal.images.length > 0
    ? deal.images[0]
    : 'https://via.placeholder.com/400x200?text=No+Image';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Discount Badge */}
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{deal.discount}%</Text>
          <Text style={styles.offText}>OFF</Text>
        </View>

        {/* Distance Badge */}
        {(deal.distance !== null && deal.distance !== undefined && deal.distance > 0) && (
          <View style={styles.distanceBadge}>
            <Ionicons name="location" size={12} color="#fff" />
            <Text style={styles.distanceText}>{formatDistance(deal.distance)}</Text>
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
              size={20}
              color={liked ? '#e94e1b' : '#fff'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClaim}
            activeOpacity={0.7}
          >
            <Ionicons
              name="ticket-outline"
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        {/* Business Name */}
        <Text style={styles.businessName} numberOfLines={1}>
          {deal.businessName}
        </Text>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {deal.title}
        </Text>

        {/* Price Section */}
        <View style={styles.priceRow}>
          <Text style={styles.discountedPrice}>
            ${deal.discountedPrice.toFixed(2)}
          </Text>
          {deal.originalPrice > 0 && (
            <Text style={styles.originalPrice}>
              ${deal.originalPrice.toFixed(2)}
            </Text>
          )}
        </View>

        {/* Info Row */}
        <View style={styles.infoRow}>
          {deal.distance !== null && (
            <View style={styles.infoItem}>
              <Text style={styles.infoText}>📍 {formatDistance(deal.distance)}</Text>
            </View>
          )}
          {deal.expiresAt && (
            <View style={styles.infoItem}>
              <Text style={styles.infoText}>⏰ {calculateTimeRemaining(deal.expiresAt)}</Text>
            </View>
          )}
        </View>

        {/* Category Badge */}
        {deal.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{deal.category}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const CARD_HEIGHT = 280;
const IMAGE_HEIGHT = CARD_HEIGHT * 0.65; // 65% of card height

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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
    top: 10,
    right: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
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
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  offText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '600',
    lineHeight: 10,
  },
  distanceBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  distanceText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  actionButtons: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  businessName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    lineHeight: 24,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  discountedPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e94e1b',
    marginRight: 10,
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  infoItem: {
    marginRight: 15,
    marginBottom: 5,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
});
