import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Offer } from '../types/offer';

const CARD_WIDTH = Dimensions.get('window').width * 0.47;

interface DealCardProps {
  deal: Offer;
  onPress: () => void;
}

export default function DealCard({ deal, onPress }: DealCardProps) {
  const formatDistance = (distance: number | null): string => {
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

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
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
    height: 140,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#e94e1b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  discountText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  offText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    padding: 12,
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
