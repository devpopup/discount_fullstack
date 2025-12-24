import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DealCardLandscape from '../components/DealCardLandscape';
import { getNearbyOffers, claimOffer, getTotalQuantityClaimed, canClaimMore, setOfferReminder, removeOfferReminder } from '../services/offersService';
import { getUserLocation, getDefaultLocation } from '../utils/location';
import { Offer, Location } from '../types/offer';
import { useAuth } from '../context/AuthContext';

type RootStackParamList = {
  DiscountDetails: { offerId: string };
  SignIn: undefined;
  SignUp: undefined;
};

type NearbyScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface NearbyScreenProps {
  navigation: NearbyScreenNavigationProp;
}

export default function NearbyScreen({ navigation }: NearbyScreenProps) {
  const { isAuthenticated } = useAuth();
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [deals, setDeals] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 10;

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      const location = await getUserLocation();
      setUserLocation(location);
      await loadDeals(location, 0, false);
    } catch (error) {
      const defaultLocation = getDefaultLocation();
      setUserLocation(defaultLocation);
      await loadDeals(defaultLocation, 0, false);
    }
  };

  const loadDeals = async (location: Location, currentOffset: number, append: boolean) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await getNearbyOffers(location, 10, LIMIT, currentOffset);

      if (result.error) {
        console.error('Error loading nearby deals:', result.error);
      } else {
        if (append) {
          setDeals(prev => [...prev, ...result.offers]);
        } else {
          setDeals(result.offers);
        }
        setHasMore(result.hasMore);
        setOffset(currentOffset + LIMIT);
      }
    } catch (error) {
      console.error('Error loading nearby deals:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setOffset(0);
    if (userLocation) {
      await loadDeals(userLocation, 0, false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && userLocation) {
      loadDeals(userLocation, offset, true);
    }
  };

  const handleDealPress = (deal: Offer) => {
    navigation.navigate('DiscountDetails', { offerId: deal.id });
  };

  const promptSignIn = (action: string) => {
    Alert.alert(
      'Sign In Required',
      `You need to sign in to ${action} offers.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign In',
          onPress: () => navigation.navigate('SignIn'),
        },
        {
          text: 'Sign Up',
          onPress: () => navigation.navigate('SignUp'),
        },
      ]
    );
  };

  const handleLike = (offerId: string) => {
    if (!isAuthenticated) {
      promptSignIn('like');
      return;
    }
    // TODO: Implement like API call
    console.log('Like offer:', offerId);
  };

  const handleClaim = async (offerId: string, offer?: Offer) => {
    if (!isAuthenticated) {
      promptSignIn('claim');
      return;
    }

    try {
      // Check quota if offer data is available
      if (offer?.max_claims_per_user) {
        const userCanClaim = await canClaimMore(offerId, offer.max_claims_per_user);
        if (!userCanClaim) {
          const totalClaimed = await getTotalQuantityClaimed(offerId);
          Alert.alert(
            'Limit Reached',
            `You've reached your limit (${totalClaimed}/${offer.max_claims_per_user}) for this offer.`
          );
          return;
        }
      }

      // Use min quantity if specified, otherwise default to 1
      const quantity = offer?.min_claims_per_customer || 1;

      const result = await claimOffer(offerId, 'in_store', quantity);
      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        Alert.alert('Success', 'Check the Claims tab for next steps in redeeming your claim.');
        // Refresh the offers
        if (userLocation) {
          loadDeals(userLocation, 0, false);
        }
      }
    } catch (err) {
      Alert.alert('Claim Failed', 'Unable to claim this offer. Please try again.');
    }
  };

  const handleRemind = async (offerId: string, hasReminder: boolean) => {
    if (!isAuthenticated) {
      promptSignIn('set reminders for');
      return;
    }

    try {
      if (hasReminder) {
        const result = await setOfferReminder(offerId);
        if (result.success) {
          Alert.alert('Reminder Set!', "You'll be notified when this offer goes live.");
        } else {
          Alert.alert('Error', result.error || 'Failed to set reminder');
        }
      } else {
        const result = await removeOfferReminder(offerId);
        if (result.success) {
          Alert.alert('Reminder Removed', 'You will no longer be notified about this offer.');
        } else {
          Alert.alert('Error', result.error || 'Failed to remove reminder');
        }
      }
    } catch (error) {
      console.error('Error toggling reminder:', error);
      Alert.alert('Error', 'Failed to update reminder. Please try again.');
    }
  };

  const renderItem = ({ item }: { item: Offer }) => (
    <DealCardLandscape
      deal={item}
      onPress={() => handleDealPress(item)}
      onLike={handleLike}
      onRemind={handleRemind}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#e94e1b" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No deals available nearby at the moment.</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e94e1b" />
        <Text style={styles.loadingText}>Loading nearby deals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={deals}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#e94e1b']} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 15,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
