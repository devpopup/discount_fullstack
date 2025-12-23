import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import ClaimCard from '../components/ClaimCard';
import { getClaimedOffers, unclaimOffer } from '../services/offersService';

type RootStackParamList = {
  SignIn: undefined;
  DiscountDetails: { offerId: string };
};

type ClaimsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ClaimsScreenProps {
  navigation: ClaimsScreenNavigationProp;
}

export default function ClaimsScreen({ navigation }: ClaimsScreenProps) {
  const { isAuthenticated, user } = useAuth();
  const [allClaims, setAllClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'redeemed'>('pending');

  useEffect(() => {
    if (isAuthenticated) {
      loadClaims();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]); // Only load on auth change, not filter change

  const loadClaims = async () => {
    setLoading(true);
    try {
      const result = await getClaimedOffers(1, 50);
      if (result.error) {
        console.error('Error loading claims:', result.error);
        Alert.alert('Error', 'Failed to load your claimed offers');
      } else {
        // Store all claims, filtering happens in useMemo
        setAllClaims(result.claimedOffers);
      }
    } catch (error) {
      console.error('Error loading claims:', error);
      Alert.alert('Error', 'Failed to load your claimed offers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Memoized filtering - only re-computes when allClaims or filter changes
  const filteredClaims = useMemo(() => {
    if (filter === 'pending') {
      return allClaims.filter((claim: any) => !claim.is_redeemed);
    } else if (filter === 'redeemed') {
      return allClaims.filter((claim: any) => claim.is_redeemed);
    }
    return allClaims; // 'all'
  }, [allClaims, filter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadClaims();
  };

  const handleClaimPress = (claim: any) => {
    const offer = claim.offer || claim.offers;
    navigation.navigate('DiscountDetails', { offerId: offer?.id || claim.offer_id });
  };

  const handleLocationPress = (claim: any) => {
    const offer = claim.offer || claim.offers;
    const business = offer?.business || offer?.businesses || {};
    const latitude = business?.latitude || offer?.latitude;
    const longitude = business?.longitude || offer?.longitude;

    if (latitude && longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      Linking.openURL(url).catch(err => {
        console.error('Failed to open maps:', err);
        Alert.alert('Error', 'Failed to open Google Maps');
      });
    } else {
      Alert.alert('Location Unavailable', 'No location data available for this offer');
    }
  };

  const handleUnclaim = (claimId: string, offerId: string) => {
    Alert.alert(
      'Unclaim Offer',
      'Are you sure you want to unclaim this offer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unclaim',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await unclaimOffer(offerId);

              if (result.error) {
                Alert.alert('Error', result.error);
              } else {
                // Remove the claim from the list immediately
                setAllClaims(prevClaims => prevClaims.filter((claim: any) => claim.id !== claimId));
                Alert.alert('Success', 'Offer unclaimed successfully!');
                // Optionally refresh the claims list
                loadClaims();
              }
            } catch (error) {
              console.error('Error unclaiming offer:', error);
              Alert.alert('Error', 'Failed to unclaim offer. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Sign in to view your claims</Text>
          <Text style={styles.emptyText}>
            You need to be signed in to view your claimed offers.
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
        <Text style={styles.loadingText}>Loading your claims...</Text>
      </View>
    );
  }

  const renderEmpty = () => {
    let title = 'No claims yet';
    let message = 'When you claim offers, they will appear here.';

    if (filter === 'pending') {
      title = 'No pending claims';
      message = "You don't have any pending claims. Browse deals to claim offers!";
    } else if (filter === 'redeemed') {
      title = 'No redeemed claims';
      message = "You haven't redeemed any offers yet.";
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyText}>{message}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <ClaimCard
      claim={item}
      onPress={() => handleClaimPress(item)}
      onLocationPress={() => handleLocationPress(item)}
      onUnclaim={handleUnclaim}
    />
  );

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterButtonText, filter === 'pending' && styles.filterButtonTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'redeemed' && styles.filterButtonActive]}
          onPress={() => setFilter('redeemed')}
        >
          <Text style={[styles.filterButtonText, filter === 'redeemed' && styles.filterButtonTextActive]}>
            Redeemed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
            All
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredClaims}
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
  filterContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#e94e1b',
    borderColor: '#e94e1b',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#fff',
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
