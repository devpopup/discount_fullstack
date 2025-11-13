import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import DealCard from '../components/DealCard';
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
  QRScanner: undefined;
  DiscountDetails: { offerId: string };
  SignIn: undefined;
  SignUp: undefined;
  DealsList: { type: 'nearby' | 'trending' | 'expiring' | 'all' };
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

interface DealsSectionProps {
  title: string;
  description: string;
  deals: Offer[];
  loading: boolean;
  iconName: string;
  iconColor?: string;
  onDealPress: (deal: Offer) => void;
  onLike: (offerId: string) => void;
  onClaim: (offerId: string) => void;
  onViewMore?: () => void;
}

function DealsSection({ title, description, deals, loading, iconName, iconColor = '#e94e1b', onDealPress, onLike, onClaim, onViewMore }: DealsSectionProps) {
  if (loading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name={iconName as any} size={28} color={iconColor} />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>{title}</Text>
              <Text style={styles.sectionDescription}>{description}</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#e94e1b" />
        </View>
      </View>
    );
  }

  if (deals.length === 0) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name={iconName as any} size={28} color={iconColor} />
            </View>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>{title}</Text>
              <Text style={styles.sectionDescription}>{description}</Text>
            </View>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No {title.toLowerCase()} available at the moment.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionIconContainer}>
            <Ionicons name={iconName as any} size={28} color={iconColor} />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionDescription}>{description}</Text>
          </View>
        </View>
        {onViewMore && (
          <TouchableOpacity style={styles.viewMoreButton} onPress={onViewMore}>
            <Text style={styles.viewMoreText}>View More</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dealsScrollContainer}
      >
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            onPress={() => onDealPress(deal)}
            onLike={onLike}
            onClaim={onClaim}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { isAuthenticated } = useAuth();
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [nearbyDeals, setNearbyDeals] = useState<Offer[]>([]);
  const [allDeals, setAllDeals] = useState<Offer[]>([]);
  const [trendingDeals, setTrendingDeals] = useState<Offer[]>([]);
  const [expiringDeals, setExpiringDeals] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(true);
  const [allDealsLoading, setAllDealsLoading] = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [expiringLoading, setExpiringLoading] = useState(true);

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      const location = await getUserLocation();
      setUserLocation(location);
      await loadAllDeals(location);
    } catch (error) {
      console.error('Error getting location:', error);
      const defaultLocation = getDefaultLocation();
      setUserLocation(defaultLocation);
      await loadAllDeals(defaultLocation);
    }
  };

  const loadAllDeals = async (location: Location) => {
    setLoading(true);
    await Promise.all([
      loadNearbyDeals(location),
      loadAllOffersDeals(location),
      loadTrendingDeals(location),
      loadExpiringDeals(location),
    ]);
    setLoading(false);
  };

  const loadNearbyDeals = async (location: Location) => {
    setNearbyLoading(true);
    try {
      const result = await getNearbyOffers(location, 10, 4, 0);
      if (result.error) {
        console.error('Error loading nearby deals:', result.error);
      } else {
        setNearbyDeals(result.offers);
      }
    } catch (error) {
      console.error('Error loading nearby deals:', error);
    } finally {
      setNearbyLoading(false);
    }
  };

  const loadAllOffersDeals = async (location: Location) => {
    setAllDealsLoading(true);
    try {
      const result = await getAllOffers(1, 4, location);
      if (result.error) {
        console.error('Error loading all deals:', result.error);
      } else {
        setAllDeals(result.offers);
      }
    } catch (error) {
      console.error('Error loading all deals:', error);
    } finally {
      setAllDealsLoading(false);
    }
  };

  const loadTrendingDeals = async (location: Location) => {
    setTrendingLoading(true);
    try {
      const result = await getTrendingOffers(4, 0, location);
      if (result.error) {
        console.error('Error loading trending deals:', result.error);
      } else {
        setTrendingDeals(result.offers);
      }
    } catch (error) {
      console.error('Error loading trending deals:', error);
    } finally {
      setTrendingLoading(false);
    }
  };

  const loadExpiringDeals = async (location: Location) => {
    setExpiringLoading(true);
    try {
      const result = await getExpiringSoonOffers(24, 4, 0, location);
      if (result.error) {
        console.error('Error loading expiring deals:', result.error);
      } else {
        setExpiringDeals(result.offers);
      }
    } catch (error) {
      console.error('Error loading expiring deals:', error);
    } finally {
      setExpiringLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (userLocation) {
      await loadAllDeals(userLocation);
    }
    setRefreshing(false);
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

  return (
    <View style={styles.container}>
      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#e94e1b']} />
        }
      >

      {/* Deals Near You */}
      {userLocation && (
        <DealsSection
          title="Deals Near You"
          description="Discover great offers from businesses in your area"
          deals={nearbyDeals}
          loading={nearbyLoading}
          iconName="location"
          iconColor="#4CAF50"
          onDealPress={handleDealPress}
          onLike={handleLike}
          onClaim={handleClaim}
          onViewMore={() => navigation.navigate('DealsList', { type: 'nearby' })}
        />
      )}

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
        onClaim={handleClaim}
        onViewMore={() => navigation.navigate('DealsList', { type: 'all' })}
      />

      {/* Trending Deals */}
      <DealsSection
        title="Trending Deals"
        description="Popular offers that everyone is talking about"
        deals={trendingDeals}
        loading={trendingLoading}
        iconName="flame"
        iconColor="#FF6B6B"
        onDealPress={handleDealPress}
        onLike={handleLike}
        onClaim={handleClaim}
        onViewMore={() => navigation.navigate('DealsList', { type: 'trending' })}
      />

      {/* Expiring Soon */}
      <DealsSection
        title="Expiring Soon"
        description="Hurry! These deals won't last much longer"
        deals={expiringDeals}
        loading={expiringLoading}
        iconName="time"
        iconColor="#FFA726"
        onDealPress={handleDealPress}
        onLike={handleLike}
        onClaim={handleClaim}
        onViewMore={() => navigation.navigate('DealsList', { type: 'expiring' })}
      />

      {/* Call to Action */}
      <View style={styles.ctaContainer}>
        <Text style={styles.ctaTitle}>Never Miss a Deal Again</Text>
        <Text style={styles.ctaDescription}>
          Enable notifications to get alerts about new deals from your favorite businesses
        </Text>
        <TouchableOpacity style={styles.ctaButton}>
          <Text style={styles.ctaButtonText}>Enable Notifications</Text>
        </TouchableOpacity>
      </View>

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
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  sectionIconContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
  },
  viewMoreButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e94e1b',
  },
  viewMoreText: {
    color: '#e94e1b',
    fontSize: 12,
    fontWeight: '600',
  },
  dealsScrollContainer: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  ctaContainer: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 30,
    backgroundColor: '#e94e1b',
    borderRadius: 20,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  ctaDescription: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  ctaButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  ctaButtonText: {
    color: '#e94e1b',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
