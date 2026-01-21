import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { RouteProp } from '@react-navigation/native';
import DealCardLandscape from '../components/DealCardLandscape';
import {
  useInfiniteNearbyOffers,
  useInfiniteTrendingOffers,
  useInfiniteExpiringSoonOffers,
  useInfiniteUpcomingOffers,
  useInfiniteAllOffers,
} from '../hooks/useInfiniteOffers';
import { getUserLocation, getDefaultLocation } from '../utils/location';
import { Offer, Location } from '../types/offer';
import { useAuth } from '../context/AuthContext';
import { claimOffer, getTotalQuantityClaimed, canClaimMore, setOfferReminder, removeOfferReminder } from '../services/offersService';

// Card dimensions for getItemLayout optimization
const DEAL_CARD_LANDSCAPE_HEIGHT = 155; // Card height (140) + marginBottom (15)

type RootStackParamList = {
  Home: undefined;
  DealsList: { type: 'nearby' | 'trending' | 'expiring' | 'upcoming' | 'all' };
  DiscountDetails: { offerId: string };
  SignIn: undefined;
  SignUp: undefined;
};

type DealsListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DealsList'>;
type DealsListRouteProp = RouteProp<RootStackParamList, 'DealsList'>;

interface DealsListScreenProps {
  navigation: DealsListNavigationProp;
  route: DealsListRouteProp;
}

export default function DealsListScreen({ navigation, route }: DealsListScreenProps) {
  // Defensive check for route params
  if (!route?.params?.type) {
    console.error('DealsListScreen: Missing type parameter');
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Invalid navigation parameters</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { type } = route.params;
  const { isAuthenticated } = useAuth();
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const LIMIT = 20;

  // Select the appropriate infinite query hook based on type
  const nearbyQuery = useInfiniteNearbyOffers(userLocation, 10, LIMIT, type === 'nearby' && !!userLocation);
  const allQuery = useInfiniteAllOffers(LIMIT, userLocation || undefined, type === 'all');
  const trendingQuery = useInfiniteTrendingOffers(LIMIT, userLocation || undefined, type === 'trending');
  const expiringQuery = useInfiniteExpiringSoonOffers(24, LIMIT, userLocation || undefined, type === 'expiring');
  const upcomingQuery = useInfiniteUpcomingOffers(LIMIT, userLocation || undefined, type === 'upcoming');

  // Select the active query based on type
  const activeQuery = type === 'nearby' ? nearbyQuery :
                     type === 'all' ? allQuery :
                     type === 'trending' ? trendingQuery :
                     type === 'expiring' ? expiringQuery :
                     upcomingQuery;

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } = activeQuery;

  // Flatten all pages into a single array with defensive checks
  const deals = useMemo(() => {
    try {
      if (!data?.pages) return [];

      const flattenedDeals = data.pages.flatMap(page => {
        // Ensure page.offers is an array
        if (!page || !Array.isArray(page.offers)) {
          console.warn('DealsListScreen: Invalid page structure', page);
          return [];
        }

        // Filter out any invalid offers
        return page.offers.filter(offer => {
          const isValid = offer && typeof offer === 'object' && offer.id;
          if (!isValid) {
            console.warn('DealsListScreen: Filtered invalid offer', offer);
          }
          return isValid;
        });
      });

      console.log(`DealsListScreen (${type}): Loaded ${flattenedDeals.length} deals`);
      return flattenedDeals;
    } catch (error) {
      console.error('DealsListScreen: Error flattening deals', error);
      return [];
    }
  }, [data, type]);

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      const location = await getUserLocation();
      setUserLocation(location);
    } catch (error) {
      const defaultLocation = getDefaultLocation();
      setUserLocation(defaultLocation);
    }
  };

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleDealPress = useCallback((deal: Offer) => {
    navigation.navigate('DiscountDetails', { offerId: deal.id });
  }, [navigation]);

  const promptSignIn = useCallback((action: string) => {
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
  }, [navigation]);

  const handleLike = useCallback((offerId: string) => {
    if (!isAuthenticated) {
      promptSignIn('like');
      return;
    }
    // TODO: Implement like API call
    console.log('Like offer:', offerId);
  }, [isAuthenticated, promptSignIn]);

  const handleClaim = useCallback(async (offerId: string, offer?: Offer) => {
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
        refetch();
      }
    } catch (err) {
      Alert.alert('Claim Failed', 'Unable to claim this offer. Please try again.');
    }
  }, [isAuthenticated, promptSignIn, refetch]);

  const handleRemind = useCallback(async (offerId: string, hasReminder: boolean) => {
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
  }, [isAuthenticated, promptSignIn]);

  const getTitle = () => {
    switch (type) {
      case 'nearby':
        return 'Deals Near You';
      case 'all':
        return 'All Deals';
      case 'trending':
        return 'Trending Deals';
      case 'expiring':
        return 'Expiring Soon';
      case 'upcoming':
        return 'Coming Soon';
    }
  };

  const renderItem = useCallback(({ item }: { item: Offer }) => {
    // Defensive check - ensure item has required fields
    if (!item || !item.id) {
      console.warn('DealsList renderItem: Invalid offer item:', item);
      return null;
    }

    try {
      return (
        <DealCardLandscape
          deal={item}
          onPress={() => handleDealPress(item)}
          onLike={handleLike}
          onRemind={handleRemind}
        />
      );
    } catch (error) {
      console.error('DealsList renderItem error:', error);
      return null;
    }
  }, [handleDealPress, handleLike, handleRemind]);

  const renderFooter = () => {
    if (!hasNextPage) return null;

    if (isFetchingNextPage) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#e94e1b" />
          <Text style={styles.loadingMoreText}>Loading more deals...</Text>
        </View>
      );
    }

    return null; // Auto-load on scroll end
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No deals available at the moment.</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e94e1b" />
        <Text style={styles.loadingText}>Loading {getTitle().toLowerCase()}...</Text>
      </View>
    );
  }

  // Performance optimization: getItemLayout helps FlatList calculate item positions faster
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: DEAL_CARD_LANDSCAPE_HEIGHT,
      offset: DEAL_CARD_LANDSCAPE_HEIGHT * index,
      index,
    }),
    []
  );

  // Final safety check - ensure deals is always an array
  const safeDeals = Array.isArray(deals) ? deals : [];

  return (
    <View style={styles.container}>
      <FlatList
        data={safeDeals}
        renderItem={renderItem}
        keyExtractor={(item, index) => item?.id || `offer-${index}`}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} colors={['#e94e1b']} />
        }
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        getItemLayout={getItemLayout}
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
  loadingMoreText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  loadMoreButton: {
    backgroundColor: '#e94e1b',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadMoreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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
