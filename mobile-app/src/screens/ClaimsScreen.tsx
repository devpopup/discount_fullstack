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
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadClaims();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const result = await getClaimedOffers(1, 50);
      if (result.error) {
        console.error('Error loading claims:', result.error);
        Alert.alert('Error', 'Failed to load your claimed offers');
      } else {
        setClaims(result.claimedOffers);
      }
    } catch (error) {
      console.error('Error loading claims:', error);
      Alert.alert('Error', 'Failed to load your claimed offers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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

              if (result.success) {
                // Remove the claim from the list immediately
                setClaims(prevClaims => prevClaims.filter(claim => claim.id !== claimId));
                Alert.alert('Success', 'Offer unclaimed successfully!');
              } else {
                Alert.alert('Error', result.error || 'Failed to unclaim offer');
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

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No claims yet</Text>
      <Text style={styles.emptyText}>
        When you claim offers, they will appear here.
      </Text>
    </View>
  );

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
      <FlatList
        data={claims}
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
