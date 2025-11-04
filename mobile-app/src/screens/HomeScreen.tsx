import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DealCard from '../components/DealCard';
import {
  getNearbyOffers,
  getTrendingOffers,
  getExpiringSoonOffers,
} from '../services/offersService';
import { getUserLocation, getDefaultLocation } from '../utils/location';
import { Offer, Location } from '../types/offer';
import { useAuth } from '../context/AuthContext';

type RootStackParamList = {
  Home: undefined;
  QRScanner: undefined;
  DiscountDetails: { offerId: string };
  SignIn: undefined;
  DealsList: { type: 'nearby' | 'trending' | 'expiring' };
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
  icon: string;
  onDealPress: (deal: Offer) => void;
  onViewMore?: () => void;
}

function DealsSection({ title, description, deals, loading, icon, onDealPress, onViewMore }: DealsSectionProps) {
  if (loading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionIcon}>{icon}</Text>
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
            <Text style={styles.sectionIcon}>{icon}</Text>
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
          <Text style={styles.sectionIcon}>{icon}</Text>
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
          />
        ))}
      </ScrollView>
    </View>
  );
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { user, isAuthenticated, signOut } = useAuth();
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [nearbyDeals, setNearbyDeals] = useState<Offer[]>([]);
  const [trendingDeals, setTrendingDeals] = useState<Offer[]>([]);
  const [expiringDeals, setExpiringDeals] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [expiringLoading, setExpiringLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
      loadTrendingDeals(),
      loadExpiringDeals(),
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

  const loadTrendingDeals = async () => {
    setTrendingLoading(true);
    try {
      const result = await getTrendingOffers(4, 0);
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

  const loadExpiringDeals = async () => {
    setExpiringLoading(true);
    try {
      const result = await getExpiringSoonOffers(24, 4, 0);
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

  const handleSignOut = async () => {
    setShowUserMenu(false);
    await signOut();
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PopupReach</Text>

        {isAuthenticated && user ? (
          <View>
            <TouchableOpacity
              style={styles.avatarButton}
              onPress={() => setShowUserMenu(!showUserMenu)}
            >
              {user.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{getInitials(user.full_name || user.email)}</Text>
                </View>
              )}
            </TouchableOpacity>

            {showUserMenu && (
              <View style={styles.userMenu}>
                <View style={styles.userMenuHeader}>
                  <Text style={styles.userMenuName}>{user.full_name || user.email}</Text>
                  <Text style={styles.userMenuEmail}>{user.email}</Text>
                </View>
                <TouchableOpacity
                  style={styles.userMenuItem}
                  onPress={handleSignOut}
                >
                  <Text style={styles.userMenuItemText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => navigation.navigate('SignIn')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollContent}
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
          icon="📍"
          onDealPress={handleDealPress}
          onViewMore={() => navigation.navigate('DealsList', { type: 'nearby' })}
        />
      )}

      {/* Trending Deals */}
      <DealsSection
        title="Trending Deals"
        description="Popular offers that everyone is talking about"
        deals={trendingDeals}
        loading={trendingLoading}
        icon="🔥"
        onDealPress={handleDealPress}
        onViewMore={() => navigation.navigate('DealsList', { type: 'trending' })}
      />

      {/* Expiring Soon */}
      <DealsSection
        title="Expiring Soon"
        description="Hurry! These deals won't last much longer"
        deals={expiringDeals}
        loading={expiringLoading}
        icon="⏰"
        onDealPress={handleDealPress}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    marginBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  scrollContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e94e1b',
  },
  signInButton: {
    backgroundColor: '#e94e1b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  avatarButton: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e94e1b',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e94e1b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userMenu: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
    zIndex: 1000,
  },
  userMenuHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userMenuName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userMenuEmail: {
    fontSize: 12,
    color: '#666',
  },
  userMenuItem: {
    padding: 15,
  },
  userMenuItemText: {
    fontSize: 14,
    color: '#e94e1b',
    fontWeight: '600',
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
  sectionIcon: {
    fontSize: 28,
    marginRight: 12,
    marginTop: 2,
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
