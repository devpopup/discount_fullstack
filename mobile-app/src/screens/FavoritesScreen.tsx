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
import { useAuth } from '../context/AuthContext';
import DealCardLandscape from '../components/DealCardLandscape';
import { getFavoriteOffers, removeOfferFromFavorites } from '../services/offersService';
import { Offer } from '../types/offer';
import { getUserLocation, getDefaultLocation } from '../utils/location';

type RootStackParamList = {
  SignIn: undefined;
  DiscountDetails: { offerId: string };
};

type FavoritesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FavoritesScreenProps {
  navigation: FavoritesScreenNavigationProp;
}

export default function FavoritesScreen({ navigation }: FavoritesScreenProps) {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadFavorites();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      // Get user location
      let location;
      try {
        location = await getUserLocation();
      } catch (_locationError) {
        location = getDefaultLocation();
      }

      const result = await getFavoriteOffers(1, 50, location);
      if (result.error) {
        Alert.alert('Error', 'Failed to load your favorite offers');
      } else {
        setFavorites(result.offers);
      }
    } catch (_error) {
      Alert.alert('Error', 'Failed to load your favorite offers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
  };

  const handleDealPress = (deal: Offer) => {
    navigation.navigate('DiscountDetails', { offerId: deal.id });
  };


  const handleLike = async (offerId: string) => {
    // In favorites screen, tapping the heart removes from favorites
    try {
      const result = await removeOfferFromFavorites(offerId);
      if (result.success) {
        setFavorites(prev => prev.filter(offer => offer.id !== offerId));
      } else {
        Alert.alert('Error', result.error || 'Failed to remove from favorites');
      }
    } catch (_error) {
      Alert.alert('Error', 'Failed to remove from favorites');
    }
  };

  const handleClaim = (offerId: string) => {
    // Navigate to details to claim
    navigation.navigate('DiscountDetails', { offerId });
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Sign in to view favorites</Text>
          <Text style={styles.emptyText}>
            You need to be signed in to view your favorite offers.
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => navigation.navigate('SignIn')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e94e1b" />
        <Text style={styles.loadingText}>Loading your favorites...</Text>
      </View>
    );
  }

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No favorites yet</Text>
      <Text style={styles.emptyText}>
        When you like offers, they will appear here.
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: Offer }) => (
    <DealCardLandscape
      deal={item}
      onPress={() => handleDealPress(item)}
      onLike={handleLike}
      isLiked={true}
      hideBusinessInfo={true}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#e94e1b']} />
        }
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  signInButton: {
    backgroundColor: '#e94e1b',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
