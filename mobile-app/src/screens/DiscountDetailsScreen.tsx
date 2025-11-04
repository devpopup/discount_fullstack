import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import { getOfferById, claimOffer, unclaimOffer } from '../services/offersService';
import { Offer } from '../types/offer';

type RootStackParamList = {
  Home: undefined;
  QRScanner: undefined;
  DiscountDetails: { offerId: string };
};

type DiscountDetailsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DiscountDetails'
>;

type DiscountDetailsRouteProp = RouteProp<RootStackParamList, 'DiscountDetails'>;

interface DiscountDetailsScreenProps {
  navigation: DiscountDetailsNavigationProp;
  route: DiscountDetailsRouteProp;
}

export default function DiscountDetailsScreen({
  navigation,
  route,
}: DiscountDetailsScreenProps) {
  const { offerId } = route.params;
  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isClaimed, setIsClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    fetchOfferDetails();
  }, [offerId]);

  const fetchOfferDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getOfferById(offerId);

      if (result.error) {
        setError(result.error);
      } else if (result.offer) {
        setOffer(result.offer);
      } else {
        setError('Offer not found');
      }
    } catch (err) {
      console.error('Error loading offer:', err);
      setError('Failed to load offer details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading discount...</Text>
      </View>
    );
  }

  const handleClaimOffer = async () => {
    if (!offer) return;

    setClaiming(true);
    try {
      if (isClaimed) {
        const result = await unclaimOffer(offer.id);
        if (result.error) {
          Alert.alert('Error', result.error);
        } else {
          setIsClaimed(false);
          Alert.alert('Success', 'Offer unclaimed successfully!');
        }
      } else {
        const result = await claimOffer(offer.id);
        if (result.error) {
          Alert.alert('Error', result.error);
        } else {
          setIsClaimed(true);
          Alert.alert('Success', 'Offer claimed! Show this to the cashier.');
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to process claim');
    } finally {
      setClaiming(false);
    }
  };

  if (error || !offer) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Offer not found'}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imageUrl = offer.images && offer.images.length > 0
    ? offer.images[0]
    : 'https://via.placeholder.com/400x200?text=No+Image';

  return (
    <ScrollView style={styles.container}>
      {/* Image Header */}
      <Image
        source={{ uri: imageUrl }}
        style={styles.headerImage}
        resizeMode="cover"
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.businessName}>{offer.businessName}</Text>
          <View style={styles.percentageBadge}>
            <Text style={styles.percentageText}>{offer.discount}%</Text>
            <Text style={styles.offText}>OFF</Text>
          </View>
        </View>

        <View style={styles.discountCard}>
          <Text style={styles.discountTitle}>{offer.title}</Text>
          <Text style={styles.discountDescription}>
            {offer.description}
          </Text>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.discountedPrice}>
              ${offer.discountedPrice.toFixed(2)}
            </Text>
            {offer.originalPrice > 0 && (
              <Text style={styles.originalPrice}>
                ${offer.originalPrice.toFixed(2)}
              </Text>
            )}
          </View>

          {/* Location */}
          {offer.location && (
            <View style={styles.locationContainer}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{offer.location}</Text>
            </View>
          )}

          {offer.expiresAt && (
            <View style={styles.validityContainer}>
              <Text style={styles.validityLabel}>Expires:</Text>
              <Text style={styles.validityDate}>
                {new Date(offer.expiresAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.claimButton, isClaimed && styles.claimedButton]}
          onPress={handleClaimOffer}
          disabled={claiming}
        >
          {claiming ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.claimButtonText}>
              {isClaimed ? 'Unclaim Offer' : 'Claim Offer'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.scanAgainButton}
          onPress={() => navigation.navigate('QRScanner')}
        >
          <Text style={styles.scanAgainButtonText}>Scan Another QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerImage: {
    width: '100%',
    height: 250,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  discountedPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e94e1b',
    marginRight: 10,
  },
  originalPrice: {
    fontSize: 18,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  claimedButton: {
    backgroundColor: '#4CAF50',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  businessName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  percentageBadge: {
    backgroundColor: '#4CAF50',
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  percentageText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  offText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  discountCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  discountTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  discountDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  validityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  validityLabel: {
    fontSize: 14,
    color: '#666',
  },
  validityDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  qrDataContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  qrDataLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  qrData: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
  },
  claimButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  claimButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scanAgainButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  scanAgainButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  homeButton: {
    padding: 15,
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#666',
    fontSize: 16,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#f44336',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
