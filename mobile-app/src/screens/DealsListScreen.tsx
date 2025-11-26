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
  useInfiniteAllOffers,
} from '../hooks/useInfiniteOffers';
import { getUserLocation, getDefaultLocation } from '../utils/location';
import { Offer, Location } from '../types/offer';
import { useAuth } from '../context/AuthContext';

type RootStackParamList = {
  Home: undefined;
  DealsList: { type: 'nearby' | 'trending' | 'expiring' | 'all' };
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
  const { type } = route.params;
  const { isAuthenticated } = useAuth();
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const LIMIT = 20;

  // Select the appropriate infinite query hook based on type
  const nearbyQuery = useInfiniteNearbyOffers(userLocation, 10, LIMIT, type === 'nearby' && !!userLocation);
  const allQuery = useInfiniteAllOffers(LIMIT, userLocation || undefined, type === 'all' && !!userLocation);
  const trendingQuery = useInfiniteTrendingOffers(LIMIT, userLocation || undefined, type === 'trending' && !!userLocation);
  const expiringQuery = useInfiniteExpiringSoonOffers(24, LIMIT, userLocation || undefined, type === 'expiring' && !!userLocation);

  // Select the active query based on type
  const activeQuery = type === 'nearby' ? nearbyQuery :
                     type === 'all' ? allQuery :
                     type === 'trending' ? trendingQuery :
                     expiringQuery;

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } = activeQuery;

  // Flatten all pages into a single array
  const deals = useMemo(() => {
    return data?.pages.flatMap(page => page.offers) || [];
  }, [data]);

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

  const handleClaim = useCallback((offerId: string) => {
    if (!isAuthenticated) {
      promptSignIn('claim');
      return;
    }
    // TODO: Implement claim API call
    Alert.alert('Success', 'Offer claimed! Check your Claims tab to view it.');
    console.log('Claim offer:', offerId);
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
    }
  };

  const renderItem = useCallback(({ item }: { item: Offer }) => (
    <DealCardLandscape
      deal={item}
      onPress={() => handleDealPress(item)}
      onLike={handleLike}
      onClaim={handleClaim}
    />
  ), [handleDealPress, handleLike, handleClaim]);

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

  return (
    <View style={styles.container}>
      <FlatList
        data={deals}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
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
