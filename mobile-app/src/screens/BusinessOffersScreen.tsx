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
import apiClient from '../services/api';
import { saveOfferToFavorites, removeOfferFromFavorites, getFavoritedOfferIds } from '../services/offersService';
import { Offer } from '../types/offer';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RootStackParamList = {
  BusinessOffers: { businessId: string };
  DiscountDetails: { offerId: string };
  SignIn: undefined;
  SignUp: undefined;
};

type BusinessOffersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BusinessOffers'>;
type BusinessOffersScreenRouteProp = RouteProp<RootStackParamList, 'BusinessOffers'>;

interface BusinessOffersScreenProps {
  navigation: BusinessOffersScreenNavigationProp;
  route: BusinessOffersScreenRouteProp;
}

interface Business {
  id: string;
  business_name: string;
  business_logo?: string;
  location?: string;
}

export default function BusinessOffersScreen({ navigation, route }: BusinessOffersScreenProps) {
  const { businessId } = route.params;
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const [business, setBusiness] = useState<Business | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadBusinessOffers();
  }, [businessId]);

  useEffect(() => {
    if (isAuthenticated) {
      getFavoritedOfferIds().then(ids => setFavoritedIds(ids));
    } else {
      setFavoritedIds(new Set());
    }
  }, [isAuthenticated]);

  const loadBusinessOffers = async () => {
    setLoading(true);
    try {
      // Fetch offers for this business
      const response = await apiClient.get(`/customer/businesses/${businessId}/offers`);

      if (response.data) {
        setOffers(response.data.offers || []);
        setBusiness(response.data.business || null);
      }
    } catch (error: any) {
      const message = error.response?.status === 404
        ? 'This business has no active offers at the moment.'
        : error.response?.data?.detail || 'Unable to load offers. Please try again later.';

      Alert.alert(
        'No Offers Available',
        message,
        [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBusinessOffers();
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


  const handleLike = async (offerId: string) => {
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
  };

  const handleClaim = (offerId: string) => {
    if (!isAuthenticated) {
      promptSignIn('claim');
      return;
    }
    navigation.navigate('DiscountDetails', { offerId });
  };

  const renderItem = ({ item }: { item: Offer }) => (
    <DealCardLandscape
      deal={item}
      onPress={() => handleDealPress(item)}
      onLike={handleLike}
      isLiked={favoritedIds.has(item.id)}
      hideBusinessInfo={true}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      {business && (
        <View style={styles.businessInfo}>
          <Text style={styles.businessName}>{business.business_name}</Text>
          {business.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.locationText}>{business.location}</Text>
            </View>
          )}
        </View>
      )}

      <Text style={styles.subtitle}>
        {offers.length} {offers.length === 1 ? 'offer' : 'offers'} available
      </Text>
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="gift-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>No offers available from this business at the moment.</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          activeOpacity={0.7}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#e94e1b" />
        <Text style={styles.loadingText}>Loading offers...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={offers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#e94e1b']} />
        }
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
    flexGrow: 1,
    padding: 15,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  businessInfo: {
    marginBottom: 12,
  },
  businessName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  refreshButton: {
    backgroundColor: '#e94e1b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
