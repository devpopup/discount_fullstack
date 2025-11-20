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
import { RouteProp } from '@react-navigation/native';
import DealCardLandscape from '../components/DealCardLandscape';
import {
  getNearbyOffers,
  getTrendingOffers,
  getExpiringSoonOffers,
  getAllOffers,
} from '../services/offersService';
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
  const [deals, setDeals] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

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
      let result;

      switch (type) {
        case 'nearby':
          result = await getNearbyOffers(location, 10, LIMIT, currentOffset);
          break;
        case 'all':
          result = await getAllOffers(Math.floor(currentOffset / LIMIT) + 1, LIMIT, location);
          break;
        case 'trending':
          result = await getTrendingOffers(LIMIT, currentOffset, location);
          break;
        case 'expiring':
          result = await getExpiringSoonOffers(24, LIMIT, currentOffset, location);
          break;
      }

      if (result.error) {
        console.error('Error loading deals:', result.error);
      } else {
        if (append) {
          // Filter out duplicates before adding new deals
          setDeals(prev => {
            const existingIds = new Set(prev.map(d => d.id));
            const newDeals = result.offers.filter(offer => !existingIds.has(offer.id));
            return [...prev, ...newDeals];
          });
        } else {
          setDeals(result.offers);
        }
        setHasMore(result.hasMore);
        setOffset(currentOffset + LIMIT);
      }
    } catch (error) {
      console.error('Error loading deals:', error);
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

  const handleClaim = (offerId: string) => {
    if (!isAuthenticated) {
      promptSignIn('claim');
      return;
    }
    // TODO: Implement claim API call
    Alert.alert('Success', 'Offer claimed! Check your Claims tab to view it.');
    console.log('Claim offer:', offerId);
  };

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

  const renderItem = ({ item }: { item: Offer }) => (
    <DealCardLandscape
      deal={item}
      onPress={() => handleDealPress(item)}
      onLike={handleLike}
      onClaim={handleClaim}
    />
  );

  const renderFooter = () => {
    if (!hasMore) return null;

    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#e94e1b" />
          <Text style={styles.loadingMoreText}>Loading more deals...</Text>
        </View>
      );
    }

    return (
      <View style={styles.footerLoader}>
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={handleLoadMore}
          activeOpacity={0.7}
        >
          <Text style={styles.loadMoreButtonText}>Load More Deals</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No deals available at the moment.</Text>
      </View>
    );
  };

  if (loading) {
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
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#e94e1b']} />
        }
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
