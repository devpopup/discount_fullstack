import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DealsSection from '../components/DealsSection';
import {
  useNearbyOffers,
  useTrendingOffers,
  useExpiringSoonOffers,
  useUpcomingOffers,
  useAllOffers,
} from '../hooks/useOffers';
import { getUserLocation, getDefaultLocation } from '../utils/location';
import { Offer, Location } from '../types/offer';
import { useAuth } from '../context/AuthContext';
import { setOfferReminder, removeOfferReminder, claimOffer, getTotalQuantityClaimed, canClaimMore, saveOfferToFavorites, removeOfferFromFavorites, getFavoritedOfferIds } from '../services/offersService';
import {
  requestNotificationPermissions,
  setupNotificationListeners,
} from '../services/notificationService';
import { setupGeofences } from '../services/geofencingService';
import { registerBackgroundOfferCheck } from '../services/offerMonitoringService';

type RootStackParamList = {
  Home: undefined;
  QRScanner: undefined;
  DiscountDetails: { offerId: string };
  SignIn: undefined;
  SignUp: undefined;
  DealsList: { type: 'nearby' | 'trending' | 'expiring' | 'upcoming' | 'all' };
  NotificationSettings: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { isAuthenticated } = useAuth();
  // Initialize with default location immediately so queries can start
  const [userLocation, setUserLocation] = useState<Location>(getDefaultLocation());
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());
  const notificationsInitialized = useRef(false);

  // Use React Query hooks for automatic caching - enabled by default to load immediately
  const { data: nearbyData, isLoading: nearbyLoading, refetch: refetchNearby } = useNearbyOffers(
    userLocation,
    10,
    4,
    0,
    true
  );
  const { data: allDealsData, isLoading: allDealsLoading, refetch: refetchAll } = useAllOffers(
    1,
    4,
    userLocation,
    true
  );
  const { data: trendingData, isLoading: trendingLoading, refetch: refetchTrending } = useTrendingOffers(
    4,
    0,
    userLocation,
    true
  );
  const { data: expiringData, isLoading: expiringLoading, refetch: refetchExpiring } = useExpiringSoonOffers(
    24,
    4,
    0,
    userLocation,
    true
  );
  const { data: upcomingData, isLoading: upcomingLoading, refetch: refetchUpcoming } = useUpcomingOffers(
    1,
    4,
    userLocation,
    true
  );

  const nearbyDeals = nearbyData?.offers || [];
  const allDeals = allDealsData?.offers || [];
  const trendingDeals = trendingData?.offers || [];
  const expiringDeals = expiringData?.offers || [];
  const upcomingDeals = upcomingData?.offers || [];

  const loading = nearbyLoading && allDealsLoading && trendingLoading && expiringLoading && upcomingLoading;

  useEffect(() => {
    initializeLocation();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      getFavoritedOfferIds().then(ids => setFavoritedIds(ids));
    } else {
      setFavoritedIds(new Set());
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Only initialize notifications once when we have nearby deals
    if (nearbyDeals.length > 0 && !notificationsInitialized.current) {
      initializeNotifications();
      notificationsInitialized.current = true;
    }
  }, [nearbyDeals.length > 0]);

  const initializeLocation = async () => {
    try {
      const location = await getUserLocation();
      setUserLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
      const defaultLocation = getDefaultLocation();
      setUserLocation(defaultLocation);
    }
  };

  const initializeNotifications = async () => {
    try {
      // Request notification permissions
      const hasPermission = await requestNotificationPermissions();

      if (hasPermission) {
        // Setup notification listeners
        const cleanup = setupNotificationListeners(
          // Handle notification received while app is open
          (notification) => {
            console.log('Notification received:', notification);
          },
          // Handle notification tapped
          (response) => {
            const data = response.notification.request.content.data as { offerId?: string; type?: string };
            if (data?.offerId) {
              navigation.navigate('DiscountDetails', { offerId: data.offerId });
            }
          }
        );

        // Setup geofences for nearby offers (500m radius)
        if (nearbyDeals.length > 0) {
          await setupGeofences(nearbyDeals, 0.5);
        }

        // Register background monitoring for expiring/limited offers
        await registerBackgroundOfferCheck();

        return cleanup;
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const handleRefresh = useCallback(async () => {
    // Refetch all queries - React Query handles loading states
    await Promise.all([
      refetchNearby(),
      refetchAll(),
      refetchTrending(),
      refetchExpiring(),
      refetchUpcoming(),
    ]);
  }, [refetchNearby, refetchAll, refetchTrending, refetchExpiring, refetchUpcoming]);

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


  const handleLike = useCallback(async (offerId: string) => {
    if (!isAuthenticated) {
      promptSignIn('save to favorites');
      return;
    }
    const isCurrentlyLiked = favoritedIds.has(offerId);
    setFavoritedIds(prev => {
      const next = new Set(prev);
      if (isCurrentlyLiked) next.delete(offerId);
      else next.add(offerId);
      return next;
    });
    if (isCurrentlyLiked) {
      await removeOfferFromFavorites(offerId);
    } else {
      await saveOfferToFavorites(offerId);
    }
  }, [isAuthenticated, promptSignIn, favoritedIds]);

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
        // Refresh the offers to update claim status
        refetchTrending();
        refetchNearby();
        refetchExpiring();
      }
    } catch (err) {
      Alert.alert('Claim Failed', 'Unable to claim this offer. Please try again.');
    }
  }, [isAuthenticated, promptSignIn, refetchTrending, refetchNearby, refetchExpiring]);

  const handleRemind = useCallback(async (offerId: string, hasReminder: boolean) => {
    if (!isAuthenticated) {
      promptSignIn('set reminders for');
      return;
    }

    try {
      if (hasReminder) {
        // Set reminder
        const result = await setOfferReminder(offerId);
        if (result.success) {
          Alert.alert('Reminder Set!', "You'll be notified when this offer goes live.");
        } else {
          Alert.alert('Error', result.error || 'Failed to set reminder');
        }
      } else {
        // Remove reminder
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

  return (
    <View style={styles.container}>
      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} colors={['#e94e1b']} />
        }
      >

      {/* Deals Near You */}
      <DealsSection
        title="Deals Near You"
        description="Discover great offers from businesses in your area"
        deals={nearbyDeals}
        loading={nearbyLoading}
        iconName="compass"
        iconColor="#4CAF50"
        onDealPress={handleDealPress}
        onLike={handleLike}
        favoritedIds={favoritedIds}
        onClaim={handleClaim}
        onRemind={handleRemind}
        onViewMore={() => navigation.navigate('DealsList', { type: 'nearby' })}
      />

      {/* All Deals */}
      <DealsSection
        title="All Deals"
        description="Browse all available offers and deals"
        deals={allDeals}
        loading={allDealsLoading}
        iconName="grid"
        iconColor="#2196F3"
        onDealPress={handleDealPress}
        onLike={handleLike}
        favoritedIds={favoritedIds}
        onClaim={handleClaim}
        onRemind={handleRemind}
        onViewMore={() => navigation.navigate('DealsList', { type: 'all' })}
      />

      {/* Trending Deals */}
      <DealsSection
        title="Trending Deals"
        description="Popular offers that everyone is talking about"
        deals={trendingDeals}
        loading={trendingLoading}
        iconName="trending-up"
        iconColor="#FF6B6B"
        onDealPress={handleDealPress}
        onLike={handleLike}
        favoritedIds={favoritedIds}
        onClaim={handleClaim}
        onRemind={handleRemind}
        onViewMore={() => navigation.navigate('DealsList', { type: 'trending' })}
      />

      {/* Expiring Soon */}
      <DealsSection
        title="Expiring Soon"
        description="Hurry! These deals won't last much longer"
        deals={expiringDeals}
        loading={expiringLoading}
        iconName="alarm"
        iconColor="#FFA726"
        onDealPress={handleDealPress}
        onLike={handleLike}
        favoritedIds={favoritedIds}
        onClaim={handleClaim}
        onRemind={handleRemind}
        onViewMore={() => navigation.navigate('DealsList', { type: 'expiring' })}
      />

      {/* Coming Soon */}
      <DealsSection
        title="Coming Soon"
        description="Get notified when these offers go live!"
        deals={upcomingDeals}
        loading={upcomingLoading}
        iconName="hourglass"
        iconColor="#9C27B0"
        onDealPress={handleDealPress}
        onLike={handleLike}
        favoritedIds={favoritedIds}
        onClaim={handleClaim}
        onRemind={handleRemind}
        onViewMore={() => navigation.navigate('DealsList', { type: 'upcoming' })}
      />

      {/* Call to Action */}
      {/* <View style={styles.ctaContainer}>
        <Text style={styles.ctaTitle}>Never Miss a Deal Again</Text>
        <Text style={styles.ctaDescription}>
          Enable notifications to get alerts about new deals from your favorite businesses
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('NotificationSettings')}
        >
          <Text style={styles.ctaButtonText}>Enable Notifications</Text>
        </TouchableOpacity>
      </View> */}

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingTop: 20,
  },
});
