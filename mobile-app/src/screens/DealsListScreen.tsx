import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import DealCard from '../components/DealCard';
import {
  getNearbyOffers,
  getTrendingOffers,
  getExpiringSoonOffers,
} from '../services/offersService';
import { getUserLocation, getDefaultLocation } from '../utils/location';
import { Offer, Location } from '../types/offer';

type RootStackParamList = {
  Home: undefined;
  DealsList: { type: 'nearby' | 'trending' | 'expiring' };
  DiscountDetails: { offerId: string };
};

type DealsListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DealsList'>;
type DealsListRouteProp = RouteProp<RootStackParamList, 'DealsList'>;

interface DealsListScreenProps {
  navigation: DealsListNavigationProp;
  route: DealsListRouteProp;
}

export default function DealsListScreen({ navigation, route }: DealsListScreenProps) {
  const { type } = route.params;
  const [deals, setDeals] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
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
      let result;

      switch (type) {
        case 'nearby':
          result = await getNearbyOffers(location, 10, LIMIT, currentOffset);
          break;
        case 'trending':
          result = await getTrendingOffers(LIMIT, currentOffset);
          break;
        case 'expiring':
          result = await getExpiringSoonOffers(24, LIMIT, currentOffset);
          break;
      }

      if (result.error) {
        console.error('Error loading deals:', result.error);
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

  const getTitle = () => {
    switch (type) {
      case 'nearby':
        return 'Deals Near You';
      case 'trending':
        return 'Trending Deals';
      case 'expiring':
        return 'Expiring Soon';
    }
  };

  const renderItem = ({ item }: { item: Offer }) => (
    <View style={styles.cardContainer}>
      <DealCard deal={item} onPress={() => handleDealPress(item)} />
    </View>
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
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
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
    padding: 10,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  cardContainer: {
    flex: 1,
    maxWidth: '48%',
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
